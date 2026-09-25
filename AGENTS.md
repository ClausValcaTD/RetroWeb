# RetroWeb - Development Guide for Jules

## Architecture
- Modern Web-based Retro Emulator frontend inspired by Afterplay / modern streaming platforms.
- Stack: Vite + React + Tailwind CSS.
- Emulation Layer: Precompiled Libretro Emscripten cores located in `/public/emulator/`.
- Virtual File System: Managed via BrowserFS and IndexedDB.

## Core Rules
1. Do NOT try to build/compile C/C++ or use Emscripten. All binaries (.wasm, .js) are precompiled in `/public/emulator/`.
2. Keep the UI clean, mobile-first, and responsive.
3. Build modular React components (Canvas viewport, Header, Game Library grid, On-screen controls).
