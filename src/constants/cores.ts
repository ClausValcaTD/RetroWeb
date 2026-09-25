import { CoreInfo } from '../types/emulator';

export const SUPPORTED_CORES: CoreInfo[] = [
  {
    id: 'uzem',
    name: 'Uzebox (Uzem)',
    system: 'Uzebox',
    extensions: ['.uze', '.hex', '.bin'],
    aspectRatio: '4:3',
  },
  {
    id: 'mgba',
    name: 'Nintendo - Game Boy Advance (mGBA)',
    system: 'Game Boy Advance',
    extensions: ['.gba', '.gb', '.gbc'],
    aspectRatio: '3:2',
  },
  {
    id: 'quasi88',
    name: 'NEC - PC-8000 / PC-8800 series (QUASI88)',
    system: 'PC-88',
    extensions: ['.d88', '.88d', '.cmt', '.t88'],
    aspectRatio: '4:3',
  },
];

export const CORE_MAP: Record<string, CoreInfo> = SUPPORTED_CORES.reduce((acc, core) => {
  acc[core.id] = core;
  return acc;
}, {} as Record<string, CoreInfo>);
