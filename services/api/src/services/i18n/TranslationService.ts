/**
 * Translation Service
 *
 * Core translation management service that handles:
 * - Translation key registration and management
 * - Multi-language translation storage
 * - Translation versioning and history
 * - Import/export functionality
 * - Translation quality metrics
 */

import { EventEmitter } from 'events';

// Types
export type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'dashboard'
  | 'habits'
  | 'goals'
  | 'coaching'
  | 'gamification'
  | 'settings'
  | 'notifications'
  | 'errors'
  | 'validation'
  | 'onboarding'
  | 'billing'
  | 'admin'
  | 'email'
  | 'push';

export type TranslationStatus = 'pending' | 'translated' | 'reviewed' | 'approved' | 'deprecated';

export type PluralForm = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface TranslationKey {
  id: string;
  key: string;
  namespace: TranslationNamespace;
  description?: string;
  context?: string;
  maxLength?: number;
  placeholders?: TranslationPlaceholder[];
  pluralForms?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
  isDeprecated?: boolean;
  deprecatedAt?: Date;
  replacedBy?: string;
}

export interface TranslationPlaceholder {
  name: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percent';
  description?: string;
  example?: string;
  required?: boolean;
}

export interface Translation {
  id: string;
  keyId: string;
  locale: string;
  value: string;
  pluralForms?: Record<PluralForm, string>;
  status: TranslationStatus;
  translatedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  translatedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  qualityScore?: number;
}

export interface TranslationHistory {
  id: string;
  translationId: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  version: number;
}

export interface TranslationBundle {
  locale: string;
  namespace: TranslationNamespace;
  translations: Record<string, string | Record<PluralForm, string>>;
  version: string;
  generatedAt: Date;
  checksum: string;
}

export interface ImportResult {
  locale: string;
  namespace: TranslationNamespace;
  imported: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  key: string;
  error: string;
  line?: number;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xliff' | 'po' | 'arb';
  locale: string;
  namespaces?: TranslationNamespace[];
  includeMetadata?: boolean;
  flattenKeys?: boolean;
  onlyApproved?: boolean;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: Record<string, number>;
  reviewedKeys: Record<string, number>;
  approvedKeys: Record<string, number>;
  completionRate: Record<string, number>;
  qualityScore: Record<string, number>;
  recentChanges: number;
  deprecatedKeys: number;
}

export interface TranslationServiceConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  enableVersioning: boolean;
  maxHistoryVersions: number;
  autoApproveThreshold?: number;
  qualityCheckEnabled: boolean;
}

// Singleton instance
let instance: TranslationService | null = null;

/**
 * Translation Service implementation
 */
export class TranslationService extends EventEmitter {
  private config: TranslationServiceConfig;
  private keys: Map<string, TranslationKey> = new Map();
  private translations: Map<string, Translation> = new Map();
  private history: TranslationHistory[] = [];
  private bundles: Map<string, TranslationBundle> = new Map();

  constructor(config: Partial<TranslationServiceConfig> = {}) {
    super();
    this.config = {
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko', 'ar', 'hi'],
      fallbackLocale: 'en',
      enableVersioning: true,
      maxHistoryVersions: 50,
      qualityCheckEnabled: true,
      ...config,
    };

    this.initializeDefaultKeys();
  }

