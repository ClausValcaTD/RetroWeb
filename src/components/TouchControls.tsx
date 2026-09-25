import React, { useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface ButtonConfig {
  code: string;
  key: string;
  label?: string;
}

interface TouchButtonProps {
  config: ButtonConfig;
  className?: string;
  children?: React.ReactNode;
}

const dispatchKey = (type: 'keydown' | 'keyup', code: string, key: string) => {
  const event = new KeyboardEvent(type, {
    key,
    code,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

const TouchButton: React.FC<TouchButtonProps> = ({ config, className = '', children }) => {
  const [isPressed, setIsPressed] = useState(false);
  const isPressedRef = useRef(false);

  const handlePressStart = useCallback(
    (e: React.PointerEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      if (!isPressedRef.current) {
        isPressedRef.current = true;
        setIsPressed(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(15);
          } catch {
            // Ignore vibration error if unsupported or restricted
          }
        }
        dispatchKey('keydown', config.code, config.key);
      }
    },
    [config]
  );

  const handlePressEnd = useCallback(
    (e: React.PointerEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      if (isPressedRef.current) {
        isPressedRef.current = false;
        setIsPressed(false);
        dispatchKey('keyup', config.code, config.key);
      }
    },
    [config]
  );

  return (
    <button
      type="button"
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerCancel={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onTouchStart={(e) => {
        if (e.cancelable) e.preventDefault();
      }}
      onTouchEnd={(e) => {
        if (e.cancelable) e.preventDefault();
      }}
      className={`touch-none select-none flex items-center justify-center font-bold transition-all duration-75 active:scale-95 cursor-pointer ${
        isPressed
          ? 'bg-white/30 border-white/40 scale-95 shadow-inner'
          : 'bg-white/10 dark:bg-black/30 border-white/10 hover:bg-white/20'
      } backdrop-blur-md border rounded-full text-white ${className}`}
    >
      {children || config.label}
    </button>
  );
};

const BUTTON_CONFIGS = {
  up: { code: 'ArrowUp', key: 'ArrowUp', label: '▲' },
  down: { code: 'ArrowDown', key: 'ArrowDown', label: '▼' },
  left: { code: 'ArrowLeft', key: 'ArrowLeft', label: '◄' },
  right: { code: 'ArrowRight', key: 'ArrowRight', label: '►' },
  a: { code: 'KeyX', key: 'x', label: 'A' },
  b: { code: 'KeyZ', key: 'z', label: 'B' },
  start: { code: 'Enter', key: 'Enter', label: 'START' },
  select: { code: 'ShiftRight', key: 'Shift', label: 'SELECT' },
  l: { code: 'KeyQ', key: 'q', label: 'L' },
  r: { code: 'KeyW', key: 'w', label: 'R' },
};

export const TouchControls: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Top Triggers Row */}
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto pt-2">
        <TouchButton
          config={BUTTON_CONFIGS.l}
          className="pointer-events-auto px-6 py-2.5 text-sm font-semibold tracking-wider rounded-xl shadow-lg border-white/15"
        >
          L
        </TouchButton>

        <TouchButton
          config={BUTTON_CONFIGS.r}
          className="pointer-events-auto px-6 py-2.5 text-sm font-semibold tracking-wider rounded-xl shadow-lg border-white/15"
        >
          R
        </TouchButton>
      </div>

      {/* Main Controller Area (D-Pad, Select/Start, Action Buttons) */}
      <div className="flex justify-between items-end w-full max-w-5xl mx-auto pb-2">
        {/* Left Side: D-Pad */}
        <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1 w-36 h-36 sm:w-44 sm:h-44 p-2 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/10 shadow-2xl items-center justify-items-center">
          <TouchButton
            config={BUTTON_CONFIGS.up}
            className="col-start-2 row-start-1 w-11 h-11 sm:w-13 sm:h-13 rounded-t-lg rounded-b-sm"
          >
            <ChevronUp className="w-6 h-6 text-cyan-300" />
          </TouchButton>

          <TouchButton
            config={BUTTON_CONFIGS.left}
            className="col-start-1 row-start-2 w-11 h-11 sm:w-13 sm:h-13 rounded-l-lg rounded-r-sm"
          >
            <ChevronLeft className="w-6 h-6 text-cyan-300" />
          </TouchButton>

          <div className="col-start-2 row-start-2 w-8 h-8 rounded-full bg-white/10 dark:bg-black/40 border border-white/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/40" />
          </div>

          <TouchButton
            config={BUTTON_CONFIGS.right}
            className="col-start-3 row-start-2 w-11 h-11 sm:w-13 sm:h-13 rounded-r-lg rounded-l-sm"
          >
            <ChevronRight className="w-6 h-6 text-cyan-300" />
          </TouchButton>

          <TouchButton
            config={BUTTON_CONFIGS.down}
            className="col-start-2 row-start-3 w-11 h-11 sm:w-13 sm:h-13 rounded-b-lg rounded-t-sm"
          >
            <ChevronDown className="w-6 h-6 text-cyan-300" />
          </TouchButton>
        </div>

        {/* Bottom Center: Select / Start Buttons */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/5 dark:bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl mb-1">
          <TouchButton
            config={BUTTON_CONFIGS.select}
            className="px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider rounded-full shadow border-white/10"
          >
            SELECT
          </TouchButton>
          <TouchButton
            config={BUTTON_CONFIGS.start}
            className="px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider rounded-full shadow border-white/10"
          >
            START
          </TouchButton>
        </div>

        {/* Right Side: Action Buttons (A & B angled) */}
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 p-3 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/10 shadow-2xl transform -rotate-12">
          <TouchButton
            config={BUTTON_CONFIGS.b}
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full text-lg font-black text-rose-400 border-rose-500/30 shadow-lg shadow-rose-950/30"
          >
            B
          </TouchButton>
          <TouchButton
            config={BUTTON_CONFIGS.a}
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full text-lg font-black text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-950/30 translate-y-[-6px]"
          >
            A
          </TouchButton>
        </div>
      </div>
    </div>
  );
};
