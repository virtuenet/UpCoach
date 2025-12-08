/// App Store and Play Store metadata for UpCoach
library;

/// App Store metadata for iOS/macOS
class AppStoreMetadata {
  // App Identity
  static const String appName = 'UpCoach';
  static const String subtitle = 'AI-Powered Personal Coaching';
  static const String bundleId = 'com.upcoach.mobile';

  // App Store Connect Categories
  static const String primaryCategory = 'Health & Fitness';
  static const String secondaryCategory = 'Lifestyle';

  // Age Rating
  static const String ageRating = '4+';

  // Short Description (30 characters max)
  static const String promotionalText = 'Your AI coaching companion';

  // Description (4000 characters max)
  static const String description = '''
UpCoach is your personal AI-powered coaching companion designed to help you build better habits, achieve your goals, and transform your life.

KEY FEATURES:

AI Voice Coach
Talk to your personal AI coach anytime. Get real-time guidance, motivation, and personalized advice using advanced voice AI technology.

Smart Habit Tracking
Build lasting habits with intelligent tracking, streaks, and progress analytics. UpCoach learns your patterns and adapts to help you succeed.

Goal Setting & Progress
Set meaningful goals and track your journey with visual progress charts, milestones, and achievements.

Mood & Wellness Tracking
Monitor your emotional well-being with daily mood check-ins, journaling, and wellness insights.

Voice Journal
Capture your thoughts effortlessly with voice-to-text journaling. Reflect on your day and track your personal growth.

Community Support
Connect with like-minded individuals, share achievements, and get inspired by others on their coaching journey.

Gamification & Rewards
Stay motivated with points, badges, achievements, and leaderboards. Make self-improvement fun and engaging.

Personalized Insights
Get AI-powered insights and recommendations tailored to your unique goals, habits, and progress patterns.

Offline Support
Continue your coaching journey even without internet. Full offline functionality with automatic sync when connected.

WHY UPCOACH?

UpCoach combines the power of AI with proven coaching methodologies to deliver a personalized experience that adapts to you. Whether you're building new habits, breaking old ones, or working toward ambitious goals, UpCoach is your dedicated partner every step of the way.

Start your transformation today with UpCoach!
''';

  // Keywords (100 characters max, comma-separated)
  static const String keywords =
      'coaching,habits,goals,AI,wellness,health,productivity,mindfulness,motivation,tracking';

  // What's New (4000 characters max)
  static const String whatsNew = '''
Version 1.0.0 - Initial Release

Introducing UpCoach - Your AI-Powered Personal Coaching Companion!

- AI Voice Coach for personalized guidance
- Smart habit tracking with streaks
- Goal setting and progress tracking
- Mood and wellness monitoring
- Voice journaling with transcription
- Community features for support
- Gamification with achievements
- Full offline support
- 5 languages: English, Spanish, French, Indonesian, Arabic
- Accessibility features for all users
''';

  // Support URLs
  static const String supportUrl = 'https://upcoach.com/support';
  static const String privacyPolicyUrl = 'https://upcoach.com/privacy';
  static const String termsOfServiceUrl = 'https://upcoach.com/terms';
  static const String marketingUrl = 'https://upcoach.com';

  // Screenshot sizes for App Store (in pixels)
  static const Map<String, List<int>> screenshotSizes = {
    'iphone_6_7_8': [1242, 2208], // 5.5" Display
    'iphone_6_7_8_plus': [1242, 2208], // 5.5" Display
    'iphone_x_xs': [1125, 2436], // 5.8" Display
    'iphone_xs_max': [1242, 2688], // 6.5" Display
    'iphone_12_13_14': [1170, 2532], // 6.1" Display
    'iphone_12_13_14_pro_max': [1284, 2778], // 6.7" Display
    'iphone_15_pro_max': [1290, 2796], // 6.7" Display
    'ipad_pro_12_9': [2048, 2732], // 12.9" Display
    'ipad_pro_11': [1668, 2388], // 11" Display
  };
}

/// Play Store metadata for Android
class PlayStoreMetadata {
  // App Identity
  static const String appName = 'UpCoach';
  static const String packageName = 'com.upcoach.upcoach_mobile';

