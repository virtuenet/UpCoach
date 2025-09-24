// Missing type definitions for third-party packages
// This file provides minimal type definitions for packages that don't have proper @types packages

// Node.js global types
declare global {
  var process: {
    env: { [key: string]: string | undefined };
    exit(code?: number): never;
    cwd(): string;
    platform: string;
    argv: string[];
    version: string;
    versions: { [key: string]: string };
  };
  var require: (id: string) => any;
  var Buffer: {
    new (str: string, encoding?: string): Buffer;
    from(data: any, encoding?: string): Buffer;
    alloc(size: number, fill?: any, encoding?: string): Buffer;
    isBuffer(obj: any): boolean;
  };
  interface Buffer {
    length: number;
    toString(encoding?: string, start?: number, end?: number): string;
    slice(start?: number, end?: number): Buffer;
    copy(target: Buffer, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
  }
  var __dirname: string;
  var __filename: string;
}

// Dotenv types
declare module 'dotenv' {
  export interface DotenvConfigOptions {
    path?: string;
    encoding?: string;
    debug?: boolean;
    override?: boolean;
  }

  export interface DotenvConfigOutput {
    error?: Error;
    parsed?: { [key: string]: string };
  }

  export function config(options?: DotenvConfigOptions): DotenvConfigOutput;
  export function parse(src: string | Buffer, options?: DotenvConfigOptions): { [key: string]: string };
}

// Zod types
declare module 'zod' {
  export interface ZodType<T = any> {
    parse(data: unknown): T;
    safeParse(data: unknown): { success: true; data: T } | { success: false; error: any };
    optional(): ZodOptional<this>;
    nullable(): ZodNullable<this>;
    default(value: T): ZodDefault<this>;
  }

  export interface ZodString extends ZodType<string> {
    min(length: number, message?: string): this;
    max(length: number, message?: string): this;
    length(length: number, message?: string): this;
    email(message?: string): this;
    url(message?: string): this;
    uuid(message?: string): this;
    regex(pattern: RegExp, message?: string): this;
    includes(value: string, message?: string): this;
    startsWith(value: string, message?: string): this;
    endsWith(value: string, message?: string): this;
    trim(): this;
    toLowerCase(): this;
    toUpperCase(): this;
  }

  export interface ZodNumber extends ZodType<number> {
    min(value: number, message?: string): this;
    max(value: number, message?: string): this;
    int(message?: string): this;
    positive(message?: string): this;
    negative(message?: string): this;
    nonnegative(message?: string): this;
    nonpositive(message?: string): this;
    finite(message?: string): this;
    safe(message?: string): this;
  }

  export interface ZodBoolean extends ZodType<boolean> {}

  export interface ZodArray<T extends ZodType> extends ZodType<T[]> {
    min(length: number, message?: string): this;
    max(length: number, message?: string): this;
    length(length: number, message?: string): this;
    nonempty(message?: string): this;
  }

  export interface ZodObject<T extends Record<string, ZodType>> extends ZodType<{ [K in keyof T]: T[K] extends ZodType<infer U> ? U : never }> {
    shape: T;
    pick<K extends keyof T>(keys: K[]): ZodObject<Pick<T, K>>;
    omit<K extends keyof T>(keys: K[]): ZodObject<Omit<T, K>>;
    partial(): ZodObject<{ [K in keyof T]: ZodOptional<T[K]> }>;
    required(): ZodObject<{ [K in keyof T]: T[K] extends ZodOptional<infer U> ? U : T[K] }>;
    extend<U extends Record<string, ZodType>>(schema: U): ZodObject<T & U>;
    merge<U extends ZodObject<any>>(schema: U): ZodObject<T & U['shape']>;
    passthrough(): this;
    strict(): this;
    strip(): this;
    deepPartial(): any;
  }

  export interface ZodOptional<T extends ZodType> extends ZodType<T extends ZodType<infer U> ? U | undefined : never> {}
  export interface ZodNullable<T extends ZodType> extends ZodType<T extends ZodType<infer U> ? U | null : never> {}
  export interface ZodDefault<T extends ZodType> extends ZodType<T extends ZodType<infer U> ? U : never> {}

  export function string(): ZodString;
  export function number(): ZodNumber;
  export function boolean(): ZodBoolean;
  export function array<T extends ZodType>(schema: T): ZodArray<T>;
  export function object<T extends Record<string, ZodType>>(shape: T): ZodObject<T>;
  export function union<T extends [ZodType, ZodType, ...ZodType[]]>(schemas: T): ZodType<T[number] extends ZodType<infer U> ? U : never>;
  export function literal<T extends string | number | boolean>(value: T): ZodType<T>;
  export function ZodEnum<T extends string>(values: [T, ...T[]]): ZodType<T>;
  export function record<T extends ZodType>(schema: T): ZodType<Record<string, T extends ZodType<infer U> ? U : never>>;
  export function tuple<T extends [ZodType, ...ZodType[]]>(schemas: T): ZodType<{ [K in keyof T]: T[K] extends ZodType<infer U> ? U : never }>;
  export function any(): ZodType<any>;
  export function unknown(): ZodType<unknown>;
  export function never(): ZodType<never>;
  export function ZodVoid(): ZodType<void>;
  export function ZodNull(): ZodType<null>;
  export function ZodUndefined(): ZodType<undefined>;

  export const ZodError: any;
  export type ZodError = any;
}

// Jest global types
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function beforeAll(fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;
  function expect(actual: any): any;

  namespace jest {
    function fn(): any;
    function fn<T extends (...args: any[]) => any>(implementation?: T): any;
    function spyOn(object: any, method: string): any;
    function mock(moduleName: string, factory?: () => any, options?: any): void;
    function unmock(moduleName: string): void;
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;
    function setTimeout(timeout: number): void;
  }
}

// @jest/globals module
declare module '@jest/globals' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function expect(actual: any): any;
  export const jest: typeof import('jest');
}

