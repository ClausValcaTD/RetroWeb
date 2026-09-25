import * as fflate from 'fflate';
import { GlobalEmscriptenModule } from "../types/emulator";
import { ensureBrowserFS } from "./scriptLoader";

let isFSInitialized = false;

export async function initVirtualFileSystem() {
  const BFS = await ensureBrowserFS();
  if (isFSInitialized) return BFS;

  let asyncFs;
  if (BFS.FileSystem.IndexedDB && BFS.FileSystem.IndexedDB.isAvailable()) {
    try {
      const imfs = new BFS.FileSystem.InMemory();
      asyncFs = new BFS.FileSystem.AsyncMirror(
        imfs,
        new BFS.FileSystem.IndexedDB((e: any) => {
          if (e) console.warn("IndexedDB warning:", e);
        }, "RetroArch")
      );
    } catch {
      asyncFs = new BFS.FileSystem.InMemory();
    }
  } else {
    asyncFs = new BFS.FileSystem.InMemory();
  }

  const mfs = new BFS.FileSystem.MountableFileSystem();
  const inMemoryCores = new BFS.FileSystem.InMemory();
  const inMemoryRoot = new BFS.FileSystem.InMemory();

  mfs.mount("/home/web_user/retroarch", inMemoryRoot);
  mfs.mount("/home/web_user/retroarch/cores", inMemoryCores);
  mfs.mount("/home/web_user/retroarch/userdata", asyncFs || new BFS.FileSystem.InMemory());

  BFS.initialize(mfs);
  isFSInitialized = true;
  return BFS;
}

export function mountEmscriptenFS(Module: GlobalEmscriptenModule, coreId: string) {
  const BFS = window.BrowserFS;
  if (!BFS || !Module.FS || !Module.PATH || !Module.ERRNO_CODES) return;

  const FS = Module.FS;

  try {
    try {
      FS.mkdir?.("/home");
      FS.mkdir?.("/home/web_user");
      FS.mkdir?.("/home/web_user/retroarch");
      FS.mkdir?.("/home/web_user/retroarch/userdata");
      FS.mkdir?.("/home/web_user/retroarch/userdata/content");
    } catch {
      // Directories might already exist
    }

    try {
      if (FS.analyzePath && !FS.analyzePath("/system").exists) {
        FS.mkdir?.("/system");
      } else if (!FS.analyzePath) {
        FS.mkdir?.("/system");
      }
    } catch {
      // Directory might already exist
    }

    const emscriptenFS = new BFS.EmscriptenFS(FS, Module.PATH, Module.ERRNO_CODES);
    try {
      FS.mount?.(emscriptenFS, { root: "/home" }, "/home");
    } catch {
      // Might already be mounted
    }

    try {
      FS.writeFile?.(`/home/web_user/retroarch/cores/${coreId}_libretro.core`, new Uint8Array(0));
    } catch {
      // Ignore write errors if already exists
    }
  } catch (err) {
    console.warn("mountEmscriptenFS warning:", err);
  }
}

export function cleanupVirtualFS(Module: GlobalEmscriptenModule) {
  if (!Module || !Module.FS) return;
  const FS = Module.FS;

  const filesToRemove = ["/current_game.rom", "/current_game.uze", "/game.rom"];
  for (const file of filesToRemove) {
    try {
      FS.unlink?.(file);
    } catch {
      // Ignore if file does not exist
    }
  }
}

export function writeRomToFS(Module: GlobalEmscriptenModule, fileData: ArrayBuffer, fileName: string): string {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  const defaultRomPath = (ext === ".uze" || ext === ".hex") ? "/current_game.uze" : "/current_game.rom";
  const targetPath = `/home/web_user/retroarch/userdata/content/${fileName}`;
  const dataView = new Uint8Array(fileData);

  if (Module.FS) {
    const FS = Module.FS;

    cleanupVirtualFS(Module);

    try {
      FS.writeFile?.(defaultRomPath, dataView);
    } catch (err) {
      console.warn("Failed to write directly to /current_game.rom:", err);
    }

    try {
      try { FS.mkdir?.("/home"); } catch {}
      try { FS.mkdir?.("/home/web_user"); } catch {}
      try { FS.mkdir?.("/home/web_user/retroarch"); } catch {}
      try { FS.mkdir?.("/home/web_user/retroarch/userdata"); } catch {}
      try { FS.mkdir?.("/home/web_user/retroarch/userdata/content"); } catch {}

      FS.writeFile?.(targetPath, dataView);
    } catch (err) {
      console.error("Failed to write ROM to Emscripten FS:", err);
      try {
        FS.createDataFile?.("/", fileName, dataView, true, true);
        const readData = FS.readFile?.(fileName);
        if (readData) {
          FS.writeFile?.(targetPath, readData);
        }
        FS.unlink?.(fileName);
      } catch (e) {
        console.error("Fallback write failed:", e);
      }
    }
  }
  return defaultRomPath;
}

