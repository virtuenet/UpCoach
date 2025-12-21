/// Translation Service
///
/// Handles translation key management and interpolation for the mobile app.
/// Supports pluralization, parameter interpolation, and fallback locales.

import 'dart:convert';
import 'package:flutter/services.dart';
import 'locale_service.dart';

/// Translation namespace for organizing keys
enum TranslationNamespace {
  common,
  auth,
  dashboard,
  habits,
  goals,
  coaching,
  gamification,
  settings,
  notifications,
  errors,
  validation,
  onboarding,
  billing,
}

/// Plural form types
enum PluralForm {
  zero,
  one,
  two,
  few,
  many,
  other,
}

/// Translation service for managing app translations
class TranslationService {
  static TranslationService? _instance;

  final Map<String, Map<String, dynamic>> _translations = {};
  final Set<String> _loadedLocales = {};
  SupportedLocale _currentLocale = SupportedLocale.en;
  SupportedLocale _fallbackLocale = SupportedLocale.en;

  TranslationService._() {
    _initializeDefaultTranslations();
  }

  /// Get singleton instance
  static TranslationService get instance {
    _instance ??= TranslationService._();
    return _instance!;
  }

  /// Current locale
  SupportedLocale get currentLocale => _currentLocale;

  /// Fallback locale
  SupportedLocale get fallbackLocale => _fallbackLocale;

  /// Set current locale
  Future<void> setLocale(SupportedLocale locale) async {
    _currentLocale = locale;
    LocaleService.instance.setLocale(locale);

    // Load translations for locale if not already loaded
    if (!_loadedLocales.contains(locale.code)) {
      await loadTranslations(locale);
    }
  }

  /// Set fallback locale
  void setFallbackLocale(SupportedLocale locale) {
    _fallbackLocale = locale;
  }

  /// Load translations from asset file
  Future<void> loadTranslations(SupportedLocale locale) async {
    try {
      final String jsonString = await rootBundle.loadString(
        'assets/i18n/${locale.code}.json',
      );
      final Map<String, dynamic> translations = json.decode(jsonString);
      _translations[locale.code] = translations;
      _loadedLocales.add(locale.code);
    } catch (e) {
      // Try base language if specific locale fails
      final baseCode = locale.languageCode;
      if (baseCode != locale.code && !_loadedLocales.contains(baseCode)) {
        try {
          final String jsonString = await rootBundle.loadString(
            'assets/i18n/$baseCode.json',
          );
          final Map<String, dynamic> translations = json.decode(jsonString);
          _translations[locale.code] = translations;
          _loadedLocales.add(locale.code);
        } catch (e) {
          print('Failed to load translations for ${locale.code}: $e');
        }
      }
    }
  }

