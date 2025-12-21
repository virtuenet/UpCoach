/// Locale Service
///
/// Handles locale detection, preferences, and formatting for the mobile app.
/// Provides locale-aware formatting for numbers, dates, currencies, and relative times.

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Supported locales in the app
enum SupportedLocale {
  en('en', 'English', 'English'),
  enUS('en-US', 'English (US)', 'English (United States)'),
  enGB('en-GB', 'English (UK)', 'English (United Kingdom)'),
  es('es', 'Spanish', 'Español'),
  esMX('es-MX', 'Spanish (Mexico)', 'Español (México)'),
  fr('fr', 'French', 'Français'),
  de('de', 'German', 'Deutsch'),
  pt('pt', 'Portuguese', 'Português'),
  ptBR('pt-BR', 'Portuguese (Brazil)', 'Português (Brasil)'),
  ja('ja', 'Japanese', '日本語'),
  zh('zh', 'Chinese (Simplified)', '简体中文'),
  zhTW('zh-TW', 'Chinese (Traditional)', '繁體中文'),
  ko('ko', 'Korean', '한국어'),
  ar('ar', 'Arabic', 'العربية'),
  hi('hi', 'Hindi', 'हिन्दी'),
  he('he', 'Hebrew', 'עברית'),
  ru('ru', 'Russian', 'Русский'),
  it('it', 'Italian', 'Italiano'),
  nl('nl', 'Dutch', 'Nederlands'),
  pl('pl', 'Polish', 'Polski'),
  tr('tr', 'Turkish', 'Türkçe'),
  th('th', 'Thai', 'ไทย'),
  vi('vi', 'Vietnamese', 'Tiếng Việt'),
  id('id', 'Indonesian', 'Bahasa Indonesia'),
  ms('ms', 'Malay', 'Bahasa Melayu');

  final String code;
  final String displayName;
  final String nativeName;

  const SupportedLocale(this.code, this.displayName, this.nativeName);

  /// Convert to Flutter Locale
  Locale toLocale() {
    final parts = code.split('-');
    if (parts.length == 2) {
      return Locale(parts[0], parts[1]);
    }
    return Locale(parts[0]);
  }

  /// Check if locale is RTL
  bool get isRTL => code == 'ar' || code == 'he';

  /// Get text direction
  TextDirection get textDirection =>
      isRTL ? TextDirection.rtl : TextDirection.ltr;

  /// Get base language code
  String get languageCode => code.split('-')[0];

  /// Get region code if present
  String? get regionCode {
    final parts = code.split('-');
    return parts.length == 2 ? parts[1] : null;
  }

  /// Get from code string
  static SupportedLocale? fromCode(String code) {
    for (final locale in SupportedLocale.values) {
      if (locale.code == code) {
        return locale;
      }
    }
    // Try base language
    final baseCode = code.split('-')[0];
    for (final locale in SupportedLocale.values) {
      if (locale.code == baseCode) {
        return locale;
      }
    }
    return null;
  }

  /// Get from Flutter Locale
  static SupportedLocale? fromLocale(Locale locale) {
    final code = locale.countryCode != null
        ? '${locale.languageCode}-${locale.countryCode}'
        : locale.languageCode;
    return fromCode(code);
  }
}

/// Locale info with formatting configuration
class LocaleInfo {
  final SupportedLocale locale;
  final String dateFormat;
  final String timeFormat;
  final int firstDayOfWeek; // 0 = Sunday, 1 = Monday, 6 = Saturday
  final String currency;
  final String decimalSeparator;
  final String thousandsSeparator;
  final int decimalPlaces;

  const LocaleInfo({
    required this.locale,
    required this.dateFormat,
    required this.timeFormat,
    required this.firstDayOfWeek,
    required this.currency,
    required this.decimalSeparator,
    required this.thousandsSeparator,
    required this.decimalPlaces,
  });

  /// Default locale info for English
  static const LocaleInfo english = LocaleInfo(
    locale: SupportedLocale.en,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    firstDayOfWeek: 0,
    currency: 'USD',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  );
}

