import { Request, Response, NextFunction } from 'express';
import i18n, { isValidLanguage } from '../config/i18n';
import { logger } from '../utils/logger';

export function i18nMiddleware(req: Request, res: Response, next: NextFunction) {
  // Get language from multiple sources
  let locale = req.query.lang as string ||
               req.cookies?.locale ||
               req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
               'en';

  // Validate and fallback to default if invalid
  if (!isValidLanguage(locale)) {
    locale = 'en';
  }

  // Set locale for this request
  i18n.setLocale(req, locale);
  
  // Store locale in response locals for views
  res.locals.locale = locale;
  res.locals.__ = res.__ = (phrase: string, ...replace: any[]) => {
    return i18n.__(phrase, ...replace);
  };
  res.locals.__n = res.__n = (singular: string, plural: string, count: number) => {
    return i18n.__n(singular, plural, count);
  };

  // Set locale cookie
  res.cookie('locale', locale, {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    httpOnly: true,
    sameSite: 'lax',
  });

  // Set content-language header
  res.setHeader('Content-Language', locale);

  next();
}

// API to get current locale
export function getLocale(req: Request): string {
  return i18n.getLocale(req);
}

// API to set locale
export function setLocale(req: Request, res: Response, locale: string): boolean {
  if (!isValidLanguage(locale)) {
    return false;
  }

  i18n.setLocale(req, locale);
  res.cookie('locale', locale, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
  });

  return true;
}

// Helper to translate in services
export function translate(key: string, locale: string = 'en', ...args: any[]): string {
  const originalLocale = i18n.getLocale();
  i18n.setLocale(locale);
  const translation = i18n.__(key, ...args);
  i18n.setLocale(originalLocale);
  return translation;
}