declare module '@babel/generator' {
  const generator: any;
  export = generator;
}

declare module '@babel/template' {
  const template: any;
  export = template;
}

declare module '@babel/traverse' {
  const traverse: any;
  export = traverse;
}

declare module 'body-parser' {
  const bodyParser: any;
  export = bodyParser;
}

declare module 'd3-color' {
  const d3Color: any;
  export = d3Color;
}

declare module 'd3-path' {
  const d3Path: any;
  export = d3Path;
}

declare module 'http-cache-semantics' {
  const httpCacheSemantics: any;
  export = httpCacheSemantics;
}

declare module 'istanbul-lib-report' {
  const istanbulLibReport: any;
  export = istanbulLibReport;
}

declare module 'ms' {
  const ms: any;
  export = ms;
}

declare module 'qs' {
  const qs: any;
  export = qs;
}

declare module 'range-parser' {
  const rangeParser: any;
  export = rangeParser;
}

declare module 'react-router' {
  const reactRouter: any;
  export = reactRouter;
}

declare module 'readdir-glob' {
  const readdirGlob: any;
  export = readdirGlob;
}

declare module 'send' {
  const send: any;
  export = send;
}

declare module 'serve-static' {
  const serveStatic: any;
  export = serveStatic;
}

declare module 'tough-cookie' {
  const toughCookie: any;
  export = toughCookie;
}

declare module 'yargs-parser' {
  const yargsParser: any;
  export = yargsParser;
}

// Web Vitals types
declare module 'web-vitals' {
  interface Metric {
    name: string;
    value: number;
    delta: number;
    id: string;
    entries?: PerformanceEntry[];
  }

  export function getCLS(onReport: (metric: Metric) => void): void;
  export function getFID(onReport: (metric: Metric) => void): void;
  export function getFCP(onReport: (metric: Metric) => void): void;
  export function getLCP(onReport: (metric: Metric) => void): void;
  export function getTTFB(onReport: (metric: Metric) => void): void;
}

// Redis types
declare module 'redis' {
  export interface RedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    setex(key: string, seconds: number, value: string): Promise<void>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    ltrim(key: string, start: number, stop: number): Promise<void>;
    incrBy(key: string, increment: number): Promise<number>;
    quit(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    on(event: string, listener: Function): void;
  }

  export function createClient(options?: any): RedisClient;
}

// React Hot Toast types
declare module 'react-hot-toast' {
  export interface ToastOptions {
    id?: string;
    duration?: number;
    position?: string;
    style?: React.CSSProperties;
    className?: string;
    icon?: React.ReactNode;
    iconTheme?: any;
    ariaProps?: React.AriaAttributes;
  }

  export function toast(message: string, options?: ToastOptions): string;
  export namespace toast {
    function success(message: string, options?: ToastOptions): string;
    function error(message: string, options?: ToastOptions): string;
    function loading(message: string, options?: ToastOptions): string;
    function dismiss(id?: string): void;
  }

  export function Toaster(props?: any): React.ReactElement;
}

// Twilio types
declare module 'twilio' {
  export interface TwilioClient {
    messages: {
      create(options: any): Promise<any>;
    };
  }

  export default function twilio(accountSid: string, authToken: string): TwilioClient;
}

