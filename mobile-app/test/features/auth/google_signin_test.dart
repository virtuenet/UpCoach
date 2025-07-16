import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:dartz/dartz.dart';

// Import your actual implementation files
// import 'package:upcoach/features/auth/data/repositories/auth_repository_impl.dart';
// import 'package:upcoach/features/auth/domain/entities/user.dart';
// import 'package:upcoach/core/error/failures.dart';

// For demo purposes, let's define minimal interfaces
abstract class AuthRepository {
  Future<Either<Failure, User>> signInWithGoogle();
  Future<Either<Failure, void>> signOut();
  Future<Either<Failure, User?>> getCurrentUser();
}

class User {
  final String id;
  final String email;
  final String? name;
  final String? avatarUrl;

  User({
    required this.id,
    required this.email,
    this.name,
    this.avatarUrl,
  });
}

abstract class Failure {
  final String message;
  Failure(this.message);
}

class AuthFailure extends Failure {
  AuthFailure(String message) : super(message);
}

// Generate mocks
@GenerateMocks([
  GoogleSignIn,
  GoogleSignInAccount,
  GoogleSignInAuthentication,
  SupabaseClient,
  GoTrueClient,
])
void main() {
  late AuthRepository authRepository;
  late MockGoogleSignIn mockGoogleSignIn;
  late MockSupabaseClient mockSupabaseClient;
  late MockGoTrueClient mockGoTrueClient;

  setUp(() {
    mockGoogleSignIn = MockGoogleSignIn();
    mockSupabaseClient = MockSupabaseClient();
    mockGoTrueClient = MockGoTrueClient();
    
    // Initialize repository with mocks
    // authRepository = AuthRepositoryImpl(
    //   googleSignIn: mockGoogleSignIn,
    //   supabaseClient: mockSupabaseClient,
    // );
  });

  group('Google Sign-In Tests', () {
    test('should return User when Google sign-in is successful', () async {
      // Arrange
      final mockGoogleUser = MockGoogleSignInAccount();
      final mockGoogleAuth = MockGoogleSignInAuthentication();
      
      when(mockGoogleUser.id).thenReturn('google123');
      when(mockGoogleUser.email).thenReturn('test@example.com');
      when(mockGoogleUser.displayName).thenReturn('Test User');
      when(mockGoogleUser.photoUrl).thenReturn('https://example.com/photo.jpg');
      
      when(mockGoogleAuth.idToken).thenReturn('mock_id_token');
      when(mockGoogleAuth.accessToken).thenReturn('mock_access_token');
      
      when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleUser);
      when(mockGoogleUser.authentication).thenAnswer((_) async => mockGoogleAuth);
      
      when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
      when(mockGoTrueClient.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: 'mock_id_token',
        accessToken: 'mock_access_token',
      )).thenAnswer((_) async => AuthResponse(
        session: Session(
          accessToken: 'supabase_access_token',
          tokenType: 'bearer',
          user: User(
            id: 'user123',
            email: 'test@example.com',
            appMetadata: {},
            userMetadata: {
              'name': 'Test User',
              'avatar_url': 'https://example.com/photo.jpg',
            },
            aud: 'authenticated',
            createdAt: DateTime.now().toIso8601String(),
          ),
        ),
      ));

      // Act
      final result = await authRepository.signInWithGoogle();

      // Assert
      expect(result.isRight(), true);
      result.fold(
        (failure) => fail('Should not return failure'),
        (user) {
          expect(user.id, 'user123');
          expect(user.email, 'test@example.com');
          expect(user.name, 'Test User');
          expect(user.avatarUrl, 'https://example.com/photo.jpg');
        },
      );

      // Verify interactions
      verify(mockGoogleSignIn.signIn()).called(1);
      verify(mockGoogleUser.authentication).called(1);
      verify(mockGoTrueClient.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: 'mock_id_token',
        accessToken: 'mock_access_token',
      )).called(1);
    });

    test('should return AuthFailure when Google sign-in is cancelled', () async {
      // Arrange
      when(mockGoogleSignIn.signIn()).thenAnswer((_) async => null);

      // Act
      final result = await authRepository.signInWithGoogle();

      // Assert
      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<AuthFailure>());
          expect(failure.message, contains('cancelled'));
        },
        (user) => fail('Should not return user'),
      );

      // Verify interactions
      verify(mockGoogleSignIn.signIn()).called(1);
      verifyNever(mockGoTrueClient.signInWithIdToken(
        provider: any,
        idToken: any,
        accessToken: any,
      ));
    });

    test('should return AuthFailure when Google authentication fails', () async {
      // Arrange
      final mockGoogleUser = MockGoogleSignInAccount();
      
      when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleUser);
      when(mockGoogleUser.authentication).thenThrow(Exception('Authentication failed'));

      // Act
      final result = await authRepository.signInWithGoogle();

      // Assert
      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<AuthFailure>());
          expect(failure.message, contains('Authentication failed'));
        },
        (user) => fail('Should not return user'),
      );
    });

    test('should return AuthFailure when Supabase sign-in fails', () async {
      // Arrange
      final mockGoogleUser = MockGoogleSignInAccount();
      final mockGoogleAuth = MockGoogleSignInAuthentication();
      
      when(mockGoogleAuth.idToken).thenReturn('mock_id_token');
      when(mockGoogleAuth.accessToken).thenReturn('mock_access_token');
      
      when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleUser);
      when(mockGoogleUser.authentication).thenAnswer((_) async => mockGoogleAuth);
      
      when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
      when(mockGoTrueClient.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: 'mock_id_token',
        accessToken: 'mock_access_token',
      )).thenThrow(AuthException('Invalid credentials'));

      // Act
      final result = await authRepository.signInWithGoogle();

      // Assert
      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<AuthFailure>());
          expect(failure.message, contains('Invalid credentials'));
        },
        (user) => fail('Should not return user'),
      );
    });
  });

  group('Sign Out Tests', () {
    test('should successfully sign out from both Google and Supabase', () async {
      // Arrange
      when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
      when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
      when(mockGoTrueClient.signOut()).thenAnswer((_) async {});

      // Act
      final result = await authRepository.signOut();

      // Assert
      expect(result.isRight(), true);

      // Verify interactions
      verify(mockGoogleSignIn.signOut()).called(1);
      verify(mockGoTrueClient.signOut()).called(1);
    });

    test('should return AuthFailure when sign out fails', () async {
      // Arrange
      when(mockGoogleSignIn.signOut()).thenThrow(Exception('Sign out failed'));

      // Act
      final result = await authRepository.signOut();

      // Assert
      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<AuthFailure>());
          expect(failure.message, contains('Sign out failed'));
        },
        (_) => fail('Should not succeed'),
      );
    });
  });

  group('Get Current User Tests', () {
    test('should return current user when authenticated', () async {
      // Arrange
      when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
      when(mockGoTrueClient.currentUser).thenReturn(User(
        id: 'user123',
        email: 'test@example.com',
        appMetadata: {},
        userMetadata: {
          'name': 'Test User',
          'avatar_url': 'https://example.com/photo.jpg',
        },
        aud: 'authenticated',
        createdAt: DateTime.now().toIso8601String(),
      ));

      // Act
      final result = await authRepository.getCurrentUser();

      // Assert
      expect(result.isRight(), true);
      result.fold(
        (failure) => fail('Should not return failure'),
        (user) {
          expect(user?.id, 'user123');
          expect(user?.email, 'test@example.com');
          expect(user?.name, 'Test User');
        },
      );
    });

    test('should return null when not authenticated', () async {
      // Arrange
      when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
      when(mockGoTrueClient.currentUser).thenReturn(null);

      // Act
      final result = await authRepository.getCurrentUser();

      // Assert
      expect(result.isRight(), true);
      result.fold(
        (failure) => fail('Should not return failure'),
        (user) => expect(user, isNull),
      );
    });
  });
} 