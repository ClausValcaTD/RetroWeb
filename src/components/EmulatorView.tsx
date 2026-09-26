import React, { useRef, useState, useEffect } from "react";
import { Upload, Monitor, AlertCircle, RefreshCw } from "lucide-react";
import { EmulatorStatus } from "../types/emulator";
import { CORE_MAP } from "../constants/cores";

interface EmulatorViewProps {
  currentCoreId: string;
  romFile: { name: string; buffer: ArrayBuffer } | null;
  status: EmulatorStatus;
  onRomSelect: (file: File) => void;
  errorMessage?: string | null;
}

export const EmulatorView: React.FC<EmulatorViewProps> = ({
  currentCoreId,
  romFile,
  status,
  onRomSelect,
  errorMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeCore = CORE_MAP[currentCoreId] || CORE_MAP["uzem"];

  useEffect(() => {
    if (!romFile || !romFile.buffer) return;

    // Create object URL from ROM buffer/blob
    const gameBlob = new Blob([romFile.buffer]);
    const gameUrl = URL.createObjectURL(gameBlob);

    // Map core IDs if necessary (e.g. mgba -> gba)
    const coreId = currentCoreId === "mgba" ? "gba" : currentCoreId;

    // Set EmulatorJS global parameters
    (window as any).EJS_player = "#game";
    (window as any).EJS_core = coreId;
    (window as any).EJS_gameUrl = gameUrl;
    (window as any).EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    (window as any).EJS_startOnLoaded = true;

    // Dynamically load loader.js if not already present or reload it
    const existingScript = document.getElementById("emulatorjs-loader");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "emulatorjs-loader";
    script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    document.body.appendChild(script);

    return () => {
      URL.revokeObjectURL(gameUrl);
      const gameDiv = document.getElementById("game");
      if (gameDiv) {
        gameDiv.innerHTML = "";
      }
      const loaderScript = document.getElementById("emulatorjs-loader");
      if (loaderScript) {
        loaderScript.remove();
      }
    };
  }, [romFile, currentCoreId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onRomSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onRomSelect(e.target.files[0]);
    }
  };

  const getAspectRatioClass = () => {
    switch (activeCore?.aspectRatio) {
      case "3:2":
        return "aspect-[3/2]";
      case "16:9":
        return "aspect-video";
      case "4:3":
      default:
        return "aspect-[4/3]";
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-4 w-full h-full overflow-hidden">
      <div
        className={`relative w-full max-w-5xl ${getAspectRatioClass()} max-h-[80vh] flex items-center justify-center bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl shadow-cyan-950/20 crt-screen overflow-hidden group transition-all duration-300 ${
          isDragging ? "ring-2 ring-cyan-500 bg-zinc-900/80" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={[...activeCore.extensions, ".zip"].join(",")}
          onChange={handleFileInputChange}
        />

        <div id="game" className="w-full h-full relative" />

        {(status === "idle" || status === "ready" || status === "loading" || status === "error") && !romFile && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-zinc-950/90 backdrop-blur-sm">
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
                <div className="text-xl font-medium text-zinc-200">Loading {activeCore.name}...</div>
                <p className="text-sm text-zinc-400">Initializing EmulatorJS core</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center space-y-4 max-w-md">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <div className="text-xl font-semibold text-rose-300">Emulation Error</div>
                <p className="text-sm text-zinc-400">{errorMessage || "Failed to start emulation core or load ROM."}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition cursor-pointer"
                >
                  Try another ROM
                </button>
              </div>
            )}

            {(status === "idle" || status === "ready") && (
              <div className="flex flex-col items-center space-y-6 max-w-md">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/5">
                  <Monitor className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight text-zinc-100">
                    `Load a ${activeCore.system} ROM`
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Drag and drop your <span className="font-mono text-cyan-400">{[...activeCore.extensions, ".zip"].join(", ")}</span> file here, or browse from your device.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-cyan-500/25 active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose ROM File</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-cyan-950/80 border-2 border-dashed border-cyan-400 rounded-xl flex flex-col items-center justify-center z-30 backdrop-blur-sm pointer-events-none">
            <Upload className="w-16 h-16 text-cyan-400 animate-bounce mb-2" />
            <span className="text-lg font-semibold text-cyan-200">Drop ROM file to play</span>
          </div>
        )}
      </div>
    </div>
  );
};