  /**
   * Initialize default translation keys
   */
  private initializeDefaultKeys(): void {
    const defaultKeys: Partial<TranslationKey>[] = [
      // Common
      { key: 'common.save', namespace: 'common', description: 'Save button text' },
      { key: 'common.cancel', namespace: 'common', description: 'Cancel button text' },
      { key: 'common.delete', namespace: 'common', description: 'Delete button text' },
      { key: 'common.edit', namespace: 'common', description: 'Edit button text' },
      { key: 'common.loading', namespace: 'common', description: 'Loading indicator text' },
      { key: 'common.error', namespace: 'common', description: 'Generic error message' },
      { key: 'common.success', namespace: 'common', description: 'Generic success message' },
      { key: 'common.confirm', namespace: 'common', description: 'Confirm action text' },
      { key: 'common.search', namespace: 'common', description: 'Search placeholder' },
      { key: 'common.noResults', namespace: 'common', description: 'No results found message' },

      // Auth
      { key: 'auth.login', namespace: 'auth', description: 'Login button text' },
      { key: 'auth.logout', namespace: 'auth', description: 'Logout button text' },
      { key: 'auth.register', namespace: 'auth', description: 'Register button text' },
      { key: 'auth.forgotPassword', namespace: 'auth', description: 'Forgot password link text' },
      { key: 'auth.resetPassword', namespace: 'auth', description: 'Reset password title' },
      { key: 'auth.emailPlaceholder', namespace: 'auth', description: 'Email input placeholder' },
      { key: 'auth.passwordPlaceholder', namespace: 'auth', description: 'Password input placeholder' },
      { key: 'auth.invalidCredentials', namespace: 'auth', description: 'Invalid login error' },
      { key: 'auth.sessionExpired', namespace: 'auth', description: 'Session expired message' },
      { key: 'auth.welcomeBack', namespace: 'auth', description: 'Welcome back greeting', placeholders: [{ name: 'name', type: 'string', required: true }] },

      // Habits
      { key: 'habits.title', namespace: 'habits', description: 'Habits section title' },
      { key: 'habits.createNew', namespace: 'habits', description: 'Create new habit button' },
      { key: 'habits.complete', namespace: 'habits', description: 'Complete habit button' },
      { key: 'habits.streak', namespace: 'habits', description: 'Streak label', pluralForms: true },
      { key: 'habits.streakDays', namespace: 'habits', description: 'Streak days count', placeholders: [{ name: 'count', type: 'number', required: true }], pluralForms: true },
      { key: 'habits.reminder', namespace: 'habits', description: 'Reminder setting' },
      { key: 'habits.frequency', namespace: 'habits', description: 'Frequency setting' },
      { key: 'habits.progress', namespace: 'habits', description: 'Progress label' },
      { key: 'habits.noHabits', namespace: 'habits', description: 'Empty state message' },
      { key: 'habits.completedToday', namespace: 'habits', description: 'Completed today message' },

      // Goals
      { key: 'goals.title', namespace: 'goals', description: 'Goals section title' },
      { key: 'goals.createNew', namespace: 'goals', description: 'Create new goal button' },
      { key: 'goals.deadline', namespace: 'goals', description: 'Deadline label' },
      { key: 'goals.progress', namespace: 'goals', description: 'Progress percentage', placeholders: [{ name: 'percent', type: 'percent', required: true }] },
      { key: 'goals.milestone', namespace: 'goals', description: 'Milestone label', pluralForms: true },
      { key: 'goals.completed', namespace: 'goals', description: 'Goal completed message' },
      { key: 'goals.overdue', namespace: 'goals', description: 'Goal overdue warning' },
      { key: 'goals.noGoals', namespace: 'goals', description: 'Empty state message' },

      // Coaching
      { key: 'coaching.title', namespace: 'coaching', description: 'Coaching section title' },
      { key: 'coaching.findCoach', namespace: 'coaching', description: 'Find coach button' },
      { key: 'coaching.bookSession', namespace: 'coaching', description: 'Book session button' },
      { key: 'coaching.upcomingSession', namespace: 'coaching', description: 'Upcoming session label' },
      { key: 'coaching.sessionWith', namespace: 'coaching', description: 'Session with coach', placeholders: [{ name: 'coachName', type: 'string', required: true }] },
      { key: 'coaching.rateSession', namespace: 'coaching', description: 'Rate session prompt' },
      { key: 'coaching.aiCoach', namespace: 'coaching', description: 'AI coach title' },
      { key: 'coaching.askQuestion', namespace: 'coaching', description: 'Ask question placeholder' },

      // Gamification
      { key: 'gamification.points', namespace: 'gamification', description: 'Points label', pluralForms: true },
      { key: 'gamification.level', namespace: 'gamification', description: 'Level label', placeholders: [{ name: 'level', type: 'number', required: true }] },
      { key: 'gamification.badge', namespace: 'gamification', description: 'Badge label', pluralForms: true },
      { key: 'gamification.achievement', namespace: 'gamification', description: 'Achievement unlocked', placeholders: [{ name: 'name', type: 'string', required: true }] },
      { key: 'gamification.leaderboard', namespace: 'gamification', description: 'Leaderboard title' },
      { key: 'gamification.rank', namespace: 'gamification', description: 'Rank label', placeholders: [{ name: 'rank', type: 'number', required: true }] },

      // Settings
      { key: 'settings.title', namespace: 'settings', description: 'Settings title' },
      { key: 'settings.profile', namespace: 'settings', description: 'Profile section' },
      { key: 'settings.notifications', namespace: 'settings', description: 'Notifications section' },
      { key: 'settings.privacy', namespace: 'settings', description: 'Privacy section' },
      { key: 'settings.language', namespace: 'settings', description: 'Language selection' },
      { key: 'settings.theme', namespace: 'settings', description: 'Theme selection' },
      { key: 'settings.darkMode', namespace: 'settings', description: 'Dark mode toggle' },
      { key: 'settings.account', namespace: 'settings', description: 'Account section' },
      { key: 'settings.deleteAccount', namespace: 'settings', description: 'Delete account button' },

      // Notifications
      { key: 'notifications.title', namespace: 'notifications', description: 'Notifications title' },
      { key: 'notifications.markRead', namespace: 'notifications', description: 'Mark as read' },
      { key: 'notifications.markAllRead', namespace: 'notifications', description: 'Mark all as read' },
      { key: 'notifications.empty', namespace: 'notifications', description: 'No notifications message' },

      // Errors
      { key: 'errors.network', namespace: 'errors', description: 'Network error message' },
      { key: 'errors.server', namespace: 'errors', description: 'Server error message' },
      { key: 'errors.notFound', namespace: 'errors', description: 'Resource not found' },
      { key: 'errors.unauthorized', namespace: 'errors', description: 'Unauthorized access' },
      { key: 'errors.forbidden', namespace: 'errors', description: 'Forbidden action' },
      { key: 'errors.validation', namespace: 'errors', description: 'Validation error' },
      { key: 'errors.tryAgain', namespace: 'errors', description: 'Try again button' },

      // Validation
      { key: 'validation.required', namespace: 'validation', description: 'Required field error' },
      { key: 'validation.email', namespace: 'validation', description: 'Invalid email error' },
      { key: 'validation.minLength', namespace: 'validation', description: 'Min length error', placeholders: [{ name: 'min', type: 'number', required: true }] },
      { key: 'validation.maxLength', namespace: 'validation', description: 'Max length error', placeholders: [{ name: 'max', type: 'number', required: true }] },
      { key: 'validation.passwordMatch', namespace: 'validation', description: 'Password mismatch error' },
      { key: 'validation.invalidFormat', namespace: 'validation', description: 'Invalid format error' },

      // Onboarding
      { key: 'onboarding.welcome', namespace: 'onboarding', description: 'Welcome screen title' },
      { key: 'onboarding.getStarted', namespace: 'onboarding', description: 'Get started button' },
      { key: 'onboarding.skip', namespace: 'onboarding', description: 'Skip button' },
      { key: 'onboarding.next', namespace: 'onboarding', description: 'Next button' },
      { key: 'onboarding.finish', namespace: 'onboarding', description: 'Finish button' },

      // Billing
      { key: 'billing.subscription', namespace: 'billing', description: 'Subscription title' },
      { key: 'billing.upgrade', namespace: 'billing', description: 'Upgrade button' },
      { key: 'billing.currentPlan', namespace: 'billing', description: 'Current plan label' },
      { key: 'billing.price', namespace: 'billing', description: 'Price display', placeholders: [{ name: 'amount', type: 'currency', required: true }] },
      { key: 'billing.perMonth', namespace: 'billing', description: 'Per month suffix' },
      { key: 'billing.perYear', namespace: 'billing', description: 'Per year suffix' },
    ];

    for (const keyData of defaultKeys) {
      const key: TranslationKey = {
        id: this.generateId(),
        key: keyData.key!,
        namespace: keyData.namespace!,
        description: keyData.description,
        placeholders: keyData.placeholders,
        pluralForms: keyData.pluralForms,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };
      this.keys.set(key.key, key);
    }

    // Initialize default English translations
    this.initializeEnglishTranslations();
  }