/// Locale configurations
final Map<SupportedLocale, LocaleInfo> _localeConfigs = {
  SupportedLocale.en: LocaleInfo.english,
  SupportedLocale.enUS: const LocaleInfo(
    locale: SupportedLocale.enUS,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    firstDayOfWeek: 0,
    currency: 'USD',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  ),
  SupportedLocale.enGB: const LocaleInfo(
    locale: SupportedLocale.enGB,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'GBP',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  ),
  SupportedLocale.es: const LocaleInfo(
    locale: SupportedLocale.es,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    decimalPlaces: 2,
  ),
  SupportedLocale.fr: const LocaleInfo(
    locale: SupportedLocale.fr,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
    decimalPlaces: 2,
  ),
  SupportedLocale.de: const LocaleInfo(
    locale: SupportedLocale.de,
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'EUR',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    decimalPlaces: 2,
  ),
  SupportedLocale.ja: const LocaleInfo(
    locale: SupportedLocale.ja,
    dateFormat: 'yyyy/MM/dd',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'JPY',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 0,
  ),
  SupportedLocale.zh: const LocaleInfo(
    locale: SupportedLocale.zh,
    dateFormat: 'yyyy/MM/dd',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1,
    currency: 'CNY',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  ),
  SupportedLocale.ko: const LocaleInfo(
    locale: SupportedLocale.ko,
    dateFormat: 'yyyy.MM.dd',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0,
    currency: 'KRW',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 0,
  ),
  SupportedLocale.ar: const LocaleInfo(
    locale: SupportedLocale.ar,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 6,
    currency: 'SAR',
    decimalSeparator: '٫',
    thousandsSeparator: '٬',
    decimalPlaces: 2,
  ),
};

/// Locale Service for handling locale-specific formatting
class LocaleService {
  static LocaleService? _instance;

  SupportedLocale _currentLocale = SupportedLocale.en;
  LocaleInfo _currentInfo = LocaleInfo.english;

  LocaleService._();

  /// Get singleton instance
  static LocaleService get instance {
    _instance ??= LocaleService._();
    return _instance!;
  }

  /// Current locale
  SupportedLocale get currentLocale => _currentLocale;

  /// Current locale info
  LocaleInfo get currentInfo => _currentInfo;

  /// Current Flutter locale
  Locale get flutterLocale => _currentLocale.toLocale();

  /// Is current locale RTL
  bool get isRTL => _currentLocale.isRTL;

  /// Text direction for current locale
  TextDirection get textDirection => _currentLocale.textDirection;

  /// Set current locale
  void setLocale(SupportedLocale locale) {
    _currentLocale = locale;
    _currentInfo = _localeConfigs[locale] ?? LocaleInfo.english;
    Intl.defaultLocale = locale.code;
  }

  /// Set locale from code
  void setLocaleFromCode(String code) {
    final locale = SupportedLocale.fromCode(code);
    if (locale != null) {
      setLocale(locale);
    }
  }

  /// Set locale from Flutter Locale
  void setLocaleFromFlutter(Locale locale) {
    final supportedLocale = SupportedLocale.fromLocale(locale);
    if (supportedLocale != null) {
      setLocale(supportedLocale);
    }
  }

  /// Get locale info
  LocaleInfo getLocaleInfo(SupportedLocale locale) {
    return _localeConfigs[locale] ?? LocaleInfo.english;
  }

  /// Get all supported locales
  List<SupportedLocale> get supportedLocales => SupportedLocale.values.toList();

  /// Format number
  String formatNumber(
    num value, {
    int? minimumFractionDigits,
    int? maximumFractionDigits,
    bool useGrouping = true,
  }) {
    final format = NumberFormat.decimalPattern(_currentLocale.code);

    if (minimumFractionDigits != null) {
      format.minimumFractionDigits = minimumFractionDigits;
    }
    if (maximumFractionDigits != null) {
      format.maximumFractionDigits = maximumFractionDigits;
    }

    return format.format(value);
  }

  /// Format currency
  String formatCurrency(
    num value, {
    String? currencyCode,
    bool showSymbol = true,
    bool showCode = false,
  }) {
    final currency = currencyCode ?? _currentInfo.currency;
    final format = NumberFormat.currency(
      locale: _currentLocale.code,
      symbol: showSymbol ? null : '',
      name: currency,
    );

    String result = format.format(value);

    if (showCode && !showSymbol) {
      result = '$result $currency';
    }

    return result;
  }

