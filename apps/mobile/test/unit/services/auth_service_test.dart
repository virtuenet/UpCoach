import 'package:flutter_test/flutter_test.dart';

// Mock Auth Service for testing
class AuthService {
  String? _currentUser;
  String? _authToken;

  Future<bool> login(String email, String password) async {
    // Simulate API call
    await Future.delayed(const Duration(milliseconds: 100));
    
    if (email == 'test@example.com' && password == 'password123') {
      _currentUser = email;
      _authToken = 'mock_token_123';
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 50));
    _currentUser = null;
    _authToken = null;
  }

  bool get isAuthenticated => _currentUser != null && _authToken != null;
  String? get currentUser => _currentUser;
  String? get authToken => _authToken;

  Future<bool> refreshToken() async {
    if (_authToken != null) {
      await Future.delayed(const Duration(milliseconds: 50));
      _authToken = 'refreshed_token_456';
      return true;
    }
    return false;
  }

  Future<bool> register(String email, String password, String name) async {
    await Future.delayed(const Duration(milliseconds: 100));
    
    if (email.contains('@') && password.length >= 8 && name.isNotEmpty) {
      return true;
    }
    return false;
  }
}

void main() {
  group('AuthService Tests', () {
    late AuthService authService;

    setUp(() {
      authService = AuthService();
    });

    test('successful login sets user and token', () async {
      final result = await authService.login('test@example.com', 'password123');
      
      expect(result, isTrue);
      expect(authService.isAuthenticated, isTrue);
      expect(authService.currentUser, equals('test@example.com'));
      expect(authService.authToken, equals('mock_token_123'));
    });

    test('failed login does not set user or token', () async {
      final result = await authService.login('wrong@example.com', 'wrongpass');
      
      expect(result, isFalse);
      expect(authService.isAuthenticated, isFalse);
      expect(authService.currentUser, isNull);
      expect(authService.authToken, isNull);
    });

    test('logout clears user and token', () async {
      // First login
      await authService.login('test@example.com', 'password123');
      expect(authService.isAuthenticated, isTrue);
      
      // Then logout
      await authService.logout();
      expect(authService.isAuthenticated, isFalse);
      expect(authService.currentUser, isNull);
      expect(authService.authToken, isNull);
    });

    test('refresh token updates the token', () async {
      // Login first
      await authService.login('test@example.com', 'password123');
      final originalToken = authService.authToken;
      
      // Refresh token
      final refreshResult = await authService.refreshToken();
      
      expect(refreshResult, isTrue);
      expect(authService.authToken, equals('refreshed_token_456'));
      expect(authService.authToken, isNot(equals(originalToken)));
    });

    test('refresh token fails when not authenticated', () async {
      final refreshResult = await authService.refreshToken();
      
      expect(refreshResult, isFalse);
      expect(authService.authToken, isNull);
    });

    test('register validates email format', () async {
      final result = await authService.register(
        'notanemail',
        'password123',
        'Test User',
      );
      
      expect(result, isFalse);
    });

    test('register validates password length', () async {
      final result = await authService.register(
        'test@example.com',
        'short',
        'Test User',
      );
      
      expect(result, isFalse);
    });

    test('register validates name is not empty', () async {
      final result = await authService.register(
        'test@example.com',
        'password123',
        '',
      );
      
      expect(result, isFalse);
    });

    test('register succeeds with valid input', () async {
      final result = await authService.register(
        'newuser@example.com',
        'password123',
        'New User',
      );
      
      expect(result, isTrue);
    });

    test('isAuthenticated returns false initially', () {
      expect(authService.isAuthenticated, isFalse);
    });

    test('isAuthenticated returns true after successful login', () async {
      await authService.login('test@example.com', 'password123');
      expect(authService.isAuthenticated, isTrue);
    });
  });
}