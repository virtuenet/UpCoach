class AppConstants {
  // API Configuration
  static const String baseUrl = 'http://localhost:8000/api';
  static const String supabaseUrl = 'http://localhost:8000';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  // App Information
  static const String appName = 'UpCoach';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  
  // Routes
  static const String homeRoute = '/';
  static const String loginRoute = '/login';
  static const String registerRoute = '/register';
  static const String onboardingRoute = '/onboarding';
  static const String chatRoute = '/chat';
  static const String tasksRoute = '/tasks';
  static const String goalsRoute = '/goals';
  static const String moodRoute = '/mood';
  static const String profileRoute = '/profile';
  
  // Animations
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration longAnimationDuration = Duration(milliseconds: 500);
  
  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double borderRadius = 12.0;
  static const double buttonHeight = 48.0;
  
  // Chat Constants
  static const int maxMessageLength = 1000;
  static const Duration typingDelay = Duration(milliseconds: 500);
  
  // Validation
  static const int minPasswordLength = 8;
  static const int maxNameLength = 50;
} 