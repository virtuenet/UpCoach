/**
 * Locale Service
 *
 * Handles locale detection, preferences, and formatting rules.
 * Supports:
 * - Locale detection from headers, user preferences
 * - Number, date, currency formatting
 * - Timezone handling
 * - Regional preferences
 */

import { EventEmitter } from 'events';

// Types
export interface LocaleInfo {
  code: string;
  language: string;
  region?: string;
  script?: string;
  displayName: string;
  nativeName: string;
  isRTL: boolean;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: 0 | 1 | 6; // Sunday, Monday, Saturday
  currency: string;
  numberFormat: NumberFormatConfig;
}

export interface NumberFormatConfig {
  decimalSeparator: string;
  thousandsSeparator: string;
  decimalPlaces: number;
}

export interface UserLocalePreferences {
  userId: string;
  locale: string;
  timezone: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  firstDayOfWeek?: 0 | 1 | 6;
  currency?: string;
  measurementSystem?: 'metric' | 'imperial';
  updatedAt: Date;
}

export interface LocaleDetectionResult {
  locale: string;
  source: 'user' | 'header' | 'cookie' | 'ip' | 'default';
  confidence: number;
  alternates: string[];
}

export interface FormattedValue {
  value: string;
  locale: string;
  type: 'number' | 'currency' | 'date' | 'time' | 'datetime' | 'relative';
}

export interface LocaleServiceConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  detectFromIP: boolean;
  cookieName: string;
  headerName: string;
}

// Locale definitions
const LOCALE_DATA: Record<string, LocaleInfo> = {
  'en': {
    code: 'en',
    language: 'English',
    displayName: 'English',
    nativeName: 'English',
    isRTL: false,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    firstDayOfWeek: 0,
    currency: 'USD',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'en-US': {
    code: 'en-US',
    language: 'English',
    region: 'US',
    displayName: 'English (United States)',
    nativeName: 'English (United States)',
    isRTL: false,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    firstDayOfWeek: 0,
    currency: 'USD',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'en-GB': {
    code: 'en-GB',
    language: 'English',
    region: 'GB',
    displayName: 'English (United Kingdom)',
    nativeName: 'English (United Kingdom)',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'GBP',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'es': {
    code: 'es',
    language: 'Spanish',
    displayName: 'Spanish',
    nativeName: 'Español',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  },
  'es-MX': {
    code: 'es-MX',
    language: 'Spanish',
    region: 'MX',
    displayName: 'Spanish (Mexico)',
    nativeName: 'Español (México)',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'h:mm A',
    firstDayOfWeek: 0,
    currency: 'MXN',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'fr': {
    code: 'fr',
    language: 'French',
    displayName: 'French',
    nativeName: 'Français',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: ' ', decimalPlaces: 2 },
  },
  'de': {
    code: 'de',
    language: 'German',
    displayName: 'German',
    nativeName: 'Deutsch',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  },
  'pt': {
    code: 'pt',
    language: 'Portuguese',
    displayName: 'Portuguese',
    nativeName: 'Português',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'EUR',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  },
  'pt-BR': {
    code: 'pt-BR',
    language: 'Portuguese',
    region: 'BR',
    displayName: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'BRL',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  },
  'ja': {
    code: 'ja',
    language: 'Japanese',
    displayName: 'Japanese',
    nativeName: '日本語',
    isRTL: false,
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'JPY',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 0 },
  },
  'zh': {
    code: 'zh',
    language: 'Chinese',
    displayName: 'Chinese (Simplified)',
    nativeName: '简体中文',
    isRTL: false,
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'CNY',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'zh-TW': {
    code: 'zh-TW',
    language: 'Chinese',
    region: 'TW',
    displayName: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    isRTL: false,
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'TWD',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 0 },
  },
  'ko': {
    code: 'ko',
    language: 'Korean',
    displayName: 'Korean',
    nativeName: '한국어',
    isRTL: false,
    dateFormat: 'YYYY.MM.DD',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'KRW',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 0 },
  },
  'ar': {
    code: 'ar',
    language: 'Arabic',
    displayName: 'Arabic',
    nativeName: 'العربية',
    isRTL: true,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 6,
    currency: 'SAR',
    numberFormat: { decimalSeparator: '٫', thousandsSeparator: '٬', decimalPlaces: 2 },
  },
  'hi': {
    code: 'hi',
    language: 'Hindi',
    displayName: 'Hindi',
    nativeName: 'हिन्दी',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'h:mm A',
    firstDayOfWeek: 0,
    currency: 'INR',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'he': {
    code: 'he',
    language: 'Hebrew',
    displayName: 'Hebrew',
    nativeName: 'עברית',
    isRTL: true,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'ILS',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'ru': {
    code: 'ru',
    language: 'Russian',
    displayName: 'Russian',
    nativeName: 'Русский',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'RUB',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: ' ', decimalPlaces: 2 },
  },
  'it': {
    code: 'it',
    language: 'Italian',
    displayName: 'Italian',
    nativeName: 'Italiano',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  },
  'nl': {
    code: 'nl',
    language: 'Dutch',
    displayName: 'Dutch',
    nativeName: 'Nederlands',
    isRTL: false,
    dateFormat: 'DD-MM-YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  },
  'pl': {
    code: 'pl',
    language: 'Polish',
    displayName: 'Polish',
    nativeName: 'Polski',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'PLN',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: ' ', decimalPlaces: 2 },
  },
  'tr': {
    code: 'tr',
    language: 'Turkish',
    displayName: 'Turkish',
    nativeName: 'Türkçe',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'TRY',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 2 },
  },
  'th': {
    code: 'th',
    language: 'Thai',
    displayName: 'Thai',
    nativeName: 'ไทย',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'THB',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
  'vi': {
    code: 'vi',
    language: 'Vietnamese',
    displayName: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'VND',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 0 },
  },
  'id': {
    code: 'id',
    language: 'Indonesian',
    displayName: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'IDR',
    numberFormat: { decimalSeparator: ',', thousandsSeparator: '.', decimalPlaces: 0 },
  },
  'ms': {
    code: 'ms',
    language: 'Malay',
    displayName: 'Malay',
    nativeName: 'Bahasa Melayu',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'h:mm A',
    firstDayOfWeek: 1,
    currency: 'MYR',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2 },
  },
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  BRL: 'R$',
  MXN: '$',
  RUB: '₽',
  SAR: '﷼',
  ILS: '₪',
  PLN: 'zł',
  TRY: '₺',
  THB: '฿',
  VND: '₫',
  IDR: 'Rp',
  MYR: 'RM',
  TWD: 'NT$',
};

