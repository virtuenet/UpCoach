// Global Node.js types for the UpCoach API service
declare global {
  var process: {
    env: { [key: string]: string | undefined };
    exit: (code: number) => never;
    cwd: () => string;
    on: (event: string, callback: Function) => void;
  };

  var require: (id: string) => any;
  var console: {
    log: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
  };

  var Buffer: BufferConstructor;

  var global: unknown;
  var __dirname: string;
  var __filename: string;
}

// Node.js specific types
interface Buffer {
  toString: (encoding?: string) => string;
  length: number;
}

interface BufferConstructor {
  from: (str: string, encoding?: string) => Buffer;
  alloc: (size: number) => Buffer;
}

// Module declarations for core Node.js modules
declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string): string;
}

declare module 'fs' {
  export function readFileSync(path: string, encoding?: string): string | Buffer;
  export function writeFileSync(path: string, data: string | Buffer): void;
  export function existsSync(path: string): boolean;
}

declare module 'crypto' {
  export function randomBytes(size: number): Buffer;
  export function createHash(algorithm: string): unknown;
  export function createHmac(algorithm: string, key: string | Buffer): unknown;
}

declare module 'express' {
  export interface Request {
    body: unknown;
    params: unknown;
    query: unknown;
    headers: unknown;
    user?: unknown;
  }

  export interface Response {
    status: (code: number) => Response;
    json: (data: unknown) => Response;
    send: (data: unknown) => Response;
    cookie: (name: string, value: string, options?: unknown) => Response;
  }

  export interface NextFunction {
    (error?: unknown): void;
  }

  export function Router(): unknown;
  export default function express(): unknown;
}

declare module 'express-session' {
  interface SessionOptions {
    secret: string;
    resave?: boolean;
    saveUninitialized?: boolean;
    cookie?: unknown;
    store?: unknown;
  }

  function session(options: SessionOptions): unknown;
  export = session;
}

export {};