  /// Format date
  String formatDate(DateTime date, {String? pattern}) {
    final format = DateFormat(
      pattern ?? _currentInfo.dateFormat,
      _currentLocale.code,
    );
    return format.format(date);
  }

  /// Format time
  String formatTime(DateTime time, {String? pattern}) {
    final format = DateFormat(
      pattern ?? _currentInfo.timeFormat,
      _currentLocale.code,
    );
    return format.format(time);
  }

  /// Format date and time
  String formatDateTime(DateTime dateTime, {String? datePattern, String? timePattern}) {
    final dateStr = formatDate(dateTime, pattern: datePattern);
    final timeStr = formatTime(dateTime, pattern: timePattern);
    return '$dateStr $timeStr';
  }

  /// Format relative time
  String formatRelativeTime(DateTime dateTime, {DateTime? baseDate}) {
    final base = baseDate ?? DateTime.now();
    final diff = dateTime.difference(base);
    final isPast = diff.isNegative;
    final absDiff = diff.abs();

    String unit;
    int n;

    if (absDiff.inSeconds < 60) {
      return _getRelativeTimeString('seconds', absDiff.inSeconds, isPast);
    } else if (absDiff.inMinutes == 1) {
      return _getRelativeTimeString('minute', 1, isPast);
    } else if (absDiff.inMinutes < 60) {
      return _getRelativeTimeString('minutes', absDiff.inMinutes, isPast);
    } else if (absDiff.inHours == 1) {
      return _getRelativeTimeString('hour', 1, isPast);
    } else if (absDiff.inHours < 24) {
      return _getRelativeTimeString('hours', absDiff.inHours, isPast);
    } else if (absDiff.inDays == 1) {
      return _getRelativeTimeString('day', 1, isPast);
    } else if (absDiff.inDays < 7) {
      return _getRelativeTimeString('days', absDiff.inDays, isPast);
    } else if (absDiff.inDays < 14) {
      return _getRelativeTimeString('week', 1, isPast);
    } else if (absDiff.inDays < 30) {
      return _getRelativeTimeString('weeks', (absDiff.inDays / 7).floor(), isPast);
    } else if (absDiff.inDays < 60) {
      return _getRelativeTimeString('month', 1, isPast);
    } else if (absDiff.inDays < 365) {
      return _getRelativeTimeString('months', (absDiff.inDays / 30).floor(), isPast);
    } else if (absDiff.inDays < 730) {
      return _getRelativeTimeString('year', 1, isPast);
    } else {
      return _getRelativeTimeString('years', (absDiff.inDays / 365).floor(), isPast);
    }
  }

  /// Get relative time string based on locale
  String _getRelativeTimeString(String unit, int n, bool isPast) {
    final baseLocale = _currentLocale.languageCode;
    final templates = _relativeTimeTemplates[baseLocale] ?? _relativeTimeTemplates['en']!;
    final template = templates[unit];

    if (template == null) {
      return isPast ? '$n $unit ago' : 'in $n $unit';
    }

    final str = isPast ? template['past']! : template['future']!;
    return str.replaceAll('{n}', n.toString());
  }

  /// Format compact number (1K, 1M, etc.)
  String formatCompactNumber(num value) {
    final format = NumberFormat.compact(locale: _currentLocale.code);
    return format.format(value);
  }

  /// Format percentage
  String formatPercentage(num value, {int decimalPlaces = 0}) {
    final format = NumberFormat.percentPattern(_currentLocale.code);
    format.maximumFractionDigits = decimalPlaces;
    return format.format(value);
  }

  /// Get month name
  String getMonthName(int month, {bool abbreviated = false}) {
    final format = DateFormat(abbreviated ? 'MMM' : 'MMMM', _currentLocale.code);
    return format.format(DateTime(2024, month));
  }

  /// Get day name
  String getDayName(int weekday, {bool abbreviated = false}) {
    final format = DateFormat(abbreviated ? 'EEE' : 'EEEE', _currentLocale.code);
    // weekday is 1-7 (Mon-Sun), DateTime expects 1-7
    return format.format(DateTime(2024, 1, weekday));
  }

