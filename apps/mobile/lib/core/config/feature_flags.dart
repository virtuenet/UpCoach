import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Feature flag storage key prefix
const String _featureFlagPrefix = 'feature_flag_';

/// Available feature flags for the UpCoach app
///
/// Use these to control feature rollout and hide incomplete features
enum Feature {
  // Health integrations
  fitbitIntegration,
  whoopIntegration,
  ouraIntegration,
  garminIntegration,
  appleHealthIntegration,
  googleFitIntegration,

  // Habit features
  habitAchievements,
  advancedHabitSettings,
  habitReminders,
  habitStreaks,

  // Progress photos features
  progressPhotoCategories,
  progressPhotoSettings,
  progressPhotoExport,
  aiPhotoAnalysis,

  // Messaging features
  videoCall,
  audioCall,
  liveChatSupport,

  // Offline features
  offlineSync,
  offlineImport,

  // AI features
  onDeviceAI,
  cloudAI,
  speechToText,

  // Gamification
  leaderboards,
  challenges,
  rewards,

  // Other features
  advancedHealthExport,
  videoTutorials,
  communityForums,
  marketplace,
}

/// Default values for each feature flag
///
/// Set to `true` for features that are ready for production
/// Set to `false` for features that are still in development
const Map<Feature, bool> _defaultFeatureValues = {
  // Health integrations - mostly enabled
  Feature.fitbitIntegration: true,
  Feature.whoopIntegration: true,
  Feature.ouraIntegration: true,
  Feature.garminIntegration: true,
  Feature.appleHealthIntegration: true,
  Feature.googleFitIntegration: true,

  // Habit features - core enabled, advanced disabled
  Feature.habitAchievements: true,
  Feature.advancedHabitSettings: false, // Coming soon
  Feature.habitReminders: true,
  Feature.habitStreaks: true,

  // Progress photos - basic enabled, advanced disabled
  Feature.progressPhotoCategories: false, // Coming soon
  Feature.progressPhotoSettings: false, // Coming soon
  Feature.progressPhotoExport: false, // Coming soon
  Feature.aiPhotoAnalysis: false, // Coming soon

  // Messaging - enabled
  Feature.videoCall: true,
  Feature.audioCall: true,
  Feature.liveChatSupport: false, // Coming soon

  // Offline features - mostly enabled
  Feature.offlineSync: true,
  Feature.offlineImport: false, // Coming soon

  // AI features - on-device disabled by default
  Feature.onDeviceAI: false, // Requires model download
  Feature.cloudAI: true,
  Feature.speechToText: true,

  // Gamification - enabled
  Feature.leaderboards: true,
  Feature.challenges: true,
  Feature.rewards: true,

  // Other features
  Feature.advancedHealthExport: false, // Coming soon
  Feature.videoTutorials: false, // Coming soon
  Feature.communityForums: true,
  Feature.marketplace: true,
};

/// Service for managing feature flags
class FeatureFlagService {
  static final FeatureFlagService _instance = FeatureFlagService._internal();
  factory FeatureFlagService() => _instance;
  FeatureFlagService._internal();

  SharedPreferences? _prefs;
  final Map<Feature, bool> _overrides = {};
  bool _initialized = false;

  /// Initialize the feature flag service
  Future<void> initialize() async {
    if (_initialized) return;
    _prefs = await SharedPreferences.getInstance();
    _loadOverrides();
    _initialized = true;
    debugPrint('FeatureFlagService initialized');
  }

  /// Load any saved overrides from SharedPreferences
  void _loadOverrides() {
    for (final feature in Feature.values) {
      final key = '$_featureFlagPrefix${feature.name}';
      if (_prefs!.containsKey(key)) {
        _overrides[feature] = _prefs!.getBool(key)!;
      }
    }
    debugPrint('Loaded ${_overrides.length} feature flag overrides');
  }

