/// Cultural Adaptation Service
///
/// Handles cultural adaptations beyond translations including:
/// - Date/time formatting preferences
/// - Number and currency formatting
/// - Color and imagery preferences
/// - Content sensitivity
/// - Cultural calendar support

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'locale_service.dart';
import 'i18n_provider.dart';

/// Cultural region classification
enum CulturalRegion {
  westernEurope,
  easternEurope,
  northAmerica,
  latinAmerica,
  middleEast,
  eastAsia,
  southAsia,
  southeastAsia,
  africa,
  oceania,
}

/// Calendar system
enum CalendarSystem {
  gregorian,
  islamic,
  hebrew,
  chinese,
  japanese,
  persian,
  thai,
}

/// Week start preference
enum WeekStart {
  sunday, // US, Canada, Japan
  monday, // Most of Europe, China
  saturday, // Middle East
}

/// Cultural color associations
class CulturalColorPalette {
  final Color success;
  final Color warning;
  final Color error;
  final Color celebration;
  final Color mourning;
  final Color prosperity;
  final Color luck;

  const CulturalColorPalette({
    required this.success,
    required this.warning,
    required this.error,
    required this.celebration,
    required this.mourning,
    required this.prosperity,
    required this.luck,
  });
}

/// Cultural preferences for a locale
class CulturalPreferences {
  final String locale;
  final CulturalRegion region;
  final CalendarSystem primaryCalendar;
  final CalendarSystem? secondaryCalendar;
  final WeekStart weekStart;
  final bool use24HourClock;
  final bool showSecondsInTime;
  final String dateFormatPattern;
  final String timeFormatPattern;
  final CulturalColorPalette colorPalette;
  final List<String> holidays;
  final bool avoidRedForPositive;
  final bool preferFormalAddress;
  final String currencyPosition; // 'before' or 'after'
  final String currencySpacing; // 'space' or 'none'
  final List<String> sensitiveTopics;

  const CulturalPreferences({
    required this.locale,
    required this.region,
    required this.primaryCalendar,
    this.secondaryCalendar,
    required this.weekStart,
    required this.use24HourClock,
    this.showSecondsInTime = false,
    required this.dateFormatPattern,
    required this.timeFormatPattern,
    required this.colorPalette,
    this.holidays = const [],
    this.avoidRedForPositive = false,
    this.preferFormalAddress = false,
    this.currencyPosition = 'before',
    this.currencySpacing = 'none',
    this.sensitiveTopics = const [],
  });
}

/// Cultural Adaptation Service
class CulturalAdaptationService {
  static CulturalAdaptationService? _instance;

  // Cultural preferences by locale
  final Map<String, CulturalPreferences> _preferences = {};

  CulturalAdaptationService._() {
    _initializePreferences();
  }

  factory CulturalAdaptationService() {
    _instance ??= CulturalAdaptationService._();
    return _instance!;
  }

