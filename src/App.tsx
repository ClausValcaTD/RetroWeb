import { useState, useCallback, useEffect } from "react";
import { Header } from "./components/Header";
import { EmulatorView } from "./components/EmulatorView";
import { TouchControls } from "./components/TouchControls";
import { GameLibrary } from "./components/GameLibrary";
import { InGameHUD } from "./components/InGameHUD";
import { EmulatorStatus } from "./types/emulator";
import { extractRomFromZip, writeBiosToFS } from "./utils/emulatorRunner";
import { SUPPORTED_CORES } from "./constants/cores";
import {
  Game,
  getAllGames,
  addGameToDb,
  deleteGameFromDb,
  updateGameLastPlayed,
} from "./db";
import { cleanRomTitle, getBoxArtUrl } from "./utils/boxArt";

export default function App() {
  const [currentCoreId, setCurrentCoreId] = useState<string>("uzem");
  const [status, setStatus] = useState<EmulatorStatus>("idle");
  const [romFile, setRomFile] = useState<{ name: string; buffer: ArrayBuffer } | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [viewMode, setViewMode] = useState<"library" | "emulator">("library");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);

  // Load games from Dexie IndexedDB on mount
  const refreshGames = useCallback(async () => {
    try {
      const storedGames = await getAllGames();
      setGames(storedGames);
    } catch (err) {
      console.error("Failed to load games from Dexie:", err);
    }
  }, []);

  useEffect(() => {
    refreshGames();

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
    setShowTouchControls(isTouchDevice);
  }, [refreshGames]);

  const startEmulator = useCallback(
    async (coreId: string, romData?: { name: string; buffer: ArrayBuffer }) => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        if (romData) {
          setRomFile(romData);
        }
        setCurrentCoreId(coreId);
        setStatus("running");
      } catch (err: any) {
        console.error("Failed to launch emulator:", err);
        setErrorMessage(err.message || "Error initializing emulator core.");
        setStatus("error");
      }
    },
    []
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
        const matchingCore = SUPPORTED_CORES.find((c) => c.extensions.includes(fileExt));
        const coreId = matchingCore ? matchingCore.id : currentCoreId;

        const cleanTitle = cleanRomTitle(file.name);
        const coverUrl = getBoxArtUrl(file.name, coreId);

        const newGameId = await addGameToDb({
          title: cleanTitle,
          originalFilename: file.name,
          coreId: coreId,
          romData: buffer,
          coverUrl: coverUrl,
          lastPlayed: Date.now(),
        });

        await refreshGames();

        const storedGame: Game = {
          id: newGameId,
          title: cleanTitle,
          originalFilename: file.name,
          coreId,
          romData: buffer,
          coverUrl,
          lastPlayed: Date.now(),
          createdAt: Date.now(),
        };

        setActiveGame(storedGame);
        setCurrentCoreId(coreId);
        setRomFile({ name: file.name, buffer });
        setViewMode("emulator");

        setTimeout(() => {
          startEmulator(coreId, { name: file.name, buffer });
        }, 100);
      } catch (err: any) {
        console.error("Failed to import file:", err);
        setErrorMessage("Failed to read or store ROM file.");
      }
    },
    [currentCoreId, refreshGames, startEmulator]
  );

  const handleBiosSelect = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        if (window.Module) {
          writeBiosToFS(window.Module, buffer, file.name);
          alert(`BIOS file "${file.name}" uploaded to /system directory.`);
        } else {
          alert(`BIOS file "${file.name}" will be mounted into /system directory when core starts.`);
        }
      } catch (err: any) {
        console.error("Failed to read BIOS file:", err);
        setErrorMessage("Failed to read BIOS file.");
      }
    },
    []
  );

  const handleRomSelect = useCallback(
    async (file: File) => {
      try {
        let buffer = await file.arrayBuffer();
        let fileName = file.name;
        let fileExt = "." + fileName.split(".").pop()?.toLowerCase();

        if (fileExt === ".zip") {
          const allSupportedExtensions = SUPPORTED_CORES.flatMap((c) => c.extensions);
          const extracted = extractRomFromZip(buffer, allSupportedExtensions);
          fileName = extracted.name;
          buffer = extracted.buffer;
          fileExt = "." + fileName.split(".").pop()?.toLowerCase();
        }

        const romData = { name: fileName, buffer };
        setRomFile(romData);
        setViewMode("emulator");

        const matchingCore = SUPPORTED_CORES.find((c) => c.extensions.includes(fileExt));
        const coreId = matchingCore ? matchingCore.id : currentCoreId;
        setCurrentCoreId(coreId);

        setTimeout(() => {
          startEmulator(coreId, romData);
        }, 100);
      } catch (err: any) {
        console.error("Failed to select ROM:", err);
        setErrorMessage("Failed to read ROM file.");
      }
    },
    [currentCoreId, startEmulator]
  );

  const handleSelectGame = useCallback(
    (game: Game) => {
      setActiveGame(game);
      setCurrentCoreId(game.coreId);
      setRomFile({ name: game.originalFilename, buffer: game.romData });
      setViewMode("emulator");
      if (game.id) {
        updateGameLastPlayed(game.id).then(() => refreshGames());
      }

      setTimeout(() => {
        startEmulator(game.coreId, { name: game.originalFilename, buffer: game.romData });
      }, 100);
    },
    [refreshGames, startEmulator]
  );

  const handleDeleteGame = useCallback(
    async (id: number) => {
      try {
        await deleteGameFromDb(id);
        await refreshGames();
        if (activeGame?.id === id) {
          setActiveGame(null);
          setRomFile(null);
          setStatus("idle");
          setViewMode("library");
        }
      } catch (err) {
        console.error("Failed to delete game:", err);
      }
    },
    [activeGame, refreshGames]
  );

  const handleSelectCore = useCallback(
    (coreId: string) => {
      setCurrentCoreId(coreId);
      if (romFile) {
        startEmulator(coreId, romFile);
      } else {
        setStatus("ready");
      }
    },
    [romFile, startEmulator]
  );

  const handlePauseToggle = useCallback(() => {
    if (status === "running") {
      setStatus("paused");
    } else if (status === "paused") {
      setStatus("running");
    }
  }, [status]);

  const handleReset = useCallback(() => {
    // Reset handler for UI state
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        gameContainer.requestFullscreen().catch(() => {});
      }
    }
  }, []);

  const handleToggleTouchControls = useCallback(() => {
    setShowTouchControls((prev) => !prev);
  }, []);

  const handleBackToLibrary = useCallback(() => {
    if (status === "running") {
      handlePauseToggle();
    }
    setViewMode("library");
  }, [handlePauseToggle, status]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden">
      {viewMode === "library" ? (
        <GameLibrary
          games={games}
          onSelectGame={handleSelectGame}
          onImportFile={handleImportFile}
          onDeleteGame={handleDeleteGame}
        />
      ) : (
        <>
          <Header
            currentCoreId={currentCoreId}
            onSelectCore={handleSelectCore}
            status={status}
            romName={romFile ? romFile.name : activeGame?.title || null}
            onRomSelect={handleRomSelect}
            onBiosSelect={handleBiosSelect}
            onPauseToggle={handlePauseToggle}
            onReset={handleReset}
            onFullscreenToggle={handleFullscreenToggle}
            showTouchControls={showTouchControls}
            onToggleTouchControls={handleToggleTouchControls}
          />

          <main className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950 overflow-hidden">
            <InGameHUD
              gameId={activeGame?.id || null}
              gameTitle={activeGame?.title || romFile?.name || null}
              status={status}
              onPauseToggle={handlePauseToggle}
              onReset={handleReset}
              onBackToLibrary={handleBackToLibrary}
              onToggleTouchControls={handleToggleTouchControls}
              showTouchControls={showTouchControls}
            />

            <EmulatorView
              currentCoreId={currentCoreId}
              romFile={romFile}
              status={status}
              onRomSelect={handleRomSelect}
              errorMessage={errorMessage}
            />

            {showTouchControls && <TouchControls />}
          </main>
        </>
      )}
    </div>
  );
}