export async function loadAndStartCore(
  coreId: string,
  canvas: HTMLCanvasElement,
  romData?: { name: string; buffer: ArrayBuffer },
  onLog?: (text: string, isErr?: boolean) => void
): Promise<GlobalEmscriptenModule> {
  await initVirtualFileSystem();

  const corePath = `/home/web_user/retroarch/cores/${coreId}_libretro.core`;
  let romPath: string | undefined = undefined;
  if (romData) {
    const ext = "." + romData.name.split(".").pop()?.toLowerCase();
    romPath = (ext === ".uze" || ext === ".hex" || coreId === "uzem") ? "/current_game.uze" : "/current_game.rom";
  }

  const args = romPath ? [romPath] : ["-v", "--menu"];

  const ModuleBase: GlobalEmscriptenModule = {
    noInitialRun: true,
    arguments: args,
    canvas: canvas,
    corePath: corePath,
    preRun: [
      (mod: GlobalEmscriptenModule) => {
        if (mod.ENV) {
          mod.ENV["LIBRARY_PATH"] = mod.corePath || corePath;
        }
      }
    ],
    print: (text: string) => {
      console.log(`[${coreId} stdout]:`, text);
      if (onLog) onLog(text, false);
    },
    printErr: (text: string) => {
      console.warn(`[${coreId} stderr]:`, text);
      if (onLog) onLog(text, true);
    },
  };

  const coreModuleUrl = `/emulator/${coreId}_libretro.js`;
  const moduleFactory = await import(/* @vite-ignore */ coreModuleUrl);
  const factoryFunc = moduleFactory.default || moduleFactory;

  const Module = await factoryFunc(ModuleBase);
  window.Module = Module;

  mountEmscriptenFS(Module, coreId);

  if (romData) {
    writeRomToFS(Module, romData.buffer, romData.name);
    Module.arguments = [romPath!];
  } else {
    Module.arguments = args;
  }

  if (Module.callMain) {
    Module.callMain(Module.arguments);
  }

  return Module;
}

export function extractRomFromZip(
  zipBuffer: ArrayBuffer,
  supportedExtensions: string[]
): { name: string; buffer: ArrayBuffer } {
  const decompressed = fflate.unzipSync(new Uint8Array(zipBuffer));
  const fileNames = Object.keys(decompressed);

  if (fileNames.length === 0) {
    throw new Error("The zip archive is empty.");
  }

  // Look for a file matching supported extensions
  let targetFileName = fileNames.find((name) => {
    const ext = "." + name.split(".").pop()?.toLowerCase();
    return supportedExtensions.includes(ext);
  });

  // If no exact core match found, look for any known ROM extension or non-directory file
  if (!targetFileName) {
    targetFileName = fileNames.find((name) => !name.endsWith("/") && !name.startsWith("__MACOSX"));
  }

  if (!targetFileName) {
    throw new Error("No valid ROM file found in the archive.");
  }

  const romUint8 = decompressed[targetFileName];
  const romBuffer = romUint8.buffer.slice(
    romUint8.byteOffset,
    romUint8.byteOffset + romUint8.byteLength
  ) as ArrayBuffer;

  // Strip path prefix if any inside zip
  const cleanName = targetFileName.split("/").pop() || targetFileName;

  return {
    name: cleanName,
    buffer: romBuffer,
  };
}

export function writeBiosToFS(Module: GlobalEmscriptenModule, fileData: ArrayBuffer, fileName: string): void {
  if (!Module || !Module.FS) return;
  const FS = Module.FS;

  try {
    if (FS.analyzePath && !FS.analyzePath("/system").exists) {
      FS.mkdir?.("/system");
    } else if (!FS.analyzePath) {
      try { FS.mkdir?.("/system"); } catch {}
    }
  } catch {}

  const dataView = new Uint8Array(fileData);
  const targetPath = `/system/${fileName}`;

  try {
    FS.writeFile?.(targetPath, dataView);
    console.log(`Successfully mounted BIOS file: ${targetPath}`);
  } catch (err) {
    console.error(`Failed to write BIOS ${fileName} to /system:`, err);
  }
}
