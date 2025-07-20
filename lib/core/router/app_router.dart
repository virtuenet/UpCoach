import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_constants.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../shared/widgets/splash_screen.dart';
import '../../shared/widgets/main_navigation.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.when(
        data: (user) => user != null,
        loading: () => false,
        error: (_, __) => false,
      );
      
      final isAuthRoute = [
        AppConstants.loginRoute,
        AppConstants.registerRoute,
      ].contains(state.fullPath);
      
      // Show splash while loading
      if (authState.isLoading) {
        return '/splash';
      }
      
      // Redirect to login if not authenticated and not on auth route
      if (!isAuthenticated && !isAuthRoute && state.fullPath != '/splash') {
        return AppConstants.loginRoute;
      }
      
      // Redirect to home if authenticated and on auth route
      if (isAuthenticated && isAuthRoute) {
        return AppConstants.homeRoute;
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppConstants.loginRoute,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppConstants.registerRoute,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppConstants.onboardingRoute,
        builder: (context, state) => const OnboardingScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainNavigation(child: child),
        routes: [
          GoRoute(
            path: AppConstants.homeRoute,
            builder: (context, state) => const Placeholder(child: Text('Home')),
          ),
          GoRoute(
            path: AppConstants.chatRoute,
            builder: (context, state) => const Placeholder(child: Text('Chat')),
          ),
          GoRoute(
            path: AppConstants.tasksRoute,
            builder: (context, state) => const Placeholder(child: Text('Tasks')),
          ),
          GoRoute(
            path: AppConstants.goalsRoute,
            builder: (context, state) => const Placeholder(child: Text('Goals')),
          ),
          GoRoute(
            path: AppConstants.moodRoute,
            builder: (context, state) => const Placeholder(child: Text('Mood')),
          ),
          GoRoute(
            path: AppConstants.profileRoute,
            builder: (context, state) => const Placeholder(child: Text('Profile')),
          ),
        ],
      ),
    ],
  );
}); 