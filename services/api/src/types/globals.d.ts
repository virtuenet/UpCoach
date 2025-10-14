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
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
  };

  var Buffer: BufferConstructor;

  var global: any;
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
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: string | Buffer): any;
}

declare module 'express' {
  export interface Request {
    body: any;
    params: any;
    query: any;
    headers: any;
    user?: any;
  }

  export interface Response {
    status: (code: number) => Response;
    json: (data: any) => Response;
    send: (data: any) => Response;
    cookie: (name: string, value: string, options?: any) => Response;
  }

  export interface NextFunction {
    (error?: any): void;
  }

  export function Router(): any;
  export default function express(): any;
}

declare module 'express-session' {
  interface SessionOptions {
    secret: string;
    resave?: boolean;
    saveUninitialized?: boolean;
    cookie?: any;
    store?: any;
  }

  function session(options: SessionOptions): any;
  export = session;
}

export {};