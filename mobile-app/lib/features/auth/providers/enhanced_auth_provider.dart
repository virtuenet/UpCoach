import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/realtime_service.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/auth_response.dart';

/// Enhanced authentication state that includes real-time capabilities
class EnhancedAuthState {
  final UserModel? user;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final String? authProvider;
  final DateTime? lastAuthTime;
  final bool isRealTimeConnected;
  final Map<String, dynamic> deviceInfo;

  const EnhancedAuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.authProvider,
    this.lastAuthTime,
    this.isRealTimeConnected = false,
    this.deviceInfo = const {},
  });

  EnhancedAuthState copyWith({
    UserModel? user,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    String? authProvider,
    DateTime? lastAuthTime,
    bool? isRealTimeConnected,
    Map<String, dynamic>? deviceInfo,
  }) {
    return EnhancedAuthState(
      user: user ?? this.user,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      authProvider: authProvider ?? this.authProvider,
      lastAuthTime: lastAuthTime ?? this.lastAuthTime,
      isRealTimeConnected: isRealTimeConnected ?? this.isRealTimeConnected,
      deviceInfo: deviceInfo ?? this.deviceInfo,
    );
  }
}

/// Enhanced authentication provider with real-time integration
class EnhancedAuthNotifier extends StateNotifier<EnhancedAuthState> {
  final AuthService _authService;
  final RealTimeService _realTimeService;

  EnhancedAuthNotifier(this._authService, this._realTimeService)
      : super(const EnhancedAuthState()) {
    _initializeAuth();
  }

  /// Initialize authentication state and check for existing session
  Future<void> _initializeAuth() async {
    state = state.copyWith(isLoading: true);

    try {
      // Check for existing user session
      final currentUser = await _authService.getCurrentUser();

      if (currentUser != null) {
        // User is already authenticated
        state = state.copyWith(
          user: currentUser,
          isAuthenticated: true,
          isLoading: false,
          lastAuthTime: DateTime.now(),
        );

        // Initialize real-time connection for authenticated user
        await _initializeRealTimeConnection(currentUser.id);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to initialize authentication: ${e.toString()}',
      );
    }
  }

  /// Sign in with Google using enhanced backend integration
  Future<bool> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final authResponse = await _authService.signInWithGoogle();

