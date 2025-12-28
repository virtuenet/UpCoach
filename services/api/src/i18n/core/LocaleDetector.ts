// Locale Detector - Intelligent locale detection and preferences (~400 LOC)

interface LocaleDetectionResult {
  locale: string;
  confidence: number;
  source: 'user_preference' | 'header' | 'ip' | 'browser' | 'default';
}

export class LocaleDetector {
  private readonly SUPPORTED_LOCALES = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'pt_BR', 'ru', 'pl', 'nl',
    'zh_CN', 'zh_TW', 'ja', 'ko', 'th', 'vi', 'id', 'hi',
    'ar', 'he', 'fa', 'tr',
    'sv', 'no', 'da', 'fi', 'cs', 'uk',
  ];

  private readonly COUNTRY_TO_LOCALE: Record<string, string> = {
    US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en',
    ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
    FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr',
    DE: 'de', AT: 'de', CH: 'de',
    IT: 'it', CH: 'it',
    BR: 'pt_BR', PT: 'pt',
    RU: 'ru', BY: 'ru', KZ: 'ru',
    PL: 'pl',
    NL: 'nl', BE: 'nl',
    CN: 'zh_CN', SG: 'zh_CN',
    TW: 'zh_TW', HK: 'zh_TW',
    JP: 'ja',
    KR: 'ko',
    TH: 'th',
    VN: 'vi',
    ID: 'id',
    IN: 'hi',
    SA: 'ar', AE: 'ar', EG: 'ar', JO: 'ar', LB: 'ar',
    IL: 'he',
    IR: 'fa',
    TR: 'tr',
    SE: 'sv',
    NO: 'no',
    DK: 'da',
    FI: 'fi',
    CZ: 'cs',
    UA: 'uk',
  };

  async detectLocale(request: {
    userId?: string;
    ip?: string;
    headers?: Record<string, string>;
  }): Promise<LocaleDetectionResult> {
    console.log('[LocaleDetector] Detecting locale...');

    // Priority 1: Explicit user preference (stored)
    if (request.userId) {
      const userPreference = await this.getUserPreference(request.userId);
      if (userPreference) {
        return {
          locale: userPreference,
          confidence: 1.0,
          source: 'user_preference',
        };
      }
    }

    // Priority 2: Accept-Language header
    if (request.headers?.['accept-language']) {
      const headerLocale = this.parseAcceptLanguageHeader(
        request.headers['accept-language']
      );
      if (headerLocale && this.isSupported(headerLocale)) {
        return {
          locale: headerLocale,
          confidence: 0.9,
          source: 'header',
        };
      }
    }

    // Priority 3: IP-based geolocation
    if (request.ip) {
      const geoLocale = await this.detectFromIP(request.ip);
      if (geoLocale && this.isSupported(geoLocale)) {
        return {
          locale: geoLocale,
          confidence: 0.7,
          source: 'ip',
        };
      }
    }

    // Priority 4: Browser/OS settings
    if (request.headers?.['user-agent-locale']) {
      const browserLocale = request.headers['user-agent-locale'];
      if (browserLocale && this.isSupported(browserLocale)) {
        return {
          locale: browserLocale,
          confidence: 0.6,
          source: 'browser',
        };
      }
    }

    // Fallback to English
    return {
      locale: 'en',
      confidence: 0.5,
      source: 'default',
    };
  }

  private async getUserPreference(userId: string): Promise<string | null> {
    // In production, fetch from database
    console.log(`[LocaleDetector] Checking user preference for ${userId}`);
    return null; // No preference stored
  }

  parseAcceptLanguageHeader(header: string): string | null {
    // Parse Accept-Language header
    // Example: "en-US,en;q=0.9,es;q=0.8,fr;q=0.7"

    const languages = header.split(',').map((lang) => {
      const [locale, qValue] = lang.trim().split(';q=');
      const quality = qValue ? parseFloat(qValue) : 1.0;
      return { locale: locale.trim(), quality };
    });

    // Sort by quality
    languages.sort((a, b) => b.quality - a.quality);

    // Find first supported locale
    for (const { locale } of languages) {
      const normalized = this.normalizeLocale(locale);
      if (normalized && this.isSupported(normalized)) {
        return normalized;
      }
    }

    return null;
  }

  private async detectFromIP(ip: string): Promise<string | null> {
    // Simulate IP geolocation (in production, use MaxMind GeoIP2 or similar)
    console.log(`[LocaleDetector] Detecting locale from IP: ${ip}`);

    // Sample IP to country mapping
    const ipToCountry: Record<string, string> = {
      '192.168.1.1': 'US',
      '10.0.0.1': 'GB',
      '172.16.0.1': 'ES',
    };

    const country = ipToCountry[ip] || 'US';
    return this.COUNTRY_TO_LOCALE[country] || null;
  }

  private normalizeLocale(locale: string): string | null {
    // Normalize locale codes
    // en-US -> en
    // en_US -> en
    // pt-BR -> pt_BR
    // zh-Hans -> zh_CN
    // zh-Hant -> zh_TW

    locale = locale.replace('-', '_');

    // Special cases
    const mapping: Record<string, string> = {
      en_US: 'en',
      en_GB: 'en',
      es_ES: 'es',
      es_MX: 'es',
      fr_FR: 'fr',
      de_DE: 'de',
      pt_PT: 'pt',
      pt_BR: 'pt_BR',
      zh_Hans: 'zh_CN',
      zh_Hant: 'zh_TW',
      zh_CN: 'zh_CN',
      zh_TW: 'zh_TW',
      ja_JP: 'ja',
      ko_KR: 'ko',
      ar_SA: 'ar',
      he_IL: 'he',
      fa_IR: 'fa',
    };

    if (mapping[locale]) {
      return mapping[locale];
    }

    // Extract base language
    const base = locale.split('_')[0];
    return this.isSupported(base) ? base : null;
  }

  isSupported(locale: string): boolean {
    return this.SUPPORTED_LOCALES.includes(locale);
  }

  async saveUserPreference(userId: string, locale: string): Promise<void> {
    if (!this.isSupported(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    console.log(`[LocaleDetector] Saving user preference: ${userId} -> ${locale}`);
    // In production, save to database
  }

  getSupportedLocales(): string[] {
    return [...this.SUPPORTED_LOCALES];
  }

  getLocaleInfo(locale: string): {
    code: string;
    name: string;
    nativeName: string;
    region: string;
  } | null {
    // In production, return full locale information
    return {
      code: locale,
      name: 'Language Name',
      nativeName: 'Native Name',
      region: 'Region',
    };
  }
}

export const localeDetector = new LocaleDetector();
