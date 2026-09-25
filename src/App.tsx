import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { EmulatorView } from './components/EmulatorView';
import { TouchControls } from './components/TouchControls';
import { EmulatorStatus } from './types/emulator';
import { loadAndStartCore } from './utils/emulatorRunner';
import { SUPPORTED_CORES } from './constants/cores';

export default function App() {
  const [currentCoreId, setCurrentCoreId] = useState<string>('uzem');
  const [status, setStatus] = useState<EmulatorStatus>('idle');
  const [romFile, setRomFile] = useState<{ name: string; buffer: ArrayBuffer } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);

  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
    setShowTouchControls(isTouchDevice);
  }, []);

  const startEmulator = useCallback(
    async (coreId: string, romData?: { name: string; buffer: ArrayBuffer }) => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) {
          throw new Error('Canvas element not found in DOM');
        }

        await loadAndStartCore(
          coreId,
          canvas,
          romData,
          (log, isErr) => {
            if (isErr && log.includes('Error')) {
              console.error('Emscripten Error:', log);
            }
          }
        );

        setStatus('running');
      } catch (err: any) {
        console.error('Failed to launch emulator:', err);
        setErrorMessage(err.message || 'Error initializing emulator core.');
        setStatus('error');
      }
    },
    []
  );

  const handleSelectCore = useCallback(
    (coreId: string) => {
      setCurrentCoreId(coreId);
      if (romFile) {
        startEmulator(coreId, romFile);
      } else {
        setStatus('ready');
      }
    },
    [romFile, startEmulator]
  );

  const handleRomSelect = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        const romData = { name: file.name, buffer };
        setRomFile(romData);

        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        const matchingCore = SUPPORTED_CORES.find((c) => c.extensions.includes(fileExt));

        const targetCoreId = matchingCore ? matchingCore.id : currentCoreId;
        if (matchingCore && matchingCore.id !== currentCoreId) {
          setCurrentCoreId(matchingCore.id);
        }

        await startEmulator(targetCoreId, romData);
      } catch (err: any) {
        console.error('Failed to read ROM file:', err);
        setErrorMessage('Failed to read ROM file.');
        setStatus('error');
      }
    },
    [currentCoreId, startEmulator]
  );

  const handlePauseToggle = useCallback(() => {
    if (!window.Module) return;

    if (status === 'running') {
      if (window.Module._cmd_pause) {
        window.Module._cmd_pause();
      } else if (window.Module.retroArchSend) {
        window.Module.retroArchSend('PAUSE_TOGGLE');
      }
      setStatus('paused');
    } else if (status === 'paused') {
      if (window.Module._cmd_unpause) {
        window.Module._cmd_unpause();
      } else if (window.Module.retroArchSend) {
        window.Module.retroArchSend('PAUSE_TOGGLE');
      }
      setStatus('running');
    }
  }, [status]);

  const handleReset = useCallback(() => {
    if (!window.Module) return;

    if (window.Module._cmd_reset) {
      window.Module._cmd_reset();
    } else if (window.Module.retroArchSend) {
      window.Module.retroArchSend('RESET');
    }
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        canvas.requestFullscreen().catch(() => {});
      }
    }
  }, []);

  const handleToggleTouchControls = useCallback(() => {
    setShowTouchControls((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden">
      <Header
        currentCoreId={currentCoreId}
        onSelectCore={handleSelectCore}
        status={status}
        romName={romFile ? romFile.name : null}
        onRomSelect={handleRomSelect}
        onPauseToggle={handlePauseToggle}
        onReset={handleReset}
        onFullscreenToggle={handleFullscreenToggle}
        showTouchControls={showTouchControls}
        onToggleTouchControls={handleToggleTouchControls}
      />

      <main className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950 overflow-hidden">
        <EmulatorView
          currentCoreId={currentCoreId}
          romFile={romFile}
          status={status}
          onRomSelect={handleRomSelect}
          errorMessage={errorMessage}
        />

        {showTouchControls && <TouchControls />}
      </main>
    </div>
  );
}