  /// Get first day of week
  int get firstDayOfWeek => _currentInfo.firstDayOfWeek;

  /// Get currency symbol
  String getCurrencySymbol(String currencyCode) {
    return _currencySymbols[currencyCode] ?? currencyCode;
  }
}

/// Currency symbols
const Map<String, String> _currencySymbols = {
  'USD': '\$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CNY': '¥',
  'KRW': '₩',
  'INR': '₹',
  'BRL': 'R\$',
  'MXN': '\$',
  'RUB': '₽',
  'SAR': '﷼',
  'ILS': '₪',
  'PLN': 'zł',
  'TRY': '₺',
  'THB': '฿',
  'VND': '₫',
  'IDR': 'Rp',
  'MYR': 'RM',
  'TWD': 'NT\$',
};

/// Relative time templates by locale
const Map<String, Map<String, Map<String, String>>> _relativeTimeTemplates = {
  'en': {
    'seconds': {'past': '{n} seconds ago', 'future': 'in {n} seconds'},
    'minute': {'past': 'a minute ago', 'future': 'in a minute'},
    'minutes': {'past': '{n} minutes ago', 'future': 'in {n} minutes'},
    'hour': {'past': 'an hour ago', 'future': 'in an hour'},
    'hours': {'past': '{n} hours ago', 'future': 'in {n} hours'},
    'day': {'past': 'yesterday', 'future': 'tomorrow'},
    'days': {'past': '{n} days ago', 'future': 'in {n} days'},
    'week': {'past': 'last week', 'future': 'next week'},
    'weeks': {'past': '{n} weeks ago', 'future': 'in {n} weeks'},
    'month': {'past': 'last month', 'future': 'next month'},
    'months': {'past': '{n} months ago', 'future': 'in {n} months'},
    'year': {'past': 'last year', 'future': 'next year'},
    'years': {'past': '{n} years ago', 'future': 'in {n} years'},
  },
  'es': {
    'seconds': {'past': 'hace {n} segundos', 'future': 'en {n} segundos'},
    'minute': {'past': 'hace un minuto', 'future': 'en un minuto'},
    'minutes': {'past': 'hace {n} minutos', 'future': 'en {n} minutos'},
    'hour': {'past': 'hace una hora', 'future': 'en una hora'},
    'hours': {'past': 'hace {n} horas', 'future': 'en {n} horas'},
    'day': {'past': 'ayer', 'future': 'mañana'},
    'days': {'past': 'hace {n} días', 'future': 'en {n} días'},
    'week': {'past': 'la semana pasada', 'future': 'la próxima semana'},
    'weeks': {'past': 'hace {n} semanas', 'future': 'en {n} semanas'},
    'month': {'past': 'el mes pasado', 'future': 'el próximo mes'},
    'months': {'past': 'hace {n} meses', 'future': 'en {n} meses'},
    'year': {'past': 'el año pasado', 'future': 'el próximo año'},
    'years': {'past': 'hace {n} años', 'future': 'en {n} años'},
  },
  'fr': {
    'seconds': {'past': 'il y a {n} secondes', 'future': 'dans {n} secondes'},
    'minute': {'past': 'il y a une minute', 'future': 'dans une minute'},
    'minutes': {'past': 'il y a {n} minutes', 'future': 'dans {n} minutes'},
    'hour': {'past': 'il y a une heure', 'future': 'dans une heure'},
    'hours': {'past': 'il y a {n} heures', 'future': 'dans {n} heures'},
    'day': {'past': 'hier', 'future': 'demain'},
    'days': {'past': 'il y a {n} jours', 'future': 'dans {n} jours'},
    'week': {'past': 'la semaine dernière', 'future': 'la semaine prochaine'},
    'weeks': {'past': 'il y a {n} semaines', 'future': 'dans {n} semaines'},
    'month': {'past': 'le mois dernier', 'future': 'le mois prochain'},
    'months': {'past': 'il y a {n} mois', 'future': 'dans {n} mois'},
    'year': {'past': "l'année dernière", 'future': "l'année prochaine"},
    'years': {'past': 'il y a {n} ans', 'future': 'dans {n} ans'},
  },
  'de': {
    'seconds': {'past': 'vor {n} Sekunden', 'future': 'in {n} Sekunden'},
    'minute': {'past': 'vor einer Minute', 'future': 'in einer Minute'},
    'minutes': {'past': 'vor {n} Minuten', 'future': 'in {n} Minuten'},
    'hour': {'past': 'vor einer Stunde', 'future': 'in einer Stunde'},
    'hours': {'past': 'vor {n} Stunden', 'future': 'in {n} Stunden'},
    'day': {'past': 'gestern', 'future': 'morgen'},
    'days': {'past': 'vor {n} Tagen', 'future': 'in {n} Tagen'},
    'week': {'past': 'letzte Woche', 'future': 'nächste Woche'},
    'weeks': {'past': 'vor {n} Wochen', 'future': 'in {n} Wochen'},
    'month': {'past': 'letzten Monat', 'future': 'nächsten Monat'},
    'months': {'past': 'vor {n} Monaten', 'future': 'in {n} Monaten'},
    'year': {'past': 'letztes Jahr', 'future': 'nächstes Jahr'},
    'years': {'past': 'vor {n} Jahren', 'future': 'in {n} Jahren'},
  },
  'ja': {
    'seconds': {'past': '{n}秒前', 'future': '{n}秒後'},
    'minute': {'past': '1分前', 'future': '1分後'},
    'minutes': {'past': '{n}分前', 'future': '{n}分後'},
    'hour': {'past': '1時間前', 'future': '1時間後'},
    'hours': {'past': '{n}時間前', 'future': '{n}時間後'},
    'day': {'past': '昨日', 'future': '明日'},
    'days': {'past': '{n}日前', 'future': '{n}日後'},
    'week': {'past': '先週', 'future': '来週'},
    'weeks': {'past': '{n}週間前', 'future': '{n}週間後'},
    'month': {'past': '先月', 'future': '来月'},
    'months': {'past': '{n}ヶ月前', 'future': '{n}ヶ月後'},
    'year': {'past': '昨年', 'future': '来年'},
    'years': {'past': '{n}年前', 'future': '{n}年後'},
  },
  'zh': {
    'seconds': {'past': '{n}秒前', 'future': '{n}秒后'},
    'minute': {'past': '1分钟前', 'future': '1分钟后'},
    'minutes': {'past': '{n}分钟前', 'future': '{n}分钟后'},
    'hour': {'past': '1小时前', 'future': '1小时后'},
    'hours': {'past': '{n}小时前', 'future': '{n}小时后'},
    'day': {'past': '昨天', 'future': '明天'},
    'days': {'past': '{n}天前', 'future': '{n}天后'},
    'week': {'past': '上周', 'future': '下周'},
    'weeks': {'past': '{n}周前', 'future': '{n}周后'},
    'month': {'past': '上个月', 'future': '下个月'},
    'months': {'past': '{n}个月前', 'future': '{n}个月后'},
    'year': {'past': '去年', 'future': '明年'},
    'years': {'past': '{n}年前', 'future': '{n}年后'},
  },
  'ar': {
    'seconds': {'past': 'منذ {n} ثانية', 'future': 'بعد {n} ثانية'},
    'minute': {'past': 'منذ دقيقة', 'future': 'بعد دقيقة'},
    'minutes': {'past': 'منذ {n} دقائق', 'future': 'بعد {n} دقائق'},
    'hour': {'past': 'منذ ساعة', 'future': 'بعد ساعة'},
    'hours': {'past': 'منذ {n} ساعات', 'future': 'بعد {n} ساعات'},
    'day': {'past': 'أمس', 'future': 'غداً'},
    'days': {'past': 'منذ {n} أيام', 'future': 'بعد {n} أيام'},
    'week': {'past': 'الأسبوع الماضي', 'future': 'الأسبوع القادم'},
    'weeks': {'past': 'منذ {n} أسابيع', 'future': 'بعد {n} أسابيع'},
    'month': {'past': 'الشهر الماضي', 'future': 'الشهر القادم'},
    'months': {'past': 'منذ {n} أشهر', 'future': 'بعد {n} أشهر'},
    'year': {'past': 'العام الماضي', 'future': 'العام القادم'},
    'years': {'past': 'منذ {n} سنوات', 'future': 'بعد {n} سنوات'},
  },
};
