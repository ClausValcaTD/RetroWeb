# RetroWeb - Project Architecture & Jules Guidelines

## Overview
RetroWeb is a modern, open-source, self-hosted web-based retro game emulator (PWA) inspired by Afterplay, running on WebAssembly (WASM).

## Tech Stack
- Frontend: Vite + React (or Svelte) + Tailwind CSS + Lucide Icons
- Emulation: Libretro WASM cores (using Nostalgist.js or libretro-emscripten runtime)
- Storage: IndexedDB for local saves and ROM caching
- PWA: Service Worker for full offline capabilities
- Touch: Virtual on-screen touch controller overlay for mobile

## Rules for Jules:
1. Do NOT attempt to compile the entire RetroArch C codebase.
2. Rely on pre-compiled Libretro WASM cores / Nostalgist engine for running games on Canvas.
3. Focus PRs on clean UI/UX, responsive mobile design, touch controls, and save-state syncing.
4. Keep the codebase modular and well-documented.