  /// Initialize default English translations
  void _initializeDefaultTranslations() {
    _translations['en'] = {
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
      'common.retry': 'Retry',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.done': 'Done',
      'common.yes': 'Yes',
      'common.no': 'No',

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
      'auth.createAccount': 'Create Account',
      'auth.alreadyHaveAccount': 'Already have an account?',
      'auth.dontHaveAccount': "Don't have an account?",

      // Habits
      'habits.title': 'My Habits',
      'habits.createNew': 'Create New Habit',
      'habits.complete': 'Mark Complete',
      'habits.streak': {
        'zero': 'No streak',
        'one': '1 day streak',
        'other': '{{count}} day streak',
      },
      'habits.streakDays': {
        'zero': '0 days',
        'one': '1 day',
        'other': '{{count}} days',
      },
      'habits.reminder': 'Reminder',
      'habits.frequency': 'Frequency',
      'habits.progress': 'Progress',
      'habits.noHabits': 'No habits yet. Create your first habit to get started!',
      'habits.completedToday': 'Great job! You completed this habit today.',
      'habits.daily': 'Daily',
      'habits.weekly': 'Weekly',
      'habits.monthly': 'Monthly',
      'habits.category': 'Category',
      'habits.startDate': 'Start Date',
      'habits.endDate': 'End Date',

      // Goals
      'goals.title': 'My Goals',
      'goals.createNew': 'Create New Goal',
      'goals.deadline': 'Deadline',
      'goals.progress': '{{percent}}% complete',
      'goals.milestone': {
        'one': '1 milestone',
        'other': '{{count}} milestones',
      },
      'goals.completed': 'Goal completed! Congratulations!',
      'goals.overdue': 'This goal is overdue',
      'goals.noGoals': 'No goals yet. Set your first goal to start your journey!',
      'goals.addMilestone': 'Add Milestone',
      'goals.targetDate': 'Target Date',
      'goals.priority': 'Priority',
      'goals.description': 'Description',

      // Coaching
      'coaching.title': 'Coaching',
      'coaching.findCoach': 'Find a Coach',
      'coaching.bookSession': 'Book Session',
      'coaching.upcomingSession': 'Upcoming Session',
      'coaching.sessionWith': 'Session with {{coachName}}',
      'coaching.rateSession': 'How was your session?',
      'coaching.aiCoach': 'AI Coach',
      'coaching.askQuestion': 'Ask me anything...',
      'coaching.noSessions': 'No upcoming sessions',
      'coaching.sessionHistory': 'Session History',
      'coaching.reschedule': 'Reschedule',
      'coaching.cancel': 'Cancel Session',

      // Gamification
      'gamification.points': {
        'one': '1 point',
        'other': '{{count}} points',
      },
      'gamification.level': 'Level {{level}}',
      'gamification.badge': {
        'one': '1 badge',
        'other': '{{count}} badges',
      },
      'gamification.achievement': 'Achievement unlocked: {{name}}!',
      'gamification.leaderboard': 'Leaderboard',
      'gamification.rank': 'Rank #{{rank}}',
      'gamification.xp': '{{amount}} XP',
      'gamification.levelUp': 'Level Up!',
      'gamification.newBadge': 'New Badge Earned!',

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
      'settings.about': 'About',
      'settings.help': 'Help & Support',
      'settings.terms': 'Terms of Service',
      'settings.privacyPolicy': 'Privacy Policy',

      // Notifications
      'notifications.title': 'Notifications',
      'notifications.markRead': 'Mark as read',
      'notifications.markAllRead': 'Mark all as read',
      'notifications.empty': 'No notifications',
      'notifications.settings': 'Notification Settings',
      'notifications.push': 'Push Notifications',
      'notifications.email': 'Email Notifications',
      'notifications.reminders': 'Habit Reminders',

      // Errors
      'errors.network': 'Network error. Please check your connection.',
      'errors.server': 'Server error. Please try again later.',
      'errors.notFound': 'The requested resource was not found.',
      'errors.unauthorized': 'Please log in to continue.',
      'errors.forbidden': 'You do not have permission to perform this action.',
      'errors.validation': 'Please check your input and try again.',
      'errors.tryAgain': 'Try Again',
      'errors.timeout': 'Request timed out. Please try again.',
      'errors.unknown': 'An unexpected error occurred.',

      // Validation
      'validation.required': 'This field is required',
      'validation.email': 'Please enter a valid email address',
      'validation.minLength': 'Must be at least {{min}} characters',
      'validation.maxLength': 'Must be no more than {{max}} characters',
      'validation.passwordMatch': 'Passwords do not match',
      'validation.invalidFormat': 'Invalid format',
      'validation.minValue': 'Must be at least {{min}}',
      'validation.maxValue': 'Must be no more than {{max}}',

      // Onboarding
      'onboarding.welcome': 'Welcome to UpCoach',
      'onboarding.getStarted': 'Get Started',
      'onboarding.skip': 'Skip',
      'onboarding.next': 'Next',
      'onboarding.finish': 'Finish',
      'onboarding.step1Title': 'Track Your Habits',
      'onboarding.step1Desc': 'Build consistent habits with daily tracking and reminders.',
      'onboarding.step2Title': 'Set Your Goals',
      'onboarding.step2Desc': 'Define clear goals and track your progress with milestones.',
      'onboarding.step3Title': 'Get Coached',
      'onboarding.step3Desc': 'Connect with AI and human coaches for personalized guidance.',

      // Billing
      'billing.subscription': 'Subscription',
      'billing.upgrade': 'Upgrade',
      'billing.currentPlan': 'Current Plan',
      'billing.price': '{{amount}}',
      'billing.perMonth': '/month',
      'billing.perYear': '/year',
      'billing.free': 'Free',
      'billing.premium': 'Premium',
      'billing.enterprise': 'Enterprise',
      'billing.managePlan': 'Manage Plan',
      'billing.cancelSubscription': 'Cancel Subscription',
    };

    _loadedLocales.add('en');

    // Add Spanish translations
    _translations['es'] = {
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.loading': 'Cargando...',
      'common.error': 'Ocurrió un error',
      'common.success': '¡Éxito!',
      'common.confirm': 'Confirmar',
      'common.search': 'Buscar...',
      'common.noResults': 'No se encontraron resultados',
      'common.retry': 'Reintentar',
      'common.close': 'Cerrar',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.done': 'Hecho',
      'common.yes': 'Sí',
      'common.no': 'No',
      'auth.login': 'Iniciar Sesión',
      'auth.logout': 'Cerrar Sesión',
      'auth.register': 'Registrarse',
      'auth.forgotPassword': '¿Olvidaste tu contraseña?',
      'auth.welcomeBack': '¡Bienvenido de nuevo, {{name}}!',
      'habits.title': 'Mis Hábitos',
      'habits.createNew': 'Crear Nuevo Hábito',
      'habits.streak': {
        'zero': 'Sin racha',
        'one': 'Racha de 1 día',
        'other': 'Racha de {{count}} días',
      },
      'goals.title': 'Mis Metas',
      'goals.createNew': 'Crear Nueva Meta',
      'coaching.title': 'Coaching',
      'settings.title': 'Configuración',
      'settings.language': 'Idioma',
      'onboarding.welcome': 'Bienvenido a UpCoach',
      'onboarding.getStarted': 'Comenzar',
    };
    _loadedLocales.add('es');

    // Add French translations
    _translations['fr'] = {
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.loading': 'Chargement...',
      'common.error': 'Une erreur est survenue',
      'common.success': 'Succès !',
      'auth.login': 'Connexion',
      'auth.logout': 'Déconnexion',
      'auth.register': "S'inscrire",
      'auth.welcomeBack': 'Bon retour, {{name}} !',
      'habits.title': 'Mes Habitudes',
      'habits.createNew': 'Créer une Habitude',
      'goals.title': 'Mes Objectifs',
      'coaching.title': 'Coaching',
      'settings.title': 'Paramètres',
      'settings.language': 'Langue',
      'onboarding.welcome': 'Bienvenue sur UpCoach',
      'onboarding.getStarted': 'Commencer',
    };
    _loadedLocales.add('fr');

    // Add German translations
    _translations['de'] = {
      'common.save': 'Speichern',
      'common.cancel': 'Abbrechen',
      'common.delete': 'Löschen',
      'common.edit': 'Bearbeiten',
      'common.loading': 'Laden...',
      'auth.login': 'Anmelden',
      'auth.logout': 'Abmelden',
      'auth.register': 'Registrieren',
      'auth.welcomeBack': 'Willkommen zurück, {{name}}!',
      'habits.title': 'Meine Gewohnheiten',
      'goals.title': 'Meine Ziele',
      'coaching.title': 'Coaching',
      'settings.title': 'Einstellungen',
      'settings.language': 'Sprache',
      'onboarding.welcome': 'Willkommen bei UpCoach',
    };
    _loadedLocales.add('de');

    // Add Japanese translations
    _translations['ja'] = {
      'common.save': '保存',
      'common.cancel': 'キャンセル',
      'common.delete': '削除',
      'common.edit': '編集',
      'common.loading': '読み込み中...',
      'auth.login': 'ログイン',
      'auth.logout': 'ログアウト',
      'auth.register': '新規登録',
      'auth.welcomeBack': 'おかえりなさい、{{name}}さん！',
      'habits.title': '習慣',
      'habits.createNew': '新しい習慣を作成',
      'habits.streak': {
        'other': '{{count}}日連続',
      },
      'goals.title': '目標',
      'coaching.title': 'コーチング',
      'settings.title': '設定',
      'settings.language': '言語',
      'onboarding.welcome': 'UpCoachへようこそ',
    };
    _loadedLocales.add('ja');

    // Add Chinese translations
    _translations['zh'] = {
      'common.save': '保存',
      'common.cancel': '取消',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.loading': '加载中...',
      'auth.login': '登录',
      'auth.logout': '退出登录',
      'auth.register': '注册',
      'auth.welcomeBack': '欢迎回来，{{name}}！',
      'habits.title': '我的习惯',
      'habits.createNew': '创建新习惯',
      'goals.title': '我的目标',
      'coaching.title': '教练',
      'settings.title': '设置',
      'settings.language': '语言',
      'onboarding.welcome': '欢迎使用UpCoach',
    };
    _loadedLocales.add('zh');

    // Add Arabic translations
    _translations['ar'] = {
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.loading': 'جاري التحميل...',
      'auth.login': 'تسجيل الدخول',
      'auth.logout': 'تسجيل الخروج',
      'auth.register': 'إنشاء حساب',
      'auth.welcomeBack': 'مرحباً بعودتك، {{name}}!',
      'habits.title': 'عاداتي',
      'goals.title': 'أهدافي',
      'coaching.title': 'التدريب',
      'settings.title': 'الإعدادات',
      'settings.language': 'اللغة',
      'onboarding.welcome': 'مرحباً بك في UpCoach',
    };
    _loadedLocales.add('ar');
  }

