import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Plus, Play, Trash2, Search, Sparkles, Upload, Clock, HardDrive } from 'lucide-react';
import { Game } from '../db';
import { getBoxArtUrl, getFallbackGradient } from '../utils/boxArt';
import { SUPPORTED_CORES, CORE_MAP } from '../constants/cores';

interface GameLibraryProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  onImportFile: (file: File) => void;
  onDeleteGame: (id: number) => void;
}

export const GameLibrary: React.FC<GameLibraryProps> = ({
  games,
  onSelectGame,
  onImportFile,
  onDeleteGame,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageError = (id: number) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => onImportFile(file));
      e.target.value = '';
    }
  };

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
      Array.from(e.dataTransfer.files).forEach((file) => onImportFile(file));
    }
  };

  const filteredGames = games.filter((game) => {
    const matchesFilter =
      selectedFilter === 'all' || game.coreId.toLowerCase() === selectedFilter.toLowerCase();
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.originalFilename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSystemBadge = (coreId: string) => {
    switch (coreId.toLowerCase()) {
      case 'mgba':
        return { label: 'GBA', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'uzem':
        return { label: 'Uzebox', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'quasi88':
        return { label: 'PC-88', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { label: coreId.toUpperCase(), bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    }
  };

  return (
    <div
      className="relative flex-1 w-full h-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-y-auto overflow-x-hidden selection:bg-cyan-500 selection:text-zinc-950"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".uze,.hex,.bin,.gba,.gb,.gbc,.d88,.88d,.cmt,.t88"
        onChange={handleFileInputChange}
      />

      {/* Drag and Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-cyan-950/90 backdrop-blur-md border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none p-6"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="p-6 rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-4"
            >
              <Upload className="w-16 h-16" />
            </motion.div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Drop ROM Files to Add to Library
            </h2>
            <p className="text-cyan-200/80 text-sm max-w-md text-center">
              Your games will be automatically processed, cover art fetched, and saved locally in Dexie IndexedDB.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header / Branding Banner */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                RetroWeb
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Library
              </span>
            </div>
            <p className="text-xs text-zinc-400">Play instantly with local Dexie storage & Libretro Box Art</p>
          </div>
        </div>

        {/* Filter Tabs & Quick Import */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 focus:border-cyan-500/50 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition"
            />
          </div>

          {/* Quick Add Game Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add Game</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 flex-1 flex flex-col gap-6">
        {/* System Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/60">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            All Systems ({games.length})
          </button>
          {SUPPORTED_CORES.map((core) => {
            const count = games.filter((g) => g.coreId.toLowerCase() === core.id.toLowerCase()).length;
            return (
              <button
                key={core.id}
                onClick={() => setSelectedFilter(core.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === core.id
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <span>{core.system}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-800/80 text-zinc-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Library Grid or Empty State */}
        {filteredGames.length === 0 ? (
          <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 my-auto">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4 shadow-xl">
              <HardDrive className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-200 mb-1">
              {games.length === 0 ? 'Your Game Library is Empty' : 'No matching games found'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mb-6">
              {games.length === 0
                ? 'Drag & drop ROM files anywhere or click below to upload. Games will be saved in Dexie IndexedDB with box art automatically.'
                : 'Try clearing your search query or switching system filters.'}
            </p>
            {games.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Import First ROM</span>
              </button>
            )}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
          >
            <AnimatePresence>
              {filteredGames.map((game) => {
                const gameId = game.id!;
                const coverUrl = game.coverUrl || getBoxArtUrl(game.title, game.coreId);
                const hasImageError = imageErrorMap[gameId];
                const badge = getSystemBadge(game.coreId);
                const fallbackBg = getFallbackGradient(game.title);

                return (
                  <motion.div
                    key={gameId}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10"
                  >
                    {/* Poster Art Card (aspect-2/3) */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                      {!hasImageError ? (
                        <img
                          src={coverUrl}
                          alt={game.title}
                          onError={() => handleImageError(gameId)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${fallbackBg} p-4 flex flex-col justify-between relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}
                        >
                          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                          <div className="relative z-10 flex justify-between items-start">
                            <Sparkles className="w-5 h-5 text-cyan-400/60" />
                          </div>
                          <div className="relative z-10">
                            <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-md">
                              {game.title}
                            </h3>
                            <p className="text-[10px] text-zinc-300/80 mt-1 font-mono uppercase">
                              {CORE_MAP[game.coreId]?.system || game.coreId}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* System Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${game.title}" from local storage?`)) {
                            onDeleteGame(gameId);
                          }
                        }}
                        title="Delete from Library"
                        className="absolute top-2 right-2 z-20 p-1.5 rounded-xl bg-zinc-950/70 hover:bg-rose-600 text-zinc-400 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Hover Overlay with Play Button */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                        <button
                          onClick={() => onSelectGame(game)}
                          className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition transform translate-y-2 group-hover:translate-y-0 cursor-pointer active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Play Now</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Footer Info */}
                    <div className="p-3 bg-zinc-900 flex flex-col justify-between flex-1">
                      <div>
                        <h4
                          className="text-xs font-semibold text-zinc-100 truncate group-hover:text-cyan-300 transition"
                          title={game.title}
                        >
                          {game.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">
                          {game.originalFilename}
                        </p>
                      </div>

                      {game.lastPlayed && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center gap-1 text-[10px] text-zinc-500">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Last played {new Date(game.lastPlayed).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};
