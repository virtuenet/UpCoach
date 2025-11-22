import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_settings.freezed.dart';
part 'user_settings.g.dart';

/// Simplified User Settings model for essential features only
@freezed
class UserSettings with _$UserSettings {
  const factory UserSettings({
    // Language settings
    @Default('en') String languageCode,
    @Default('US') String countryCode,

    // Notification settings
    @Default(true) bool pushNotificationsEnabled,
    @Default(true) bool emailNotificationsEnabled,
    @Default(true) bool habitRemindersEnabled,
    @Default(true) bool goalRemindersEnabled,

    // Privacy settings
    @Default(false) bool biometricAuthEnabled,
    @Default(true) bool analyticsEnabled,

    // Display settings
    @Default('system') String themeMode, // light, dark, system
    @Default('medium') String fontSize, // small, medium, large

    // Data management
    @Default(true) bool autoBackupEnabled,
    DateTime? lastBackupDate,
    DateTime? lastExportDate,

    // App behavior
    @Default(true) bool showOnboarding,
    @Default(true) bool soundEffectsEnabled,
    @Default(true) bool hapticsEnabled,

    required DateTime updatedAt,
  }) = _UserSettings;

  factory UserSettings.fromJson(Map<String, dynamic> json) =>
      _$UserSettingsFromJson(json);

  factory UserSettings.fromDatabase(Map<String, dynamic> map) {
    // Convert database key-value pairs to UserSettings object
    return UserSettings(
      languageCode: _getString(map, 'language_code', 'en'),
      countryCode: _getString(map, 'country_code', 'US'),
      pushNotificationsEnabled: _getBool(map, 'push_notifications', true),
      emailNotificationsEnabled: _getBool(map, 'email_notifications', true),
      habitRemindersEnabled: _getBool(map, 'habit_reminders', true),
      goalRemindersEnabled: _getBool(map, 'goal_reminders', true),
      biometricAuthEnabled: _getBool(map, 'biometric_auth', false),
      analyticsEnabled: _getBool(map, 'analytics_enabled', true),
      themeMode: _getString(map, 'theme_mode', 'system'),
      fontSize: _getString(map, 'font_size', 'medium'),
      autoBackupEnabled: _getBool(map, 'auto_backup', true),
      lastBackupDate: _getDateTime(map, 'last_backup_date'),
      lastExportDate: _getDateTime(map, 'last_export_date'),
      showOnboarding: _getBool(map, 'show_onboarding', true),
      soundEffectsEnabled: _getBool(map, 'sound_effects', true),
      hapticsEnabled: _getBool(map, 'haptics', true),
      updatedAt: _getDateTime(map, 'updated_at') ?? DateTime.now(),
    );
  }

  static String _getString(Map<String, dynamic> map, String key, String defaultValue) {
    return map[key] as String? ?? defaultValue;
  }

  static bool _getBool(Map<String, dynamic> map, String key, bool defaultValue) {
    final value = map[key];
    if (value == null) return defaultValue;
    if (value is bool) return value;
    if (value is String) return value.toLowerCase() == 'true' || value == '1';
    if (value is int) return value == 1;
    return defaultValue;
  }

  static DateTime? _getDateTime(Map<String, dynamic> map, String key) {
    final value = map[key];
    if (value == null) return null;
    if (value is String) {
      final milliseconds = int.tryParse(value);
      if (milliseconds != null) {
        return DateTime.fromMillisecondsSinceEpoch(milliseconds);
      }
    }
    return null;
  }
}

extension UserSettingsExtension on UserSettings {
  /// Convert settings to database key-value pairs
  Map<String, String> toDatabaseEntries() {
    return {
      'language_code': languageCode,
      'country_code': countryCode,
      'push_notifications': pushNotificationsEnabled.toString(),
      'email_notifications': emailNotificationsEnabled.toString(),
      'habit_reminders': habitRemindersEnabled.toString(),
      'goal_reminders': goalRemindersEnabled.toString(),
      'biometric_auth': biometricAuthEnabled.toString(),
      'analytics_enabled': analyticsEnabled.toString(),
      'theme_mode': themeMode,
      'font_size': fontSize,
      'auto_backup': autoBackupEnabled.toString(),
      'last_backup_date': lastBackupDate?.millisecondsSinceEpoch.toString() ?? '',
      'last_export_date': lastExportDate?.millisecondsSinceEpoch.toString() ?? '',
      'show_onboarding': showOnboarding.toString(),
      'sound_effects': soundEffectsEnabled.toString(),
      'haptics': hapticsEnabled.toString(),
      'updated_at': updatedAt.millisecondsSinceEpoch.toString(),
    };
  }

  String get localeString => '${languageCode}_$countryCode';
}