      await _handleSuccessfulAuthentication(
        authResponse,
        'google',
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Google Sign-In failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Sign in with Apple using enhanced backend integration
  Future<bool> signInWithApple() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final authResponse = await _authService.signInWithApple();

      await _handleSuccessfulAuthentication(
        authResponse,
        'apple',
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Apple Sign-In failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Sign in with Facebook using enhanced backend integration
  Future<bool> signInWithFacebook() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final authResponse = await _authService.signInWithFacebook();

      await _handleSuccessfulAuthentication(
        authResponse,
        'facebook',
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Facebook Sign-In failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Sign in with email and password
  Future<bool> signInWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final authResponse = await _authService.login(
        email: email,
        password: password,
      );

      await _handleSuccessfulAuthentication(
        authResponse,
        'email',
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Email Sign-In failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Register with email and password
  Future<bool> registerWithEmail({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final authResponse = await _authService.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );

      await _handleSuccessfulAuthentication(
        authResponse,
        'email',
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Registration failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Handle successful authentication from any provider
  Future<void> _handleSuccessfulAuthentication(
    AuthResponse authResponse,
    String provider,
  ) async {
    // Update authentication state
    state = state.copyWith(
      user: authResponse.user,
      isAuthenticated: true,
      isLoading: false,
      authProvider: provider,
      lastAuthTime: DateTime.now(),
      error: null,
    );

    // Initialize real-time connection for the authenticated user
    await _initializeRealTimeConnection(authResponse.user.id);
  }

  /// Initialize real-time connection for authenticated user
  Future<void> _initializeRealTimeConnection(String userId) async {
    try {
      // Connect to real-time services
      await _realTimeService.initialize();

      // Subscribe to user-specific updates
      await _realTimeService.subscribeToUserUpdates(userId);
      await _realTimeService.subscribeToDashboardUpdates();

      // Update connection status
      state = state.copyWith(isRealTimeConnected: true);
    } catch (e) {
      // Real-time connection failed, but don't fail the authentication
      state = state.copyWith(isRealTimeConnected: false);
    }
  }

  /// Sign out from all providers and disconnect real-time services
  Future<void> signOut() async {
    state = state.copyWith(isLoading: true);

    try {
      // Disconnect real-time services first
      _realTimeService.disconnect();

      // Sign out from authentication service
      await _authService.signOut();

      // Reset state
      state = const EnhancedAuthState();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Sign out failed: ${e.toString()}',
      );
    }
  }

  /// Refresh authentication token
  Future<bool> refreshToken() async {
    try {
      final currentUser = await _authService.getCurrentUser();

      if (currentUser != null) {
        state = state.copyWith(
          user: currentUser,
          lastAuthTime: DateTime.now(),
        );
        return true;
      } else {
        // Token refresh failed, sign out
        await signOut();
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        error: 'Token refresh failed: ${e.toString()}',
      );
      return false;
    }
  }

  /// Check and refresh token if needed
  Future<bool> ensureValidToken() async {
    try {
      await _authService.ensureValidToken();
      return true;
    } catch (e) {
      // Token validation failed, sign out
      await signOut();
      return false;
    }
  }

  /// Update real-time connection status
  void updateRealTimeConnectionStatus(bool isConnected) {
    state = state.copyWith(isRealTimeConnected: isConnected);
  }

  /// Set authenticated user (for manual updates)
  void setAuthenticatedUser(UserModel user) {
    state = state.copyWith(
      user: user,
      isAuthenticated: true,
      lastAuthTime: DateTime.now(),
    );
  }

  /// Clear error state
  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Check if user has specific authentication provider
  bool hasProvider(String provider) {
    return state.authProvider == provider;
  }

  /// Check if authentication is recent (within last hour)
  bool isRecentAuth() {
    if (state.lastAuthTime == null) return false;
    return DateTime.now().difference(state.lastAuthTime!).inHours < 1;
  }
}

/// Enhanced authentication provider
final enhancedAuthProvider = StateNotifierProvider<EnhancedAuthNotifier, EnhancedAuthState>((ref) {
  final authService = AuthService();
  final realTimeService = RealTimeService();

  return EnhancedAuthNotifier(authService, realTimeService);
});

/// Provider for current authenticated user
final currentUserProvider = Provider<UserModel?>((ref) {
  final authState = ref.watch(enhancedAuthProvider);
  return authState.user;
});

/// Provider for authentication status
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(enhancedAuthProvider);
  return authState.isAuthenticated;
});

/// Provider for authentication loading state
final isAuthLoadingProvider = Provider<bool>((ref) {
  final authState = ref.watch(enhancedAuthProvider);
  return authState.isLoading;
});

/// Provider for authentication error
final authErrorProvider = Provider<String?>((ref) {
  final authState = ref.watch(enhancedAuthProvider);
  return authState.error;
});

/// Provider for real-time connection status
final isRealTimeConnectedProvider = Provider<bool>((ref) {
  final authState = ref.watch(enhancedAuthProvider);
  return authState.isRealTimeConnected;
});

/// Provider for authentication provider type
final authProviderTypeProvider = Provider<String?>((ref) {
  final authState = ref.watch(enhancedAuthProvider);
  return authState.authProvider;
});

/// Stream provider for authentication state changes
final authStateStreamProvider = StreamProvider<EnhancedAuthState>((ref) async* {
  // This would typically listen to authentication state changes
  // For now, we'll yield the current state
  yield ref.watch(enhancedAuthProvider);
});

/// Provider for biometric authentication availability
final biometricAuthAvailableProvider = FutureProvider<bool>((ref) async {
  final authService = AuthService();
  return await authService.isBiometricEnabled();
});

/// Provider for two-factor authentication status
final twoFactorEnabledProvider = FutureProvider<bool>((ref) async {
  final authService = AuthService();
  return await authService.isTwoFactorEnabled();
});