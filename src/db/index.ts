import Dexie, { Table } from 'dexie';

export interface Game {
  id?: number;
  title: string;
  originalFilename: string;
  coreId: string;
  romData: ArrayBuffer;
  coverUrl?: string;
  lastPlayed?: number;
  createdAt: number;
}

export interface SaveState {
  id?: number;
  gameId: number;
  slot: number; // 0 for autosave, 1-5 for manual states
  stateData: ArrayBuffer;
  screenshot?: string; // base64 thumbnail for save preview
  updatedAt: number;
}

export class RetroWebDB extends Dexie {
  games!: Table<Game, number>;
  saves!: Table<SaveState, number>;

  constructor() {
    super('RetroWebDB');
    this.version(1).stores({
      games: '++id, title, originalFilename, coreId, lastPlayed, createdAt',
      saves: '++id, gameId, slot, [gameId+slot], updatedAt',
    });
  }
}

export const db = new RetroWebDB();

export async function addGameToDb(game: Omit<Game, 'id' | 'createdAt'>): Promise<number> {
  const existing = await db.games
    .where('originalFilename')
    .equals(game.originalFilename)
    .first();

  if (existing && existing.id) {
    await db.games.update(existing.id, {
      ...game,
      lastPlayed: Date.now(),
    });
    return existing.id;
  }

  const id = await db.games.add({
    ...game,
    createdAt: Date.now(),
  });
  return id as number;
}

export async function getAllGames(): Promise<Game[]> {
  return await db.games.orderBy('lastPlayed').reverse().toArray();
}

export async function getGameById(id: number): Promise<Game | undefined> {
  return await db.games.get(id);
}

export async function updateGameLastPlayed(id: number): Promise<void> {
  await db.games.update(id, { lastPlayed: Date.now() });
}

export async function deleteGameFromDb(id: number): Promise<void> {
  await db.transaction('rw', db.games, db.saves, async () => {
    await db.saves.where('gameId').equals(id).delete();
    await db.games.delete(id);
  });
}

export async function saveGameState(save: Omit<SaveState, 'id' | 'updatedAt'>): Promise<number> {
  const existing = await db.saves
    .where('[gameId+slot]')
    .equals([save.gameId, save.slot])
    .first();

  const updatedAt = Date.now();
  if (existing && existing.id) {
    await db.saves.update(existing.id, {
      stateData: save.stateData,
      screenshot: save.screenshot,
      updatedAt,
    });
    return existing.id;
  } else {
    const id = await db.saves.add({
      ...save,
      updatedAt,
    });
    return id as number;
  }
}

export async function getGameSaves(gameId: number): Promise<SaveState[]> {
  return await db.saves.where('gameId').equals(gameId).toArray();
}

export async function getSaveState(gameId: number, slot: number): Promise<SaveState | undefined> {
  return await db.saves
    .where('[gameId+slot]')
    .equals([gameId, slot])
    .first();
}