// Puppeteer types
declare module 'puppeteer' {
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    setContent(html: string): Promise<void>;
    pdf(options?: any): Promise<Buffer>;
    close(): Promise<void>;
  }

  export function launch(options?: any): Promise<Browser>;
}

// CSV Writer types
declare module 'csv-writer' {
  export interface CsvWriter {
    writeRecords(records: any[]): Promise<void>;
  }

  export function createObjectCsvWriter(options: any): CsvWriter;
}

// Axios Retry types
declare module 'axios-retry' {
  import { AxiosInstance } from 'axios';

  export default function axiosRetry(axios: AxiosInstance, options?: any): void;
}

// Express Rate Limit types
declare module 'express-rate-limit' {
  import { Request, Response, NextFunction } from 'express';

  export interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string;
    statusCode?: number;
    headers?: boolean;
    skip?: (req: Request, res: Response) => boolean;
    keyGenerator?: (req: Request, res: Response) => string;
    handler?: (req: Request, res: Response, next: NextFunction) => void;
    onLimitReached?: (req: Request, res: Response, options: any) => void;
  }

  export default function rateLimit(options?: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
}

// Sequelize main module
declare module 'sequelize' {
  export interface Sequelize {
    define(modelName: string, attributes: any, options?: any): any;
    authenticate(): Promise<void>;
    sync(options?: any): Promise<void>;
    close(): Promise<void>;
    transaction(options?: any): Promise<any>;
    query(sql: string, options?: any): Promise<any>;
    getDialect(): string;
    getDatabaseName(): string;
    models: { [key: string]: any };
  }

  export class Sequelize {
    constructor(database: string, username: string, password: string, options?: any);
    constructor(uri: string, options?: any);
    define(modelName: string, attributes: any, options?: any): any;
    authenticate(): Promise<void>;
    sync(options?: any): Promise<void>;
    close(): Promise<void>;
    transaction(options?: any): Promise<any>;
    query(sql: string, options?: any): Promise<any>;
    getDialect(): string;
    getDatabaseName(): string;
    models: { [key: string]: any };
  }

  export const DataTypes: {
    STRING: any;
    TEXT: any;
    INTEGER: any;
    BIGINT: any;
    FLOAT: any;
    DOUBLE: any;
    DECIMAL: any;
    DATE: any;
    DATEONLY: any;
    BOOLEAN: any;
    ENUM: any;
    JSON: any;
    JSONB: any;
    UUID: any;
    UUIDV4: any;
    BLOB: any;
    NOW: any;
  };

  export class Model {
    static belongsTo(target: any, options?: any): any;
    static hasOne(target: any, options?: any): any;
    static hasMany(target: any, options?: any): any;
    static belongsToMany(target: any, options?: any): any;
    static init(attributes: any, options: any): any;
    static findAll(options?: any): Promise<any[]>;
    static findOne(options?: any): Promise<any>;
    static findByPk(id: any, options?: any): Promise<any>;
    static create(values: any, options?: any): Promise<any>;
    static update(values: any, options: any): Promise<[number, any[]]>;
    static destroy(options: any): Promise<number>;
    static count(options?: any): Promise<number>;
    save(options?: any): Promise<this>;
    destroy(options?: any): Promise<void>;
    reload(options?: any): Promise<this>;
    update(values: any, options?: any): Promise<this>;
  }

  export const Op: {
    eq: symbol;
    ne: symbol;
    gte: symbol;
    gt: symbol;
    lte: symbol;
    lt: symbol;
    not: symbol;
    is: symbol;
    in: symbol;
    notIn: symbol;
    like: symbol;
    notLike: symbol;
    iLike: symbol;
    notILike: symbol;
    regexp: symbol;
    notRegexp: symbol;
    iRegexp: symbol;
    notIRegexp: symbol;
    between: symbol;
    notBetween: symbol;
    overlap: symbol;
    contains: symbol;
    contained: symbol;
    adjacent: symbol;
    strictLeft: symbol;
    strictRight: symbol;
    noExtendRight: symbol;
    noExtendLeft: symbol;
    and: symbol;
    or: symbol;
    any: symbol;
    all: symbol;
    values: symbol;
    col: symbol;
    placeholder: symbol;
    join: symbol;
    startsWith: symbol;
    endsWith: symbol;
    substring: symbol;
  };

  export function literal(val: string): any;
  export function fn(fnName: string, ...args: any[]): any;
  export function col(column: string): any;
  export function where(attribute: any, comparator: any, logic?: any): any;
}

