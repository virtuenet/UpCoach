class ApiConstants {
  static const String baseUrl = 'http://localhost:1080/api';
  static const String wsUrl = 'ws://localhost:1080';

  // Timeout durations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // API endpoints
  static const String authLogin = '/auth/login';
  static const String authRegister = '/auth/register';
  static const String authRefresh = '/auth/refresh';
  static const String authLogout = '/auth/logout';

  // Two-factor authentication endpoints
  static const String twoFactorStatus = '/auth/2fa/status';
  static const String twoFactorGenerate = '/auth/2fa/totp/generate';
  static const String twoFactorVerify = '/auth/2fa/totp/verify';
  static const String twoFactorDisable = '/auth/2fa/disable';

  // Profile endpoints
  static const String profile = '/profile';
  static const String profileUpdate = '/profile/update';

  // Voice journal endpoints
  static const String voiceJournals = '/voice-journals';
  static const String voiceJournalUpload = '/voice-journals/upload';

  // Local LLM endpoints
  static const String localLlmQuery = '/local-llm/query';
  static const String localLlmStatus = '/local-llm/status';
}