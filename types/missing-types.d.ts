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

  // Main export for the common import pattern
  export const z: {
    string(): ZodString;
    number(): ZodNumber;
    boolean(): ZodBoolean;
    array<T extends ZodType>(schema: T): ZodArray<T>;
    object<T extends Record<string, ZodType>>(shape: T): ZodObject<T>;
    union<T extends [ZodType, ZodType, ...ZodType[]]>(schemas: T): ZodType<T[number] extends ZodType<infer U> ? U : never>;
    literal<T extends string | number | boolean>(value: T): ZodType<T>;
    enum<T extends string>(values: [T, ...T[]]): ZodType<T>;
    record<T extends ZodType>(schema: T): ZodType<Record<string, T extends ZodType<infer U> ? U : never>>;
    tuple<T extends [ZodType, ...ZodType[]]>(schemas: T): ZodType<{ [K in keyof T]: T[K] extends ZodType<infer U> ? U : never }>;
    any(): ZodType<any>;
    unknown(): ZodType<unknown>;
    never(): ZodType<never>;
    void(): ZodType<void>;
    null(): ZodType<null>;
    undefined(): ZodType<undefined>;
  };
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
    interface MockedClass<T = any> {
      new (...args: any[]): T;
    }

    interface MockedFunction<T extends (...args: any[]) => any> {
      (...args: Parameters<T>): ReturnType<T>;
      mockReturnValue(value: ReturnType<T>): MockedFunction<T>;
      mockResolvedValue(value: ReturnType<T>): MockedFunction<T>;
      mockRejectedValue(error: any): MockedFunction<T>;
      mockImplementation(fn: T): MockedFunction<T>;
      mockClear(): void;
      mockReset(): void;
      mockRestore(): void;
    }

    interface Mock<T = any> extends MockedFunction<(...args: any[]) => T> {}

    function fn(): MockedFunction<() => any>;
    function fn<T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T>;
    function spyOn(object: any, method: string): MockedFunction<any>;
    function mock(moduleName: string, factory?: () => any, options?: any): void;
    function unmock(moduleName: string): void;
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;
    function setTimeout(timeout: number): void;
  }

  const jest: typeof jest;
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
    flushdb(): Promise<void>;
    on(event: string, listener: Function): void;
  }

  export type RedisClientType = RedisClient;
  export type RedisClusterType = RedisClient;

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
    static findAndCountAll(options?: any): Promise<{ rows: any[]; count: number }>;
    static bulkCreate(records: any[], options?: any): Promise<any[]>;
    static sum(field: string, options?: any): Promise<number>;
    static max(field: string, options?: any): Promise<number>;
    static min(field: string, options?: any): Promise<number>;
    static scope(name: string): any;
    static sequelize: Sequelize;
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

  export enum QueryTypes {
    SELECT = 'SELECT',
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    BULKUPDATE = 'BULKUPDATE',
    BULKDELETE = 'BULKDELETE',
    DELETE = 'DELETE',
    UPSERT = 'UPSERT',
    VERSION = 'VERSION',
    SHOWTABLES = 'SHOWTABLES',
    SHOWINDEXES = 'SHOWINDEXES',
    DESCRIBE = 'DESCRIBE',
    RAW = 'RAW',
    FOREIGNKEYS = 'FOREIGNKEYS',
    SHOWCONSTRAINTS = 'SHOWCONSTRAINTS'
  }
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

  export interface SessionData {
    id: string;
    cookie: any;
    [key: string]: any;
  }

  export class Store {
    constructor(options?: any);
    get(sid: string, callback: (err: any, session?: SessionData) => void): void;
    set(sid: string, session: SessionData, callback: (err?: any) => void): void;
    destroy(sid: string, callback: (err?: any) => void): void;
    clear(callback: (err?: any) => void): void;
    length(callback: (err: any, length?: number) => void): void;
    all(callback: (err: any, obj?: { [sid: string]: SessionData }) => void): void;
    touch(sid: string, session: SessionData, callback: (err?: any) => void): void;
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

  export class MulterError extends Error {
    code: string;
    constructor(code: string, field?: string);
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
    toFormat(format: string, options?: any): Sharp;
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

// Axios types
declare module 'axios' {
  export interface AxiosRequestConfig {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: any;
    params?: any;
    data?: any;
    timeout?: number;
    withCredentials?: boolean;
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'stream';
    maxContentLength?: number;
    validateStatus?: (status: number) => boolean;
    onUploadProgress?: (progressEvent: any) => void;
    onDownloadProgress?: (progressEvent: any) => void;
    [key: string]: any;
  }

  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: AxiosRequestConfig;
    request?: any;
  }

  export interface AxiosError<T = any> extends Error {
    config: AxiosRequestConfig;
    code?: string;
    request?: any;
    response?: AxiosResponse<T>;
    isAxiosError: boolean;
  }

  export interface AxiosInstance {
    defaults: AxiosRequestConfig;
    interceptors: {
      request: {
        use(
          onFulfilled?: (value: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
          onRejected?: (error: any) => any
        ): number;
        eject(id: number): void;
      };
      response: {
        use(
          onFulfilled?: (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
          onRejected?: (error: any) => any
        ): number;
        eject(id: number): void;
      };
    };
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  }

  export interface AxiosStatic extends AxiosInstance {
    create(config?: AxiosRequestConfig): AxiosInstance;
    Cancel: any;
    CancelToken: any;
    isCancel(value: any): boolean;
    all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
    spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
  }

  const axios: AxiosStatic;
  export default axios;
}

// Testing Library React
declare module '@testing-library/react' {
  import { ReactElement } from 'react';

  export interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    hydrate?: boolean;
    wrapper?: React.ComponentType<any>;
  }

  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (element?: HTMLElement) => void;
    rerender: (ui: ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
    getByText: (text: string | RegExp) => HTMLElement;
    getAllByText: (text: string | RegExp) => HTMLElement[];
    queryByText: (text: string | RegExp) => HTMLElement | null;
    queryAllByText: (text: string | RegExp) => HTMLElement[];
    getByRole: (role: string, options?: any) => HTMLElement;
    getAllByRole: (role: string, options?: any) => HTMLElement[];
    queryByRole: (role: string, options?: any) => HTMLElement | null;
    queryAllByRole: (role: string, options?: any) => HTMLElement[];
    getByTestId: (testId: string) => HTMLElement;
    getAllByTestId: (testId: string) => HTMLElement[];
    queryByTestId: (testId: string) => HTMLElement | null;
    queryAllByTestId: (testId: string) => HTMLElement[];
    [key: string]: any;
  }

  export function render(ui: ReactElement, options?: RenderOptions): RenderResult;
  export function cleanup(): void;
  export function fireEvent(element: HTMLElement, event: Event): void;
  export function waitFor(callback: () => void | Promise<void>, options?: any): Promise<void>;
  export const screen: RenderResult;
}

// Testing Library User Event
declare module '@testing-library/user-event' {
  export interface UserEvent {
    click(element: HTMLElement): Promise<void>;
    type(element: HTMLElement, text: string): Promise<void>;
    clear(element: HTMLElement): Promise<void>;
    selectOptions(element: HTMLElement, values: string | string[]): Promise<void>;
    upload(element: HTMLElement, file: File | File[]): Promise<void>;
    keyboard(text: string): Promise<void>;
    tab(): Promise<void>;
    hover(element: HTMLElement): Promise<void>;
    unhover(element: HTMLElement): Promise<void>;
    paste(text: string): Promise<void>;
  }

  export default function userEvent(): UserEvent;
}

// Jest Axe
declare module 'jest-axe' {
  export function toHaveNoViolations(): any;
  export function axe(element: HTMLElement, options?: any): Promise<any>;
  export function configureAxe(config: any): any;
}

// Isomorphic DOMPurify
declare module 'isomorphic-dompurify' {
  export interface DOMPurify {
    sanitize(source: string, config?: any): string;
    addHook(hook: string, cb: (node: any) => void): void;
    removeHook(hook: string): void;
    removeHooks(hook: string): void;
    removeAllHooks(): void;
    isValidAttribute(tag: string, attr: string, value: string): boolean;
  }

  const DOMPurify: DOMPurify;
  export default DOMPurify;
}

// React Router DOM additional exports
declare module 'react-router-dom' {
  export interface MemoryRouterProps {
    initialEntries?: string[];
    initialIndex?: number;
    children?: React.ReactNode;
  }

  export const MemoryRouter: React.ComponentType<MemoryRouterProps>;
  export { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation, useParams } from 'react-router';
  export * from 'react-router';
}

// MUI Material
declare module '@mui/material' {
  export const Box: any;
  export const Typography: any;
  export const Button: any;
  export const TextField: any;
  export const Container: any;
  export const Grid: any;
  export const Paper: any;
  export const Card: any;
  export const CardContent: any;
  export const CardActions: any;
  export const AppBar: any;
  export const Toolbar: any;
  export const IconButton: any;
  export const Menu: any;
  export const MenuItem: any;
  export const Dialog: any;
  export const DialogTitle: any;
  export const DialogContent: any;
  export const DialogActions: any;
  export const Snackbar: any;
  export const Alert: any;
  export const CircularProgress: any;
  export const LinearProgress: any;
  export const Chip: any;
  export const Avatar: any;
  export const List: any;
  export const ListItem: any;
  export const ListItemText: any;
  export const ListItemIcon: any;
  export const Drawer: any;
  export const Tabs: any;
  export const Tab: any;
  export const Select: any;
  export const FormControl: any;
  export const InputLabel: any;
  export const FormHelperText: any;
  export const Checkbox: any;
  export const Switch: any;
  export const Radio: any;
  export const RadioGroup: any;
  export const FormControlLabel: any;
  export const Slider: any;
  export const Rating: any;
  export const Autocomplete: any;
  export const Table: any;
  export const TableBody: any;
  export const TableCell: any;
  export const TableContainer: any;
  export const TableHead: any;
  export const TableRow: any;
  export const TablePagination: any;
  export const Pagination: any;
  export const Breadcrumbs: any;
  export const Link: any;
  export const Stepper: any;
  export const Step: any;
  export const StepLabel: any;
  export const StepContent: any;
  export const Accordion: any;
  export const AccordionSummary: any;
  export const AccordionDetails: any;
  export const Tooltip: any;
  export const Popover: any;
  export const Modal: any;
  export const Backdrop: any;
  export const Fade: any;
  export const Grow: any;
  export const Slide: any;
  export const Zoom: any;
  export const Collapse: any;
}

// MUI Styles
declare module '@mui/material/styles' {
  export interface Theme {
    palette: any;
    typography: any;
    spacing: any;
    breakpoints: any;
    shadows: any;
    transitions: any;
    zIndex: any;
    mixins: any;
    components: any;
  }

  export function createTheme(options?: any): Theme;
  export function useTheme(): Theme;
  export function styled(component: any): any;
  export function makeStyles(styles: any): any;
  export function withStyles(styles: any): any;
  export const ThemeProvider: any;
  export const CssBaseline: any;
}

// MUI Material CssBaseline
declare module '@mui/material/CssBaseline' {
  const CssBaseline: React.ComponentType<any>;
  export default CssBaseline;
}

// MUI Icons
declare module '@mui/icons-material' {
  export const Home: any;
  export const Person: any;
  export const Settings: any;
  export const Search: any;
  export const Add: any;
  export const Edit: any;
  export const Delete: any;
  export const Save: any;
  export const Cancel: any;
  export const Close: any;
  export const Menu: any;
  export const MoreVert: any;
  export const ExpandMore: any;
  export const ExpandLess: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ArrowBack: any;
  export const ArrowForward: any;
  export const Check: any;
  export const Clear: any;
  export const Visibility: any;
  export const VisibilityOff: any;
  export const Star: any;
  export const StarBorder: any;
  export const Favorite: any;
  export const FavoriteBorder: any;
  export const ThumbUp: any;
  export const ThumbDown: any;
  export const Share: any;
  export const Download: any;
  export const Upload: any;
  export const AttachFile: any;
  export const Image: any;
  export const VideoFile: any;
  export const AudioFile: any;
  export const PictureAsPdf: any;
  export const InsertDriveFile: any;
  export const Folder: any;
  export const FolderOpen: any;
  export const CloudUpload: any;
  export const CloudDownload: any;
  export const Sync: any;
  export const Refresh: any;
  export const Update: any;
  export const Notifications: any;
  export const NotificationsOff: any;
  export const Email: any;
  export const Phone: any;
  export const Chat: any;
  export const Message: any;
  export const Send: any;
  export const Reply: any;
  export const Forward: any;
  export const Print: any;
  export const FileCopy: any;
  export const ContentCopy: any;
  export const ContentPaste: any;
  export const Undo: any;
  export const Redo: any;
  export const SelectAll: any;
  export const Dashboard: any;
  export const Analytics: any;
  export const Timeline: any;
  export const TrendingUp: any;
  export const TrendingDown: any;
  export const BarChart: any;
  export const PieChart: any;
  export const ShowChart: any;
  export const Assessment: any;
  export const AccountBox: any;
  export const AccountCircle: any;
  export const Group: any;
  export const SupervisorAccount: any;
  export const Business: any;
  export const Work: any;
  export const School: any;
  export const Store: any;
  export const ShoppingCart: any;
  export const Payment: any;
  export const CreditCard: any;
  export const AccountBalance: any;
  export const AttachMoney: any;
  export const MonetizationOn: any;
  export const Security: any;
  export const Lock: any;
  export const LockOpen: any;
  export const VpnKey: any;
  export const Fingerprint: any;
  export const VerifiedUser: any;
  export const Warning: any;
  export const Error: any;
  export const ErrorOutline: any;
  export const Info: any;
  export const InfoOutlined: any;
  export const Help: any;
  export const HelpOutline: any;
  export const QuestionAnswer: any;
  export const Support: any;
  export const BugReport: any;
  export const Build: any;
  export const Code: any;
  export const Computer: any;
  export const Smartphone: any;
  export const Tablet: any;
  export const DesktopMac: any;
  export const LaptopMac: any;
  export const PhoneIphone: any;
  export const PhoneAndroid: any;
  export const Web: any;
  export const Language: any;
  export const Public: any;
  export const Globe: any;
  export const Place: any;
  export const LocationOn: any;
  export const LocationOff: any;
  export const MyLocation: any;
  export const GpsFixed: any;
  export const GpsNotFixed: any;
  export const Map: any;
  export const Satellite: any;
  export const Terrain: any;
  export const Directions: any;
  export const DirectionsCar: any;
  export const DirectionsWalk: any;
  export const DirectionsBike: any;
  export const DirectionsTransit: any;
  export const Flight: any;
  export const Train: any;
  export const Subway: any;
  export const DirectionsBus: any;
  export const LocalTaxi: any;
  export const Hotel: any;
  export const Restaurant: any;
  export const LocalCafe: any;
  export const LocalBar: any;
  export const LocalGroceryStore: any;
  export const LocalMall: any;
  export const LocalPharmacy: any;
  export const LocalHospital: any;
  export const LocalLibrary: any;
  export const LocalMovies: any;
  export const LocalPlay: any;
  export const FitnessCenter: any;
  export const SportsEsports: any;
  export const SportsFootball: any;
  export const SportsBasketball: any;
  export const SportsTennis: any;
  export const SportsGolf: any;
  export const SportsBaseball: any;
  export const SportsSoccer: any;
  export const SportsVolleyball: any;
  export const Pool: any;
  export const Beach: any;
  export const Cake: any;
  export const Casino: any;
  export const ChildCare: any;
  export const Elderly: any;
  export const Accessible: any;
  export const AccessibleForward: any;
  export const Pets: any;
  export const SmokingRooms: any;
  export const SmokeFree: any;
  export const AcUnit: any;
  export const AirportShuttle: any;
  export const AllInclusive: any;
  export const BusinessCenter: any;
  export const ElevatorOutlined: any;
  export const FamilyRestroom: any;
  export const FitnessCenter: any;
  export const FreeBreakfast: any;
  export const GolfCourse: any;
  export const HotTub: any;
  export const Kitchen: any;
  export const MeetingRoom: any;
  export const NoMeetingRoom: any;
  export const Pool: any;
  export const RoomService: any;
  export const Smoke: any;
  export const SmokeFree: any;
  export const Spa: any;
  export const Wifi: any;
  export const SignalWifi0Bar: any;
  export const SignalWifi1Bar: any;
  export const SignalWifi2Bar: any;
  export const SignalWifi3Bar: any;
  export const SignalWifi4Bar: any;
  export const SignalWifiOff: any;
  export const NetworkWifi: any;
  export const WifiOff: any;
  export const WifiTethering: any;
  export const Bluetooth: any;
  export const BluetoothAudio: any;
  export const BluetoothConnected: any;
  export const BluetoothDisabled: any;
  export const BluetoothSearching: any;
  export const Nfc: any;
  export const SignalCellular: any;
  export const SignalCellularAlt: any;
  export const SignalCellularConnectedNoInternet: any;
  export const SignalCellularNoSim: any;
  export const SignalCellularNull: any;
  export const SignalCellularOff: any;
  export const SimCard: any;
  export const SimCardAlert: any;
  export const Usb: any;
  export const UsbOff: any;
  export const Battery: any;
  export const BatteryAlert: any;
  export const BatteryChargingFull: any;
  export const BatteryFull: any;
  export const BatteryStd: any;
  export const BatteryUnknown: any;
  export const PowerInput: any;
  export const PowerOff: any;
  export const PowerSettingsNew: any;
  export const Brightness: any;
  export const BrightnessAuto: any;
  export const BrightnessHigh: any;
  export const BrightnessLow: any;
  export const BrightnessMedium: any;
  export const VolumeDown: any;
  export const VolumeMute: any;
  export const VolumeOff: any;
  export const VolumeUp: any;
  export const PlayArrow: any;
  export const Pause: any;
  export const Stop: any;
  export const FastForward: any;
  export const FastRewind: any;
  export const SkipNext: any;
  export const SkipPrevious: any;
  export const Replay: any;
  export const Repeat: any;
  export const RepeatOne: any;
  export const Shuffle: any;
  export const QueueMusic: any;
  export const PlaylistAdd: any;
  export const PlaylistPlay: any;
  export const MusicNote: any;
  export const MusicOff: any;
  export const Album: any;
  export const ArtTrack: any;
  export const AudioTrack: any;
  export const LibraryMusic: any;
  export const MicNone: any;
  export const Mic: any;
  export const MicOff: any;
  export const Headset: any;
  export const HeadsetMic: any;
  export const HeadsetOff: any;
  export const Speaker: any;
  export const SpeakerGroup: any;
  export const SpeakerPhone: any;
  export const Equalizer: any;
  export const GraphicEq: any;
  export const SurroundSound: any;
  export const HighQuality: any;
  export const Movie: any;
  export const MovieCreation: any;
  export const MovieFilter: any;
  export const Slideshow: any;
  export const Photo: any;
  export const PhotoAlbum: any;
  export const PhotoCamera: any;
  export const PhotoCameraBack: any;
  export const PhotoCameraFront: any;
  export const PhotoLibrary: any;
  export const PhotoSizeSelectActual: any;
  export const PhotoSizeSelectLarge: any;
  export const PhotoSizeSelectSmall: any;
  export const CameraAlt: any;
  export const CameraEnhance: any;
  export const CameraFront: any;
  export const CameraRear: any;
  export const CameraRoll: any;
  export const Videocam: any;
  export const VideocamOff: any;
  export const VideoCall: any;
  export const VideoLabel: any;
  export const VideoLibrary: any;
  export const VideoSettings: any;
  export const Subscriptions: any;
  export const LiveTv: any;
  export const OndemandVideo: any;
  export const Tv: any;
  export const TvOff: any;
  export const ConnectedTv: any;
  export const RadioButtonChecked: any;
  export const RadioButtonUnchecked: any;
  export const Radio: any;
  export const Devices: any;
  export const DeviceHub: any;
  export const DevicesOther: any;
  export const DeviceUnknown: any;
  export const Gamepad: any;
  export const GamesOutlined: any;
  export const SportsEsports: any;
  export const Casino: any;
  export const Toys: any;
  export const Extension: any;
  export const Puzzle: any;
  export const ViewModule: any;
  export const ViewQuilt: any;
  export const ViewArray: any;
  export const ViewColumn: any;
  export const ViewList: any;
  export const ViewHeadline: any;
  export const ViewAgenda: any;
  export const ViewDay: any;
  export const ViewWeek: any;
  export const ViewStream: any;
  export const ViewComfy: any;
  export const ViewCompact: any;
  export const DashboardCustomize: any;
  export const Dashboard: any;
  export const GridOn: any;
  export const GridOff: any;
  export const GridView: any;
  export const WindowOutlined: any;
  export const OpenInNew: any;
  export const OpenWith: any;
  export const Launch: any;
  export const AspectRatio: any;
  export const CropFree: any;
  export const CropOriginal: any;
  export const Crop: any;
  export const CropSquare: any;
  export const CropPortrait: any;
  export const CropLandscape: any;
  export const Crop169: any;
  export const Crop32: any;
  export const Crop54: any;
  export const Crop75: any;
  export const CropDin: any;
  export const Straighten: any;
  export const Rotate90DegreesCcw: any;
  export const Rotate90DegreesCw: any;
  export const RotateLeft: any;
  export const RotateRight: any;
  export const FlipCameraAndroid: any;
  export const FlipCameraIos: any;
  export const Transform: any;
  export const Tune: any;
  export const FilterList: any;
  export const FilterAlt: any;
  export const Filter: any;
  export const FilterBAndW: any;
  export const FilterCenterFocus: any;
  export const FilterDrama: any;
  export const FilterFrames: any;
  export const FilterHdr: any;
  export const FilterNone: any;
  export const FilterTiltShift: any;
  export const FilterVintage: any;
  export const Grain: any;
  export const Texture: any;
  export const InvertColors: any;
  export const InvertColorsOff: any;
  export const Colorize: any;
  export const ColorLens: any;
  export const Palette: any;
  export const FormatColorFill: any;
  export const FormatColorReset: any;
  export const FormatColorText: any;
  export const Format: any;
  export const FormatAlignCenter: any;
  export const FormatAlignJustify: any;
  export const FormatAlignLeft: any;
  export const FormatAlignRight: any;
  export const FormatBold: any;
  export const FormatClear: any;
  export const FormatItalic: any;
  export const FormatLineSpacing: any;
  export const FormatListBulleted: any;
  export const FormatListNumbered: any;
  export const FormatListNumberedRtl: any;
  export const FormatPaint: any;
  export const FormatQuote: any;
  export const FormatShapes: any;
  export const FormatSize: any;
  export const FormatStrikethrough: any;
  export const FormatTextdirectionLToR: any;
  export const FormatTextdirectionRToL: any;
  export const FormatUnderlined: any;
  export const Functions: any;
  export const Title: any;
  export const TextFields: any;
  export const TextFormat: any;
  export const TextRotateUp: any;
  export const TextRotateVertical: any;
  export const TextRotationDown: any;
  export const TextRotationNone: any;
  export const VerticalAlignBottom: any;
  export const VerticalAlignCenter: any;
  export const VerticalAlignTop: any;
  export const WrapText: any;
  export const ShortText: any;
  export const Notes: any;
  export const Subject: any;
  export const ViewHeadline: any;
  export const ViewModule: any;
  export const BorderAll: any;
  export const BorderBottom: any;
  export const BorderClear: any;
  export const BorderColor: any;
  export const BorderHorizontal: any;
  export const BorderInner: any;
  export const BorderLeft: any;
  export const BorderOuter: any;
  export const BorderRight: any;
  export const BorderStyle: any;
  export const BorderTop: any;
  export const BorderVertical: any;
  export const TableChart: any;
  export const TableRows: any;
  export const TableView: any;
  export const InsertChart: any;
  export const InsertChartOutlined: any;
  export const InsertComment: any;
  export const InsertDriveFile: any;
  export const InsertEmoticon: any;
  export const InsertInvitation: any;
  export const InsertLink: any;
  export const InsertPhoto: any;
  export const Space: any;
  export const SpaceBar: any;
  export const LinearScale: any;
  export const MultilineChart: any;
  export const PieChart: any;
  export const PieChartOutline: any;
  export const DonutLarge: any;
  export const DonutSmall: any;
  export const ScatterPlot: any;
  export const BubbleChart: any;
  export const Equalizer: any;
  export const ShowChart: any;
  export const Timeline: any;
  export const TrendingDown: any;
  export const TrendingFlat: any;
  export const TrendingUp: any;
  export const InsertChart: any;
  export const Assessment: any;
  export const Analytics: any;
  export const QueryStats: any;
  export const DataUsage: any;
  export const DataThresholding: any;
  export const AccountTree: any;
  export const AccountTreeOutlined: any;
  export const DeviceHub: any;
  export const Hub: any;
  export const AccountBalance: any;
  export const AccountBalanceWallet: any;
  export const MonetizationOn: any;
  export const Money: any;
  export const MoneyOff: any;
  export const MoneyOffCsred: any;
  export const AttachMoney: any;
  export const Euro: any;
  export const CurrencyBitcoin: any;
  export const CurrencyExchange: any;
  export const CurrencyFranc: any;
  export const CurrencyLira: any;
  export const CurrencyPound: any;
  export const CurrencyRuble: any;
  export const CurrencyRupee: any;
  export const CurrencyYen: any;
  export const CurrencyYuan: any;
  export const LocalAtm: any;
  export const Payment: any;
  export const Payments: any;
  export const CreditCard: any;
  export const CreditCardOff: any;
  export const CardGiftcard: any;
  export const CardMembership: any;
  export const CardTravel: any;
  export const Loyalty: any;
  export const Redeem: any;
  export const ShoppingBasket: any;
  export const ShoppingCart: any;
  export const ShoppingCartCheckout: any;
  export const AddShoppingCart: any;
  export const RemoveShoppingCart: any;
  export const Store: any;
  export const StoreMallDirectory: any;
  export const Storefront: any;
  export const LocalGroceryStore: any;
  export const LocalMall: any;
  export const LocalOffer: any;
  export const LocalShipping: any;
  export const Receipt: any;
  export const ReceiptLong: any;
  export const RequestQuote: any;
  export const Sell: any;
  export const Discount: any;
  export const Inventory: any;
  export const Inventory2: any;
  export const Category: any;
  export const Label: any;
  export const LabelImportant: any;
  export const LabelImportantOutlined: any;
  export const LabelOff: any;
  export const LabelOutlined: any;
  export const LocalOffer: any;
  export const NewReleases: any;
  export const Whatshot: any;
  export const Bookmark: any;
  export const BookmarkAdd: any;
  export const BookmarkAdded: any;
  export const BookmarkBorder: any;
  export const BookmarkRemove: any;
  export const Bookmarks: any;
  export const Class: any;
  export const Book: any;
  export const Bookmark: any;
  export const BookOnline: any;
  export const ChromeReaderMode: any;
  export const ImportContacts: any;
  export const LibraryAdd: any;
  export const LibraryBooks: any;
  export const MenuBook: any;
  export const School: any;
  export const AutoStories: any;
  export const Collections: any;
  export const CollectionsBookmark: any;
  export const Create: any;
  export const CreateNewFolder: any;
  export const NoteAdd: any;
  export const PostAdd: any;
  export const EditNote: any;
  export const EditOff: any;
  export const ModeEdit: any;
  export const ModeEditOutline: any;
  export const BorderColor: any;
  export const FormatColorFill: any;
  export const Title: any;
  export const Draw: any;
  export const Gesture: any;
  export const Highlight: any;
  export const LinearScale: any;
  export const MergeType: any;
  export const MonetizationOn: any;
  export const MultilineChart: any;
  export const PieChart: any;
  export const PieChartOutline: any;
  export const PieChartOutlined: any;
  export const PublishedWithChanges: any;
  export const QueryBuilder: any;
  export const QueryStats: any;
  export const QuestionAnswer: any;
  export const QuestionMark: any;
  export const Quiz: any;
  export const RateReview: any;
  export const Receipt: any;
  export const ReceiptLong: any;
  export const RequestQuote: any;
  export const Reviews: any;
  export const RuleFolder: any;
  export const Savings: any;
  export const ScatterPlot: any;
  export const Schedule: any;
  export const Score: any;
  export const ScreenRotationAlt: any;
  export const ScreenSearchDesktop: any;
  export const ScreenShare: any;
  export const Search: any;
  export const SearchOff: any;
  export const Security: any;
  export const SecurityUpdate: any;
  export const SecurityUpdateGood: any;
  export const SecurityUpdateWarning: any;
  export const Segment: any;
  export const SelectAll: any;
  export const Send: any;
  export const SendAndArchive: any;
  export const SendTimeExtension: any;
  export const SentimentDissatisfied: any;
  export const SentimentNeutral: any;
  export const SentimentSatisfied: any;
  export const SentimentSatisfiedAlt: any;
  export const SentimentVeryDissatisfied: any;
  export const SentimentVerySatisfied: any;
  export const Settings: any;
  export const SettingsAccessibility: any;
  export const SettingsApplications: any;
  export const SettingsBackupRestore: any;
  export const SettingsBluetooth: any;
  export const SettingsBrightness: any;
  export const SettingsCell: any;
  export const SettingsDisplay: any;
  export const SettingsEthernet: any;
  export const SettingsInputAntenna: any;
  export const SettingsInputComponent: any;
  export const SettingsInputComposite: any;
  export const SettingsInputHdmi: any;
  export const SettingsInputSvideo: any;
  export const SettingsOverscan: any;
  export const SettingsPhone: any;
  export const SettingsPower: any;
  export const SettingsRemote: any;
  export const SettingsSystemDaydream: any;
  export const SettingsVoice: any;
  export const Share: any;
  export const ShareLocation: any;
  export const Shield: any;
  export const ShieldMoon: any;
  export const Shop: any;
  export const Shop2: any;
  export const ShopTwo: any;
  export const Shopping: any;
  export const ShoppingBag: any;
  export const ShoppingBasket: any;
  export const ShoppingCart: any;
  export const ShoppingCartCheckout: any;
  export const ShortText: any;
  export const ShowChart: any;
  export const Shuffle: any;
  export const ShuffleOn: any;
  export const ShutterSpeed: any;
  export const SickOutlined: any;
  export const SignalCellular0Bar: any;
  export const SignalCellular1Bar: any;
  export const SignalCellular2Bar: any;
  export const SignalCellular3Bar: any;
  export const SignalCellular4Bar: any;
  export const SignalCellularAlt: any;
  export const SignalCellularAlt1Bar: any;
  export const SignalCellularAlt2Bar: any;
  export const SignalCellularConnectedNoInternet0Bar: any;
  export const SignalCellularConnectedNoInternet1Bar: any;
  export const SignalCellularConnectedNoInternet2Bar: any;
  export const SignalCellularConnectedNoInternet3Bar: any;
  export const SignalCellularConnectedNoInternet4Bar: any;
  export const SignalCellularNoSim: any;
  export const SignalCellularNull: any;
  export const SignalCellularOff: any;
  export const SignalWifi0Bar: any;
  export const SignalWifi1Bar: any;
  export const SignalWifi1BarLock: any;
  export const SignalWifi2Bar: any;
  export const SignalWifi2BarLock: any;
  export const SignalWifi3Bar: any;
  export const SignalWifi3BarLock: any;
  export const SignalWifi4Bar: any;
  export const SignalWifi4BarLock: any;
  export const SignalWifiBad: any;
  export const SignalWifiConnectedNoInternet4: any;
  export const SignalWifiOff: any;
  export const SignalWifiStatusbar4Bar: any;
  export const SignalWifiStatusbarConnectedNoInternet4: any;
  export const SignalWifiStatusbarNull: any;
  export const SimCard: any;
  export const SimCardAlert: any;
  export const SimCardDownload: any;
  export const SingleBed: any;
  export const SipOutlined: any;
  export const SixFtApart: any;
  export const SixK: any;
  export const SixKPlus: any;
  export const SixMp: any;
  export const SixteenMp: any;
  export const SixtyFps: any;
  export const SixtyFpsSelect: any;
  export const Skateboarding: any;
  export const SkipNext: any;
  export const SkipPrevious: any;
  export const Sledding: any;
  export const Slideshow: any;
  export const SlowMotionVideo: any;
  export const SmartButton: any;
  export const SmartDisplay: any;
  export const SmartScreen: any;
  export const SmartToy: any;
  export const Smartphone: any;
  export const SmokeFree: any;
  export const SmokingRooms: any;
  export const Sms: any;
  export const SmsFailedOutlined: any;
  export const SnippetFolder: any;
  export const Snooze: any;
  export const Snowboarding: any;
  export const Snowmobile: any;
  export const Snowshoeing: any;
  export const Soap: any;
  export const SocialDistance: any;
  export const SolarPower: any;
  export const Sort: any;
  export const SortByAlpha: any;
  export const SoupKitchen: any;
  export const Source: any;
  export const South: any;
  export const SouthAmerica: any;
  export const SouthEast: any;
  export const SouthWest: any;
  export const Spa: any;
  export const SpaceBar: any;
  export const SpaceDashboard: any;
  export const Speaker: any;
  export const SpeakerGroup: any;
  export const SpeakerNotes: any;
  export const SpeakerNotesOff: any;
  export const SpeakerPhone: any;
  export const Speed: any;
  export const SpellcheckOutlined: any;
  export const Splitscreen: any;
  export const Spoke: any;
  export const Sports: any;
  export const SportsBar: any;
  export const SportsBaseball: any;
  export const SportsBasketball: any;
  export const SportsCricket: any;
  export const SportsEsports: any;
  export const SportsFootball: any;
  export const SportsGolf: any;
  export const SportsHandball: any;
  export const SportsHockey: any;
  export const SportsKabaddi: any;
  export const SportsMartialArts: any;
  export const SportsMma: any;
  export const SportsMotorsports: any;
  export const SportsRugby: any;
  export const SportsScore: any;
  export const SportsSoccer: any;
  export const SportsTennis: any;
  export const SportsVolleyball: any;
  export const SquareFoot: any;
  export const StackedBarChart: any;
  export const StackedLineChart: any;
  export const Stadium: any;
  export const Stairs: any;
  export const Star: any;
  export const StarBorder: any;
  export const StarBorderPurple500: any;
  export const StarHalf: any;
  export const StarOutline: any;
  export const StarOutlined: any;
  export const StarPurple500: any;
  export const StarRate: any;
  export const Stars: any;
  export const Start: any;
  export const StayCurrentLandscape: any;
  export const StayCurrentPortrait: any;
  export const StayPrimaryLandscape: any;
  export const StayPrimaryPortrait: any;
  export const StickyNote2: any;
  export const Stop: any;
  export const StopCircle: any;
  export const StopScreenShare: any;
  export const Storage: any;
  export const Store: any;
  export const StoreMallDirectory: any;
  export const Storefront: any;
  export const Storm: any;
  export const Straight: any;
  export const Straighten: any;
  export const Stream: any;
  export const Streetview: any;
  export const StrikethroughS: any;
  export const Stroller: any;
  export const Style: any;
  export const SubdirectoryArrowLeft: any;
  export const SubdirectoryArrowRight: any;
  export const Subject: any;
  export const Subscript: any;
  export const Subscriptions: any;
  export const Subtitles: any;
  export const SubtitlesOff: any;
  export const Subway: any;
  export const Summarize: any;
  export const Superscript: any;
  export const SupervisedUserCircle: any;
  export const SupervisorAccount: any;
  export const Support: any;
  export const SupportAgent: any;
  export const Surfing: any;
  export const SurroundSound: any;
  export const SwapCalls: any;
  export const SwapHoriz: any;
  export const SwapHorizontalCircle: any;
  export const SwapVert: any;
  export const SwapVerticalCircle: any;
  export const Swipe: any;
  export const SwipeDown: any;
  export const SwipeDownAlt: any;
  export const SwipeLeft: any;
  export const SwipeLeftAlt: any;
  export const SwipeRight: any;
  export const SwipeRightAlt: any;
  export const SwipeUp: any;
  export const SwipeUpAlt: any;
  export const SwipeVertical: any;
  export const SwitchAccessShortcut: any;
  export const SwitchAccessShortcutAdd: any;
  export const SwitchAccount: any;
  export const SwitchCamera: any;
  export const SwitchLeft: any;
  export const SwitchRight: any;
  export const SwitchVideo: any;
  export const Synagogue: any;
  export const Sync: any;
  export const SyncAlt: any;
  export const SyncDisabled: any;
  export const SyncLock: any;
  export const SyncProblem: any;
  export const SystemSecurityUpdate: any;
  export const SystemSecurityUpdateGood: any;
  export const SystemSecurityUpdateWarning: any;
  export const SystemUpdate: any;
  export const SystemUpdateAlt: any;
  export const Tab: any;
  export const TabUnselected: any;
  export const TableChart: any;
  export const TableRestaurant: any;
  export const TableRows: any;
  export const TableView: any;
  export const Tablet: any;
  export const TabletAndroid: any;
  export const TabletMac: any;
  export const Tag: any;
  export const TagFaces: any;
  export const TakeoutDining: any;
  export const TapAndPlay: any;
  export const Tapas: any;
  export const TaskAlt: any;
  export const TaxiAlert: any;
  export const TempleBuddhist: any;
  export const TempleHindu: any;
  export const Terminal: any;
  export const Terrain: any;
  export const TextDecrease: any;
  export const TextFields: any;
  export const TextFormat: any;
  export const TextIncrease: any;
  export const TextRotateUp: any;
  export const TextRotateVertical: any;
  export const TextRotationAngledown: any;
  export const TextRotationAngleup: any;
  export const TextRotationDown: any;
  export const TextRotationNone: any;
  export const TextSnippet: any;
  export const Textsms: any;
  export const Texture: any;
  export const TheaterComedy: any;
  export const Theaters: any;
  export const Thermostat: any;
  export const ThermostatAuto: any;
  export const ThirteenMp: any;
  export const ThirtyFps: any;
  export const ThirtyFpsSelect: any;
  export const ThreeDRotation: any;
  export const ThreeGMobiledata: any;
  export const ThreeK: any;
  export const ThreeKPlus: any;
  export const ThreeMp: any;
  export const ThreeP: any;
  export const ThreeSixty: any;
  export const ThumbDown: any;
  export const ThumbDownAlt: any;
  export const ThumbDownOffAlt: any;
  export const ThumbUp: any;
  export const ThumbUpAlt: any;
  export const ThumbUpOffAlt: any;
  export const ThumbsUpDown: any;
  export const Thunderstorm: any;
  export const TimeToLeave: any;
  export const Timelapse: any;
  export const Timeline: any;
  export const Timer: any;
  export const Timer10: any;
  export const Timer10Select: any;
  export const Timer3: any;
  export const Timer3Select: any;
  export const TimerOff: any;
  export const TipsAndUpdates: any;
  export const TireRepair: any;
  export const Title: any;
  export const Toc: any;
  export const Today: any;
  export const ToggleOff: any;
  export const ToggleOn: any;
  export const Token: any;
  export const Toll: any;
  export const Tonality: any;
  export const Topic: any;
  export const TouchApp: any;
  export const Tour: any;
  export const Toys: any;
  export const TrackChanges: any;
  export const Traffic: any;
  export const Train: any;
  export const Tram: any;
  export const TransferWithinAStation: any;
  export const Transform: any;
  export const TransgenderOutlined: any;
  export const TransitEnterexit: any;
  export const Translate: any;
  export const TravelExplore: any;
  export const TrendingDown: any;
  export const TrendingFlat: any;
  export const TrendingNeutral: any;
  export const TrendingUp: any;
  export const Trip: any;
  export const TripOrigin: any;
  export const TroubleshootOutlined: any;
  export const Try: any;
  export const Tsunami: any;
  export const Tty: any;
  export const Tune: any;
  export const TurnedIn: any;
  export const TurnedInNot: any;
  export const TurnLeft: any;
  export const TurnRight: any;
  export const TurnSharpLeft: any;
  export const TurnSharpRight: any;
  export const TurnSlightLeft: any;
  export const TurnSlightRight: any;
  export const TwelveMp: any;
  export const TwentyFourMp: any;
  export const TwentyMp: any;
  export const TwentyOneMp: any;
  export const TwentyThreeMp: any;
  export const TwentyTwoMp: any;
  export const TwoK: any;
  export const TwoKPlus: any;
  export const TwoMp: any;
  export const TwoWheeler: any;
  export const TypeSpecimen: any;
  export const UTurnLeft: any;
  export const UTurnRight: any;
  export const Umbrella: any;
  export const Unarchive: any;
  export const Undo: any;
  export const UnfoldLess: any;
  export const UnfoldMore: any;
  export const Unpublished: any;
  export const Unsubscribe: any;
  export const Upcoming: any;
  export const Update: any;
  export const UpdateDisabled: any;
  export const Upgrade: any;
  export const Upload: any;
  export const UploadFile: any;
  export const Usb: any;
  export const UsbOff: any;
  export const VerifiedUser: any;
  export const VerticalAlignBottom: any;
  export const VerticalAlignCenter: any;
  export const VerticalAlignTop: any;
  export const VerticalSplit: any;
  export const Vibration: any;
  export const VideoCall: any;
  export const VideoCameraBack: any;
  export const VideoCameraFront: any;
  export const VideoFile: any;
  export const VideoLabel: any;
  export const VideoLibrary: any;
  export const VideoSettings: any;
  export const VideoStable: any;
  export const Videocam: any;
  export const VideocamOff: any;
  export const VideogameAsset: any;
  export const VideogameAssetOff: any;
  export const ViewAgenda: any;
  export const ViewArray: any;
  export const ViewCarousel: any;
  export const ViewColumn: any;
  export const ViewComfy: any;
  export const ViewComfyAlt: any;
  export const ViewCompact: any;
  export const ViewCompactAlt: any;
  export const ViewDay: any;
  export const ViewHeadline: any;
  export const ViewInAr: any;
  export const ViewKanban: any;
  export const ViewList: any;
  export const ViewModule: any;
  export const ViewQuilt: any;
  export const ViewSidebar: any;
  export const ViewStream: any;
  export const ViewTimeline: any;
  export const ViewWeek: any;
  export const Vignette: any;
  export const Villa: any;
  export const Visibility: any;
  export const VisibilityOff: any;
  export const VoiceChat: any;
  export const VoiceOverOff: any;
  export const Voicemail: any;
  export const Volcano: any;
  export const VolumeDown: any;
  export const VolumeMute: any;
  export const VolumeOff: any;
  export const VolumeUp: any;
  export const VolunteerActivism: any;
  export const VpnKey: any;
  export const VpnKeyOff: any;
  export const VpnLock: any;
  export const Vrpano: any;
  export const WalkerOutlined: any;
  export const Wallet: any;
  export const WalletGiftcard: any;
  export const WalletMembership: any;
  export const WalletTravel: any;
  export const Wallpaper: any;
  export const WarehouseOutlined: any;
  export const Warning: any;
  export const WarningAmber: any;
  export const Wash: any;
  export const Watch: any;
  export const WatchLater: any;
  export const WatchOff: any;
  export const Water: any;
  export const WaterDamage: any;
  export const WaterDrop: any;
  export const Waterfall: any;
  export const Waves: any;
  export const WavingHand: any;
  export const WbAuto: any;
  export const WbCloudy: any;
  export const WbIncandescent: any;
  export const WbIridescent: any;
  export const WbShade: any;
  export const WbSunny: any;
  export const WbTwilight: any;
  export const Wc: any;
  export const Web: any;
  export const WebAsset: any;
  export const WebAssetOff: any;
  export const WebStories: any;
  export const Webhook: any;
  export const Weekend: any;
  export const West: any;
  export const WhatShot: any;
  export const Whatshot: any;
  export const WheelchairPickup: any;
  export const WhereToVote: any;
  export const Widgets: any;
  export const WidgetsOutlined: any;
  export const Wifi: any;
  export const WifiCalling: any;
  export const WifiCalling3: any;
  export const WifiChannel: any;
  export const WifiFind: any;
  export const WifiLock: any;
  export const WifiOff: any;
  export const WifiPassword: any;
  export const WifiProtectedSetup: any;
  export const WifiTethering: any;
  export const WifiTetheringError: any;
  export const WifiTetheringErrorRounded: any;
  export const WifiTetheringOff: any;
  export const WindPower: any;
  export const Window: any;
  export const WineBar: any;
  export const Woman: any;
  export const Woman2: any;
  export const WomanOutlined: any;
  export const Work: any;
  export const WorkHistory: any;
  export const WorkOff: any;
  export const WorkOutline: any;
  export const WorkOutlined: any;
  export const Workspaces: any;
  export const WorkspacesOutlined: any;
  export const WrapText: any;
  export const WrongLocation: any;
  export const Wysiwyg: any;
  export const Yard: any;
  export const YardOutlined: any;
  export const YoutubeSearchedFor: any;
  export const ZoomIn: any;
  export const ZoomInMap: any;
  export const ZoomOut: any;
  export const ZoomOutMap: any;
}

// Vitest
declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function expect(actual: any): any;

  export interface Mock<T = any> {
    (...args: any[]): T;
    mockReturnValue(value: T): Mock<T>;
    mockResolvedValue(value: T): Mock<T>;
    mockRejectedValue(error: any): Mock<T>;
    mockImplementation(fn: (...args: any[]) => T): Mock<T>;
    mockClear(): void;
    mockReset(): void;
    mockRestore(): void;
  }

  export const vi: {
    fn<T = any>(implementation?: (...args: any[]) => T): Mock<T>;
    mock(moduleName: string, factory?: () => any): void;
    unmock(moduleName: string): void;
    importActual(moduleName: string): Promise<any>;
    clearAllMocks(): void;
    resetAllMocks(): void;
    restoreAllMocks(): void;
  };
}

// Date-fns
declare module 'date-fns' {
  export function format(date: Date | number, format: string, options?: any): string;
  export function formatDistance(date: Date | number, baseDate: Date | number, options?: any): string;
  export function formatDistanceToNow(date: Date | number, options?: any): string;
  export function formatRelative(date: Date | number, baseDate: Date | number, options?: any): string;
  export function parseISO(dateString: string): Date;
  export function isValid(date: any): boolean;
  export function addDays(date: Date | number, amount: number): Date;
  export function addWeeks(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function addYears(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function subWeeks(date: Date | number, amount: number): Date;
  export function subMonths(date: Date | number, amount: number): Date;
  export function subYears(date: Date | number, amount: number): Date;
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function startOfWeek(date: Date | number, options?: any): Date;
  export function endOfWeek(date: Date | number, options?: any): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function startOfYear(date: Date | number): Date;
  export function endOfYear(date: Date | number): Date;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameWeek(dateLeft: Date | number, dateRight: Date | number, options?: any): boolean;
  export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameYear(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInWeeks(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInMonths(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInYears(dateLeft: Date | number, dateRight: Date | number): number;
  export function eachDayOfInterval(interval: { start: Date | number; end: Date | number }): Date[];
  export function eachWeekOfInterval(interval: { start: Date | number; end: Date | number }, options?: any): Date[];
  export function eachMonthOfInterval(interval: { start: Date | number; end: Date | number }): Date[];
  export function eachYearOfInterval(interval: { start: Date | number; end: Date | number }): Date[];
}

// React Query
declare module '@tanstack/react-query' {
  export interface QueryClient {
    prefetchQuery(options: any): Promise<void>;
    getQueryData(queryKey: any): any;
    setQueryData(queryKey: any, data: any): void;
    invalidateQueries(options?: any): Promise<void>;
    refetchQueries(options?: any): Promise<void>;
    cancelQueries(options?: any): Promise<void>;
    removeQueries(options?: any): void;
    clear(): void;
  }

  export class QueryClient {
    constructor(config?: any);
    prefetchQuery(options: any): Promise<void>;
    getQueryData(queryKey: any): any;
    setQueryData(queryKey: any, data: any): void;
    invalidateQueries(options?: any): Promise<void>;
    refetchQueries(options?: any): Promise<void>;
    cancelQueries(options?: any): Promise<void>;
    removeQueries(options?: any): void;
    clear(): void;
  }

  export const QueryClientProvider: React.ComponentType<{ client: QueryClient; children: React.ReactNode }>;

  export function useQuery(options: any): any;
  export function useMutation(options: any): any;
  export function useQueryClient(): QueryClient;
  export function useInfiniteQuery(options: any): any;
  export function useSuspenseQuery(options: any): any;
}

// React Query DevTools
declare module '@tanstack/react-query-devtools' {
  export const ReactQueryDevtools: React.ComponentType<any>;
}

// Recharts
declare module 'recharts' {
  export const LineChart: any;
  export const AreaChart: any;
  export const BarChart: any;
  export const PieChart: any;
  export const Cell: any;
  export const XAxis: any;
  export const YAxis: any;
  export const CartesianGrid: any;
  export const Tooltip: any;
  export const Legend: any;
  export const Line: any;
  export const Area: any;
  export const Bar: any;
  export const Pie: any;
  export const ResponsiveContainer: any;
  export const ComposedChart: any;
  export const ScatterChart: any;
  export const Scatter: any;
  export const RadarChart: any;
  export const Radar: any;
  export const PolarGrid: any;
  export const PolarAngleAxis: any;
  export const PolarRadiusAxis: any;
  export const TreemapChart: any;
  export const Treemap: any;
  export const SankeyChart: any;
  export const Sankey: any;
  export const FunnelChart: any;
  export const Funnel: any;
  export const LabelList: any;
  export const ReferenceLine: any;
  export const ReferenceArea: any;
  export const ReferenceDot: any;
  export const ErrorBar: any;
  export const Brush: any;
}