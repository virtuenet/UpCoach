import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/auth_service.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/auth_response.dart';

// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

// Auth state provider
final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});

// Auth notifier
class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final AuthService _authService;
  
  AuthNotifier(this._authService) : super(const AsyncValue.loading()) {
    _checkAuthStatus();
  }

  // Check initial auth status
  Future<void> _checkAuthStatus() async {
    try {
      final isAuthenticated = await _authService.isAuthenticated();
      if (isAuthenticated) {
        final user = await _authService.getCurrentUser();
        state = AsyncValue.data(user);
      } else {
        state = const AsyncValue.data(null);
      }
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  // Login
  Future<void> login(LoginRequest request) async {
    state = const AsyncValue.loading();
    try {
      final authResponse = await _authService.login(request);
      state = AsyncValue.data(authResponse.user);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  // Register
  Future<void> register(RegisterRequest request) async {
    state = const AsyncValue.loading();
    try {
      final authResponse = await _authService.register(request);
      state = AsyncValue.data(authResponse.user);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _authService.logout();
      state = const AsyncValue.data(null);
    } catch (e, stackTrace) {
      // Even if logout API fails, clear local state
      state = const AsyncValue.data(null);
    }
  }

  // Update user profile
  Future<void> updateProfile(User updatedUser) async {
    if (state.value != null) {
      state = AsyncValue.data(updatedUser);
    }
  }

  // Get current user
  User? get currentUser => state.value;

  // Check if user is authenticated
  bool get isAuthenticated => state.value != null;
}

// Loading state provider for UI
final authLoadingProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).isLoading;
});

// Error provider for UI
final authErrorProvider = Provider<String?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.when(
    data: (_) => null,
    loading: () => null,
    error: (error, _) => error.toString(),
  );
}); 