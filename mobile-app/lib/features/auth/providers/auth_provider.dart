import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/google_auth_service.dart';
import '../../../core/services/token_manager.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/auth_response.dart';

// Auth Service Provider
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

// Google Auth Service Provider
final googleAuthServiceProvider = Provider<GoogleAuthService>((ref) {
  return GoogleAuthService();
});

// Token Manager Provider
final tokenManagerProvider = Provider<TokenManager>((ref) {
  final tokenManager = TokenManager();
  tokenManager.initialize();
  
  ref.onDispose(() {
    tokenManager.dispose();
  });
  
  return tokenManager;
});

// Auth State
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final UserModel? user;
  final String? error;
  final String? accessToken;
  final String? refreshToken;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.error,
    this.accessToken,
    this.refreshToken,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    UserModel? user,
    String? error,
    String? accessToken,
    String? refreshToken,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
    );
  }
}

// Auth Provider
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final GoogleAuthService _googleAuthService;
  final TokenManager _tokenManager;

  AuthNotifier({
    required AuthService authService,
    required GoogleAuthService googleAuthService,
    required TokenManager tokenManager,
  }) : _authService = authService,
       _googleAuthService = googleAuthService,
       _tokenManager = tokenManager,
       super(const AuthState()) {
    _checkAuthStatus();
    _listenToTokenState();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    
    try {
      // Check if we have valid tokens
      final hasValidTokens = await _tokenManager.hasValidTokens();
      if (!hasValidTokens) {
        state = state.copyWith(isLoading: false, isAuthenticated: false);
        return;
      }
      
      final user = await _authService.getCurrentUser();
      if (user != null) {
        state = state.copyWith(
          isAuthenticated: true,
          user: user,
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  void _listenToTokenState() {
    _tokenManager.tokenStateStream.listen((tokenState) {
      switch (tokenState) {
        case TokenState.expired:
        case TokenState.cleared:
          state = state.copyWith(isAuthenticated: false, user: null);
          break;
        case TokenState.error:
          state = state.copyWith(error: 'Session expired. Please sign in again.');
          break;
        default:
          break;
      }
    });
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final authResponse = await _authService.login(
        email: email,
        password: password,
      );
      
      state = state.copyWith(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<bool> register({
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
      
      state = state.copyWith(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<void> signOut() async {
    try {
      await _authService.signOut();
    } catch (e) {
      // Handle error but still clear local state
    }
    
    state = const AuthState();
  }

  Future<void> refreshToken() async {
    final refreshToken = state.refreshToken;
    if (refreshToken == null) {
      await signOut();
      return;
    }

    try {
      final response = await _authService.refreshToken(refreshToken);
      
      state = state.copyWith(
        isAuthenticated: true,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
    } catch (e) {
      await signOut();
    }
  }

  void updateUser(UserModel user) {
    state = state.copyWith(user: user);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  Future<void> sendPasswordResetEmail(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      await _authService.sendPasswordResetEmail(email);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      throw e;
    }
  }

  Future<bool> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final authResponse = await _googleAuthService.signIn();
      
      // Store tokens in TokenManager
      await _tokenManager.saveTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        expiresIn: authResponse.expiresIn,
        additionalData: {
          'google_signed_in': 'true',
          'user_id': authResponse.user.id,
        },
      );
      
      state = state.copyWith(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );
      
      return true;
    } on GoogleAuthException catch (e) {
      if (e.code == GoogleAuthErrorCode.userCancelled) {
        // User cancelled, just clear loading state
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          error: e.message,
          isLoading: false,
        );
      }
      return false;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<bool> signInWithGoogleSilently() async {
    try {
      final authResponse = await _googleAuthService.signInSilently();
      
      if (authResponse != null) {
        await _tokenManager.saveTokens(
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          expiresIn: authResponse.expiresIn,
          additionalData: {
            'google_signed_in': 'true',
            'user_id': authResponse.user.id,
          },
        );
        
        state = state.copyWith(
          user: authResponse.user,
          isAuthenticated: true,
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
        );
        
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Silent sign in failed: $e');
      return false;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final googleAuthService = ref.watch(googleAuthServiceProvider);
  final tokenManager = ref.watch(tokenManagerProvider);
  
  return AuthNotifier(
    authService: authService,
    googleAuthService: googleAuthService,
    tokenManager: tokenManager,
  );
});

// Additional providers for convenience
final currentUserProvider = Provider<UserModel?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.isAuthenticated;
}); 