// Month names for formatting
const MONTH_NAMES: Record<string, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

// Day names for formatting
const DAY_NAMES: Record<string, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  ja: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  ko: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};

// Relative time units
const RELATIVE_TIME_UNITS: Record<string, Record<string, { past: string; future: string }>> = {
  en: {
    seconds: { past: '{n} seconds ago', future: 'in {n} seconds' },
    minute: { past: 'a minute ago', future: 'in a minute' },
    minutes: { past: '{n} minutes ago', future: 'in {n} minutes' },
    hour: { past: 'an hour ago', future: 'in an hour' },
    hours: { past: '{n} hours ago', future: 'in {n} hours' },
    day: { past: 'yesterday', future: 'tomorrow' },
    days: { past: '{n} days ago', future: 'in {n} days' },
    week: { past: 'last week', future: 'next week' },
    weeks: { past: '{n} weeks ago', future: 'in {n} weeks' },
    month: { past: 'last month', future: 'next month' },
    months: { past: '{n} months ago', future: 'in {n} months' },
    year: { past: 'last year', future: 'next year' },
    years: { past: '{n} years ago', future: 'in {n} years' },
  },
  es: {
    seconds: { past: 'hace {n} segundos', future: 'en {n} segundos' },
    minute: { past: 'hace un minuto', future: 'en un minuto' },
    minutes: { past: 'hace {n} minutos', future: 'en {n} minutos' },
    hour: { past: 'hace una hora', future: 'en una hora' },
    hours: { past: 'hace {n} horas', future: 'en {n} horas' },
    day: { past: 'ayer', future: 'mañana' },
    days: { past: 'hace {n} días', future: 'en {n} días' },
    week: { past: 'la semana pasada', future: 'la próxima semana' },
    weeks: { past: 'hace {n} semanas', future: 'en {n} semanas' },
    month: { past: 'el mes pasado', future: 'el próximo mes' },
    months: { past: 'hace {n} meses', future: 'en {n} meses' },
    year: { past: 'el año pasado', future: 'el próximo año' },
    years: { past: 'hace {n} años', future: 'en {n} años' },
  },
  fr: {
    seconds: { past: 'il y a {n} secondes', future: 'dans {n} secondes' },
    minute: { past: 'il y a une minute', future: 'dans une minute' },
    minutes: { past: 'il y a {n} minutes', future: 'dans {n} minutes' },
    hour: { past: 'il y a une heure', future: 'dans une heure' },
    hours: { past: 'il y a {n} heures', future: 'dans {n} heures' },
    day: { past: 'hier', future: 'demain' },
    days: { past: 'il y a {n} jours', future: 'dans {n} jours' },
    week: { past: 'la semaine dernière', future: 'la semaine prochaine' },
    weeks: { past: 'il y a {n} semaines', future: 'dans {n} semaines' },
    month: { past: 'le mois dernier', future: 'le mois prochain' },
    months: { past: 'il y a {n} mois', future: 'dans {n} mois' },
    year: { past: "l'année dernière", future: "l'année prochaine" },
    years: { past: 'il y a {n} ans', future: 'dans {n} ans' },
  },
  de: {
    seconds: { past: 'vor {n} Sekunden', future: 'in {n} Sekunden' },
    minute: { past: 'vor einer Minute', future: 'in einer Minute' },
    minutes: { past: 'vor {n} Minuten', future: 'in {n} Minuten' },
    hour: { past: 'vor einer Stunde', future: 'in einer Stunde' },
    hours: { past: 'vor {n} Stunden', future: 'in {n} Stunden' },
    day: { past: 'gestern', future: 'morgen' },
    days: { past: 'vor {n} Tagen', future: 'in {n} Tagen' },
    week: { past: 'letzte Woche', future: 'nächste Woche' },
    weeks: { past: 'vor {n} Wochen', future: 'in {n} Wochen' },
    month: { past: 'letzten Monat', future: 'nächsten Monat' },
    months: { past: 'vor {n} Monaten', future: 'in {n} Monaten' },
    year: { past: 'letztes Jahr', future: 'nächstes Jahr' },
    years: { past: 'vor {n} Jahren', future: 'in {n} Jahren' },
  },
  ja: {
    seconds: { past: '{n}秒前', future: '{n}秒後' },
    minute: { past: '1分前', future: '1分後' },
    minutes: { past: '{n}分前', future: '{n}分後' },
    hour: { past: '1時間前', future: '1時間後' },
    hours: { past: '{n}時間前', future: '{n}時間後' },
    day: { past: '昨日', future: '明日' },
    days: { past: '{n}日前', future: '{n}日後' },
    week: { past: '先週', future: '来週' },
    weeks: { past: '{n}週間前', future: '{n}週間後' },
    month: { past: '先月', future: '来月' },
    months: { past: '{n}ヶ月前', future: '{n}ヶ月後' },
    year: { past: '昨年', future: '来年' },
    years: { past: '{n}年前', future: '{n}年後' },
  },
  zh: {
    seconds: { past: '{n}秒前', future: '{n}秒后' },
    minute: { past: '1分钟前', future: '1分钟后' },
    minutes: { past: '{n}分钟前', future: '{n}分钟后' },
    hour: { past: '1小时前', future: '1小时后' },
    hours: { past: '{n}小时前', future: '{n}小时后' },
    day: { past: '昨天', future: '明天' },
    days: { past: '{n}天前', future: '{n}天后' },
    week: { past: '上周', future: '下周' },
    weeks: { past: '{n}周前', future: '{n}周后' },
    month: { past: '上个月', future: '下个月' },
    months: { past: '{n}个月前', future: '{n}个月后' },
    year: { past: '去年', future: '明年' },
    years: { past: '{n}年前', future: '{n}年后' },
  },
  ar: {
    seconds: { past: 'منذ {n} ثانية', future: 'بعد {n} ثانية' },
    minute: { past: 'منذ دقيقة', future: 'بعد دقيقة' },
    minutes: { past: 'منذ {n} دقائق', future: 'بعد {n} دقائق' },
    hour: { past: 'منذ ساعة', future: 'بعد ساعة' },
    hours: { past: 'منذ {n} ساعات', future: 'بعد {n} ساعات' },
    day: { past: 'أمس', future: 'غداً' },
    days: { past: 'منذ {n} أيام', future: 'بعد {n} أيام' },
    week: { past: 'الأسبوع الماضي', future: 'الأسبوع القادم' },
    weeks: { past: 'منذ {n} أسابيع', future: 'بعد {n} أسابيع' },
    month: { past: 'الشهر الماضي', future: 'الشهر القادم' },
    months: { past: 'منذ {n} أشهر', future: 'بعد {n} أشهر' },
    year: { past: 'العام الماضي', future: 'العام القادم' },
    years: { past: 'منذ {n} سنوات', future: 'بعد {n} سنوات' },
  },
};

