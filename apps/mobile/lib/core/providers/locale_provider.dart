import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Supported locales in the app
class SupportedLocales {
  static const Locale english = Locale('en');
  static const Locale spanish = Locale('es');
  static const Locale french = Locale('fr');
  static const Locale indonesian = Locale('id');
  static const Locale arabic = Locale('ar');

  static const List<Locale> all = [
    english,
    spanish,
    french,
    indonesian,
    arabic,
  ];

  /// Get locale display name
  static String getDisplayName(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      case 'id':
        return 'Bahasa Indonesia';
      case 'ar':
        return 'العربية';
      default:
        return locale.languageCode;
    }
  }

  /// Get locale native name
  static String getNativeName(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      case 'id':
        return 'Bahasa Indonesia';
      case 'ar':
        return 'العربية';
      default:
        return locale.languageCode;
    }
  }

  /// Check if locale is RTL
  static bool isRTL(Locale locale) {
    return locale.languageCode == 'ar';
  }

  /// Get text direction for locale
  static TextDirection getTextDirection(Locale locale) {
    return isRTL(locale) ? TextDirection.rtl : TextDirection.ltr;
  }
}

/// Locale state
class LocaleState {
  final Locale locale;
  final bool isSystemLocale;

  const LocaleState({
    required this.locale,
    this.isSystemLocale = false,
  });

  LocaleState copyWith({
    Locale? locale,
    bool? isSystemLocale,
  }) {
    return LocaleState(
      locale: locale ?? this.locale,
      isSystemLocale: isSystemLocale ?? this.isSystemLocale,
    );
  }

  bool get isRTL => SupportedLocales.isRTL(locale);
  TextDirection get textDirection => SupportedLocales.getTextDirection(locale);
}

/// Locale notifier for managing app locale
class LocaleNotifier extends StateNotifier<LocaleState> {
  static const String _localeKey = 'app_locale';
  static const String _systemLocaleKey = 'use_system_locale';

  LocaleNotifier()
      : super(const LocaleState(locale: SupportedLocales.english)) {
    _loadSavedLocale();
  }

  /// Load saved locale from preferences
  Future<void> _loadSavedLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final useSystemLocale = prefs.getBool(_systemLocaleKey) ?? true;

      if (useSystemLocale) {
        final systemLocale = _getSystemLocale();
        state = LocaleState(locale: systemLocale, isSystemLocale: true);
      } else {
        final savedLocaleCode = prefs.getString(_localeKey);
        if (savedLocaleCode != null) {
          final savedLocale = Locale(savedLocaleCode);
          if (_isSupported(savedLocale)) {
            state = LocaleState(locale: savedLocale, isSystemLocale: false);
          }
        }
      }
    } catch (e) {
      debugPrint('Error loading saved locale: $e');
    }
  }

  /// Get system locale (fallback to English if not supported)
  Locale _getSystemLocale() {
    final systemLocale = PlatformDispatcher.instance.locale;
    final matchingLocale = SupportedLocales.all.firstWhere(
      (locale) => locale.languageCode == systemLocale.languageCode,
      orElse: () => SupportedLocales.english,
    );
    return matchingLocale;
  }

  /// Check if locale is supported
  bool _isSupported(Locale locale) {
    return SupportedLocales.all.any(
      (supported) => supported.languageCode == locale.languageCode,
    );
  }

  /// Set app locale
  Future<void> setLocale(Locale locale) async {
    if (!_isSupported(locale)) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_localeKey, locale.languageCode);
      await prefs.setBool(_systemLocaleKey, false);
      state = LocaleState(locale: locale, isSystemLocale: false);
    } catch (e) {
      debugPrint('Error saving locale: $e');
    }
  }

  /// Use system locale
  Future<void> useSystemLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_systemLocaleKey, true);
      await prefs.remove(_localeKey);
      final systemLocale = _getSystemLocale();
      state = LocaleState(locale: systemLocale, isSystemLocale: true);
    } catch (e) {
      debugPrint('Error setting system locale: $e');
    }
  }

  /// Reset to default (English)
  Future<void> resetToDefault() async {
    await setLocale(SupportedLocales.english);
  }
}

/// Provider for locale state
final localeProvider =
    StateNotifierProvider<LocaleNotifier, LocaleState>((ref) {
  return LocaleNotifier();
});

/// Provider for current locale only
final currentLocaleProvider = Provider<Locale>((ref) {
  return ref.watch(localeProvider).locale;
});

/// Provider for RTL state
final isRTLProvider = Provider<bool>((ref) {
  return ref.watch(localeProvider).isRTL;
});

/// Provider for text direction
final textDirectionProvider = Provider<TextDirection>((ref) {
  return ref.watch(localeProvider).textDirection;
});
