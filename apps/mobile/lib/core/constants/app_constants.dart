class AppConstants {
  // API Configuration
  static const String baseUrl = 'http://localhost:8000';
  static const String apiUrl = '$baseUrl/api';

  // Supabase Configuration
  static const String supabaseUrl = 'YOUR_SUPABASE_URL';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

  // OAuth Configuration - Environment-based
  static const String googleAndroidClientId = String.fromEnvironment(
    'GOOGLE_ANDROID_CLIENT_ID',
    defaultValue: '',
  );
  static const String googleIOSClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
    defaultValue: '',
  );

  // API Endpoints
  static const String authEndpoint = '$apiUrl/auth';
  static const String usersEndpoint = '$apiUrl/users';
  static const String chatsEndpoint = '$apiUrl/chats';
  static const String tasksEndpoint = '$apiUrl/tasks';
  static const String goalsEndpoint = '$apiUrl/goals';
  static const String moodEndpoint = '$apiUrl/mood';

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  static const String onboardingKey = 'onboarding_completed';

  // App Configuration
  static const int requestTimeoutSeconds = 30;
  static const int maxRetryAttempts = 3;

  // UI Constants
  static const double defaultPadding = 16.0;
  static const double defaultBorderRadius = 12.0;
}