// Singleton instance
let instance: LocaleService | null = null;

/**
 * Locale Service implementation
 */
export class LocaleService extends EventEmitter {
  private config: LocaleServiceConfig;
  private userPreferences: Map<string, UserLocalePreferences> = new Map();

  constructor(config: Partial<LocaleServiceConfig> = {}) {
    super();
    this.config = {
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko', 'ar', 'hi'],
      fallbackLocale: 'en',
      detectFromIP: false,
      cookieName: 'locale',
      headerName: 'Accept-Language',
      ...config,
    };
  }

  /**
   * Detect locale from request
   */
  detectLocale(options: {
    userId?: string;
    acceptLanguage?: string;
    cookie?: string;
    ip?: string;
  }): LocaleDetectionResult {
    const alternates: string[] = [];

    // 1. Check user preferences
    if (options.userId) {
      const prefs = this.userPreferences.get(options.userId);
      if (prefs && this.isSupported(prefs.locale)) {
        return {
          locale: prefs.locale,
          source: 'user',
          confidence: 1.0,
          alternates: [],
        };
      }
    }

    // 2. Check cookie
    if (options.cookie) {
      if (this.isSupported(options.cookie)) {
        return {
          locale: options.cookie,
          source: 'cookie',
          confidence: 0.9,
          alternates: [],
        };
      }
    }

    // 3. Parse Accept-Language header
    if (options.acceptLanguage) {
      const parsed = this.parseAcceptLanguage(options.acceptLanguage);

      for (const { locale, quality } of parsed) {
        if (this.isSupported(locale)) {
          return {
            locale,
            source: 'header',
            confidence: quality,
            alternates: parsed
              .filter(p => p.locale !== locale && this.isSupported(p.locale))
              .map(p => p.locale),
          };
        }

        // Try base locale
        const baseLocale = locale.split('-')[0];
        if (this.isSupported(baseLocale)) {
          alternates.push(baseLocale);
        }
      }

      if (alternates.length > 0) {
        return {
          locale: alternates[0],
          source: 'header',
          confidence: 0.7,
          alternates: alternates.slice(1),
        };
      }
    }

    // 4. Use default
    return {
      locale: this.config.defaultLocale,
      source: 'default',
      confidence: 0.5,
      alternates: [],
    };
  }