  /// Translate a key with optional parameters
  String translate(
    String key, {
    Map<String, dynamic>? params,
    int? count,
    String? locale,
  }) {
    final targetLocale = locale ?? _currentLocale.code;
    final baseLocale = targetLocale.split('-')[0];

    // Try exact locale
    var value = _getTranslation(key, targetLocale);

    // Try base locale
    if (value == null && baseLocale != targetLocale) {
      value = _getTranslation(key, baseLocale);
    }

    // Try fallback locale
    if (value == null && targetLocale != _fallbackLocale.code) {
      value = _getTranslation(key, _fallbackLocale.code);
    }

    // Return key if no translation found
    if (value == null) {
      print('Missing translation: $key for $targetLocale');
      return key;
    }

    // Handle plural forms
    if (value is Map && count != null) {
      final pluralForm = _getPluralForm(targetLocale, count);
      value = value[pluralForm.name] ?? value['other'] ?? value.values.first;
    }

    // Interpolate parameters
    if (params != null && value is String) {
      value = _interpolate(value, params);
    }

    // Handle count parameter
    if (count != null && value is String) {
      value = value.replaceAll('{{count}}', count.toString());
    }

    return value?.toString() ?? key;
  }

  /// Get translation from map
  dynamic _getTranslation(String key, String locale) {
    final translations = _translations[locale];
    if (translations == null) return null;

    // Try direct key lookup
    if (translations.containsKey(key)) {
      return translations[key];
    }

    // Try nested key lookup
    final parts = key.split('.');
    dynamic current = translations;
    for (final part in parts) {
      if (current is Map && current.containsKey(part)) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  /// Get plural form for a number
  PluralForm _getPluralForm(String locale, int count) {
    final baseLocale = locale.split('-')[0];

    switch (baseLocale) {
      case 'ar': // Arabic
        if (count == 0) return PluralForm.zero;
        if (count == 1) return PluralForm.one;
        if (count == 2) return PluralForm.two;
        if (count % 100 >= 3 && count % 100 <= 10) return PluralForm.few;
        if (count % 100 >= 11) return PluralForm.many;
        return PluralForm.other;

      case 'ja':
      case 'ko':
      case 'zh': // East Asian (no plural)
        return PluralForm.other;

      case 'ru': // Russian
      case 'uk': // Ukrainian
        if (count % 10 == 1 && count % 100 != 11) return PluralForm.one;
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
          return PluralForm.few;
        }
        return PluralForm.many;

      default: // English and most Western languages
        if (count == 0) return PluralForm.zero;
        if (count == 1) return PluralForm.one;
        return PluralForm.other;
    }
  }

  /// Interpolate parameters in translation
  String _interpolate(String value, Map<String, dynamic> params) {
    String result = value;
    for (final entry in params.entries) {
      result = result.replaceAll('{{${entry.key}}}', entry.value.toString());
    }
    return result;
  }

  /// Check if translation exists for key
  bool hasTranslation(String key, {String? locale}) {
    final targetLocale = locale ?? _currentLocale.code;
    return _getTranslation(key, targetLocale) != null;
  }

  /// Get all translations for current locale
  Map<String, dynamic> get currentTranslations {
    return _translations[_currentLocale.code] ?? {};
  }

  /// Get loaded locales
  Set<String> get loadedLocales => Set.from(_loadedLocales);
}

/// Shorthand translation function
String t(String key, {Map<String, dynamic>? params, int? count}) {
  return TranslationService.instance.translate(key, params: params, count: count);
}

/// Plural translation function
String tp(String key, int count, {Map<String, dynamic>? params}) {
  final allParams = {...?params, 'count': count};
  return TranslationService.instance.translate(key, params: allParams, count: count);
}
