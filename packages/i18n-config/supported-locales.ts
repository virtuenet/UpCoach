/**
 * Supported Locales Configuration - Phase 14 Week 1
 * Centralized configuration for all supported languages and locales
 */

export interface LocaleConfig {
  code: string; // ISO 639-1 language code + ISO 3166-1 country code
  name: string; // English name
  nativeName: string; // Native name
  direction: 'ltr' | 'rtl';
  enabled: boolean;
  currency: string; // ISO 4217 currency code
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Africa';
  launchPriority: number; // 1 = highest priority
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (United States)',
    direction: 'ltr',
    enabled: true,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    region: 'Americas',
    launchPriority: 1,
  },
  {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    direction: 'ltr',
    enabled: true,
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
    region: 'Europe',
    launchPriority: 2,
  },
  {
    code: 'es-MX',
    name: 'Spanish (Mexico)',
    nativeName: 'Español (México)',
    direction: 'ltr',
    enabled: true,
    currency: 'MXN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    region: 'Americas',
    launchPriority: 3,
  },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    direction: 'ltr',
    enabled: true,
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
    region: 'Americas',
    launchPriority: 2,
  },
  {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français (France)',
    direction: 'ltr',
    enabled: true,
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
    },
    region: 'Europe',
    launchPriority: 3,
  },
  {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch (Deutschland)',
    direction: 'ltr',
    enabled: true,
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
    region: 'Europe',
    launchPriority: 4,
  },
  {
    code: 'ja-JP',
    name: 'Japanese (Japan)',
    nativeName: '日本語',
    direction: 'ltr',
    enabled: true,
    currency: 'JPY',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    region: 'Asia-Pacific',
    launchPriority: 4,
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    enabled: false, // Phase 14 Week 4
    currency: 'CNY',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    region: 'Asia-Pacific',
    launchPriority: 5,
  },
  {
    code: 'ko-KR',
    name: 'Korean (South Korea)',
    nativeName: '한국어',
    direction: 'ltr',
    enabled: false, // Phase 14 Week 4
    currency: 'KRW',
    dateFormat: 'YYYY. MM. DD.',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    region: 'Asia-Pacific',
    launchPriority: 5,
  },
  {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (السعودية)',
    direction: 'rtl',
    enabled: false, // Phase 14 Week 4
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    region: 'Middle East',
    launchPriority: 6,
  },
  {
    code: 'ru-RU',
    name: 'Russian (Russia)',
    nativeName: 'Русский',
    direction: 'ltr',
    enabled: false, // Phase 14 Week 4
    currency: 'RUB',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
    },
    region: 'Europe',
    launchPriority: 6,
  },
  {
    code: 'it-IT',
    name: 'Italian (Italy)',
    nativeName: 'Italiano',
    direction: 'ltr',
    enabled: false, // Phase 14 Week 4
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
    region: 'Europe',
    launchPriority: 7,
  },
];

// Helper functions
export function getEnabledLocales(): LocaleConfig[] {
  return SUPPORTED_LOCALES.filter(locale => locale.enabled);
}

export function getLocaleByCode(code: string): LocaleConfig | undefined {
  return SUPPORTED_LOCALES.find(locale => locale.code === code);
}

export function getDefaultLocale(): LocaleConfig {
  return SUPPORTED_LOCALES[0]; // en-US
}

export function getLocalesByRegion(region: LocaleConfig['region']): LocaleConfig[] {
  return SUPPORTED_LOCALES.filter(locale => locale.region === region);
}

export function isRTL(localeCode: string): boolean {
  const locale = getLocaleByCode(localeCode);
  return locale?.direction === 'rtl' || false;
}

export function getCurrencyByLocale(localeCode: string): string {
  const locale = getLocaleByCode(localeCode);
  return locale?.currency || 'USD';
}

export function getDateFormatByLocale(localeCode: string): string {
  const locale = getLocaleByCode(localeCode);
  return locale?.dateFormat || 'MM/DD/YYYY';
}

export function getTimeFormatByLocale(localeCode: string): '12h' | '24h' {
  const locale = getLocaleByCode(localeCode);
  return locale?.timeFormat || '12h';
}

// Locale codes for easy access
export const LOCALE_CODES = {
  EN_US: 'en-US',
  ES_ES: 'es-ES',
  ES_MX: 'es-MX',
  PT_BR: 'pt-BR',
  FR_FR: 'fr-FR',
  DE_DE: 'de-DE',
  JA_JP: 'ja-JP',
  ZH_CN: 'zh-CN',
  KO_KR: 'ko-KR',
  AR_SA: 'ar-SA',
  RU_RU: 'ru-RU',
  IT_IT: 'it-IT',
} as const;

export type LocaleCode = typeof LOCALE_CODES[keyof typeof LOCALE_CODES];