  /**
   * Parse Accept-Language header
   */
  private parseAcceptLanguage(header: string): Array<{ locale: string; quality: number }> {
    const result: Array<{ locale: string; quality: number }> = [];

    const parts = header.split(',');
    for (const part of parts) {
      const [locale, qualityStr] = part.trim().split(';q=');
      const quality = qualityStr ? parseFloat(qualityStr) : 1.0;

      if (locale) {
        result.push({
          locale: locale.trim(),
          quality: isNaN(quality) ? 1.0 : quality,
        });
      }
    }

    // Sort by quality descending
    result.sort((a, b) => b.quality - a.quality);
    return result;
  }

  /**
   * Check if locale is supported
   */
  isSupported(locale: string): boolean {
    return this.config.supportedLocales.includes(locale) ||
      this.config.supportedLocales.includes(locale.split('-')[0]);
  }

  /**
   * Get locale info
   */
  getLocaleInfo(locale: string): LocaleInfo | null {
    // Try exact match
    if (LOCALE_DATA[locale]) {
      return LOCALE_DATA[locale];
    }

    // Try base locale
    const baseLocale = locale.split('-')[0];
    if (LOCALE_DATA[baseLocale]) {
      return LOCALE_DATA[baseLocale];
    }

    return null;
  }

  /**
   * Get all supported locale infos
   */
  getSupportedLocaleInfos(): LocaleInfo[] {
    return this.config.supportedLocales
      .map(l => this.getLocaleInfo(l))
      .filter((info): info is LocaleInfo => info !== null);
  }