  void _initializePreferences() {
    // Western defaults (US)
    const westernColors = CulturalColorPalette(
      success: Color(0xFF22C55E), // Green
      warning: Color(0xFFF59E0B), // Orange
      error: Color(0xFFEF4444), // Red
      celebration: Color(0xFF6366F1), // Purple
      mourning: Color(0xFF1F2937), // Dark gray
      prosperity: Color(0xFF22C55E), // Green (money)
      luck: Color(0xFF22C55E), // Green
    );

    // East Asian colors (China)
    const eastAsianColors = CulturalColorPalette(
      success: Color(0xFF22C55E), // Green
      warning: Color(0xFFF59E0B), // Orange
      error: Color(0xFFEF4444), // Red
      celebration: Color(0xFFEF4444), // Red (lucky)
      mourning: Color(0xFFFFFFFF), // White
      prosperity: Color(0xFFEF4444), // Red
      luck: Color(0xFFEF4444), // Red
    );

    // Middle Eastern colors
    const middleEasternColors = CulturalColorPalette(
      success: Color(0xFF22C55E), // Green (Islamic)
      warning: Color(0xFFF59E0B), // Orange
      error: Color(0xFFEF4444), // Red
      celebration: Color(0xFF22C55E), // Green
      mourning: Color(0xFF1F2937), // Black
      prosperity: Color(0xFFFFD700), // Gold
      luck: Color(0xFF22C55E), // Green
    );

    // English (US)
    _preferences['en'] = CulturalPreferences(
      locale: 'en',
      region: CulturalRegion.northAmerica,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.sunday,
      use24HourClock: false,
      dateFormatPattern: 'MM/dd/yyyy',
      timeFormatPattern: 'h:mm a',
      colorPalette: westernColors,
      holidays: ['christmas', 'thanksgiving', 'independence_day'],
      currencyPosition: 'before',
    );

    // English (UK)
    _preferences['en-GB'] = CulturalPreferences(
      locale: 'en-GB',
      region: CulturalRegion.westernEurope,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.monday,
      use24HourClock: false,
      dateFormatPattern: 'dd/MM/yyyy',
      timeFormatPattern: 'HH:mm',
      colorPalette: westernColors,
      holidays: ['christmas', 'easter', 'bank_holidays'],
      currencyPosition: 'before',
    );

    // Spanish
    _preferences['es'] = CulturalPreferences(
      locale: 'es',
      region: CulturalRegion.westernEurope,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.monday,
      use24HourClock: true,
      dateFormatPattern: 'dd/MM/yyyy',
      timeFormatPattern: 'HH:mm',
      colorPalette: westernColors,
      holidays: ['christmas', 'easter', 'dia_de_los_reyes'],
      currencyPosition: 'after',
      currencySpacing: 'space',
    );

    // French
    _preferences['fr'] = CulturalPreferences(
      locale: 'fr',
      region: CulturalRegion.westernEurope,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.monday,
      use24HourClock: true,
      dateFormatPattern: 'dd/MM/yyyy',
      timeFormatPattern: 'HH:mm',
      colorPalette: westernColors,
      holidays: ['christmas', 'bastille_day', 'all_saints'],
      preferFormalAddress: true,
      currencyPosition: 'after',
      currencySpacing: 'space',
    );

    // German
    _preferences['de'] = CulturalPreferences(
      locale: 'de',
      region: CulturalRegion.westernEurope,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.monday,
      use24HourClock: true,
      dateFormatPattern: 'dd.MM.yyyy',
      timeFormatPattern: 'HH:mm',
      colorPalette: westernColors,
      holidays: ['christmas', 'easter', 'german_unity_day'],
      preferFormalAddress: true,
      currencyPosition: 'after',
      currencySpacing: 'space',
    );

    // Japanese
    _preferences['ja'] = CulturalPreferences(
      locale: 'ja',
      region: CulturalRegion.eastAsia,
      primaryCalendar: CalendarSystem.gregorian,
      secondaryCalendar: CalendarSystem.japanese,
      weekStart: WeekStart.sunday,
      use24HourClock: true,
      dateFormatPattern: 'yyyy/MM/dd',
      timeFormatPattern: 'HH:mm',
      colorPalette: eastAsianColors,
      holidays: ['new_year', 'golden_week', 'obon'],
      preferFormalAddress: true,
      avoidRedForPositive: false,
      currencyPosition: 'before',
    );

    // Chinese (Simplified)
    _preferences['zh'] = CulturalPreferences(
      locale: 'zh',
      region: CulturalRegion.eastAsia,
      primaryCalendar: CalendarSystem.gregorian,
      secondaryCalendar: CalendarSystem.chinese,
      weekStart: WeekStart.monday,
      use24HourClock: true,
      dateFormatPattern: 'yyyy-MM-dd',
      timeFormatPattern: 'HH:mm',
      colorPalette: eastAsianColors,
      holidays: ['chinese_new_year', 'mid_autumn', 'qingming'],
      avoidRedForPositive: false,
      currencyPosition: 'before',
    );

    // Arabic
    _preferences['ar'] = CulturalPreferences(
      locale: 'ar',
      region: CulturalRegion.middleEast,
      primaryCalendar: CalendarSystem.gregorian,
      secondaryCalendar: CalendarSystem.islamic,
      weekStart: WeekStart.saturday,
      use24HourClock: false,
      dateFormatPattern: 'dd/MM/yyyy',
      timeFormatPattern: 'hh:mm',
      colorPalette: middleEasternColors,
      holidays: ['eid_al_fitr', 'eid_al_adha', 'mawlid'],
      preferFormalAddress: true,
      sensitiveTopics: ['alcohol', 'gambling', 'pork'],
      currencyPosition: 'after',
      currencySpacing: 'space',
    );

    // Hebrew
    _preferences['he'] = CulturalPreferences(
      locale: 'he',
      region: CulturalRegion.middleEast,
      primaryCalendar: CalendarSystem.gregorian,
      secondaryCalendar: CalendarSystem.hebrew,
      weekStart: WeekStart.sunday,
      use24HourClock: true,
      dateFormatPattern: 'dd/MM/yyyy',
      timeFormatPattern: 'HH:mm',
      colorPalette: middleEasternColors,
      holidays: ['rosh_hashanah', 'yom_kippur', 'passover'],
      currencyPosition: 'after',
      currencySpacing: 'space',
    );

    // Korean
    _preferences['ko'] = CulturalPreferences(
      locale: 'ko',
      region: CulturalRegion.eastAsia,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.sunday,
      use24HourClock: true,
      dateFormatPattern: 'yyyy.MM.dd',
      timeFormatPattern: 'HH:mm',
      colorPalette: eastAsianColors,
      holidays: ['seollal', 'chuseok'],
      preferFormalAddress: true,
      currencyPosition: 'before',
    );

    // Portuguese (Brazil)
    _preferences['pt-BR'] = CulturalPreferences(
      locale: 'pt-BR',
      region: CulturalRegion.latinAmerica,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.sunday,
      use24HourClock: true,
      dateFormatPattern: 'dd/MM/yyyy',
      timeFormatPattern: 'HH:mm',
      colorPalette: westernColors,
      holidays: ['christmas', 'carnival', 'independence_day'],
      currencyPosition: 'before',
      currencySpacing: 'space',
    );

    // Hindi
    _preferences['hi'] = CulturalPreferences(
      locale: 'hi',
      region: CulturalRegion.southAsia,
      primaryCalendar: CalendarSystem.gregorian,
      weekStart: WeekStart.sunday,
      use24HourClock: false,
      dateFormatPattern: 'dd/MM/yyyy',
      timeFormatPattern: 'h:mm a',
      colorPalette: CulturalColorPalette(
        success: Color(0xFF22C55E),
        warning: Color(0xFFF59E0B),
        error: Color(0xFFEF4444),
        celebration: Color(0xFFF59E0B), // Orange/Saffron
        mourning: Color(0xFFFFFFFF), // White
        prosperity: Color(0xFF22C55E), // Green
        luck: Color(0xFFEF4444), // Red
      ),
      holidays: ['diwali', 'holi', 'ganesh_chaturthi'],
      currencyPosition: 'before',
    );
  }

