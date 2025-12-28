/// Locale Formatting Service - Phase 14 Week 3
/// Handles locale-specific formatting for dates, times, numbers, and currencies

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class LocaleFormattingService {
  final Locale locale;

  LocaleFormattingService(this.locale);

  /// Format date according to locale
  String formatDate(DateTime date, {String? pattern}) {
    if (pattern != null) {
      return DateFormat(pattern, locale.toString()).format(date);
    }

    // Use locale-specific default pattern
    switch (locale.languageCode) {
      case 'en':
        return DateFormat('MM/dd/yyyy', locale.toString()).format(date);
      case 'es':
      case 'pt':
      case 'fr':
        return DateFormat('dd/MM/yyyy', locale.toString()).format(date);
      case 'de':
        return DateFormat('dd.MM.yyyy', locale.toString()).format(date);
      case 'ja':
        return DateFormat('yyyy/MM/dd', locale.toString()).format(date);
      default:
        return DateFormat.yMd(locale.toString()).format(date);
    }
  }

  /// Format time according to locale
  String formatTime(DateTime time, {bool use24Hour = false}) {
    final bool shouldUse24Hour = use24Hour || _is24HourLocale();

    if (shouldUse24Hour) {
      return DateFormat.Hm(locale.toString()).format(time);
    } else {
      return DateFormat.jm(locale.toString()).format(time);
    }
  }

  /// Format date and time together
  String formatDateTime(DateTime dateTime, {bool use24Hour = false}) {
    final date = formatDate(dateTime);
    final time = formatTime(dateTime, use24Hour: use24Hour);
    return '$date $time';
  }

  /// Format relative time (e.g., "2 hours ago")
  String formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return _getRelativeString('seconds', difference.inSeconds);
    } else if (difference.inMinutes < 60) {
      return _getRelativeString('minutes', difference.inMinutes);
    } else if (difference.inHours < 24) {
      return _getRelativeString('hours', difference.inHours);
    } else if (difference.inDays < 7) {
      return _getRelativeString('days', difference.inDays);
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return _getRelativeString('weeks', weeks);
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return _getRelativeString('months', months);
    } else {
      final years = (difference.inDays / 365).floor();
      return _getRelativeString('years', years);
    }
  }

  /// Format number with locale-specific separators
  String formatNumber(num value, {int? decimalDigits}) {
    final formatter = decimalDigits != null
        ? NumberFormat.decimalPattern(locale.toString())
        : NumberFormat('#,##0.##', locale.toString());

    if (decimalDigits != null) {
      formatter.minimumFractionDigits = decimalDigits;
      formatter.maximumFractionDigits = decimalDigits;
    }

    return formatter.format(value);
  }

  /// Format currency
  String formatCurrency(num value, String currencyCode) {
    final formatter = NumberFormat.currency(
      locale: locale.toString(),
      symbol: _getCurrencySymbol(currencyCode),
      decimalDigits: _getCurrencyDecimals(currencyCode),
    );

    return formatter.format(value);
  }

  /// Format compact number (e.g., 1.5K, 2.3M)
  String formatCompactNumber(num value) {
    final formatter = NumberFormat.compact(locale: locale.toString());
    return formatter.format(value);
  }

  /// Format percentage
  String formatPercentage(num value, {int decimalDigits = 0}) {
    final formatter = NumberFormat.percentPattern(locale.toString());
    formatter.minimumFractionDigits = decimalDigits;
    formatter.maximumFractionDigits = decimalDigits;
    return formatter.format(value / 100);
  }

  /// Get greeting based on time of day
  String getGreeting() {
    final hour = DateTime.now().hour;

    switch (locale.languageCode) {
      case 'en':
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
      case 'es':
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
      case 'pt':
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
      case 'fr':
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
      case 'de':
        if (hour < 12) return 'Guten Morgen';
        if (hour < 18) return 'Guten Tag';
        return 'Guten Abend';
      case 'ja':
        if (hour < 12) return 'おはようございます';
        if (hour < 18) return 'こんにちは';
        return 'こんばんは';
      default:
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }
  }

  /// Get first day of week (0 = Sunday, 1 = Monday)
  int getFirstDayOfWeek() {
    // Most locales use Monday (1), except US, Canada, Japan use Sunday (0)
    switch (locale.countryCode) {
      case 'US':
      case 'CA':
      case 'JP':
      case 'BR':
        return DateTime.sunday;
      default:
        return DateTime.monday;
    }
  }

  /// Get week start date
  DateTime getWeekStartDate(DateTime date) {
    final firstDayOfWeek = getFirstDayOfWeek();
    final currentDay = date.weekday % 7; // Convert to 0-6
    final diff = (currentDay - firstDayOfWeek + 7) % 7;

    return date.subtract(Duration(days: diff));
  }

  /// Check if date is weekend
  bool isWeekend(DateTime date) {
    // Most countries: Saturday and Sunday
    // Some Middle Eastern countries: Friday and Saturday
    switch (locale.countryCode) {
      case 'SA': // Saudi Arabia
      case 'AE': // UAE
        return date.weekday == DateTime.friday || date.weekday == DateTime.saturday;
      default:
        return date.weekday == DateTime.saturday || date.weekday == DateTime.sunday;
    }
  }

  /// Format name based on cultural conventions
  String formatName(String firstName, String lastName) {
    switch (locale.languageCode) {
      case 'ja':
      case 'ko':
      case 'zh':
        // East Asian: Last name first
        return '$lastName $firstName';
      default:
        // Western: First name first
        return '$firstName $lastName';
    }
  }

  /// Get measurement system
  String getMeasurementSystem() {
    switch (locale.countryCode) {
      case 'US':
      case 'LR': // Liberia
      case 'MM': // Myanmar
        return 'imperial';
      default:
        return 'metric';
    }
  }

  /// Convert distance based on locale
  String formatDistance(double kilometers) {
    if (getMeasurementSystem() == 'imperial') {
      final miles = kilometers * 0.621371;
      return '${formatNumber(miles, decimalDigits: 1)} mi';
    } else {
      return '${formatNumber(kilometers, decimalDigits: 1)} km';
    }
  }

  /// Convert weight based on locale
  String formatWeight(double kilograms) {
    if (getMeasurementSystem() == 'imperial') {
      final pounds = kilograms * 2.20462;
      return '${formatNumber(pounds, decimalDigits: 1)} lb';
    } else {
      return '${formatNumber(kilograms, decimalDigits: 1)} kg';
    }
  }

  /// Convert temperature based on locale
  String formatTemperature(double celsius) {
    if (getMeasurementSystem() == 'imperial') {
      final fahrenheit = (celsius * 9 / 5) + 32;
      return '${formatNumber(fahrenheit, decimalDigits: 0)}°F';
    } else {
      return '${formatNumber(celsius, decimalDigits: 0)}°C';
    }
  }

  /// Check if locale uses 24-hour time format
  bool _is24HourLocale() {
    switch (locale.countryCode) {
      case 'US':
      case 'CA':
      case 'AU':
      case 'NZ':
      case 'PH':
        return false; // 12-hour format
      default:
        return true; // 24-hour format
    }
  }

  /// Get relative time string
  String _getRelativeString(String unit, int count) {
    if (count == 0) {
      return _getJustNowString();
    }

    switch (locale.languageCode) {
      case 'en':
        final plural = count == 1 ? unit.substring(0, unit.length - 1) : unit;
        return '$count $plural ago';
      case 'es':
        final units = {
          'seconds': 'segundos',
          'minutes': 'minutos',
          'hours': 'horas',
          'days': 'días',
          'weeks': 'semanas',
          'months': 'meses',
          'years': 'años',
        };
        return 'hace $count ${units[unit] ?? unit}';
      case 'pt':
        final units = {
          'seconds': 'segundos',
          'minutes': 'minutos',
          'hours': 'horas',
          'days': 'dias',
          'weeks': 'semanas',
          'months': 'meses',
          'years': 'anos',
        };
        return 'há $count ${units[unit] ?? unit}';
      case 'fr':
        final units = {
          'seconds': 'secondes',
          'minutes': 'minutes',
          'hours': 'heures',
          'days': 'jours',
          'weeks': 'semaines',
          'months': 'mois',
          'years': 'ans',
        };
        return 'il y a $count ${units[unit] ?? unit}';
      case 'de':
        final units = {
          'seconds': 'Sekunden',
          'minutes': 'Minuten',
          'hours': 'Stunden',
          'days': 'Tagen',
          'weeks': 'Wochen',
          'months': 'Monaten',
          'years': 'Jahren',
        };
        return 'vor $count ${units[unit] ?? unit}';
      case 'ja':
        final units = {
          'seconds': '秒',
          'minutes': '分',
          'hours': '時間',
          'days': '日',
          'weeks': '週間',
          'months': 'ヶ月',
          'years': '年',
        };
        return '$count${units[unit] ?? unit}前';
      default:
        return '$count $unit ago';
    }
  }

  /// Get "just now" string
  String _getJustNowString() {
    switch (locale.languageCode) {
      case 'en':
        return 'just now';
      case 'es':
        return 'justo ahora';
      case 'pt':
        return 'agora mesmo';
      case 'fr':
        return 'à l\'instant';
      case 'de':
        return 'gerade eben';
      case 'ja':
        return 'たった今';
      default:
        return 'just now';
    }
  }

  /// Get currency symbol
  String _getCurrencySymbol(String currencyCode) {
    const symbols = {
      'USD': '\$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'BRL': 'R\$',
      'CAD': 'CA\$',
      'AUD': 'A\$',
      'MXN': '\$',
      'INR': '₹',
    };
    return symbols[currencyCode] ?? currencyCode;
  }

  /// Get currency decimal places
  int _getCurrencyDecimals(String currencyCode) {
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
    return zeroDecimalCurrencies.contains(currencyCode) ? 0 : 2;
  }
}