  /// Check if a feature is enabled
  bool isEnabled(Feature feature) {
    // Check for override first
    if (_overrides.containsKey(feature)) {
      return _overrides[feature]!;
    }

    // Fall back to default value
    return _defaultFeatureValues[feature] ?? false;
  }

  /// Enable a feature (for testing/admin purposes)
  Future<void> enableFeature(Feature feature) async {
    _overrides[feature] = true;
    await _saveOverride(feature, true);
    debugPrint('Feature ${feature.name} enabled');
  }

  /// Disable a feature (for testing/admin purposes)
  Future<void> disableFeature(Feature feature) async {
    _overrides[feature] = false;
    await _saveOverride(feature, false);
    debugPrint('Feature ${feature.name} disabled');
  }

  /// Reset a feature to its default value
  Future<void> resetFeature(Feature feature) async {
    _overrides.remove(feature);
    final key = '$_featureFlagPrefix${feature.name}';
    await _prefs?.remove(key);
    debugPrint('Feature ${feature.name} reset to default');
  }

  /// Reset all features to their default values
  Future<void> resetAllFeatures() async {
    _overrides.clear();
    for (final feature in Feature.values) {
      final key = '$_featureFlagPrefix${feature.name}';
      await _prefs?.remove(key);
    }
    debugPrint('All feature flags reset to defaults');
  }

  /// Save override to SharedPreferences
  Future<void> _saveOverride(Feature feature, bool value) async {
    final key = '$_featureFlagPrefix${feature.name}';
    await _prefs?.setBool(key, value);
  }

  /// Get all features and their current values
  Map<Feature, bool> getAllFeatures() {
    final result = <Feature, bool>{};
    for (final feature in Feature.values) {
      result[feature] = isEnabled(feature);
    }
    return result;
  }

  /// Get all "coming soon" features (disabled by default)
  List<Feature> getComingSoonFeatures() {
    return Feature.values
        .where((f) => _defaultFeatureValues[f] == false)
        .toList();
  }

  /// Get display name for a feature
  static String getFeatureDisplayName(Feature feature) {
    switch (feature) {
      case Feature.fitbitIntegration:
        return 'Fitbit Integration';
      case Feature.whoopIntegration:
        return 'WHOOP Integration';
      case Feature.ouraIntegration:
        return 'Oura Ring Integration';
      case Feature.garminIntegration:
        return 'Garmin Integration';
      case Feature.appleHealthIntegration:
        return 'Apple Health Integration';
      case Feature.googleFitIntegration:
        return 'Google Fit Integration';
      case Feature.habitAchievements:
        return 'Habit Achievements';
      case Feature.advancedHabitSettings:
        return 'Advanced Habit Settings';
      case Feature.habitReminders:
        return 'Habit Reminders';
      case Feature.habitStreaks:
        return 'Habit Streaks';
      case Feature.progressPhotoCategories:
        return 'Photo Categories';
      case Feature.progressPhotoSettings:
        return 'Photo Settings';
      case Feature.progressPhotoExport:
        return 'Photo Export';
      case Feature.aiPhotoAnalysis:
        return 'AI Photo Analysis';
      case Feature.videoCall:
        return 'Video Calling';
      case Feature.audioCall:
        return 'Voice Calling';
      case Feature.liveChatSupport:
        return 'Live Chat Support';
      case Feature.offlineSync:
        return 'Offline Sync';
      case Feature.offlineImport:
        return 'Offline Import';
      case Feature.onDeviceAI:
        return 'On-Device AI';
      case Feature.cloudAI:
        return 'Cloud AI';
      case Feature.speechToText:
        return 'Speech to Text';
      case Feature.leaderboards:
        return 'Leaderboards';
      case Feature.challenges:
        return 'Challenges';
      case Feature.rewards:
        return 'Rewards';
      case Feature.advancedHealthExport:
        return 'Advanced Health Export';
      case Feature.videoTutorials:
        return 'Video Tutorials';
      case Feature.communityForums:
        return 'Community Forums';
      case Feature.marketplace:
        return 'Marketplace';
    }
  }