  /**
   * Set user locale preferences
   */
  async setUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserLocalePreferences, 'userId' | 'updatedAt'>>
  ): Promise<UserLocalePreferences> {
    const existing = this.userPreferences.get(userId);

    const updated: UserLocalePreferences = {
      userId,
      locale: preferences.locale || existing?.locale || this.config.defaultLocale,
      timezone: preferences.timezone || existing?.timezone || 'UTC',
      dateFormat: preferences.dateFormat || existing?.dateFormat,
      timeFormat: preferences.timeFormat || existing?.timeFormat,
      firstDayOfWeek: preferences.firstDayOfWeek ?? existing?.firstDayOfWeek,
      currency: preferences.currency || existing?.currency,
      measurementSystem: preferences.measurementSystem || existing?.measurementSystem,
      updatedAt: new Date(),
    };

    this.userPreferences.set(userId, updated);
    this.emit('preferences:updated', updated);

    return updated;
  }

  /**
   * Get user locale preferences
   */
  async getUserPreferences(userId: string): Promise<UserLocalePreferences | null> {
    return this.userPreferences.get(userId) || null;
  }

  /**
   * Format a number
   */
  formatNumber(
    value: number,
    locale: string,
    options: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      useGrouping?: boolean;
    } = {}
  ): FormattedValue {
    const info = this.getLocaleInfo(locale);
    const format = info?.numberFormat || LOCALE_DATA.en.numberFormat;

    const minFrac = options.minimumFractionDigits ?? 0;
    const maxFrac = options.maximumFractionDigits ?? format.decimalPlaces;
    const useGrouping = options.useGrouping !== false;

    // Format the number
    const fixed = value.toFixed(maxFrac);
    const [intPart, decPart] = fixed.split('.');

    // Add thousands separators
    let formattedInt = intPart;
    if (useGrouping) {
      formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, format.thousandsSeparator);
    }

    // Handle decimal part
    let result = formattedInt;
    if (decPart && (minFrac > 0 || parseFloat(`0.${decPart}`) > 0)) {
      // Trim trailing zeros if minFrac allows
      let trimmedDec = decPart;
      while (trimmedDec.length > minFrac && trimmedDec.endsWith('0')) {
        trimmedDec = trimmedDec.slice(0, -1);
      }
      if (trimmedDec) {
        result += format.decimalSeparator + trimmedDec;
      }
    }

    return {
      value: result,
      locale,
      type: 'number',
    };
  }

  /**
   * Format currency
   */
  formatCurrency(
    value: number,
    locale: string,
    currency?: string,
    options: {
      showSymbol?: boolean;
      showCode?: boolean;
    } = {}
  ): FormattedValue {
    const info = this.getLocaleInfo(locale);
    const currencyCode = currency || info?.currency || 'USD';
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;

    // Get decimal places for currency (JPY, KRW, VND have 0)
    const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'TWD'];
    const decimalPlaces = noDecimalCurrencies.includes(currencyCode) ? 0 : 2;

    const formatted = this.formatNumber(value, locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    let result = formatted.value;

    if (options.showSymbol !== false) {
      // Position symbol based on locale
      const symbolAfter = ['de', 'fr', 'es', 'pt', 'nl', 'pl', 'ru', 'vi'].includes(locale.split('-')[0]);
      if (symbolAfter) {
        result = `${result} ${symbol}`;
      } else {
        result = `${symbol}${result}`;
      }
    }

    if (options.showCode) {
      result += ` ${currencyCode}`;
    }

    return {
      value: result,
      locale,
      type: 'currency',
    };
  }

  /**
   * Format date
   */
  formatDate(
    date: Date | string | number,
    locale: string,
    format?: string
  ): FormattedValue {
    const d = date instanceof Date ? date : new Date(date);
    const info = this.getLocaleInfo(locale);
    const dateFormat = format || info?.dateFormat || 'YYYY-MM-DD';

    const baseLocale = locale.split('-')[0];
    const months = MONTH_NAMES[baseLocale] || MONTH_NAMES.en;
    const days = DAY_NAMES[baseLocale] || DAY_NAMES.en;

    const tokens: Record<string, string> = {
      YYYY: d.getFullYear().toString(),
      YY: d.getFullYear().toString().slice(-2),
      MMMM: months[d.getMonth()],
      MMM: months[d.getMonth()].slice(0, 3),
      MM: (d.getMonth() + 1).toString().padStart(2, '0'),
      M: (d.getMonth() + 1).toString(),
      DDDD: days[d.getDay()],
      DDD: days[d.getDay()].slice(0, 3),
      DD: d.getDate().toString().padStart(2, '0'),
      D: d.getDate().toString(),
    };

    let result = dateFormat;
    for (const [token, value] of Object.entries(tokens)) {
      result = result.replace(token, value);
    }

    return {
      value: result,
      locale,
      type: 'date',
    };
  }

  /**
   * Format time
   */
  formatTime(
    date: Date | string | number,
    locale: string,
    format?: string
  ): FormattedValue {
    const d = date instanceof Date ? date : new Date(date);
    const info = this.getLocaleInfo(locale);
    const timeFormat = format || info?.timeFormat || 'HH:mm';

    const hours24 = d.getHours();
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';

    const tokens: Record<string, string> = {
      HH: hours24.toString().padStart(2, '0'),
      H: hours24.toString(),
      hh: hours12.toString().padStart(2, '0'),
      h: hours12.toString(),
      mm: d.getMinutes().toString().padStart(2, '0'),
      m: d.getMinutes().toString(),
      ss: d.getSeconds().toString().padStart(2, '0'),
      s: d.getSeconds().toString(),
      A: ampm,
      a: ampm.toLowerCase(),
    };

    let result = timeFormat;
    for (const [token, value] of Object.entries(tokens)) {
      result = result.replace(token, value);
    }

    return {
      value: result,
      locale,
      type: 'time',
    };
  }

  /**
   * Format datetime
   */
  formatDateTime(
    date: Date | string | number,
    locale: string,
    dateFormat?: string,
    timeFormat?: string
  ): FormattedValue {
    const formattedDate = this.formatDate(date, locale, dateFormat);
    const formattedTime = this.formatTime(date, locale, timeFormat);

    return {
      value: `${formattedDate.value} ${formattedTime.value}`,
      locale,
      type: 'datetime',
    };
  }

  /**
   * Format relative time
   */
  formatRelativeTime(
    date: Date | string | number,
    locale: string,
    baseDate: Date = new Date()
  ): FormattedValue {
    const d = date instanceof Date ? date : new Date(date);
    const diffMs = d.getTime() - baseDate.getTime();
    const isPast = diffMs < 0;
    const absMs = Math.abs(diffMs);

    const baseLocale = locale.split('-')[0];
    const units = RELATIVE_TIME_UNITS[baseLocale] || RELATIVE_TIME_UNITS.en;

    let unit: string;
    let n: number;

    const seconds = Math.floor(absMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      unit = 'seconds';
      n = seconds;
    } else if (minutes === 1) {
      unit = 'minute';
      n = 1;
    } else if (minutes < 60) {
      unit = 'minutes';
      n = minutes;
    } else if (hours === 1) {
      unit = 'hour';
      n = 1;
    } else if (hours < 24) {
      unit = 'hours';
      n = hours;
    } else if (days === 1) {
      unit = 'day';
      n = 1;
    } else if (days < 7) {
      unit = 'days';
      n = days;
    } else if (weeks === 1) {
      unit = 'week';
      n = 1;
    } else if (weeks < 4) {
      unit = 'weeks';
      n = weeks;
    } else if (months === 1) {
      unit = 'month';
      n = 1;
    } else if (months < 12) {
      unit = 'months';
      n = months;
    } else if (years === 1) {
      unit = 'year';
      n = 1;
    } else {
      unit = 'years';
      n = years;
    }

    const template = isPast ? units[unit].past : units[unit].future;
    const result = template.replace('{n}', n.toString());

    return {
      value: result,
      locale,
      type: 'relative',
    };
  }

  /**
   * Check if locale is RTL
   */
  isRTL(locale: string): boolean {
    const info = this.getLocaleInfo(locale);
    return info?.isRTL || false;
  }

  /**
   * Get text direction
   */
  getTextDirection(locale: string): 'ltr' | 'rtl' {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currencyCode: string): string {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }

  /**
   * Get default locale
   */
  getDefaultLocale(): string {
    return this.config.defaultLocale;
  }

  /**
   * Get fallback locale
   */
  getFallbackLocale(): string {
    return this.config.fallbackLocale;
  }

  /**
   * Normalize locale code
   */
  normalizeLocale(locale: string): string {
    // Handle various formats: en_US, en-us, EN-US
    const normalized = locale.replace('_', '-').toLowerCase();
    const parts = normalized.split('-');

    if (parts.length === 1) {
      return parts[0];
    }

    // Language-region format
    return `${parts[0]}-${parts[1].toUpperCase()}`;
  }
}

/**
 * Get singleton instance
 */
export function getLocaleService(config?: Partial<LocaleServiceConfig>): LocaleService {
  if (!instance) {
    instance = new LocaleService(config);
  }
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetLocaleService(): void {
  instance = null;
}
