import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const keyMap: Record<string, { key: string; code: string; keyCode: number }> = {
  up:     { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
  down:   { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
  left:   { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
  right:  { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  a:      { key: 'x',          code: 'KeyX',       keyCode: 88 },
  b:      { key: 'z',          code: 'KeyZ',       keyCode: 90 },
  x:      { key: 's',          code: 'KeyS',       keyCode: 83 },
  y:      { key: 'a',          code: 'KeyA',       keyCode: 65 },
  start:  { key: 'Enter',      code: 'Enter',      keyCode: 13 },
  select: { key: 'Shift',      code: 'ShiftRight', keyCode: 16 },
  l:      { key: 'q',          code: 'KeyQ',       keyCode: 81 },
  r:      { key: 'w',          code: 'KeyW',       keyCode: 87 },
};

function triggerKeyEvent(type: 'keydown' | 'keyup', buttonName: string) {
  const mapping = keyMap[buttonName];
  if (!mapping) return;

  const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
  if (canvas && document.activeElement !== canvas) {
    canvas.focus();
  }

  const eventInit: KeyboardEventInit = {
    key: mapping.key,
    code: mapping.code,
    bubbles: true,
    cancelable: true,
    composed: true,
  };

  const event = new KeyboardEvent(type, eventInit);
  // Polyfill legacy properties that Emscripten C runtime relies on
  Object.defineProperty(event, 'keyCode', { get: () => mapping.keyCode });
  Object.defineProperty(event, 'which', { get: () => mapping.keyCode });

  // Dispatch to both canvas and document
  if (canvas) canvas.dispatchEvent(event);
  document.dispatchEvent(event);
}

interface TouchButtonProps {
  name: string;
  className?: string;
  children?: React.ReactNode;
}

const TouchButton: React.FC<TouchButtonProps> = ({ name, className = '', children }) => {
  const [isPressed, setIsPressed] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    activePointerIdRef.current = e.pointerId;
    setIsPressed(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore vibration error if unsupported or restricted
      }
    }
    triggerKeyEvent('keydown', name);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (activePointerIdRef.current !== null) {
      activePointerIdRef.current = null;
      setIsPressed(false);
      triggerKeyEvent('keyup', name);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    e.preventDefault();
    if (activePointerIdRef.current !== null) {
      activePointerIdRef.current = null;
      setIsPressed(false);
      triggerKeyEvent('keyup', name);
    }
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerUp}
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
      {children}
    </button>
  );
};

export const TouchControls: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Top Triggers Row */}
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto pt-2">
        <TouchButton
          name="l"
          className="pointer-events-auto px-6 py-2.5 text-sm font-semibold tracking-wider rounded-xl shadow-lg border-white/15"
        >
          L
        </TouchButton>

        <TouchButton
          name="r"
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
            name="up"
            className="col-start-2 row-start-1 w-11 h-11 sm:w-13 sm:h-13 rounded-t-lg rounded-b-sm"
          >
            <ChevronUp className="w-6 h-6 text-cyan-300" />
          </TouchButton>

          <TouchButton
            name="left"
            className="col-start-1 row-start-2 w-11 h-11 sm:w-13 sm:h-13 rounded-l-lg rounded-r-sm"
          >
            <ChevronLeft className="w-6 h-6 text-cyan-300" />
          </TouchButton>

          <div className="col-start-2 row-start-2 w-8 h-8 rounded-full bg-white/10 dark:bg-black/40 border border-white/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/40" />
          </div>

          <TouchButton
            name="right"
            className="col-start-3 row-start-2 w-11 h-11 sm:w-13 sm:h-13 rounded-r-lg rounded-l-sm"
          >
            <ChevronRight className="w-6 h-6 text-cyan-300" />
          </TouchButton>

          <TouchButton
            name="down"
            className="col-start-2 row-start-3 w-11 h-11 sm:w-13 sm:h-13 rounded-b-lg rounded-t-sm"
          >
            <ChevronDown className="w-6 h-6 text-cyan-300" />
          </TouchButton>
        </div>

        {/* Bottom Center: Select / Start Buttons */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/5 dark:bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl mb-1">
          <TouchButton
            name="select"
            className="px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider rounded-full shadow border-white/10"
          >
            SELECT
          </TouchButton>
          <TouchButton
            name="start"
            className="px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider rounded-full shadow border-white/10"
          >
            START
          </TouchButton>
        </div>

        {/* Right Side: Action Buttons (A & B angled) */}
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 p-3 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/10 shadow-2xl transform -rotate-12">
          <TouchButton
            name="b"
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full text-lg font-black text-rose-400 border-rose-500/30 shadow-lg shadow-rose-950/30"
          >
            B
          </TouchButton>
          <TouchButton
            name="a"
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full text-lg font-black text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-950/30 translate-y-[-6px]"
          >
            A
          </TouchButton>
        </div>
      </div>
    </div>
  );
};
