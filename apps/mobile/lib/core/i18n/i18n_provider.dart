/// i18n Provider
///
/// Riverpod providers for internationalization and localization.
/// Provides reactive locale management and translation access.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'locale_service.dart';
import 'translation_service.dart';

/// Current locale provider
final currentLocaleProvider = StateNotifierProvider<LocaleNotifier, SupportedLocale>((ref) {
  return LocaleNotifier();
});

/// Locale notifier for managing app locale
class LocaleNotifier extends StateNotifier<SupportedLocale> {
  LocaleNotifier() : super(SupportedLocale.en);

  /// Set locale
  Future<void> setLocale(SupportedLocale locale) async {
    LocaleService.instance.setLocale(locale);
    await TranslationService.instance.setLocale(locale);
    state = locale;
  }

  /// Set locale from code
  Future<void> setLocaleFromCode(String code) async {
    final locale = SupportedLocale.fromCode(code);
    if (locale != null) {
      await setLocale(locale);
    }
  }

  /// Set locale from Flutter Locale
  Future<void> setLocaleFromFlutter(Locale locale) async {
    final supportedLocale = SupportedLocale.fromLocale(locale);
    if (supportedLocale != null) {
      await setLocale(supportedLocale);
    }
  }

  /// Get next locale (for cycling through locales)
  SupportedLocale get nextLocale {
    final locales = SupportedLocale.values;
    final currentIndex = locales.indexOf(state);
    final nextIndex = (currentIndex + 1) % locales.length;
    return locales[nextIndex];
  }
}

/// Locale info provider
final localeInfoProvider = Provider<LocaleInfo>((ref) {
  final locale = ref.watch(currentLocaleProvider);
  return LocaleService.instance.getLocaleInfo(locale);
});

/// Is RTL provider
final isRTLProvider = Provider<bool>((ref) {
  final locale = ref.watch(currentLocaleProvider);
  return locale.isRTL;
});

/// Text direction provider
final textDirectionProvider = Provider<TextDirection>((ref) {
  final isRTL = ref.watch(isRTLProvider);
  return isRTL ? TextDirection.rtl : TextDirection.ltr;
});

/// Supported locales provider
final supportedLocalesProvider = Provider<List<SupportedLocale>>((ref) {
  return SupportedLocale.values.toList();
});

/// Flutter locales provider (for MaterialApp)
final flutterLocalesProvider = Provider<List<Locale>>((ref) {
  return SupportedLocale.values.map((l) => l.toLocale()).toList();
});

/// Translation provider
final translationProvider = Provider.family<String, TranslationParams>((ref, params) {
  ref.watch(currentLocaleProvider); // React to locale changes
  return TranslationService.instance.translate(
    params.key,
    params: params.params,
    count: params.count,
  );
});

/// Translation parameters
class TranslationParams {
  final String key;
  final Map<String, dynamic>? params;
  final int? count;

  const TranslationParams(this.key, {this.params, this.count});

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TranslationParams &&
        other.key == key &&
        _mapEquals(other.params, params) &&
        other.count == count;
  }

  @override
  int get hashCode => key.hashCode ^ (params?.hashCode ?? 0) ^ (count ?? 0);

  bool _mapEquals(Map<String, dynamic>? a, Map<String, dynamic>? b) {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (final key in a.keys) {
      if (a[key] != b[key]) return false;
    }
    return true;
  }
}

/// User locale preferences provider
final userLocalePreferencesProvider = StateNotifierProvider<UserLocalePreferencesNotifier, UserLocalePreferences?>((ref) {
  return UserLocalePreferencesNotifier();
});

/// User locale preferences
class UserLocalePreferences {
  final String locale;
  final String timezone;
  final String? dateFormat;
  final String? timeFormat;
  final int? firstDayOfWeek;
  final String? currency;
  final String? measurementSystem;

  const UserLocalePreferences({
    required this.locale,
    required this.timezone,
    this.dateFormat,
    this.timeFormat,
    this.firstDayOfWeek,
    this.currency,
    this.measurementSystem,
  });

