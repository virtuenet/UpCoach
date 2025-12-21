/**
 * i18n Routes
 *
 * API routes for internationalization and localization services.
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  getTranslationService,
  getLocaleService,
  getTranslationCache,
  getContentTranslationService,
  type TranslationNamespace,
  type PluralForm,
} from '../services/i18n';

const router = Router();

// ============================================================================
// Translation Routes
// ============================================================================

/**
 * Get translation bundle for a locale and namespace
 * GET /api/i18n/translations/:locale/:namespace
 */
router.get('/translations/:locale/:namespace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locale, namespace } = req.params;
    const translationService = getTranslationService();

    const bundle = await translationService.generateBundle(locale, namespace as TranslationNamespace);

    res.json({
      success: true,
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all translations for a locale
 * GET /api/i18n/translations/:locale
 */
router.get('/translations/:locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locale } = req.params;
    const translationService = getTranslationService();

    const namespaces: TranslationNamespace[] = [
      'common',
      'auth',
      'habits',
      'goals',
      'coaching',
      'gamification',
      'settings',
      'errors',
      'notifications',
      'onboarding',
    ];

    const bundles: Record<string, any> = {};
    for (const ns of namespaces) {
      bundles[ns] = await translationService.generateBundle(locale, ns);
    }

    res.json({
      success: true,
      data: {
        locale,
        namespaces: bundles,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Translate a single key
 * POST /api/i18n/translate
 */
router.post('/translate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, locale, params } = req.body;
    const translationService = getTranslationService();

    const translated = await translationService.translate(key, locale, params);

    res.json({
      success: true,
      data: {
        key,
        locale,
        value: translated,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Set/update a translation
 * PUT /api/i18n/translations/:key/:locale
 */
router.put('/translations/:key/:locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, locale } = req.params;
    const { value, pluralForms, isReviewed } = req.body;
    const translationService = getTranslationService();

    let translationValue: string | Record<PluralForm, string>;
    if (pluralForms) {
      translationValue = pluralForms as Record<PluralForm, string>;
    } else {
      translationValue = value;
    }

    const translation = await translationService.setTranslation(key, locale, translationValue);

    res.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark translation as reviewed
 * POST /api/i18n/translations/:key/:locale/review
 */
router.post('/translations/:key/:locale/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, locale } = req.params;
    const { reviewerId } = req.body;
    const translationService = getTranslationService();

    const translation = await translationService.markAsReviewed(key, locale, reviewerId || 'admin');

    res.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get translation statistics
 * GET /api/i18n/stats
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const translationService = getTranslationService();
    const stats = translationService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get locale-specific statistics
 * GET /api/i18n/stats/:locale
 */
router.get('/stats/:locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locale } = req.params;
    const translationService = getTranslationService();
    const stats = translationService.getLocaleStats(locale);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Import translations
 * POST /api/i18n/import
 */
router.post('/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { format, data, locale, namespace, overwrite } = req.body;
    const translationService = getTranslationService();

    const result = await translationService.importTranslations(format, data, {
      locale,
      namespace,
      overwrite: overwrite || false,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Export translations
 * GET /api/i18n/export/:locale
 */
router.get('/export/:locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locale } = req.params;
    const { format = 'json', namespace, includeMetadata } = req.query;
    const translationService = getTranslationService();

    const exported = await translationService.exportTranslations(locale, {
      format: format as any,
      namespace: namespace as TranslationNamespace | undefined,
      includeMetadata: includeMetadata === 'true',
    });

    // Set appropriate content type
    let contentType = 'application/json';
    if (format === 'csv') contentType = 'text/csv';
    if (format === 'xliff') contentType = 'application/xml';
    if (format === 'po') contentType = 'text/x-gettext-translation';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="translations_${locale}.${format}"`
    );
    res.send(exported);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Locale Routes
// ============================================================================

/**
 * Get supported locales
 * GET /api/i18n/locales
 */
router.get('/locales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const localeService = getLocaleService();
    const locales = localeService.getSupportedLocales();

    // Get detailed info for each locale
    const localeDetails = locales.map((code) => localeService.getLocaleInfo(code));

    res.json({
      success: true,
      data: {
        locales: localeDetails,
        default: localeService.getDefaultLocale(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get locale info
 * GET /api/i18n/locales/:code
 */
router.get('/locales/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const localeService = getLocaleService();
    const info = localeService.getLocaleInfo(code);

    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'Locale not found',
      });
    }

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Detect user locale
 * POST /api/i18n/detect-locale
 */
router.post('/detect-locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, acceptLanguage, cookie, ip } = req.body;
    const localeService = getLocaleService();

    // Also check request headers if not provided
    const detection = localeService.detectLocale({
      userId,
      acceptLanguage: acceptLanguage || req.headers['accept-language'],
      cookie: cookie || req.headers.cookie,
      ip: ip || req.ip,
    });

    res.json({
      success: true,
      data: detection,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Set user locale preference
 * PUT /api/i18n/users/:userId/locale
 */
router.put('/users/:userId/locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    const localeService = getLocaleService();

    await localeService.setUserPreferences(userId, preferences);

    res.json({
      success: true,
      message: 'User locale preferences updated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user locale preferences
 * GET /api/i18n/users/:userId/locale
 */
router.get('/users/:userId/locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const localeService = getLocaleService();
    const preferences = await localeService.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Formatting Routes
// ============================================================================

/**
 * Format number
 * POST /api/i18n/format/number
 */
router.post('/format/number', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, locale, options } = req.body;
    const localeService = getLocaleService();
    const formatted = localeService.formatNumber(value, locale, options);

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Format currency
 * POST /api/i18n/format/currency
 */
router.post('/format/currency', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, locale, currency } = req.body;
    const localeService = getLocaleService();
    const formatted = localeService.formatCurrency(value, locale, currency);

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Format date
 * POST /api/i18n/format/date
 */
router.post('/format/date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, locale, format } = req.body;
    const localeService = getLocaleService();
    const formatted = localeService.formatDate(value, locale, format);

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Format time
 * POST /api/i18n/format/time
 */
router.post('/format/time', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, locale, format } = req.body;
    const localeService = getLocaleService();
    const formatted = localeService.formatTime(value, locale, format);

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Format relative time
 * POST /api/i18n/format/relative-time
 */
router.post('/format/relative-time', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, locale } = req.body;
    const localeService = getLocaleService();
    const formatted = localeService.formatRelativeTime(value, locale);

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Cache Routes
// ============================================================================

/**
 * Get cache stats
 * GET /api/i18n/cache/stats
 */
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cache = getTranslationCache();
    const stats = cache.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Warm cache for specific locales
 * POST /api/i18n/cache/warm
 */
router.post('/cache/warm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locales, namespaces } = req.body;
    const cache = getTranslationCache();
    const translationService = getTranslationService();

    const result = await cache.warmCache(
      async (locale: string, namespace: string) => {
        return translationService.generateBundle(locale, namespace as TranslationNamespace);
      },
      locales,
      namespaces
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Clear cache
 * DELETE /api/i18n/cache
 */
router.delete('/cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pattern } = req.query;
    const cache = getTranslationCache();

    if (pattern) {
      await cache.invalidatePattern(pattern as string);
    } else {
      await cache.clearAll();
    }

    res.json({
      success: true,
      message: 'Cache cleared',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Content Translation Routes
// ============================================================================

/**
 * Request content translation
 * POST /api/i18n/content/translate
 */
router.post('/content/translate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId, contentType, sourceText, sourceLocale, targetLocales, priority, useGlossary } =
      req.body;
    const contentService = getContentTranslationService();

    const job = await contentService.requestTranslation({
      contentId,
      contentType,
      sourceText,
      sourceLocale,
      targetLocales,
      priority: priority || 'normal',
      requestedBy: 'admin', // TODO: Get from auth
      options: {
        useGlossary: useGlossary !== false,
        useTranslationMemory: true,
      },
    });

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get content translation
 * GET /api/i18n/content/:contentId/:locale
 */
router.get('/content/:contentId/:locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId, locale } = req.params;
    const contentService = getContentTranslationService();

    const translation = await contentService.getTranslation(contentId, locale);

    if (!translation) {
      return res.status(404).json({
        success: false,
        error: 'Translation not found',
      });
    }

    res.json({
      success: true,
      data: { translation },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get translation job status
 * GET /api/i18n/content/jobs/:jobId
 */
router.get('/content/jobs/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const contentService = getContentTranslationService();

    const job = await contentService.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Review content translation
 * POST /api/i18n/content/:contentId/:locale/review
 */
router.post('/content/:contentId/:locale/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId, locale } = req.params;
    const { approved, revisedText, feedback } = req.body;
    const contentService = getContentTranslationService();

    await contentService.reviewTranslation(contentId, locale, {
      approved,
      revisedText,
      feedback,
      reviewedBy: 'admin', // TODO: Get from auth
    });

    res.json({
      success: true,
      message: 'Translation reviewed',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Glossary Routes
// ============================================================================

/**
 * Get all glossary terms
 * GET /api/i18n/glossary
 */
router.get('/glossary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contentService = getContentTranslationService();
    const terms = contentService.getGlossaryTerms();

    res.json({
      success: true,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Add glossary term
 * POST /api/i18n/glossary
 */
router.post('/glossary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceTerm, translations, description, caseSensitive, category } = req.body;
    const contentService = getContentTranslationService();

    const term = await contentService.addGlossaryTerm(sourceTerm, translations, {
      description,
      caseSensitive,
      category,
    });

    res.json({
      success: true,
      data: term,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update glossary term
 * PUT /api/i18n/glossary/:termId
 */
router.put('/glossary/:termId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { termId } = req.params;
    const updates = req.body;
    const contentService = getContentTranslationService();

    const term = await contentService.updateGlossaryTerm(termId, updates);

    res.json({
      success: true,
      data: term,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete glossary term
 * DELETE /api/i18n/glossary/:termId
 */
router.delete('/glossary/:termId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { termId } = req.params;
    const contentService = getContentTranslationService();

    await contentService.deleteGlossaryTerm(termId);

    res.json({
      success: true,
      message: 'Glossary term deleted',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Translation Memory Routes
// ============================================================================

/**
 * Search translation memory
 * POST /api/i18n/translation-memory/search
 */
router.post('/translation-memory/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceText, sourceLocale, targetLocale, threshold } = req.body;
    const contentService = getContentTranslationService();

    const matches = await contentService.searchTranslationMemory(
      sourceText,
      sourceLocale,
      targetLocale,
      threshold
    );

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Add to translation memory
 * POST /api/i18n/translation-memory
 */
router.post('/translation-memory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceText, sourceLocale, targetText, targetLocale, context, contentType } = req.body;
    const contentService = getContentTranslationService();

    await contentService.addToTranslationMemory({
      sourceText,
      sourceLocale,
      targetText,
      targetLocale,
      context,
      contentType,
    });

    res.json({
      success: true,
      message: 'Added to translation memory',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// RTL Helper Routes
// ============================================================================

/**
 * Check if locale is RTL
 * GET /api/i18n/rtl/:locale
 */
router.get('/rtl/:locale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locale } = req.params;
    const localeService = getLocaleService();

    res.json({
      success: true,
      data: {
        locale,
        isRTL: localeService.isRTL(locale),
        direction: localeService.getTextDirection(locale),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
