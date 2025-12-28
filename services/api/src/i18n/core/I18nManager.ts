import { EventEmitter } from 'events';

// I18n Manager - Comprehensive internationalization management system (~600 LOC)

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  region: string;
  pluralRules: string[];
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  // European
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', region: 'US', pluralRules: ['one', 'other'] },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', region: 'ES', pluralRules: ['one', 'other'] },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', region: 'FR', pluralRules: ['one', 'other'] },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', region: 'DE', pluralRules: ['one', 'other'] },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', region: 'IT', pluralRules: ['one', 'other'] },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', region: 'PT', pluralRules: ['one', 'other'] },
  pt_BR: { code: 'pt_BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', direction: 'ltr', region: 'BR', pluralRules: ['one', 'other'] },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', region: 'RU', pluralRules: ['one', 'few', 'many', 'other'] },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr', region: 'PL', pluralRules: ['one', 'few', 'many', 'other'] },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', region: 'NL', pluralRules: ['one', 'other'] },

  // Asian
  zh_CN: { code: 'zh_CN', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr', region: 'CN', pluralRules: ['other'] },
  zh_TW: { code: 'zh_TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', direction: 'ltr', region: 'TW', pluralRules: ['other'] },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', region: 'JP', pluralRules: ['other'] },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', region: 'KR', pluralRules: ['other'] },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr', region: 'TH', pluralRules: ['other'] },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', region: 'VN', pluralRules: ['other'] },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', region: 'ID', pluralRules: ['other'] },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', region: 'IN', pluralRules: ['one', 'other'] },

  // Middle Eastern
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', region: 'SA', pluralRules: ['zero', 'one', 'two', 'few', 'many', 'other'] },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', region: 'IL', pluralRules: ['one', 'two', 'many', 'other'] },
  fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', direction: 'rtl', region: 'IR', pluralRules: ['one', 'other'] },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', region: 'TR', pluralRules: ['one', 'other'] },

  // Other
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', direction: 'ltr', region: 'SE', pluralRules: ['one', 'other'] },
  no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', direction: 'ltr', region: 'NO', pluralRules: ['one', 'other'] },
  da: { code: 'da', name: 'Danish', nativeName: 'Dansk', direction: 'ltr', region: 'DK', pluralRules: ['one', 'other'] },
  fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', direction: 'ltr', region: 'FI', pluralRules: ['one', 'other'] },
  cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', direction: 'ltr', region: 'CZ', pluralRules: ['one', 'few', 'many', 'other'] },
  uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr', region: 'UA', pluralRules: ['one', 'few', 'many', 'other'] },
};

interface TranslationBundle {
  [key: string]: string | TranslationBundle;
}

export class I18nManager extends EventEmitter {
  private translations: Map<string, TranslationBundle> = new Map();
  private currentLocale: string = 'en';
  private fallbackLocale: string = 'en';
  private loadedLocales: Set<string> = new Set();

  constructor() {
    super();
    this.loadTranslations(this.currentLocale);
  }

  async loadTranslations(locale: string): Promise<void> {
    if (this.loadedLocales.has(locale)) {
      console.log(`[I18nManager] Translations already loaded for ${locale}`);
      return;
    }

    console.log(`[I18nManager] Loading translations for ${locale}`);

    // In production, fetch from CDN or database
    // For now, create sample translations
    const bundle = await this.fetchTranslationBundle(locale);
    this.translations.set(locale, bundle);
    this.loadedLocales.add(locale);

    this.emit('translations:loaded', locale);
  }

  private async fetchTranslationBundle(locale: string): Promise<TranslationBundle> {
    // Sample translations (in production, fetch from API/CDN)
    const bundles: Record<string, TranslationBundle> = {
      en: {
        common: {
          welcome: 'Welcome',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          loading: 'Loading...',
        },
        goals: {
          create: 'Create Goal',
          list: 'Your Goals',
          completed: '{{count}} goal completed',
          completed_plural: '{{count}} goals completed',
        },
        coaching: {
          session: 'Coaching Session',
          book: 'Book a Session',
          upcoming: 'Upcoming Sessions',
        },
      },
      es: {
        common: {
          welcome: 'Bienvenido',
          save: 'Guardar',
          cancel: 'Cancelar',
          delete: 'Eliminar',
          edit: 'Editar',
          loading: 'Cargando...',
        },
        goals: {
          create: 'Crear Objetivo',
          list: 'Tus Objetivos',
          completed: '{{count}} objetivo completado',
          completed_plural: '{{count}} objetivos completados',
        },
        coaching: {
          session: 'Sesión de Coaching',
          book: 'Reservar una Sesión',
          upcoming: 'Próximas Sesiones',
        },
      },
      fr: {
        common: {
          welcome: 'Bienvenue',
          save: 'Enregistrer',
          cancel: 'Annuler',
          delete: 'Supprimer',
          edit: 'Modifier',
          loading: 'Chargement...',
        },
        goals: {
          create: 'Créer un Objectif',
          list: 'Vos Objectifs',
          completed: '{{count}} objectif complété',
          completed_plural: '{{count}} objectifs complétés',
        },
        coaching: {
          session: 'Séance de Coaching',
          book: 'Réserver une Séance',
          upcoming: 'Séances à Venir',
        },
      },
    };

    return bundles[locale] || bundles.en;
  }