  UserLocalePreferences copyWith({
    String? locale,
    String? timezone,
    String? dateFormat,
    String? timeFormat,
    int? firstDayOfWeek,
    String? currency,
    String? measurementSystem,
  }) {
    return UserLocalePreferences(
      locale: locale ?? this.locale,
      timezone: timezone ?? this.timezone,
      dateFormat: dateFormat ?? this.dateFormat,
      timeFormat: timeFormat ?? this.timeFormat,
      firstDayOfWeek: firstDayOfWeek ?? this.firstDayOfWeek,
      currency: currency ?? this.currency,
      measurementSystem: measurementSystem ?? this.measurementSystem,
    );
  }

  Map<String, dynamic> toJson() => {
    'locale': locale,
    'timezone': timezone,
    'dateFormat': dateFormat,
    'timeFormat': timeFormat,
    'firstDayOfWeek': firstDayOfWeek,
    'currency': currency,
    'measurementSystem': measurementSystem,
  };

  factory UserLocalePreferences.fromJson(Map<String, dynamic> json) {
    return UserLocalePreferences(
      locale: json['locale'] as String,
      timezone: json['timezone'] as String,
      dateFormat: json['dateFormat'] as String?,
      timeFormat: json['timeFormat'] as String?,
      firstDayOfWeek: json['firstDayOfWeek'] as int?,
      currency: json['currency'] as String?,
      measurementSystem: json['measurementSystem'] as String?,
    );
  }
}

/// User locale preferences notifier
class UserLocalePreferencesNotifier extends StateNotifier<UserLocalePreferences?> {
  UserLocalePreferencesNotifier() : super(null);

  /// Set preferences
  void setPreferences(UserLocalePreferences preferences) {
    state = preferences;
  }

  /// Update locale
  void updateLocale(String locale) {
    if (state != null) {
      state = state!.copyWith(locale: locale);
    } else {
      state = UserLocalePreferences(locale: locale, timezone: 'UTC');
    }
  }

  /// Update timezone
  void updateTimezone(String timezone) {
    if (state != null) {
      state = state!.copyWith(timezone: timezone);
    }
  }

  /// Update date format
  void updateDateFormat(String format) {
    if (state != null) {
      state = state!.copyWith(dateFormat: format);
    }
  }

  /// Update time format
  void updateTimeFormat(String format) {
    if (state != null) {
      state = state!.copyWith(timeFormat: format);
    }
  }

  /// Update currency
  void updateCurrency(String currency) {
    if (state != null) {
      state = state!.copyWith(currency: currency);
    }
  }

  /// Clear preferences
  void clear() {
    state = null;
  }
}

/// Format number with current locale
final formatNumberProvider = Provider.family<String, num>((ref, value) {
  ref.watch(currentLocaleProvider);
  return LocaleService.instance.formatNumber(value);
});

/// Format currency with current locale
final formatCurrencyProvider = Provider.family<String, CurrencyParams>((ref, params) {
  ref.watch(currentLocaleProvider);
  return LocaleService.instance.formatCurrency(
    params.value,
    currencyCode: params.currencyCode,
  );
});

/// Currency format parameters
class CurrencyParams {
  final num value;
  final String? currencyCode;

  const CurrencyParams(this.value, {this.currencyCode});

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CurrencyParams &&
        other.value == value &&
        other.currencyCode == currencyCode;
  }

  @override
  int get hashCode => value.hashCode ^ (currencyCode?.hashCode ?? 0);
}

/// Format date with current locale
final formatDateProvider = Provider.family<String, DateTime>((ref, date) {
  ref.watch(currentLocaleProvider);
  return LocaleService.instance.formatDate(date);
});

/// Format time with current locale
final formatTimeProvider = Provider.family<String, DateTime>((ref, time) {
  ref.watch(currentLocaleProvider);
  return LocaleService.instance.formatTime(time);
});

/// Format relative time with current locale
final formatRelativeTimeProvider = Provider.family<String, DateTime>((ref, date) {
  ref.watch(currentLocaleProvider);
  return LocaleService.instance.formatRelativeTime(date);
});
