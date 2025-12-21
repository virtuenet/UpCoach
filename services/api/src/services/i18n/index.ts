/**
 * i18n Services Index
 *
 * Centralized exports for internationalization and localization services.
 */

// Translation Service
export {
  TranslationService,
  getTranslationService,
  resetTranslationService,
  type TranslationNamespace,
  type TranslationStatus,
  type PluralForm,
  type TranslationKey,
  type TranslationPlaceholder,
  type Translation,
  type TranslationHistory,
  type TranslationBundle,
  type ImportResult,
  type ImportError,
  type ExportOptions,
  type TranslationStats,
  type TranslationServiceConfig,
} from './TranslationService';

// Locale Service
export {
  LocaleService,
  getLocaleService,
  resetLocaleService,
  type LocaleInfo,
  type NumberFormatConfig,
  type UserLocalePreferences,
  type LocaleDetectionResult,
  type FormattedValue,
  type LocaleServiceConfig,
} from './LocaleService';

// Translation Cache
export {
  TranslationCache,
  getTranslationCache,
  resetTranslationCache,
  type CacheEntry,
  type CacheStats,
  type CacheConfig,
  type CacheKey,
} from './TranslationCache';

// Content Translation Service
export {
  ContentTranslationService,
  getContentTranslationService,
  resetContentTranslationService,
  type ContentType,
  type TranslationQuality,
  type ContentItem,
  type ContentTranslation,
  type TranslationRequest,
  type TranslationJob,
  type GlossaryTerm,
  type TranslationMemory,
  type ContentTranslationConfig,
  type TranslationStats as ContentTranslationStats,
} from './ContentTranslationService';

// Initialize all i18n services
export function initializeI18n(config?: {
  translation?: Partial<import('./TranslationService').TranslationServiceConfig>;
  locale?: Partial<import('./LocaleService').LocaleServiceConfig>;
  cache?: Partial<import('./TranslationCache').CacheConfig>;
  contentTranslation?: Partial<import('./ContentTranslationService').ContentTranslationConfig>;
}): {
  translation: InstanceType<typeof import('./TranslationService').TranslationService>;
  locale: InstanceType<typeof import('./LocaleService').LocaleService>;
  cache: InstanceType<typeof import('./TranslationCache').TranslationCache>;
  contentTranslation: InstanceType<typeof import('./ContentTranslationService').ContentTranslationService>;
} {
  const { getTranslationService } = require('./TranslationService');
  const { getLocaleService } = require('./LocaleService');
  const { getTranslationCache } = require('./TranslationCache');
  const { getContentTranslationService } = require('./ContentTranslationService');

  const translation = getTranslationService(config?.translation);
  const locale = getLocaleService(config?.locale);
  const cache = getTranslationCache(config?.cache);
  const contentTranslation = getContentTranslationService(config?.contentTranslation);

  console.log('i18n services initialized');

  return {
    translation,
    locale,
    cache,
    contentTranslation,
  };
}

// Quick translation helper
export async function t(
  key: string,
  locale: string,
  params?: Record<string, any>
): Promise<string> {
  const { getTranslationService } = require('./TranslationService');
  const service = getTranslationService();
  return service.translate(key, locale, params);
}

// Format helpers
export function formatNumber(value: number, locale: string): string {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.formatNumber(value, locale).value;
}

export function formatCurrency(value: number, locale: string, currency?: string): string {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.formatCurrency(value, locale, currency).value;
}

export function formatDate(date: Date | string | number, locale: string, format?: string): string {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.formatDate(date, locale, format).value;
}

export function formatTime(date: Date | string | number, locale: string, format?: string): string {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.formatTime(date, locale, format).value;
}

export function formatRelativeTime(date: Date | string | number, locale: string): string {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.formatRelativeTime(date, locale).value;
}

// Locale detection helper
export function detectLocale(options: {
  userId?: string;
  acceptLanguage?: string;
  cookie?: string;
  ip?: string;
}): import('./LocaleService').LocaleDetectionResult {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.detectLocale(options);
}

// Check if locale is RTL
export function isRTL(locale: string): boolean {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.isRTL(locale);
}

// Get text direction
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.getTextDirection(locale);
}

// Supported locales
export function getSupportedLocales(): string[] {
  const { getLocaleService } = require('./LocaleService');
  const service = getLocaleService();
  return service.getSupportedLocales();
}
