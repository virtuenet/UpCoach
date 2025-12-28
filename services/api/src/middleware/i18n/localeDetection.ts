/**
 * Locale Detection Middleware - Phase 14 Week 1
 * Automatically detects user locale from multiple sources
 */

import { Request, Response, NextFunction } from 'express';

export interface LocaleDetectionConfig {
  supportedLocales: string[];
  defaultLocale: string;
  cookieName: string;
  queryParamName: string;
  enableGeolocation: boolean;
  enableUserPreference: boolean;
  fallbackChain: ('user' | 'cookie' | 'header' | 'geo' | 'default')[];
}

export interface DetectedLocale {
  locale: string;
  source: 'user' | 'cookie' | 'header' | 'geo' | 'default';
  confidence: number; // 0-100
}

// ISO 639-1 to full locale mapping
const LOCALE_MAPPINGS: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'pt': 'pt-BR',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'ja': 'ja-JP',
  'zh': 'zh-CN',
  'ar': 'ar-SA',
  'ru': 'ru-RU',
  'it': 'it-IT',
  'ko': 'ko-KR',
  'nl': 'nl-NL',
  'pl': 'pl-PL',
  'tr': 'tr-TR',
  'vi': 'vi-VN',
  'th': 'th-TH',
  'id': 'id-ID',
  'hi': 'hi-IN',
};

// Country code to locale mapping (for IP geolocation)
const COUNTRY_TO_LOCALE: Record<string, string> = {
  'US': 'en-US',
  'GB': 'en-GB',
  'CA': 'en-CA',
  'AU': 'en-AU',
  'ES': 'es-ES',
  'MX': 'es-MX',
  'AR': 'es-AR',
  'BR': 'pt-BR',
  'PT': 'pt-PT',
  'FR': 'fr-FR',
  'DE': 'de-DE',
  'JP': 'ja-JP',
  'CN': 'zh-CN',
  'TW': 'zh-TW',
  'KR': 'ko-KR',
  'SA': 'ar-SA',
  'AE': 'ar-AE',
  'RU': 'ru-RU',
  'IT': 'it-IT',
  'NL': 'nl-NL',
  'PL': 'pl-PL',
  'TR': 'tr-TR',
  'VN': 'vi-VN',
  'TH': 'th-TH',
  'ID': 'id-ID',
  'IN': 'hi-IN',
};

export class LocaleDetector {
  private config: LocaleDetectionConfig;

  constructor(config?: Partial<LocaleDetectionConfig>) {
    this.config = {
      supportedLocales: ['en-US', 'es-ES', 'pt-BR', 'fr-FR', 'de-DE', 'ja-JP'],
      defaultLocale: 'en-US',
      cookieName: 'locale',
      queryParamName: 'locale',
      enableGeolocation: true,
      enableUserPreference: true,
      fallbackChain: ['user', 'cookie', 'header', 'geo', 'default'],
      ...config,
    };
  }

  /**
   * Express middleware to detect and set locale
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const detectedLocale = await this.detectLocale(req);

        // Attach locale to request object
        (req as any).locale = detectedLocale.locale;
        (req as any).localeSource = detectedLocale.source;
        (req as any).localeConfidence = detectedLocale.confidence;

        // Set Content-Language header
        res.setHeader('Content-Language', detectedLocale.locale);

        next();
      } catch (error) {
        // Fallback to default locale on error
        (req as any).locale = this.config.defaultLocale;
        (req as any).localeSource = 'default';
        (req as any).localeConfidence = 100;
        next();
      }
    };
  }

  /**
   * Detect locale from multiple sources
   */
  async detectLocale(req: Request): Promise<DetectedLocale> {
    for (const source of this.config.fallbackChain) {
      let locale: string | null = null;
      let confidence = 0;

      switch (source) {
        case 'user':
          if (this.config.enableUserPreference) {
            const userLocale = await this.detectFromUser(req);
            if (userLocale) {
              locale = userLocale;
              confidence = 100;
            }
          }
          break;

        case 'cookie':
          locale = this.detectFromCookie(req);
          if (locale) confidence = 90;
          break;

        case 'header':
          locale = this.detectFromHeader(req);
          if (locale) confidence = 70;
          break;

        case 'geo':
          if (this.config.enableGeolocation) {
            locale = await this.detectFromGeo(req);
            if (locale) confidence = 50;
          }
          break;

        case 'default':
          locale = this.config.defaultLocale;
          confidence = 100;
          break;
      }

      if (locale && this.isSupportedLocale(locale)) {
        return {
          locale: this.normalizeLocale(locale),
          source,
          confidence,
        };
      }
    }

    // Ultimate fallback
    return {
      locale: this.config.defaultLocale,
      source: 'default',
      confidence: 100,
    };
  }