// Sequelize TypeScript types
declare module 'sequelize-typescript' {
  export * from 'sequelize';
  export { Sequelize, DataTypes, Model, Table, Column, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, BelongsTo, HasMany, HasOne, ForeignKey, AllowNull, Unique, Default, Validate } from 'sequelize';
}

// Express Session types
declare module 'express-session' {
  import { Request, Response, NextFunction } from 'express';

  export interface SessionOptions {
    secret: string | string[];
    name?: string;
    store?: any;
    cookie?: {
      maxAge?: number;
      expires?: Date;
      path?: string;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: boolean | 'lax' | 'strict' | 'none';
    };
    genid?: (req: Request) => string;
    rolling?: boolean;
    resave?: boolean;
    proxy?: boolean;
    saveUninitialized?: boolean;
    unset?: 'destroy' | 'keep';
  }

  export interface Session {
    id: string;
    cookie: any;
    [key: string]: any;
  }

  declare global {
    namespace Express {
      interface Request {
        session: Session;
      }
    }
  }

  export default function session(options: SessionOptions): (req: Request, res: Response, next: NextFunction) => void;
}

// Connect Redis types
declare module 'connect-redis' {
  import { Store } from 'express-session';

  export interface RedisStoreOptions {
    client?: any;
    host?: string;
    port?: number;
    socket?: string;
    url?: string;
    ttl?: number;
    disableTTL?: boolean;
    db?: number;
    pass?: string;
    prefix?: string;
    serializer?: any;
    unref?: boolean;
    logErrors?: boolean | ((error: Error) => void);
    scanCount?: number;
  }

  export default function RedisStore(options?: RedisStoreOptions): typeof Store;
}

// Express Validator types
declare module 'express-validator' {
  import { Request, Response, NextFunction } from 'express';

  export interface ValidationError {
    msg: string;
    param: string;
    value: any;
    location: string;
  }

  export interface Result {
    isEmpty(): boolean;
    array(): ValidationError[];
    mapped(): { [key: string]: ValidationError };
    formatWith(formatter: (error: ValidationError) => any): any;
    throw(): void;
  }

  export function body(field?: string, message?: string): any;
  export function query(field?: string, message?: string): any;
  export function param(field?: string, message?: string): any;
  export function header(field?: string, message?: string): any;
  export function cookie(field?: string, message?: string): any;
  export function check(field?: string, message?: string): any;
  export function validationResult(req: Request): Result;
  export function matchedData(req: Request, options?: any): any;
  export function sanitize(field: string): any;
  export function checkExact(fields: any[], message?: string): any;
}

// Slugify types
declare module 'slugify' {
  export interface SlugifyOptions {
    replacement?: string;
    remove?: RegExp;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
  }

  export default function slugify(string: string, options?: SlugifyOptions | string): string;
}

// Multer types
declare module 'multer' {
  import { Request } from 'express';

  export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  export interface StorageEngine {
    _handleFile(req: Request, file: MulterFile, callback: (error?: any, info?: any) => void): void;
    _removeFile(req: Request, file: MulterFile, callback: (error: Error | null) => void): void;
  }

  export interface DiskStorageOptions {
    destination?: string | ((req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => void);
    filename?: (req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => void;
  }

  export interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    preservePath?: boolean;
    fileFilter?: (req: Request, file: MulterFile, cb: (error: Error | null, acceptFile: boolean) => void) => void;
  }

  export interface Multer {
    single(fieldname: string): (req: Request, res: any, next: any) => void;
    array(fieldname: string, maxCount?: number): (req: Request, res: any, next: any) => void;
    fields(fields: { name: string; maxCount?: number }[]): (req: Request, res: any, next: any) => void;
    none(): (req: Request, res: any, next: any) => void;
    any(): (req: Request, res: any, next: any) => void;
  }

  export function diskStorage(options: DiskStorageOptions): StorageEngine;
  export function memoryStorage(): StorageEngine;