  /// Get cultural preferences for a locale
  CulturalPreferences getPreferences(String locale) {
    // Try exact match
    if (_preferences.containsKey(locale)) {
      return _preferences[locale]!;
    }

    // Try base locale (e.g., 'en' for 'en-US')
    final baseLocale = locale.split('-')[0].split('_')[0];
    if (_preferences.containsKey(baseLocale)) {
      return _preferences[baseLocale]!;
    }

    // Default to English
    return _preferences['en']!;
  }

  /// Get all available preferences
  Map<String, CulturalPreferences> getAllPreferences() {
    return Map.unmodifiable(_preferences);
  }

  /// Check if locale uses 24-hour clock
  bool uses24HourClock(String locale) {
    return getPreferences(locale).use24HourClock;
  }

  /// Get week start day for locale
  WeekStart getWeekStart(String locale) {
    return getPreferences(locale).weekStart;
  }

  /// Get week start day as integer (0 = Sunday, 1 = Monday, etc.)
  int getWeekStartDay(String locale) {
    final weekStart = getWeekStart(locale);
    switch (weekStart) {
      case WeekStart.sunday:
        return DateTime.sunday;
      case WeekStart.monday:
        return DateTime.monday;
      case WeekStart.saturday:
        return DateTime.saturday;
    }
  }

  /// Get appropriate success color for locale
  Color getSuccessColor(String locale) {
    final prefs = getPreferences(locale);
    // Some cultures (e.g., China) use red for positive/success
    if (prefs.avoidRedForPositive) {
      return prefs.colorPalette.success;
    }
    return prefs.colorPalette.success;
  }

  /// Get celebration color for locale
  Color getCelebrationColor(String locale) {
    return getPreferences(locale).colorPalette.celebration;
  }

  /// Get luck/prosperity color for locale
  Color getLuckColor(String locale) {
    return getPreferences(locale).colorPalette.luck;
  }

  /// Check if topic is sensitive for locale
  bool isSensitiveTopic(String locale, String topic) {
    return getPreferences(locale).sensitiveTopics.contains(topic.toLowerCase());
  }

  /// Get date format pattern for locale
  String getDateFormat(String locale) {
    return getPreferences(locale).dateFormatPattern;
  }

  /// Get time format pattern for locale
  String getTimeFormat(String locale) {
    return getPreferences(locale).timeFormatPattern;
  }

  /// Check if formal address is preferred
  bool prefersFormalAddress(String locale) {
    return getPreferences(locale).preferFormalAddress;
  }

  /// Get currency format for locale
  ({String position, String spacing}) getCurrencyFormat(String locale) {
    final prefs = getPreferences(locale);
    return (position: prefs.currencyPosition, spacing: prefs.currencySpacing);
  }

  /// Get calendar systems for locale
  List<CalendarSystem> getCalendarSystems(String locale) {
    final prefs = getPreferences(locale);
    final systems = [prefs.primaryCalendar];
    if (prefs.secondaryCalendar != null) {
      systems.add(prefs.secondaryCalendar!);
    }
    return systems;
  }

  /// Get cultural region for locale
  CulturalRegion getRegion(String locale) {
    return getPreferences(locale).region;
  }
}

/// Singleton getter
CulturalAdaptationService get culturalAdaptationService =>
    CulturalAdaptationService();

