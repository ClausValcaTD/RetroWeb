import { GlobalEmscriptenModule } from '../types/emulator';
import { ensureBrowserFS } from './scriptLoader';

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

  mfs.mount('/home/web_user/retroarch', inMemoryRoot);
  mfs.mount('/home/web_user/retroarch/cores', inMemoryCores);
  mfs.mount('/home/web_user/retroarch/userdata', asyncFs || new BFS.FileSystem.InMemory());

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
      FS.mkdir?.('/home');
      FS.mkdir?.('/home/web_user');
      FS.mkdir?.('/home/web_user/retroarch');
      FS.mkdir?.('/home/web_user/retroarch/userdata');
      FS.mkdir?.('/home/web_user/retroarch/userdata/content');
    } catch {
      // Directories might already exist
    }

    const emscriptenFS = new BFS.EmscriptenFS(FS, Module.PATH, Module.ERRNO_CODES);
    try {
      FS.mount?.(emscriptenFS, { root: '/home' }, '/home');
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

export function writeRomToFS(Module: GlobalEmscriptenModule, fileData: ArrayBuffer, fileName: string): string {
  const targetPath = `/home/web_user/retroarch/userdata/content/${fileName}`;
  const dataView = new Uint8Array(fileData);

  if (Module.FS) {
    const FS = Module.FS;
    try {
      try { FS.mkdir?.('/home'); } catch {}
      try { FS.mkdir?.('/home/web_user'); } catch {}
      try { FS.mkdir?.('/home/web_user/retroarch'); } catch {}
      try { FS.mkdir?.('/home/web_user/retroarch/userdata'); } catch {}
      try { FS.mkdir?.('/home/web_user/retroarch/userdata/content'); } catch {}

      FS.writeFile?.(targetPath, dataView);
    } catch (err) {
      console.error("Failed to write ROM to Emscripten FS:", err);
      try {
        FS.createDataFile?.('/', fileName, dataView, true, true);
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
  return targetPath;
}

export async function loadAndStartCore(
  coreId: string,
  canvas: HTMLCanvasElement,
  romData?: { name: string; buffer: ArrayBuffer },
  onLog?: (text: string, isErr?: boolean) => void
): Promise<GlobalEmscriptenModule> {
  await initVirtualFileSystem();

  const corePath = `/home/web_user/retroarch/cores/${coreId}_libretro.core`;
  const romPath = romData ? `/home/web_user/retroarch/userdata/content/${romData.name}` : undefined;

  const args = romPath
    ? ["-v", romPath]
    : ["-v", "--menu"];

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
  }

  if (Module.callMain) {
    Module.callMain(Module.arguments || args);
  }

  return Module;
}