  export default function multer(options?: Options): Multer;
}

// Sharp types
declare module 'sharp' {
  export interface Sharp {
    resize(width?: number, height?: number, options?: any): Sharp;
    jpeg(options?: any): Sharp;
    png(options?: any): Sharp;
    webp(options?: any): Sharp;
    toBuffer(): Promise<Buffer>;
    toFile(filename: string): Promise<any>;
    metadata(): Promise<any>;
    rotate(angle?: number): Sharp;
    flip(flip?: boolean): Sharp;
    flop(flop?: boolean): Sharp;
    crop(strategy?: string): Sharp;
    extract(options: { left: number; top: number; width: number; height: number }): Sharp;
    trim(threshold?: number): Sharp;
    normalize(normalize?: boolean): Sharp;
    gamma(gamma?: number): Sharp;
    negate(negate?: boolean): Sharp;
    blur(sigma?: number): Sharp;
    sharpen(sigma?: number, flat?: number, jagged?: number): Sharp;
    threshold(threshold?: number, options?: any): Sharp;
    boolean(operand: Buffer | Sharp, operator: string, options?: any): Sharp;
    linear(a?: number, b?: number): Sharp;
    recomb(inputMatrix: number[][]): Sharp;
    modulate(options?: any): Sharp;
    tint(rgb: { r: number; g: number; b: number }): Sharp;
    greyscale(greyscale?: boolean): Sharp;
    grayscale(grayscale?: boolean): Sharp;
    toColourspace(colourspace?: string): Sharp;
    toColorspace(colorspace?: string): Sharp;
  }

  export default function sharp(input?: string | Buffer | Uint8Array | Uint8ClampedArray): Sharp;
}

// AWS SNS types
declare module '@aws-sdk/client-sns' {
  export interface SNSClient {
    send(command: any): Promise<any>;
  }

  export class SNSClient {
    constructor(config: any);
  }

  export class PublishCommand {
    constructor(params: any);
  }
}

// Sentry React types - comprehensive definitions
declare module '@sentry/react' {
  import { ReactElement, Component } from 'react';

  export interface User {
    id?: string;
    username?: string;
    email?: string;
    ip_address?: string;
    [key: string]: any;
  }

  export interface Breadcrumb {
    message?: string;
    category?: string;
    level?: SeverityLevel;
    timestamp?: number;
    data?: { [key: string]: any };
  }

  export interface EventHint {
    event_id?: string;
    originalException?: Error;
    syntheticException?: Error;
    [key: string]: any;
  }

  export interface ErrorEvent {
    event_id: string;
    message?: string;
    timestamp?: number;
    level?: SeverityLevel;
    user?: User;
    [key: string]: any;
  }

  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

  export function init(options: any): void;
  export function captureException(exception: any, hint?: EventHint): string;
  export function captureMessage(message: string, level?: SeverityLevel): string;
  export function addBreadcrumb(breadcrumb: Breadcrumb): void;
  export function setUser(user: User): void;
  export function startSpan(options: any, callback?: (span: any) => any): any;
  export function withScope(callback: (scope: any) => void): void;
  export function getCurrentHub(): any;
  export function configureScope(callback: (scope: any) => void): void;

  export function browserTracingIntegration(options?: any): any;
  export function replayIntegration(options?: any): any;
  export function captureConsoleIntegration(options?: any): any;

  export function withSentryRouting<P>(Component: React.ComponentType<P>): React.ComponentType<P>;
  export function withErrorBoundary<P>(Component: React.ComponentType<P>, options?: any): React.ComponentType<P>;

  export class ErrorBoundary extends Component<any, any> {}

  export function useLocation(): any;
  export function useNavigationType(): any;
  export function createRoutesFromChildren(children: any): any;
  export function matchRoutes(routes: any, location: any): any;

  export const reactRouterV6Instrumentation: any;
}

// React Router DOM compatibility
declare module 'react-router-dom' {
  export { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation, useParams } from 'react-router';
  export * from 'react-router';
}

// React Error Boundary
declare module 'react-error-boundary' {
  export interface ErrorBoundaryProps {
    fallback?: React.ComponentType<any>;
    FallbackComponent?: React.ComponentType<any>;
    fallbackRender?: (props: any) => React.ReactElement;
    onError?: (error: Error, errorInfo: any) => void;
    children: React.ReactNode;
  }

  export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {}
  export function withErrorBoundary<P>(Component: React.ComponentType<P>, errorBoundaryProps?: any): React.ComponentType<P>;
}

// TipTap Editor
declare module '@tiptap/react' {
  export function useEditor(options: any): any;
  export const EditorContent: any;
  export const BubbleMenu: any;
  export const FloatingMenu: any;
}

declare module '@tiptap/starter-kit' {
  const StarterKit: any;
  export default StarterKit;
}

declare module '@tiptap/extension-link' {
  const Link: any;
  export default Link;
}

declare module '@tiptap/extension-image' {
  const Image: any;
  export default Image;
}

// React Virtualized Auto Sizer
declare module 'react-virtualized-auto-sizer' {
  export interface AutoSizerProps {
    children: (props: { height: number; width: number }) => React.ReactNode;
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    nonce?: string;
    onResize?: (props: { height: number; width: number }) => void;
    style?: React.CSSProperties;
  }

  export default function AutoSizer(props: AutoSizerProps): React.ReactElement;
}