  setLocale(locale: string): void {
    if (!SUPPORTED_LANGUAGES[locale]) {
      console.warn(`[I18nManager] Unsupported locale: ${locale}, falling back to ${this.fallbackLocale}`);
      locale = this.fallbackLocale;
    }

    this.currentLocale = locale;
    this.loadTranslations(locale);
    this.emit('locale:changed', locale);

    console.log(`[I18nManager] Locale set to ${locale}`);
  }

  getLocale(): string {
    return this.currentLocale;
  }

  translate(key: string, params?: Record<string, any>, count?: number): string {
    const bundle = this.translations.get(this.currentLocale);
    if (!bundle) {
      console.warn(`[I18nManager] No translations loaded for ${this.currentLocale}`);
      return key;
    }

    // Handle pluralization
    let translationKey = key;
    if (count !== undefined) {
      const pluralForm = this.getPluralForm(this.currentLocale, count);
      const pluralKey = `${key}_${pluralForm}`;

      // Try plural form first, fall back to singular
      translationKey = this.hasTranslation(bundle, pluralKey) ? pluralKey : key;
    }

    let translation = this.getNestedTranslation(bundle, translationKey);

    if (!translation) {
      // Fallback to default locale
      const fallbackBundle = this.translations.get(this.fallbackLocale);
      translation = fallbackBundle ? this.getNestedTranslation(fallbackBundle, translationKey) : null;
    }

    if (!translation) {
      console.warn(`[I18nManager] Missing translation for key: ${key}`);
      return key;
    }

    // Interpolate parameters
    if (params) {
      translation = this.interpolate(translation, params);
    }

    return translation;
  }

  private getNestedTranslation(bundle: TranslationBundle, key: string): string | null {
    const parts = key.split('.');
    let current: any = bundle;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  private hasTranslation(bundle: TranslationBundle, key: string): boolean {
    return this.getNestedTranslation(bundle, key) !== null;
  }

  private interpolate(template: string, params: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  getPluralForm(locale: string, count: number): string {
    try {
      const rules = new Intl.PluralRules(locale);
      return rules.select(count);
    } catch (error) {
      console.warn(`[I18nManager] Error getting plural form for ${locale}:`, error);
      return count === 1 ? 'one' : 'other';
    }
  }

  formatDate(date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'long'): string {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, {
        dateStyle: format,
      }).format(date);
    } catch (error) {
      console.warn(`[I18nManager] Error formatting date:`, error);
      return date.toLocaleDateString();
    }
  }

  formatTime(date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'short'): string {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, {
        timeStyle: format,
      }).format(date);
    } catch (error) {
      console.warn(`[I18nManager] Error formatting time:`, error);
      return date.toLocaleTimeString();
    }
  }

  formatDateTime(date: Date, dateFormat: 'short' | 'medium' | 'long' = 'long', timeFormat: 'short' | 'medium' = 'short'): string {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, {
        dateStyle: dateFormat,
        timeStyle: timeFormat,
      }).format(date);
    } catch (error) {
      console.warn(`[I18nManager] Error formatting datetime:`, error);
      return date.toLocaleString();
    }
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.currentLocale, options).format(value);
    } catch (error) {
      console.warn(`[I18nManager] Error formatting number:`, error);
      return String(value);
    }
  }

  formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      console.warn(`[I18nManager] Error formatting currency:`, error);
      return `${currency} ${amount}`;
    }
  }

  formatPercentage(value: number, decimals: number = 0): string {
    try {
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch (error) {
      console.warn(`[I18nManager] Error formatting percentage:`, error);
      return `${(value * 100).toFixed(decimals)}%`;
    }
  }

  isRTL(locale?: string): boolean {
    const lang = locale || this.currentLocale;
    const config = SUPPORTED_LANGUAGES[lang];
    return config?.direction === 'rtl';
  }

  getLanguageConfig(locale?: string): LanguageConfig | null {
    const lang = locale || this.currentLocale;
    return SUPPORTED_LANGUAGES[lang] || null;
  }

  getSupportedLanguages(): LanguageConfig[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  t = this.translate.bind(this); // Alias for convenience
}

export const i18nManager = new I18nManager();
