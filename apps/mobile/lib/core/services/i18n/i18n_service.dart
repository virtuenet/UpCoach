/// I18n Service - Phase 14 Week 1
/// Manages internationalization and localization for the mobile app

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Supported locale configuration
class LocaleConfig {
  final Locale locale;
  final String name;
  final String nativeName;
  final String currency;
  final bool isRTL;
  final bool enabled;

  const LocaleConfig({
    required this.locale,
    required this.name,
    required this.nativeName,
    required this.currency,
    this.isRTL = false,
    this.enabled = true,
  });
}

/// Supported locales
class SupportedLocales {
  static const enUS = LocaleConfig(
    locale: Locale('en', 'US'),
    name: 'English (United States)',
    nativeName: 'English (United States)',
    currency: 'USD',
    enabled: true,
  );

  static const esES = LocaleConfig(
    locale: Locale('es', 'ES'),
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    currency: 'EUR',
    enabled: true,
  );

  static const esMX = LocaleConfig(
    locale: Locale('es', 'MX'),
    name: 'Spanish (Mexico)',
    nativeName: 'Español (México)',
    currency: 'MXN',
    enabled: true,
  );

  static const ptBR = LocaleConfig(
    locale: Locale('pt', 'BR'),
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    currency: 'BRL',
    enabled: true,
  );

  static const frFR = LocaleConfig(
    locale: Locale('fr', 'FR'),
    name: 'French (France)',
    nativeName: 'Français (France)',
    currency: 'EUR',
    enabled: true,
  );

  static const deDE = LocaleConfig(
    locale: Locale('de', 'DE'),
    name: 'German (Germany)',
    nativeName: 'Deutsch (Deutschland)',
    currency: 'EUR',
    enabled: true,
  );

  static const jaJP = LocaleConfig(
    locale: Locale('ja', 'JP'),
    name: 'Japanese (Japan)',
    nativeName: '日本語',
    currency: 'JPY',
    enabled: true,
  );

  static const arSA = LocaleConfig(
    locale: Locale('ar', 'SA'),
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (السعودية)',
    currency: 'SAR',
    isRTL: true,
    enabled: false, // Phase 14 Week 4
  );

  static const List<LocaleConfig> all = [
    enUS,
    esES,
    esMX,
    ptBR,
    frFR,
    deDE,
    jaJP,
    arSA,
  ];

  static List<LocaleConfig> get enabled => all.where((l) => l.enabled).toList();

  static LocaleConfig? getByLocale(Locale locale) {
    try {
      return all.firstWhere(
        (l) => l.locale == locale,
      );
    } catch (_) {
      return null;
    }
  }

  static LocaleConfig get defaultLocale => enUS;
}

/// I18n Service
class I18nService {
  static const String _localeKey = 'user_locale';
  final SharedPreferences _prefs;

  I18nService(this._prefs);

  /// Get current locale
  Locale getCurrentLocale() {
    final localeString = _prefs.getString(_localeKey);

    if (localeString == null) {
      return SupportedLocales.defaultLocale.locale;
    }

    // Parse locale string (e.g., "en_US")
    final parts = localeString.split('_');
    if (parts.length == 2) {
      final locale = Locale(parts[0], parts[1]);
      final config = SupportedLocales.getByLocale(locale);

      if (config != null && config.enabled) {
        return locale;
      }
    }

    return SupportedLocales.defaultLocale.locale;
  }

  /// Set current locale
  Future<void> setLocale(Locale locale) async {
    final config = SupportedLocales.getByLocale(locale);

    if (config == null || !config.enabled) {
      throw Exception('Locale $locale is not supported or enabled');
    }

    final localeString = '${locale.languageCode}_${locale.countryCode}';
    await _prefs.setString(_localeKey, localeString);
  }

  /// Get locale configuration
  LocaleConfig getLocaleConfig(Locale locale) {
    return SupportedLocales.getByLocale(locale) ?? SupportedLocales.defaultLocale;
  }

  /// Get current locale configuration
  LocaleConfig getCurrentLocaleConfig() {
    final locale = getCurrentLocale();
    return getLocaleConfig(locale);
  }

