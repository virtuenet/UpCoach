declare module 'archiver' {
  import { Readable, Transform } from 'stream';

  interface Archiver extends Transform {
    append(source: string | Buffer | Readable, data?: { name?: string }): void;
    directory(dirpath: string, destpath?: string, data?: unknown): void;
    file(filepath: string, destpath?: string, data?: unknown): void;
    glob(pattern: string, options?: unknown, data?: unknown): void;
    finalize(): Promise<void>;
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
  }

  interface ArchiverOptions {
    zlib?: {
      level?: number;
      chunkSize?: number;
      windowBits?: number;
      memLevel?: number;
      strategy?: number;
      dictionary?: Buffer;
    };
    forceLocalTime?: boolean;
    forceZip64?: boolean;
    store?: boolean;
  }

  function archiver(format: 'zip' | 'tar', options?: ArchiverOptions): Archiver;

  export = archiver;
}