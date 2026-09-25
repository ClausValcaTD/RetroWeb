export interface CoreInfo {
  id: string;
  name: string;
  system: string;
  extensions: string[];
  aspectRatio?: string;
}

export type EmulatorStatus = 'idle' | 'loading' | 'ready' | 'running' | 'paused' | 'error';

export interface GlobalEmscriptenModule {
  canvas?: HTMLCanvasElement;
  print?: (text: string) => void;
  printErr?: (text: string) => void;
  onRuntimeInitialized?: () => void;
  noInitialRun?: boolean;
  arguments?: string[];
  corePath?: string;
  preRun?: Array<(module: GlobalEmscriptenModule) => void>;
  ENV?: Record<string, string>;
  FS?: {
    mkdir?: (path: string) => void;
    mount?: (type: any, opts: any, mountpoint: string) => void;
    writeFile?: (path: string, data: Uint8Array, opts?: any) => void;
    readFile?: (path: string, opts?: any) => Uint8Array;
    unlink?: (path: string) => void;
    createDataFile?: (parent: string, name: string, data: Uint8Array, canRead: boolean, canWrite: boolean) => void;
    analyzePath?: (path: string) => { exists: boolean; [key: string]: any };
  };
  PATH?: any;
  ERRNO_CODES?: any;
  callMain?: (args?: string[]) => number;
  retroArchSend?: (cmd: string) => void;
  retroArchRecv?: () => string;
  _cmd_pause?: () => void;
  _cmd_unpause?: () => void;
  _cmd_reset?: () => void;
  _cmd_toggle_pause?: () => void;
  [key: string]: any;
}

declare global {
  interface Window {
    BrowserFS?: any;
    Module?: GlobalEmscriptenModule;
    libretroCores?: Record<string, string>;
  }
}