  /**
   * Detect locale from authenticated user preferences
   */
  private async detectFromUser(req: Request): Promise<string | null> {
    try {
      // Check if user is authenticated
      const user = (req as any).user;

      if (!user || !user.id) {
        return null;
      }

      // Get user's locale preference from database
      // This would typically query the User model
      const userLocale = user.locale || user.preferredLocale;

      return userLocale || null;
    } catch {
      return null;
    }
  }

  /**
   * Detect locale from cookie
   */
  private detectFromCookie(req: Request): string | null {
    try {
      // Check query parameter first (allows easy testing)
      const queryLocale = req.query[this.config.queryParamName] as string;
      if (queryLocale) {
        return queryLocale;
      }

      // Check cookie
      const cookieLocale = req.cookies?.[this.config.cookieName];
      return cookieLocale || null;
    } catch {
      return null;
    }
  }

  /**
   * Detect locale from Accept-Language header
   */
  private detectFromHeader(req: Request): string | null {
    try {
      const acceptLanguage = req.headers['accept-language'];

      if (!acceptLanguage) {
        return null;
      }

      // Parse Accept-Language header
      // Format: "en-US,en;q=0.9,es;q=0.8,fr;q=0.7"
      const languages = this.parseAcceptLanguage(acceptLanguage);

      // Find first supported locale
      for (const lang of languages) {
        const locale = this.findMatchingLocale(lang.code);
        if (locale) {
          return locale;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse Accept-Language header
   */
  private parseAcceptLanguage(header: string): Array<{ code: string; quality: number }> {
    return header
      .split(',')
      .map(lang => {
        const parts = lang.trim().split(';');
        const code = parts[0];
        const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
        return { code, quality };
      })
      .sort((a, b) => b.quality - a.quality);
  }

  /**
   * Detect locale from IP geolocation
   */
  private async detectFromGeo(req: Request): Promise<string | null> {
    try {
      // Get client IP
      const ip = this.getClientIP(req);

      if (!ip || ip === '127.0.0.1' || ip === '::1') {
        return null;
      }

      // Get country from IP using geolocation service
      const country = await this.getCountryFromIP(ip);

      if (country && COUNTRY_TO_LOCALE[country]) {
        return COUNTRY_TO_LOCALE[country];
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string | null {
    // Check various headers for IP (useful behind proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    return req.ip || req.socket.remoteAddress || null;
  }

  /**
   * Get country code from IP address
   * In production, this would use MaxMind GeoIP2 or similar service
   */
  private async getCountryFromIP(ip: string): Promise<string | null> {
    try {
      // Production implementation would use MaxMind GeoIP2:
      // const reader = await maxmind.open('/path/to/GeoLite2-Country.mmdb');
      // const result = reader.get(ip);
      // return result?.country?.iso_code || null;

      // For now, return null (geolocation disabled in development)
      // This can be enabled with proper MaxMind database
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Find matching supported locale
   */
  private findMatchingLocale(languageCode: string): string | null {
    // Try exact match first
    if (this.isSupportedLocale(languageCode)) {
      return languageCode;
    }

    // Try base language (en-US -> en)
    const baseLanguage = languageCode.split('-')[0];

    // Check if we have a mapping
    if (LOCALE_MAPPINGS[baseLanguage]) {
      const mappedLocale = LOCALE_MAPPINGS[baseLanguage];
      if (this.isSupportedLocale(mappedLocale)) {
        return mappedLocale;
      }
    }

    // Try to find any locale starting with base language
    const match = this.config.supportedLocales.find(
      locale => locale.startsWith(baseLanguage)
    );

    return match || null;
  }

  /**
   * Check if locale is supported
   */
  private isSupportedLocale(locale: string): boolean {
    return this.config.supportedLocales.includes(locale);
  }

  /**
   * Normalize locale format
   */
  private normalizeLocale(locale: string): string {
    // Ensure format is xx-XX (e.g., en-US not en_US)
    return locale.replace('_', '-');
  }

  /**
   * Get list of supported locales
   */
  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }

  /**
   * Check if locale is RTL (Right-to-Left)
   */
  static isRTL(locale: string): boolean {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    const baseLanguage = locale.split('-')[0];
    return rtlLocales.includes(baseLanguage);
  }

  /**
   * Get language direction for locale
   */
  static getDirection(locale: string): 'ltr' | 'rtl' {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }
}

// Default instance
export const localeDetector = new LocaleDetector();

// Export middleware
export const localeDetectionMiddleware = localeDetector.middleware();

// Export factory function
export function createLocaleDetector(config?: Partial<LocaleDetectionConfig>): LocaleDetector {
  return new LocaleDetector(config);
}
