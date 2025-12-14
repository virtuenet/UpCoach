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

  // Speech-to-text endpoints
  static const String speechTranscribe = '/speech/transcribe';
  static const String speechLanguages = '/speech/languages';

  // Local LLM endpoints
  static const String localLlmQuery = '/local-llm/query';
  static const String localLlmStatus = '/local-llm/status';

  // Gamification endpoints
  static const String gamificationStats = '/gamification/stats';
  static const String gamificationAchievements = '/gamification/achievements';
  static const String gamificationAchievementClaim =
      '/gamification/achievements'; // /:id/claim
  static const String gamificationStreaks = '/gamification/streaks';
  static const String gamificationStreaksUpdate =
      '/gamification/streaks/update';
  static const String gamificationChallenges = '/gamification/challenges';
  static const String gamificationChallengeJoin =
      '/gamification/challenges'; // /:id/join
  static const String gamificationMicroChallenges =
      '/gamification/micro-challenges';
  static const String gamificationMicroChallengeComplete =
      '/gamification/micro-challenges'; // /:id/complete
  static const String gamificationLeaderboard = '/gamification/leaderboard';
  static const String gamificationRewardsStore = '/gamification/rewards/store';
  static const String gamificationRewardsPurchase =
      '/gamification/rewards/purchase'; // /:id
  static const String gamificationMyRewards =
      '/gamification/rewards/my-rewards';
  static const String gamificationTrack = '/gamification/track';
  static const String gamificationGuardians = '/gamification/guardians';
  static const String gamificationPoints = '/gamification/points';

  // Coach marketplace endpoints
  static const String coachProfiles = '/coach/profiles';
  static const String coachFeatured = '/coach/profiles/featured';
  static const String coachSpecializations = '/coach/specializations';
  static const String coachPackages = '/coach/packages';
  static const String coachMyPackages = '/coach/packages/my';
  static const String coachSessions = '/coach/sessions';
  static const String coachMySessions = '/coach/sessions/my';
  static const String coachReviews = '/coach/reviews';

  // Payment endpoints
  static const String paymentsConfig = '/payments/config';
  static const String paymentsCreateIntent = '/payments/create-intent';
  static const String paymentsConfirm = '/payments/confirm';
  static const String paymentsHistory = '/payments/history';
  static const String paymentsReceipt = '/payments/receipt'; // /:id
  static const String paymentsRefund = '/payments/refund';
  static const String paymentsMethods = '/payments/methods';
  static const String paymentsMethodsDefault = '/payments/methods/default';
  static const String paymentsSetupIntent = '/payments/setup-intent';
  static const String paymentsCustomer = '/payments/customer';
  static const String paymentsInvoices = '/payments/invoices';

  // Video/Audio Call endpoints
  static const String callsJoin = '/calls/join';
  static const String callsLeave = '/calls/leave';
  static const String callsEnd = '/calls/end';
  static const String callsToken = '/calls/token';
  static const String callsSession = '/calls/session'; // /:id
  static const String callsRecordingStart = '/calls/recording/start';
  static const String callsRecordingStop = '/calls/recording/stop';
  static const String callsScreenShare = '/calls/screen-share';
  static const String callsParticipants = '/calls/participants'; // /:callId
  static const String callsConversation = '/calls/conversation'; // Conversation-based calls
  static const String callsConversationToken = '/calls/conversation/token'; // Token for conversation calls

  // Chat/Messaging endpoints
  static const String chatConversations = '/chat/conversations';
  static const String chatConversationsDirect = '/chat/conversations/direct';
  static const String chatMessages = '/chat/messages';
  static const String chatMessagesRead = '/chat/messages/read';
  static const String chatMediaUpload = '/chat/media/upload';
  static const String chatSearch = '/chat/search';
  static const String chatUnreadCount = '/chat/unread-count';

  // Onboarding endpoints
  static const String onboardingStatus = '/onboarding/status';
  static const String onboardingProfile = '/onboarding/profile';
  static const String onboardingGoals = '/onboarding/goals';
  static const String onboardingPreferences = '/onboarding/preferences';
  static const String onboardingRecommendedCoaches =
      '/onboarding/recommended-coaches';
  static const String onboardingComplete = '/onboarding/complete';
  static const String onboardingNotifications = '/onboarding/notifications';
  static const String onboardingSkip = '/onboarding/skip';
  static const String uploadAvatar = '/upload/avatar';
}