// ============================================================================
// Riverpod Providers
// ============================================================================

/// Cultural adaptation service provider
final culturalAdaptationServiceProvider =
    Provider<CulturalAdaptationService>((ref) {
  return CulturalAdaptationService();
});

/// Cultural preferences provider
final culturalPreferencesProvider = Provider<CulturalPreferences>((ref) {
  final service = ref.watch(culturalAdaptationServiceProvider);
  final locale = ref.watch(currentLocaleProvider);
  return service.getPreferences(locale.code);
});

/// 24-hour clock preference provider
final use24HourClockProvider = Provider<bool>((ref) {
  final prefs = ref.watch(culturalPreferencesProvider);
  return prefs.use24HourClock;
});

/// Week start provider
final weekStartProvider = Provider<WeekStart>((ref) {
  final prefs = ref.watch(culturalPreferencesProvider);
  return prefs.weekStart;
});

/// Week start day provider (as DateTime weekday int)
final weekStartDayProvider = Provider<int>((ref) {
  final service = ref.watch(culturalAdaptationServiceProvider);
  final locale = ref.watch(currentLocaleProvider);
  return service.getWeekStartDay(locale.code);
});

/// Formal address preference provider
final preferFormalAddressProvider = Provider<bool>((ref) {
  final prefs = ref.watch(culturalPreferencesProvider);
  return prefs.preferFormalAddress;
});

/// Cultural color palette provider
final culturalColorsProvider = Provider<CulturalColorPalette>((ref) {
  final prefs = ref.watch(culturalPreferencesProvider);
  return prefs.colorPalette;
});

/// Cultural region provider
final culturalRegionProvider = Provider<CulturalRegion>((ref) {
  final prefs = ref.watch(culturalPreferencesProvider);
  return prefs.region;
});

// ============================================================================
// Cultural Adaptation Widgets
// ============================================================================

/// Widget that adapts its appearance based on cultural preferences
class CulturallyAdaptiveContainer extends ConsumerWidget {
  final Widget child;
  final Color? successColor;
  final Color? celebrationColor;
  final bool useSuccess;
  final bool useCelebration;

  const CulturallyAdaptiveContainer({
    super.key,
    required this.child,
    this.successColor,
    this.celebrationColor,
    this.useSuccess = false,
    this.useCelebration = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(culturalColorsProvider);

    Color? backgroundColor;
    if (useSuccess) {
      backgroundColor = successColor ?? colors.success.withOpacity(0.1);
    } else if (useCelebration) {
      backgroundColor = celebrationColor ?? colors.celebration.withOpacity(0.1);
    }

    return Container(
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }
}

/// Widget that displays culturally appropriate date
class CulturalDate extends ConsumerWidget {
  final DateTime date;
  final TextStyle? style;
  final bool showSecondaryCalendar;

  const CulturalDate({
    super.key,
    required this.date,
    this.style,
    this.showSecondaryCalendar = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(currentLocaleProvider);
    final localeService = ref.watch(localeServiceProvider);

    final formattedDate = localeService.formatDate(date);

    return Text(
      formattedDate,
      style: style,
    );
  }
}

/// Widget that displays culturally appropriate time
class CulturalTime extends ConsumerWidget {
  final DateTime time;
  final TextStyle? style;
  final bool showSeconds;

  const CulturalTime({
    super.key,
    required this.time,
    this.style,
    this.showSeconds = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localeService = ref.watch(localeServiceProvider);
    final use24Hour = ref.watch(use24HourClockProvider);

    final pattern = use24Hour
        ? (showSeconds ? 'HH:mm:ss' : 'HH:mm')
        : (showSeconds ? 'h:mm:ss a' : 'h:mm a');

    final formattedTime = localeService.formatDate(time, pattern: pattern);

    return Text(
      formattedTime,
      style: style,
    );
  }
}

/// Widget that shows celebration badge with cultural colors
class CelebrationBadge extends ConsumerWidget {
  final String text;
  final IconData? icon;

  const CelebrationBadge({
    super.key,
    required this.text,
    this.icon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(culturalColorsProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: colors.celebration,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 6),
          ],
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

/// Widget that shows success indicator with cultural colors
class CulturalSuccessIndicator extends ConsumerWidget {
  final bool isSuccess;
  final String? label;
  final double size;

  const CulturalSuccessIndicator({
    super.key,
    required this.isSuccess,
    this.label,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(culturalColorsProvider);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: isSuccess ? colors.success : colors.error,
            shape: BoxShape.circle,
          ),
          child: Icon(
            isSuccess ? Icons.check : Icons.close,
            color: Colors.white,
            size: size * 0.6,
          ),
        ),
        if (label != null) ...[
          const SizedBox(width: 8),
          Text(
            label!,
            style: TextStyle(
              color: isSuccess ? colors.success : colors.error,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }
}
