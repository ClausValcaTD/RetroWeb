import React, { useRef } from 'react';
import { Gamepad2, Upload, Play, Pause, RotateCcw, Maximize, Cpu } from 'lucide-react';
import { SUPPORTED_CORES } from '../constants/cores';
import { EmulatorStatus } from '../types/emulator';

interface HeaderProps {
  currentCoreId: string;
  onSelectCore: (coreId: string) => void;
  status: EmulatorStatus;
  romName: string | null;
  onRomSelect: (file: File) => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onFullscreenToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCoreId,
  onSelectCore,
  status,
  romName,
  onRomSelect,
  onPauseToggle,
  onReset,
  onFullscreenToggle,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCore = SUPPORTED_CORES.find((c) => c.id === currentCoreId) || SUPPORTED_CORES[0];

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Running
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Paused
          </span>
        );
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Loading
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Error
          </span>
        );
      case 'ready':
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Ready
          </span>
        );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onRomSelect(e.target.files[0]);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-4 z-40 select-none">
      {/* Left section: Logo & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              RetroWeb
            </span>
            {romName && (
              <span className="hidden sm:inline-block ml-2 text-xs text-zinc-400 max-w-[150px] truncate align-middle">
                • {romName}
              </span>
            )}
          </div>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Right section: Controls & Core Picker */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Core selector dropdown */}
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3 text-zinc-400">
            <Cpu className="w-4 h-4" />
          </div>
          <select
            value={currentCoreId}
            onChange={(e) => onSelectCore(e.target.value)}
            disabled={status === 'loading'}
            className="pl-9 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition appearance-none cursor-pointer disabled:opacity-50"
          >
            {SUPPORTED_CORES.map((core) => (
              <option key={core.id} value={core.id}>
                {core.name}
              </option>
            ))}
          </select>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={activeCore.extensions.join(',')}
          onChange={handleFileChange}
        />

        {/* Load ROM Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Load ROM"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Open ROM</span>
        </button>

        {/* Pause / Play toggle */}
        <button
          onClick={onPauseToggle}
          disabled={status !== 'running' && status !== 'paused'}
          title={status === 'paused' ? 'Resume' : 'Pause'}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 active:scale-95"
        >
          {status === 'paused' ? (
            <Play className="w-4 h-4 text-emerald-400" />
          ) : (
            <Pause className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Reset button */}
        <button
          onClick={onReset}
          disabled={status !== 'running' && status !== 'paused'}
          title="Reset Core"
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-zinc-300" />
        </button>

        {/* Fullscreen button */}
        <button
          onClick={onFullscreenToggle}
          title="Toggle Fullscreen"
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer active:scale-95"
        >
          <Maximize className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};