  /**
   * Initialize default English translations
   */
  private initializeEnglishTranslations(): void {
    const englishTranslations: Record<string, string | Record<PluralForm, string>> = {
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success!',
      'common.confirm': 'Confirm',
      'common.search': 'Search...',
      'common.noResults': 'No results found',

      // Auth
      'auth.login': 'Log In',
      'auth.logout': 'Log Out',
      'auth.register': 'Sign Up',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.resetPassword': 'Reset Password',
      'auth.emailPlaceholder': 'Enter your email',
      'auth.passwordPlaceholder': 'Enter your password',
      'auth.invalidCredentials': 'Invalid email or password',
      'auth.sessionExpired': 'Your session has expired. Please log in again.',
      'auth.welcomeBack': 'Welcome back, {{name}}!',

      // Habits
      'habits.title': 'My Habits',
      'habits.createNew': 'Create New Habit',
      'habits.complete': 'Mark Complete',
      'habits.streak': { zero: 'No streak', one: '{{count}} day streak', other: '{{count}} day streak' },
      'habits.streakDays': { zero: '0 days', one: '1 day', other: '{{count}} days' },
      'habits.reminder': 'Reminder',
      'habits.frequency': 'Frequency',
      'habits.progress': 'Progress',
      'habits.noHabits': 'No habits yet. Create your first habit to get started!',
      'habits.completedToday': 'Great job! You completed this habit today.',

      // Goals
      'goals.title': 'My Goals',
      'goals.createNew': 'Create New Goal',
      'goals.deadline': 'Deadline',
      'goals.progress': '{{percent}} complete',
      'goals.milestone': { one: '1 milestone', other: '{{count}} milestones' },
      'goals.completed': 'Goal completed! Congratulations!',
      'goals.overdue': 'This goal is overdue',
      'goals.noGoals': 'No goals yet. Set your first goal to start your journey!',

      // Coaching
      'coaching.title': 'Coaching',
      'coaching.findCoach': 'Find a Coach',
      'coaching.bookSession': 'Book Session',
      'coaching.upcomingSession': 'Upcoming Session',
      'coaching.sessionWith': 'Session with {{coachName}}',
      'coaching.rateSession': 'How was your session?',
      'coaching.aiCoach': 'AI Coach',
      'coaching.askQuestion': 'Ask me anything...',

      // Gamification
      'gamification.points': { one: '1 point', other: '{{count}} points' },
      'gamification.level': 'Level {{level}}',
      'gamification.badge': { one: '1 badge', other: '{{count}} badges' },
      'gamification.achievement': 'Achievement unlocked: {{name}}!',
      'gamification.leaderboard': 'Leaderboard',
      'gamification.rank': 'Rank #{{rank}}',

      // Settings
      'settings.title': 'Settings',
      'settings.profile': 'Profile',
      'settings.notifications': 'Notifications',
      'settings.privacy': 'Privacy',
      'settings.language': 'Language',
      'settings.theme': 'Theme',
      'settings.darkMode': 'Dark Mode',
      'settings.account': 'Account',
      'settings.deleteAccount': 'Delete Account',

      // Notifications
      'notifications.title': 'Notifications',
      'notifications.markRead': 'Mark as read',
      'notifications.markAllRead': 'Mark all as read',
      'notifications.empty': 'No notifications',

      // Errors
      'errors.network': 'Network error. Please check your connection.',
      'errors.server': 'Server error. Please try again later.',
      'errors.notFound': 'The requested resource was not found.',
      'errors.unauthorized': 'Please log in to continue.',
      'errors.forbidden': 'You do not have permission to perform this action.',
      'errors.validation': 'Please check your input and try again.',
      'errors.tryAgain': 'Try Again',

      // Validation
      'validation.required': 'This field is required',
      'validation.email': 'Please enter a valid email address',
      'validation.minLength': 'Must be at least {{min}} characters',
      'validation.maxLength': 'Must be no more than {{max}} characters',
      'validation.passwordMatch': 'Passwords do not match',
      'validation.invalidFormat': 'Invalid format',

      // Onboarding
      'onboarding.welcome': 'Welcome to UpCoach',
      'onboarding.getStarted': 'Get Started',
      'onboarding.skip': 'Skip',
      'onboarding.next': 'Next',
      'onboarding.finish': 'Finish',

      // Billing
      'billing.subscription': 'Subscription',
      'billing.upgrade': 'Upgrade',
      'billing.currentPlan': 'Current Plan',
      'billing.price': '{{amount}}',
      'billing.perMonth': '/month',
      'billing.perYear': '/year',
    };

    for (const [key, value] of Object.entries(englishTranslations)) {
      const keyData = this.keys.get(key);
      if (keyData) {
        const translation: Translation = {
          id: this.generateId(),
          keyId: keyData.id,
          locale: 'en',
          value: typeof value === 'string' ? value : '',
          pluralForms: typeof value === 'object' ? value as Record<PluralForm, string> : undefined,
          status: 'approved',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          approvedAt: new Date(),
          qualityScore: 100,
        };
        this.translations.set(`${key}:en`, translation);
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register a new translation key
   */
  async registerKey(data: Omit<TranslationKey, 'id' | 'createdAt' | 'updatedAt'>): Promise<TranslationKey> {
    if (this.keys.has(data.key)) {
      throw new Error(`Translation key already exists: ${data.key}`);
    }

    const key: TranslationKey = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keys.set(key.key, key);
    this.emit('key:registered', key);

    return key;
  }

  /**
   * Update a translation key
   */
  async updateKey(keyName: string, updates: Partial<TranslationKey>): Promise<TranslationKey> {
    const key = this.keys.get(keyName);
    if (!key) {
      throw new Error(`Translation key not found: ${keyName}`);
    }

    const updated: TranslationKey = {
      ...key,
      ...updates,
      id: key.id,
      key: key.key,
      createdAt: key.createdAt,
      updatedAt: new Date(),
    };

    this.keys.set(keyName, updated);
    this.emit('key:updated', updated);

    return updated;
  }

  /**
   * Deprecate a translation key
   */
  async deprecateKey(keyName: string, replacedBy?: string): Promise<TranslationKey> {
    const key = this.keys.get(keyName);
    if (!key) {
      throw new Error(`Translation key not found: ${keyName}`);
    }

    const updated: TranslationKey = {
      ...key,
      isDeprecated: true,
      deprecatedAt: new Date(),
      replacedBy,
      updatedAt: new Date(),
    };

    this.keys.set(keyName, updated);
    this.emit('key:deprecated', updated);

    return updated;
  }

  /**
   * Get a translation key
   */
  async getKey(keyName: string): Promise<TranslationKey | null> {
    return this.keys.get(keyName) || null;
  }

  /**
   * List translation keys
   */
  async listKeys(options: {
    namespace?: TranslationNamespace;
    search?: string;
    includeDeprecated?: boolean;
    tags?: string[];
  } = {}): Promise<TranslationKey[]> {
    let keys = Array.from(this.keys.values());

    if (options.namespace) {
      keys = keys.filter(k => k.namespace === options.namespace);
    }

    if (!options.includeDeprecated) {
      keys = keys.filter(k => !k.isDeprecated);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      keys = keys.filter(k =>
        k.key.toLowerCase().includes(search) ||
        k.description?.toLowerCase().includes(search)
      );
    }

    if (options.tags?.length) {
      keys = keys.filter(k =>
        options.tags!.some(tag => k.tags?.includes(tag))
      );
    }

    return keys;
  }

  /**
   * Set a translation
   */
  async setTranslation(
    keyName: string,
    locale: string,
    value: string | Record<PluralForm, string>,
    options: {
      translatedBy?: string;
      notes?: string;
      status?: TranslationStatus;
    } = {}
  ): Promise<Translation> {
    const key = this.keys.get(keyName);
    if (!key) {
      throw new Error(`Translation key not found: ${keyName}`);
    }

    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    const existing = this.translations.get(`${keyName}:${locale}`);
    const version = existing ? existing.version + 1 : 1;

    // Save to history if versioning enabled
    if (this.config.enableVersioning && existing) {
      this.history.push({
        id: this.generateId(),
        translationId: existing.id,
        previousValue: typeof existing.value === 'string' ? existing.value : JSON.stringify(existing.pluralForms),
        newValue: typeof value === 'string' ? value : JSON.stringify(value),
        changedBy: options.translatedBy || 'system',
        changedAt: new Date(),
        version: existing.version,
      });

      // Trim history if needed
      if (this.history.length > this.config.maxHistoryVersions) {
        this.history = this.history.slice(-this.config.maxHistoryVersions);
      }
    }

    const translation: Translation = {
      id: existing?.id || this.generateId(),
      keyId: key.id,
      locale,
      value: typeof value === 'string' ? value : '',
      pluralForms: typeof value === 'object' ? value : undefined,
      status: options.status || 'translated',
      translatedBy: options.translatedBy,
      translatedAt: new Date(),
      version,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
      notes: options.notes,
      qualityScore: this.calculateQualityScore(key, value),
    };

    this.translations.set(`${keyName}:${locale}`, translation);
    this.emit('translation:set', translation);

    // Invalidate bundle cache
    this.bundles.delete(`${locale}:${key.namespace}`);

    return translation;
  }

  /**
   * Get a translation
   */
  async getTranslation(keyName: string, locale: string): Promise<Translation | null> {
    // Try exact locale
    let translation = this.translations.get(`${keyName}:${locale}`);

    // Try base locale (e.g., 'en' from 'en-US')
    if (!translation && locale.includes('-')) {
      const baseLocale = locale.split('-')[0];
      translation = this.translations.get(`${keyName}:${baseLocale}`);
    }

    // Try fallback locale
    if (!translation && locale !== this.config.fallbackLocale) {
      translation = this.translations.get(`${keyName}:${this.config.fallbackLocale}`);
    }

    return translation || null;
  }

  /**
   * Get translated value with interpolation
   */
  async translate(
    keyName: string,
    locale: string,
    params?: Record<string, any>
  ): Promise<string> {
    const translation = await this.getTranslation(keyName, locale);

    if (!translation) {
      console.warn(`Missing translation: ${keyName} for locale ${locale}`);
      return keyName;
    }

    let value: string;

    // Handle plural forms
    if (translation.pluralForms && params?.count !== undefined) {
      const pluralForm = this.getPluralForm(locale, params.count);
      value = translation.pluralForms[pluralForm] || translation.pluralForms.other || translation.value;
    } else {
      value = translation.value;
    }

    // Interpolate placeholders
    if (params) {
      value = this.interpolate(value, params);
    }

    return value;
  }

  /**
   * Get plural form for a number
   */
  private getPluralForm(locale: string, count: number): PluralForm {
    // Simplified plural rules for common locales
    const baseLocale = locale.split('-')[0];

    switch (baseLocale) {
      case 'ar': // Arabic
        if (count === 0) return 'zero';
        if (count === 1) return 'one';
        if (count === 2) return 'two';
        if (count % 100 >= 3 && count % 100 <= 10) return 'few';
        if (count % 100 >= 11) return 'many';
        return 'other';

      case 'ja':
      case 'ko':
      case 'zh': // East Asian (no plural)
        return 'other';

      case 'ru': // Russian
      case 'uk': // Ukrainian
        if (count % 10 === 1 && count % 100 !== 11) return 'one';
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'few';
        return 'many';

      default: // English and most Western languages
        if (count === 0) return 'zero';
        if (count === 1) return 'one';
        return 'other';
    }
  }

  /**
   * Interpolate placeholders in translation
   */
  private interpolate(value: string, params: Record<string, any>): string {
    return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * Calculate translation quality score
   */
  private calculateQualityScore(key: TranslationKey, value: string | Record<PluralForm, string>): number {
    if (!this.config.qualityCheckEnabled) {
      return 100;
    }

    let score = 100;
    const text = typeof value === 'string' ? value : Object.values(value).join(' ');

    // Check max length
    if (key.maxLength && text.length > key.maxLength) {
      score -= 20;
    }

    // Check placeholders
    if (key.placeholders) {
      for (const placeholder of key.placeholders) {
        if (placeholder.required && !text.includes(`{{${placeholder.name}}}`)) {
          score -= 15;
        }
      }
    }

    // Check plural forms
    if (key.pluralForms && typeof value === 'object') {
      const forms = value as Record<PluralForm, string>;
      if (!forms.other) {
        score -= 10;
      }
    }

    // Check for empty or whitespace-only
    if (!text.trim()) {
      score = 0;
    }

    return Math.max(0, score);
  }

  /**
   * Review a translation
   */
  async reviewTranslation(
    keyName: string,
    locale: string,
    reviewedBy: string,
    approved: boolean,
    notes?: string
  ): Promise<Translation> {
    const translation = this.translations.get(`${keyName}:${locale}`);
    if (!translation) {
      throw new Error(`Translation not found: ${keyName} for ${locale}`);
    }

    const updated: Translation = {
      ...translation,
      status: approved ? 'reviewed' : 'pending',
      reviewedBy,
      reviewedAt: new Date(),
      notes: notes || translation.notes,
      updatedAt: new Date(),
    };

    this.translations.set(`${keyName}:${locale}`, updated);
    this.emit('translation:reviewed', updated);

    return updated;
  }

  /**
   * Approve a translation
   */
  async approveTranslation(
    keyName: string,
    locale: string,
    approvedBy: string
  ): Promise<Translation> {
    const translation = this.translations.get(`${keyName}:${locale}`);
    if (!translation) {
      throw new Error(`Translation not found: ${keyName} for ${locale}`);
    }

    const updated: Translation = {
      ...translation,
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    this.translations.set(`${keyName}:${locale}`, updated);
    this.emit('translation:approved', updated);

    // Invalidate bundle cache
    const key = this.keys.get(keyName);
    if (key) {
      this.bundles.delete(`${locale}:${key.namespace}`);
    }

    return updated;
  }

  /**
   * Get translation history
   */
  async getHistory(translationId: string): Promise<TranslationHistory[]> {
    return this.history.filter(h => h.translationId === translationId);
  }

  /**
   * Generate translation bundle
   */
  async generateBundle(
    locale: string,
    namespace: TranslationNamespace,
    onlyApproved: boolean = true
  ): Promise<TranslationBundle> {
    const cacheKey = `${locale}:${namespace}`;

    if (this.bundles.has(cacheKey)) {
      return this.bundles.get(cacheKey)!;
    }

    const keys = Array.from(this.keys.values()).filter(k => k.namespace === namespace);
    const translations: Record<string, string | Record<PluralForm, string>> = {};

    for (const key of keys) {
      const translation = this.translations.get(`${key.key}:${locale}`);

      if (translation && (!onlyApproved || translation.status === 'approved')) {
        if (translation.pluralForms) {
          translations[key.key] = translation.pluralForms;
        } else {
          translations[key.key] = translation.value;
        }
      }
    }

    const bundle: TranslationBundle = {
      locale,
      namespace,
      translations,
      version: this.generateBundleVersion(),
      generatedAt: new Date(),
      checksum: this.generateChecksum(translations),
    };

    this.bundles.set(cacheKey, bundle);
    return bundle;
  }

  /**
   * Generate bundle version
   */
  private generateBundleVersion(): string {
    return `1.0.${Date.now()}`;
  }

  /**
   * Generate checksum for translations
   */
  private generateChecksum(translations: Record<string, any>): string {
    const str = JSON.stringify(translations);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Export translations
   */
  async export(options: ExportOptions): Promise<string> {
    const keys = options.namespaces
      ? Array.from(this.keys.values()).filter(k => options.namespaces!.includes(k.namespace))
      : Array.from(this.keys.values());

    const data: Record<string, any> = {};

    for (const key of keys) {
      const translation = this.translations.get(`${key.key}:${options.locale}`);

      if (translation && (!options.onlyApproved || translation.status === 'approved')) {
        if (options.flattenKeys) {
          data[key.key] = translation.pluralForms || translation.value;
        } else {
          const parts = key.key.split('.');
          let current = data;
          for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = current[parts[i]] || {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = translation.pluralForms || translation.value;
        }

        if (options.includeMetadata) {
          data[`_meta_${key.key}`] = {
            description: key.description,
            placeholders: key.placeholders,
            status: translation.status,
            updatedAt: translation.updatedAt,
          };
        }
      }
    }

    switch (options.format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'arb': // Flutter ARB format
        return this.exportToARB(options.locale, data);

      case 'csv':
        return this.exportToCSV(options.locale, keys);

      case 'xliff':
        return this.exportToXLIFF(options.locale, keys);

      case 'po':
        return this.exportToPO(options.locale, keys);

      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Export to ARB format for Flutter
   */
  private exportToARB(locale: string, data: Record<string, any>): string {
    const arb: Record<string, any> = {
      '@@locale': locale,
      '@@last_modified': new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith('_meta_')) {
        const safeKey = key.replace(/\./g, '_');
        arb[safeKey] = typeof value === 'string' ? value : JSON.stringify(value);

        const metaKey = `_meta_${key}`;
        if (data[metaKey]) {
          arb[`@${safeKey}`] = {
            description: data[metaKey].description,
            placeholders: data[metaKey].placeholders?.reduce((acc: any, p: TranslationPlaceholder) => {
              acc[p.name] = { type: p.type, example: p.example };
              return acc;
            }, {}),
          };
        }
      }
    }

    return JSON.stringify(arb, null, 2);
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(locale: string, keys: TranslationKey[]): string {
    const rows: string[] = ['key,value,description,status'];

    for (const key of keys) {
      const translation = this.translations.get(`${key.key}:${locale}`);
      if (translation) {
        const value = translation.pluralForms ? JSON.stringify(translation.pluralForms) : translation.value;
        rows.push(`"${key.key}","${value.replace(/"/g, '""')}","${key.description || ''}","${translation.status}"`);
      }
    }

    return rows.join('\n');
  }

  /**
   * Export to XLIFF format
   */
  private exportToXLIFF(locale: string, keys: TranslationKey[]): string {
    const units = keys.map(key => {
      const translation = this.translations.get(`${key.key}:${locale}`);
      const source = this.translations.get(`${key.key}:${this.config.defaultLocale}`);

      return `    <trans-unit id="${key.key}">
      <source>${this.escapeXML(source?.value || key.key)}</source>
      <target state="${translation?.status || 'new'}">${this.escapeXML(translation?.value || '')}</target>
      <note>${this.escapeXML(key.description || '')}</note>
    </trans-unit>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="${this.config.defaultLocale}" target-language="${locale}" datatype="plaintext">
    <body>
${units}
    </body>
  </file>
</xliff>`;
  }

  /**
   * Export to PO format
   */
  private exportToPO(locale: string, keys: TranslationKey[]): string {
    const entries = keys.map(key => {
      const translation = this.translations.get(`${key.key}:${locale}`);
      const source = this.translations.get(`${key.key}:${this.config.defaultLocale}`);

      return `#: ${key.key}
#. ${key.description || ''}
msgid "${this.escapePO(source?.value || key.key)}"
msgstr "${this.escapePO(translation?.value || '')}"`;
    }).join('\n\n');

    return `# UpCoach Translation File
# Language: ${locale}
# Generated: ${new Date().toISOString()}

${entries}`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Escape PO special characters
   */
  private escapePO(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }

  /**
   * Import translations
   */
  async import(
    locale: string,
    namespace: TranslationNamespace,
    data: string,
    format: 'json' | 'csv' | 'arb',
    importedBy?: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      locale,
      namespace,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      let translations: Record<string, string>;

      switch (format) {
        case 'json':
        case 'arb':
          translations = this.parseJSON(data, namespace);
          break;
        case 'csv':
          translations = this.parseCSV(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      for (const [key, value] of Object.entries(translations)) {
        try {
          const existing = this.translations.get(`${key}:${locale}`);

          await this.setTranslation(key, locale, value, {
            translatedBy: importedBy,
            status: 'pending',
          });

          if (existing) {
            result.updated++;
          } else {
            result.imported++;
          }
        } catch (error) {
          result.errors.push({
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          result.skipped++;
        }
      }
    } catch (error) {
      result.errors.push({
        key: '*',
        error: error instanceof Error ? error.message : 'Parse error',
      });
    }

    this.emit('translations:imported', result);
    return result;
  }

  /**
   * Parse JSON/ARB data
   */
  private parseJSON(data: string, namespace: TranslationNamespace): Record<string, string> {
    const parsed = JSON.parse(data);
    const result: Record<string, string> = {};

    const processObject = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('@@') || key.startsWith('@')) continue;

        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'string') {
          result[fullKey] = value;
        } else if (typeof value === 'object' && value !== null) {
          // Check if it's a plural form object
          if ('one' in value || 'other' in value) {
            result[fullKey] = JSON.stringify(value);
          } else {
            processObject(value, fullKey);
          }
        }
      }
    };

    processObject(parsed);
    return result;
  }

  /**
   * Parse CSV data
   */
  private parseCSV(data: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = data.split('\n');

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const match = line.match(/^"([^"]+)","([^"]*)"(?:,"[^"]*")*$/);
      if (match) {
        result[match[1]] = match[2].replace(/""/g, '"');
      }
    }

    return result;
  }

  /**
   * Get translation statistics
   */
  async getStats(): Promise<TranslationStats> {
    const totalKeys = this.keys.size;
    const translatedKeys: Record<string, number> = {};
    const reviewedKeys: Record<string, number> = {};
    const approvedKeys: Record<string, number> = {};
    const completionRate: Record<string, number> = {};
    const qualityScores: Record<string, number[]> = {};

    for (const locale of this.config.supportedLocales) {
      translatedKeys[locale] = 0;
      reviewedKeys[locale] = 0;
      approvedKeys[locale] = 0;
      qualityScores[locale] = [];
    }

    for (const [compositeKey, translation] of this.translations) {
      const [, locale] = compositeKey.split(':');

      if (['translated', 'reviewed', 'approved'].includes(translation.status)) {
        translatedKeys[locale]++;
      }
      if (['reviewed', 'approved'].includes(translation.status)) {
        reviewedKeys[locale]++;
      }
      if (translation.status === 'approved') {
        approvedKeys[locale]++;
      }
      if (translation.qualityScore !== undefined) {
        qualityScores[locale].push(translation.qualityScore);
      }
    }

    for (const locale of this.config.supportedLocales) {
      completionRate[locale] = totalKeys > 0 ? (translatedKeys[locale] / totalKeys) * 100 : 0;
    }

    const qualityScore: Record<string, number> = {};
    for (const [locale, scores] of Object.entries(qualityScores)) {
      qualityScore[locale] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentChanges = this.history.filter(h => h.changedAt.getTime() > oneWeekAgo).length;
    const deprecatedKeys = Array.from(this.keys.values()).filter(k => k.isDeprecated).length;

    return {
      totalKeys,
      translatedKeys,
      reviewedKeys,
      approvedKeys,
      completionRate,
      qualityScore,
      recentChanges,
      deprecatedKeys,
    };
  }

  /**
   * Get missing translations for a locale
   */
  async getMissingTranslations(locale: string): Promise<TranslationKey[]> {
    const missing: TranslationKey[] = [];

    for (const key of this.keys.values()) {
      if (key.isDeprecated) continue;

      const translation = this.translations.get(`${key.key}:${locale}`);
      if (!translation || translation.status === 'pending') {
        missing.push(key);
      }
    }

    return missing;
  }

  /**
   * Bulk update translation status
   */
  async bulkUpdateStatus(
    keys: string[],
    locale: string,
    status: TranslationStatus,
    updatedBy: string
  ): Promise<number> {
    let updated = 0;

    for (const keyName of keys) {
      const translation = this.translations.get(`${keyName}:${locale}`);
      if (translation) {
        translation.status = status;
        translation.updatedAt = new Date();

        if (status === 'reviewed') {
          translation.reviewedBy = updatedBy;
          translation.reviewedAt = new Date();
        } else if (status === 'approved') {
          translation.approvedBy = updatedBy;
          translation.approvedAt = new Date();
        }

        this.translations.set(`${keyName}:${locale}`, translation);
        updated++;
      }
    }

    return updated;
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
   * Get namespaces
   */
  getNamespaces(): TranslationNamespace[] {
    return [
      'common',
      'auth',
      'dashboard',
      'habits',
      'goals',
      'coaching',
      'gamification',
      'settings',
      'notifications',
      'errors',
      'validation',
      'onboarding',
      'billing',
      'admin',
      'email',
      'push',
    ];
  }
}

/**
 * Get singleton instance
 */
export function getTranslationService(config?: Partial<TranslationServiceConfig>): TranslationService {
  if (!instance) {
    instance = new TranslationService(config);
  }
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetTranslationService(): void {
  instance = null;
}
