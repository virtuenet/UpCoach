declare module 'i18n' {
  export interface ConfigurationOptions {
    locales?: string[];
    defaultLocale?: string;
    directory?: string;
    directoryPermissions?: string;
    autoReload?: boolean;
    updateFiles?: boolean;
    syncFiles?: boolean;
    indent?: string;
    extension?: string;
    prefix?: string;
    objectNotation?: boolean;
    logDebugFn?: (msg: string) => void;
    logWarnFn?: (msg: string) => void;
    logErrorFn?: (msg: string) => void;
    register?: any;
    api?: {
      __: string;
      __n: string;
    };
    preserveLegacyCase?: boolean;
    cookie?: string;
    queryParameter?: string;
    missingKeyFn?: (locale: string, key: string) => string;
  }

  export function configure(options: ConfigurationOptions): void;
  export function init(request: any, response?: any, next?: any): void;
  export function __(key: string, ...args: any[]): string;
  export function __n(singular: string, plural: string, count: number, ...args: any[]): string;
  export function setLocale(locale: string): void;
  export function getLocale(): string;
  export function getCatalog(locale?: string): any;
  export function getLocales(): string[];
  export function addLocale(locale: string): void;
  export function removeLocale(locale: string): void;
}
