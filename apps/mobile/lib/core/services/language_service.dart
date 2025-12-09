import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class Language {
  final String code;
  final String name;
  final String nativeName;
  final String flag;
  final TextDirection direction;

  const Language({
    required this.code,
    required this.name,
    required this.nativeName,
    required this.flag,
    required this.direction,
  });
}

class LanguageService {
  static const String _languageKey = 'selected_language';
  final SharedPreferences _prefs;

  LanguageService(this._prefs);

  static const List<Language> supportedLanguages = [
    Language(
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      direction: TextDirection.ltr,
    ),
    Language(
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      direction: TextDirection.ltr,
    ),
    Language(
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      direction: TextDirection.ltr,
    ),
    Language(
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      direction: TextDirection.ltr,
    ),
    Language(
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      flag: '🇵🇹',
      direction: TextDirection.ltr,
    ),
    Language(
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
      direction: TextDirection.ltr,
    ),
    Language(
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      direction: TextDirection.ltr,
    ),
    Language(
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      direction: TextDirection.rtl,
    ),
  ];

  Future<String> getSelectedLanguage() async {
    return _prefs.getString(_languageKey) ?? 'en';
  }

  Future<void> setSelectedLanguage(String languageCode) async {
    await _prefs.setString(_languageKey, languageCode);
  }

  Language getLanguageByCode(String code) {
    return supportedLanguages.firstWhere(
      (lang) => lang.code == code,
      orElse: () => supportedLanguages.first,
    );
  }

  Locale getLocale(String languageCode) {
    return Locale(languageCode);
  }

  Future<Locale> getCurrentLocale() async {
    final languageCode = await getSelectedLanguage();
    return getLocale(languageCode);
  }
}

// Providers
final languageServiceProvider = Provider<LanguageService>((ref) {
  throw UnimplementedError('languageServiceProvider must be overridden');
});

final currentLanguageProvider = FutureProvider<String>((ref) async {
  final service = ref.watch(languageServiceProvider);
  return service.getSelectedLanguage();
});

final currentLocaleProvider = FutureProvider<Locale>((ref) async {
  final service = ref.watch(languageServiceProvider);
  return service.getCurrentLocale();
});

class LanguageNotifier extends Notifier<Locale> {
  late final LanguageService _service;
  final Locale initialLocale;

  LanguageNotifier({this.initialLocale = const Locale('en')});

  @override
  Locale build() {
    _service = ref.watch(languageServiceProvider);
    return initialLocale;
  }

  Future<void> setLanguage(String languageCode) async {
    await _service.setSelectedLanguage(languageCode);
    state = _service.getLocale(languageCode);
  }

  Language getCurrentLanguage() {
    return _service.getLanguageByCode(state.languageCode);
  }
}

final localeProvider = NotifierProvider<LanguageNotifier, Locale>(LanguageNotifier.new);
