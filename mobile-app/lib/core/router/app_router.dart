import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/splash_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/chat/screens/chat_screen.dart';
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
import '../../features/auth/presentation/screens/biometric_lock_screen.dart';

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
            builder: (context, state) => const ChatScreen(),
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
    ],
  );
}); 