  // Play Store Categories
  static const String category = 'Health & Fitness';
  static const String contentRating = 'Everyone';

  // Short Description (80 characters max)
  static const String shortDescription =
      'AI-powered coaching for habits, goals, and personal growth';

  // Full Description (4000 characters max)
  static const String fullDescription = '''
UpCoach is your personal AI-powered coaching companion designed to help you build better habits, achieve your goals, and transform your life.

<b>KEY FEATURES:</b>

<b>AI Voice Coach</b>
Talk to your personal AI coach anytime. Get real-time guidance, motivation, and personalized advice using advanced voice AI technology.

<b>Smart Habit Tracking</b>
Build lasting habits with intelligent tracking, streaks, and progress analytics. UpCoach learns your patterns and adapts to help you succeed.

<b>Goal Setting & Progress</b>
Set meaningful goals and track your journey with visual progress charts, milestones, and achievements.

<b>Mood & Wellness Tracking</b>
Monitor your emotional well-being with daily mood check-ins, journaling, and wellness insights.

<b>Voice Journal</b>
Capture your thoughts effortlessly with voice-to-text journaling. Reflect on your day and track your personal growth.

<b>Community Support</b>
Connect with like-minded individuals, share achievements, and get inspired by others on their coaching journey.

<b>Gamification & Rewards</b>
Stay motivated with points, badges, achievements, and leaderboards. Make self-improvement fun and engaging.

<b>Personalized Insights</b>
Get AI-powered insights and recommendations tailored to your unique goals, habits, and progress patterns.

<b>Offline Support</b>
Continue your coaching journey even without internet. Full offline functionality with automatic sync when connected.

<b>WHY UPCOACH?</b>

UpCoach combines the power of AI with proven coaching methodologies to deliver a personalized experience that adapts to you. Whether you're building new habits, breaking old ones, or working toward ambitious goals, UpCoach is your dedicated partner every step of the way.

Download UpCoach today and start your transformation journey!
''';

  // Feature Graphics and Screenshots
  static const Map<String, List<int>> graphicSizes = {
    'feature_graphic': [1024, 500], // Feature graphic
    'icon': [512, 512], // High-res icon
    'phone_screenshot': [1080, 1920], // Phone screenshots
    'tablet_7_screenshot': [1200, 1920], // 7" tablet
    'tablet_10_screenshot': [1600, 2560], // 10" tablet
  };

  // Tags for Play Store
  static const List<String> tags = [
    'coaching',
    'habits',
    'goals',
    'AI',
    'wellness',
    'health',
    'productivity',
    'mindfulness',
    'motivation',
    'self-improvement',
  ];
}

/// Localized metadata for different languages
class LocalizedMetadata {
  static const Map<String, Map<String, String>> translations = {
    'en': {
      'name': 'UpCoach',
      'subtitle': 'AI-Powered Personal Coaching',
      'short_description':
          'AI-powered coaching for habits, goals, and personal growth',
    },
    'es': {
      'name': 'UpCoach',
      'subtitle': 'Coaching Personal con IA',
      'short_description':
          'Coaching con IA para hábitos, metas y crecimiento personal',
    },
    'fr': {
      'name': 'UpCoach',
      'subtitle': 'Coaching Personnel par IA',
      'short_description':
          'Coaching IA pour habitudes, objectifs et développement personnel',
    },
    'id': {
      'name': 'UpCoach',
      'subtitle': 'Coaching Pribadi Bertenaga AI',
      'short_description':
          'Coaching AI untuk kebiasaan, tujuan, dan pengembangan diri',
    },
    'ar': {
      'name': 'UpCoach',
      'subtitle': 'تدريب شخصي بالذكاء الاصطناعي',
      'short_description':
          'تدريب بالذكاء الاصطناعي للعادات والأهداف والنمو الشخصي',
    },
  };
}

/// App version information
class AppVersion {
  static const String version = '1.0.0';
  static const int buildNumber = 1;
  static const String fullVersion = '$version+$buildNumber';

  /// Minimum supported versions
  static const String minAndroidVersion = 'Android 7.0 (API 24)';
  static const String minIOSVersion = 'iOS 12.0';

  /// Target versions
  static const int targetAndroidSdk = 34;
  static const String targetIOSVersion = '17.0';
}
