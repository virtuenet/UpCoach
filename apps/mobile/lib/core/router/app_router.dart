import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/splash_screen.dart';
import '../../shared/models/mood_model.dart';
import '../../shared/models/task_model.dart';
import '../../shared/models/goal_model.dart';
import '../../shared/models/progress_photo_model.dart';
import '../../shared/models/chat_models.dart';
import '../../shared/models/payment_models.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/chat/screens/chat_screen.dart';
import '../../features/messaging/screens/conversations_screen.dart';
import '../../features/messaging/screens/messaging_screen.dart';
import '../../features/tasks/screens/tasks_screen.dart';
import '../../features/goals/screens/goals_screen.dart';
import '../../features/mood/screens/mood_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../shared/widgets/main_navigation.dart';
import '../../features/ai/presentation/screens/ai_coach_screen.dart';
import '../../features/ai/presentation/screens/ai_insights_screen.dart';
import '../../features/ai/presentation/screens/voice_coach_screen.dart';
import '../../features/ai/presentation/screens/recommendations_screen.dart';
import '../../features/content/presentation/screens/content_library_screen.dart';
import '../../features/content/presentation/screens/article_detail_screen.dart';
import '../../features/content/screens/saved_articles_screen.dart';
import '../../features/settings/presentation/screens/biometric_settings_screen.dart';
import '../../features/settings/presentation/screens/widget_settings_screen.dart';
import '../../features/settings/presentation/screens/accessibility_settings_screen.dart';
import '../../features/mood/screens/create_mood_screen.dart';
import '../../features/tasks/screens/create_task_screen.dart';
import '../../features/tasks/screens/task_detail_screen.dart';
import '../../features/goals/screens/create_goal_screen.dart';
import '../../features/goals/screens/goal_detail_screen.dart';
import '../../features/habits/screens/create_habit_screen.dart';
import '../../features/habits/screens/habits_screen.dart';
import '../../features/progress_photos/screens/progress_photos_screen.dart';
import '../../features/progress_photos/screens/photo_viewer_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/settings_screen.dart';
import '../../features/profile/screens/privacy_security_screen.dart';
import '../../features/profile/screens/notifications_screen.dart';
import '../../features/profile/screens/help_center_screen.dart';
import '../../features/profile/screens/about_screen.dart';
import '../../features/profile/screens/feedback_screen.dart';
import '../../features/profile/screens/offline_settings_screen.dart';
import '../../features/marketplace/screens/marketplace_browse_screen.dart';
import '../../features/marketplace/screens/coach_detail_screen.dart';
import '../../features/marketplace/screens/session_booking_screen.dart';
import '../../features/marketplace/screens/my_sessions_screen.dart';
import '../../features/marketplace/screens/coach_reviews_screen.dart';
import '../../features/gamification/presentation/screens/gamification_screen.dart';
import '../../features/payments/screens/payment_history_screen.dart';
import '../../features/payments/screens/payment_methods_screen.dart';
import '../../features/payments/screens/checkout_screen.dart';
import '../../features/video_call/screens/video_call_screen.dart';
import '../../features/video_call/screens/audio_call_screen.dart';
import '../../features/video_call/screens/conversation_call_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../shared/models/video_call_models.dart';
import '../../features/legal/legal.dart';
import '../../features/health/health.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      // If not logged in and not on auth pages, redirect to login
      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      // If logged in and on auth pages, redirect to home
      if (isLoggedIn && isLoggingIn) {
        return '/home';
      }

      return null;
    },
    routes: [
      // Splash Screen
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),

      // Onboarding Route
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),

      // Authentication Routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // Main App Navigation
      ShellRoute(
        builder: (context, state, child) => MainNavigation(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/chat',
            builder: (context, state) => const ConversationsScreen(),
          ),
          GoRoute(
            path: '/messages',
            builder: (context, state) => const ConversationsScreen(),
          ),
          GoRoute(
            path: '/tasks',
            builder: (context, state) => const TasksScreen(),
          ),
          GoRoute(
            path: '/goals',
            builder: (context, state) => const GoalsScreen(),
          ),
          GoRoute(
            path: '/mood',
            builder: (context, state) => const MoodScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/ai-coach',
            builder: (context, state) => const AICoachScreen(),
          ),
          GoRoute(
            path: '/content',
            builder: (context, state) => const ContentLibraryScreen(),
          ),
          GoRoute(
            path: '/marketplace',
            builder: (context, state) => const MarketplaceBrowseScreen(),
          ),
          GoRoute(
            path: '/gamification',
            builder: (context, state) => const GamificationScreen(),
          ),
        ],
      ),

      // AI Feature Routes (outside main navigation)
      GoRoute(
        path: '/ai/insights',
        builder: (context, state) => const AIInsightsScreen(),
      ),
      GoRoute(
        path: '/ai/voice-coach',
        builder: (context, state) => const VoiceCoachScreen(),
      ),
      GoRoute(
        path: '/ai/recommendations',
        builder: (context, state) => const RecommendationsScreen(),
      ),

      // Content Routes
      GoRoute(
        path: '/content/article/:id',
        builder: (context, state) {
          final articleId = int.parse(state.pathParameters['id']!);
          return ArticleDetailScreen(articleId: articleId);
        },
      ),
      GoRoute(
        path: '/content/saved',
        builder: (context, state) => const SavedArticlesScreen(),
      ),

      // Settings Routes
      GoRoute(
        path: '/settings/biometric',
        builder: (context, state) => const BiometricSettingsScreen(),
      ),
      GoRoute(
        path: '/settings/widgets',
        builder: (context, state) => const WidgetSettingsScreen(),
      ),
      GoRoute(
        path: '/settings/accessibility',
        builder: (context, state) => const AccessibilitySettingsScreen(),
      ),
      GoRoute(
        path: '/settings/health',
        builder: (context, state) => const HealthIntegrationsScreen(),
      ),

      // Mood Routes
      GoRoute(
        path: '/mood/create',
        builder: (context, state) {
          final existingMood = state.extra as MoodModel?;
          return CreateMoodScreen(existingMood: existingMood);
        },
      ),

      // Task Routes
      GoRoute(
        path: '/tasks/create',
        builder: (context, state) => const CreateTaskScreen(),
      ),
      GoRoute(
        path: '/tasks/:id',
        builder: (context, state) {
          final task = state.extra as TaskModel;
          return TaskDetailScreen(task: task);
        },
      ),

      // Goal Routes
      GoRoute(
        path: '/goals/create',
        builder: (context, state) => const CreateGoalScreen(),
      ),
      GoRoute(
        path: '/goals/:id',
        builder: (context, state) {
          final goal = state.extra as GoalModel;
          return GoalDetailScreen(goal: goal);
        },
      ),

      // Habit Routes
      GoRoute(
        path: '/habits',
        builder: (context, state) => const HabitsScreen(),
      ),
      GoRoute(
        path: '/habits/create',
        builder: (context, state) => const CreateHabitScreen(),
      ),

      // Progress Photos Routes
      GoRoute(
        path: '/progress-photos',
        builder: (context, state) => const ProgressPhotosScreen(),
      ),
      GoRoute(
        path: '/progress-photos/view',
        builder: (context, state) {
          final photos = state.extra as List<ProgressPhoto>;
          final initialIndex = state.uri.queryParameters['index'] ?? '0';
          return PhotoViewerScreen(
            photos: photos,
            initialIndex: int.parse(initialIndex),
          );
        },
      ),

      // Profile Routes
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/profile/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/profile/privacy',
        builder: (context, state) => const PrivacySecurityScreen(),
      ),
      GoRoute(
        path: '/profile/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/profile/help',
        builder: (context, state) => const HelpCenterScreen(),
      ),
      GoRoute(
        path: '/profile/about',
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        path: '/feedback',
        builder: (context, state) => const FeedbackScreen(),
      ),
      GoRoute(
        path: '/profile/offline-settings',
        builder: (context, state) => const OfflineSettingsScreen(),
      ),

      // Legal Routes
      GoRoute(
        path: '/legal/privacy',
        builder: (context, state) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: '/legal/terms',
        builder: (context, state) => const TermsOfServiceScreen(),
      ),

      // Coach Marketplace Routes
      GoRoute(
        path: '/marketplace/coach/:id',
        builder: (context, state) {
          final coachId = int.parse(state.pathParameters['id']!);
          return CoachDetailScreen(coachId: coachId);
        },
      ),
      GoRoute(
        path: '/marketplace/book/:id',
        builder: (context, state) {
          final coachId = int.parse(state.pathParameters['id']!);
          return SessionBookingScreen(coachId: coachId);
        },
      ),
      GoRoute(
        path: '/marketplace/my-sessions',
        builder: (context, state) => const MySessionsScreen(),
      ),
      GoRoute(
        path: '/marketplace/coach/:id/reviews',
        builder: (context, state) {
          final coachId = int.parse(state.pathParameters['id']!);
          final extra = state.extra as Map<String, dynamic>?;
          return CoachReviewsScreen(
            coachId: coachId,
            coachName: extra?['coachName'] as String?,
          );
        },
      ),

      // Payment Routes
      GoRoute(
        path: '/payments/history',
        builder: (context, state) => const PaymentHistoryScreen(),
      ),
      GoRoute(
        path: '/payments/methods',
        builder: (context, state) => const PaymentMethodsScreen(),
      ),
      GoRoute(
        path: '/payments/checkout',
        builder: (context, state) {
          final args = state.extra as Map<String, dynamic>;
          return CheckoutScreen(
            amount: args['amount'] as int,
            type: args['type'] as PaymentType,
            sessionId: args['sessionId'] as int?,
            packageId: args['packageId'] as int?,
            title: args['title'] as String,
            description: args['description'] as String,
            onSuccess: args['onSuccess'] as VoidCallback?,
          );
        },
      ),

      // Messaging Routes
      GoRoute(
        path: '/messaging/:conversationId',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          final conversation = state.extra as Conversation?;
          return MessagingScreen(
            conversationId: conversationId,
            initialConversation: conversation,
          );
        },
      ),
      GoRoute(
        path: '/ai-chat',
        builder: (context, state) => const ChatScreen(),
      ),

      // Video/Audio Call Routes
      GoRoute(
        path: '/call/video/:sessionId',
        builder: (context, state) {
          final sessionId = int.parse(state.pathParameters['sessionId']!);
          final coachName = state.uri.queryParameters['coachName'];
          return VideoCallScreen(
            sessionId: sessionId,
            callType: CallType.video,
            coachName: coachName,
          );
        },
      ),
      GoRoute(
        path: '/call/audio/:sessionId',
        builder: (context, state) {
          final sessionId = int.parse(state.pathParameters['sessionId']!);
          final coachName = state.uri.queryParameters['coachName'];
          final coachImageUrl = state.uri.queryParameters['coachImageUrl'];
          return AudioCallScreen(
            sessionId: sessionId,
            coachName: coachName,
            coachImageUrl: coachImageUrl,
          );
        },
      ),

      // Conversation-based Call Routes (peer-to-peer from messaging)
      GoRoute(
        path: '/call/conversation/video/:conversationId',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          final participantName = state.uri.queryParameters['participantName'];
          final participantImageUrl =
              state.uri.queryParameters['participantImageUrl'];
          return ConversationCallScreen(
            conversationId: conversationId,
            callType: CallType.video,
            participantName: participantName,
            participantImageUrl: participantImageUrl,
          );
        },
      ),
      GoRoute(
        path: '/call/conversation/audio/:conversationId',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          final participantName = state.uri.queryParameters['participantName'];
          final participantImageUrl =
              state.uri.queryParameters['participantImageUrl'];
          return ConversationCallScreen(
            conversationId: conversationId,
            callType: CallType.audio,
            participantName: participantName,
            participantImageUrl: participantImageUrl,
          );
        },
      ),
    ],
  );
});