  /// Check if locale is RTL
  bool isRTL(Locale locale) {
    final config = SupportedLocales.getByLocale(locale);
    return config?.isRTL ?? false;
  }

  /// Get text direction
  TextDirection getTextDirection(Locale locale) {
    return isRTL(locale) ? TextDirection.rtl : TextDirection.ltr;
  }

  /// Get currency for locale
  String getCurrency(Locale locale) {
    final config = SupportedLocales.getByLocale(locale);
    return config?.currency ?? 'USD';
  }

  /// Get current currency
  String getCurrentCurrency() {
    final locale = getCurrentLocale();
    return getCurrency(locale);
  }

  /// Get all enabled locales
  List<Locale> getEnabledLocales() {
    return SupportedLocales.enabled.map((c) => c.locale).toList();
  }

  /// Get all enabled locale configs
  List<LocaleConfig> getEnabledLocaleConfigs() {
    return SupportedLocales.enabled;
  }

  /// Detect device locale
  Locale? detectDeviceLocale(BuildContext context) {
    final deviceLocale = View.of(context).platformDispatcher.locale;
    final config = SupportedLocales.getByLocale(deviceLocale);

    if (config != null && config.enabled) {
      return deviceLocale;
    }

    // Try to match language code only
    try {
      final matchedConfig = SupportedLocales.enabled.firstWhere(
        (c) => c.locale.languageCode == deviceLocale.languageCode,
      );
      return matchedConfig.locale;
    } catch (_) {
      return null;
    }
  }

  /// Initialize locale (call on app start)
  Future<Locale> initializeLocale(BuildContext context) async {
    // First, check if user has a saved preference
    final currentLocale = getCurrentLocale();
    final config = getLocaleConfig(currentLocale);

    if (config.enabled) {
      return currentLocale;
    }

    // If no saved preference or disabled, try device locale
    final deviceLocale = detectDeviceLocale(context);
    if (deviceLocale != null) {
      await setLocale(deviceLocale);
      return deviceLocale;
    }

    // Fallback to default
    final defaultLocale = SupportedLocales.defaultLocale.locale;
    await setLocale(defaultLocale);
    return defaultLocale;
  }

  /// Clear locale preference
  Future<void> clearLocale() async {
    await _prefs.remove(_localeKey);
  }
}

/// I18n Service Provider
final i18nServiceProvider = Provider<I18nService>((ref) {
  throw UnimplementedError('I18nService must be overridden with SharedPreferences');
});

/// Current Locale Provider
final currentLocaleProvider = StateProvider<Locale>((ref) {
  final i18nService = ref.watch(i18nServiceProvider);
  return i18nService.getCurrentLocale();
});

/// Locale Config Provider
final localeConfigProvider = Provider<LocaleConfig>((ref) {
  final locale = ref.watch(currentLocaleProvider);
  final i18nService = ref.watch(i18nServiceProvider);
  return i18nService.getLocaleConfig(locale);
});

/// Text Direction Provider
final textDirectionProvider = Provider<TextDirection>((ref) {
  final locale = ref.watch(currentLocaleProvider);
  final i18nService = ref.watch(i18nServiceProvider);
  return i18nService.getTextDirection(locale);
});

/// Currency Provider
final currencyProvider = Provider<String>((ref) {
  final locale = ref.watch(currentLocaleProvider);
  final i18nService = ref.watch(i18nServiceProvider);
  return i18nService.getCurrency(locale);
});

/// Helper extension for BuildContext
extension I18nContextExtension on BuildContext {
  Locale get currentLocale {
    final container = ProviderScope.containerOf(this);
    return container.read(currentLocaleProvider);
  }

  LocaleConfig get localeConfig {
    final container = ProviderScope.containerOf(this);
    return container.read(localeConfigProvider);
  }

  TextDirection get textDirection {
    final container = ProviderScope.containerOf(this);
    return container.read(textDirectionProvider);
  }

  String get currency {
    final container = ProviderScope.containerOf(this);
    return container.read(currencyProvider);
  }

  bool get isRTL {
    return textDirection == TextDirection.rtl;
  }
}