  /// Get description for a feature
  static String getFeatureDescription(Feature feature) {
    switch (feature) {
      case Feature.fitbitIntegration:
        return 'Sync your Fitbit activity and health data';
      case Feature.whoopIntegration:
        return 'Connect your WHOOP band for recovery metrics';
      case Feature.ouraIntegration:
        return 'Import sleep and readiness data from Oura Ring';
      case Feature.garminIntegration:
        return 'Sync workouts and activities from Garmin devices';
      case Feature.appleHealthIntegration:
        return 'Connect to Apple Health for comprehensive health data';
      case Feature.googleFitIntegration:
        return 'Sync with Google Fit for activity tracking';
      case Feature.habitAchievements:
        return 'Earn achievements for completing habits';
      case Feature.advancedHabitSettings:
        return 'Configure advanced habit options and triggers';
      case Feature.habitReminders:
        return 'Get reminded to complete your habits';
      case Feature.habitStreaks:
        return 'Track your habit completion streaks';
      case Feature.progressPhotoCategories:
        return 'Organize photos into custom categories';
      case Feature.progressPhotoSettings:
        return 'Customize photo capture settings';
      case Feature.progressPhotoExport:
        return 'Export progress photos as collages or PDFs';
      case Feature.aiPhotoAnalysis:
        return 'AI-powered analysis of your progress photos';
      case Feature.videoCall:
        return 'Video call with your coach';
      case Feature.audioCall:
        return 'Voice call with your coach';
      case Feature.liveChatSupport:
        return 'Get instant help from support team';
      case Feature.offlineSync:
        return 'Work offline and sync when connected';
      case Feature.offlineImport:
        return 'Import data from files while offline';
      case Feature.onDeviceAI:
        return 'Run AI models on your device for privacy';
      case Feature.cloudAI:
        return 'Use cloud-based AI for advanced features';
      case Feature.speechToText:
        return 'Convert voice to text for journaling';
      case Feature.leaderboards:
        return 'Compete with others on leaderboards';
      case Feature.challenges:
        return 'Join challenges to earn rewards';
      case Feature.rewards:
        return 'Redeem points for rewards';
      case Feature.advancedHealthExport:
        return 'Export detailed health reports';
      case Feature.videoTutorials:
        return 'Watch tutorial videos for exercises';
      case Feature.communityForums:
        return 'Connect with the community in forums';
      case Feature.marketplace:
        return 'Browse coaching packages and resources';
    }
  }
}

// Providers

/// Provider for FeatureFlagService
final featureFlagServiceProvider = Provider<FeatureFlagService>((ref) {
  return FeatureFlagService();
});

/// Provider for checking if a specific feature is enabled
final isFeatureEnabledProvider =
    Provider.family<bool, Feature>((ref, feature) {
  final service = ref.watch(featureFlagServiceProvider);
  return service.isEnabled(feature);
});

/// Provider for getting all features and their states
final allFeaturesProvider = Provider<Map<Feature, bool>>((ref) {
  final service = ref.watch(featureFlagServiceProvider);
  return service.getAllFeatures();
});

/// Provider for "coming soon" features
final comingSoonFeaturesProvider = Provider<List<Feature>>((ref) {
  final service = ref.watch(featureFlagServiceProvider);
  return service.getComingSoonFeatures();
});

// Extension for easy feature checking in widgets

/// Extension on WidgetRef for easy feature flag checking
extension FeatureFlagExtension on WidgetRef {
  /// Check if a feature is enabled
  bool isFeatureEnabled(Feature feature) {
    return watch(isFeatureEnabledProvider(feature));
  }
}

/// Extension on Ref for easy feature flag checking in providers
extension FeatureFlagRefExtension on Ref {
  /// Check if a feature is enabled
  bool isFeatureEnabled(Feature feature) {
    return watch(isFeatureEnabledProvider(feature));
  }
}
