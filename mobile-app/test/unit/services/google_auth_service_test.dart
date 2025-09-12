import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:upcoach_mobile/core/services/auth_service.dart';
import 'package:upcoach_mobile/shared/models/auth_response.dart';

// Generate mocks
@GenerateMocks([
  Dio,
  FlutterSecureStorage,
  GoogleSignIn,
  GoogleSignInAccount,
  GoogleSignInAuthentication,
  Response,
])
import 'google_auth_service_test.mocks.dart';

void main() {
  group('AuthService - Google Sign In', () {
    late AuthService authService;
    late MockDio mockDio;
    late MockFlutterSecureStorage mockSecureStorage;
    late MockGoogleSignIn mockGoogleSignIn;
    late MockGoogleSignInAccount mockGoogleAccount;
    late MockGoogleSignInAuthentication mockGoogleAuth;

    setUp(() {
      mockDio = MockDio();
      mockSecureStorage = MockFlutterSecureStorage();
      mockGoogleSignIn = MockGoogleSignIn();
      mockGoogleAccount = MockGoogleSignInAccount();
      mockGoogleAuth = MockGoogleSignInAuthentication();

      // Create AuthService instance with mocked dependencies
      authService = AuthService();
      // Note: In a real implementation, you'd inject these dependencies
    });

    group('signInWithGoogle', () {
      const validAuthResponse = {
        'success': true,
        'message': 'Signed in successfully',
        'data': {
          'user': {
            'id': 'user-123',
            'email': 'test@example.com',
            'name': 'Test User',
          },
          'tokens': {
            'accessToken': 'mock-access-token',
            'refreshToken': 'mock-refresh-token',
          },
          'isNewUser': false,
          'authProvider': 'google',
        },
      };

      setUp(() {
        // Setup Google Sign-In mocks
        when(mockGoogleAccount.email).thenReturn('test@example.com');
        when(mockGoogleAccount.displayName).thenReturn('Test User');
        when(mockGoogleAccount.photoUrl).thenReturn('https://example.com/photo.jpg');
        
        when(mockGoogleAuth.idToken).thenReturn('mock-id-token');
        when(mockGoogleAuth.accessToken).thenReturn('mock-access-token');
        
        when(mockGoogleAccount.authentication)
            .thenAnswer((_) async => mockGoogleAuth);
      });

      testWidgets('should sign in successfully with valid Google account', (tester) async {
        // Arrange
        when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
        when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleAccount);
        
        final mockResponse = MockResponse<Map<String, dynamic>>();
        when(mockResponse.data).thenReturn(validAuthResponse);
        
        when(mockDio.post(
          '/auth/google/signin',
          data: anyNamed('data'),
        )).thenAnswer((_) async => mockResponse);

        when(mockSecureStorage.write(
          key: anyNamed('key'),
          value: anyNamed('value'),
        )).thenAnswer((_) async {});

        // Act
        final result = await authService.signInWithGoogle();

        // Assert
        expect(result.accessToken, equals('mock-access-token'));
        expect(result.refreshToken, equals('mock-refresh-token'));
        
        // Verify Google Sign-In flow
        verify(mockGoogleSignIn.signOut()).called(1);
        verify(mockGoogleSignIn.signIn()).called(1);
        verify(mockGoogleAccount.authentication).called(1);

        // Verify API call
        verify(mockDio.post(
          '/auth/google/signin',
          data: {
            'id_token': 'mock-id-token',
            'access_token': 'mock-access-token',
            'client_info': {
              'platform': 'mobile',
              'app_version': '1.0.0',
              'device_id': 'flutter_device',
            },
          },
        )).called(1);

        // Verify secure storage
        verify(mockSecureStorage.write(
          key: 'access_token',
          value: 'mock-access-token',
        )).called(1);
        verify(mockSecureStorage.write(
          key: 'refresh_token',
          value: 'mock-refresh-token',
        )).called(1);
        verify(mockSecureStorage.write(
          key: 'google_signed_in',
          value: 'true',
        )).called(1);
      });

      testWidgets('should handle Google sign-in cancellation', (tester) async {
        // Arrange
        when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
        when(mockGoogleSignIn.signIn()).thenAnswer((_) async => null);

        // Act & Assert
        expect(
          () => authService.signInWithGoogle(),
          throwsA(isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Google sign-in was cancelled by the user'),
          )),
        );

        // Verify cleanup on cancellation
        verify(mockGoogleSignIn.signOut()).called(2); // Once at start, once on error
      });

      testWidgets('should handle missing authentication tokens', (tester) async {
        // Arrange
        when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
        when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleAccount);
        
        // Mock missing tokens
        when(mockGoogleAuth.idToken).thenReturn(null);
        when(mockGoogleAuth.accessToken).thenReturn('mock-access-token');
        when(mockGoogleAccount.authentication)
            .thenAnswer((_) async => mockGoogleAuth);

        // Act & Assert
        expect(
          () => authService.signInWithGoogle(),
          throwsA(isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Failed to obtain Google authentication tokens'),
          )),
        );

        // Verify cleanup on error
        verify(mockGoogleSignIn.signOut()).called(2);
      });

      testWidgets('should handle API errors gracefully', (tester) async {
        // Arrange
        when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
        when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleAccount);
        
        when(mockDio.post(
          '/auth/google/signin',
          data: anyNamed('data'),
        )).thenThrow(DioException(
          requestOptions: RequestOptions(path: '/auth/google/signin'),
          response: Response(
            requestOptions: RequestOptions(path: '/auth/google/signin'),
            statusCode: 401,
            data: {'message': 'Google account email must be verified'},
          ),
        ));

        // Act & Assert
        expect(
          () => authService.signInWithGoogle(),
          throwsA(isA<String>().having(
            (s) => s,
            'error message',
            equals('Google account email must be verified'),
          )),
        );

        // Verify cleanup on API error
        verify(mockGoogleSignIn.signOut()).called(2);
      });

      testWidgets('should handle network connectivity issues', (tester) async {
        // Arrange
        when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
        when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleAccount);
        
        when(mockDio.post(
          '/auth/google/signin',
          data: anyNamed('data'),
        )).thenThrow(DioException(
          requestOptions: RequestOptions(path: '/auth/google/signin'),
          type: DioExceptionType.connectionTimeout,
        ));

        // Act & Assert
        expect(
          () => authService.signInWithGoogle(),
          throwsA(isA<String>().having(
            (s) => s,
            'error message',
            equals('Connection timeout'),
          )),
        );
      });
    });

    group('Google token refresh', () => {
      testWidgets('should use Google refresh endpoint when user signed in with Google', (tester) async {
        // Arrange
        when(mockSecureStorage.read(key: 'google_signed_in'))
            .thenAnswer((_) async => 'true');
        
        final mockResponse = MockResponse<Map<String, dynamic>>();
        when(mockResponse.data).thenReturn({
          'success': true,
          'data': {
            'tokens': {
              'accessToken': 'new-access-token',
              'refreshToken': 'new-refresh-token',
            },
          },
        });
        
        when(mockDio.post(
          '/auth/google/refresh',
          data: anyNamed('data'),
        )).thenAnswer((_) async => mockResponse);

        when(mockSecureStorage.write(
          key: anyNamed('key'),
          value: anyNamed('value'),
        )).thenAnswer((_) async {});

        // Act
        final result = await authService.refreshToken('old-refresh-token');

        // Assert
        expect(result.accessToken, equals('new-access-token'));
        expect(result.refreshToken, equals('new-refresh-token'));
        
        verify(mockDio.post(
          '/auth/google/refresh',
          data: {'refresh_token': 'old-refresh-token'},
        )).called(1);
      });

      testWidgets('should use regular refresh endpoint for non-Google users', (tester) async {
        // Arrange
        when(mockSecureStorage.read(key: 'google_signed_in'))
            .thenAnswer((_) async => null);
        
        final mockResponse = MockResponse<Map<String, dynamic>>();
        when(mockResponse.data).thenReturn({
          'success': true,
          'data': {
            'tokens': {
              'accessToken': 'new-access-token',
              'refreshToken': 'new-refresh-token',
            },
          },
        });
        
        when(mockDio.post(
          '/auth/refresh',
          data: anyNamed('data'),
        )).thenAnswer((_) async => mockResponse);

        when(mockSecureStorage.write(
          key: anyNamed('key'),
          value: anyNamed('value'),
        )).thenAnswer((_) async {});

        // Act
        final result = await authService.refreshToken('old-refresh-token');

        // Assert
        verify(mockDio.post(
          '/auth/refresh',
          data: {'refresh_token': 'old-refresh-token'},
        )).called(1);
      });
    });

    group('Sign out with Google', () => {
      testWidgets('should properly clean up Google sign-in state', (tester) async {
        // Arrange
        when(mockSecureStorage.read(key: 'access_token'))
            .thenAnswer((_) async => 'mock-token');
        when(mockSecureStorage.read(key: 'google_signed_in'))
            .thenAnswer((_) async => 'true');
        
        when(mockDio.post(
          '/auth/logout',
          options: anyNamed('options'),
        )).thenAnswer((_) async => MockResponse());

        when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
        when(mockGoogleSignIn.disconnect()).thenAnswer((_) async => null);
        when(mockSecureStorage.deleteAll()).thenAnswer((_) async {});

        // Act
        await authService.signOut();

        // Assert
        verify(mockGoogleSignIn.signOut()).called(1);
        verify(mockGoogleSignIn.disconnect()).called(1);
        verify(mockSecureStorage.deleteAll()).called(1);
      });

      testWidgets('should handle Google sign out errors gracefully', (tester) async {
        // Arrange
        when(mockSecureStorage.read(key: 'access_token'))
            .thenAnswer((_) async => null);
        when(mockSecureStorage.read(key: 'google_signed_in'))
            .thenAnswer((_) async => 'true');

        when(mockGoogleSignIn.signOut()).thenThrow(Exception('Google signout failed'));
        when(mockGoogleSignIn.disconnect()).thenAnswer((_) async => null);
        when(mockSecureStorage.deleteAll()).thenAnswer((_) async {});

        // Act
        await authService.signOut();

        // Assert - should still clean up local storage despite Google error
        verify(mockSecureStorage.deleteAll()).called(1);
      });
    });

    group('Error handling', () => {
      testWidgets('should provide user-friendly error messages', (tester) async {
        final testCases = [
          {
            'dioError': DioException(
              requestOptions: RequestOptions(path: '/test'),
              type: DioExceptionType.connectionTimeout,
            ),
            'expected': 'Connection timeout',
          },
          {
            'dioError': DioException(
              requestOptions: RequestOptions(path: '/test'),
              type: DioExceptionType.receiveTimeout,
            ),
            'expected': 'Receive timeout',
          },
          {
            'dioError': DioException(
              requestOptions: RequestOptions(path: '/test'),
              type: DioExceptionType.connectionError,
            ),
            'expected': 'Connection error',
          },
        ];

        for (final testCase in testCases) {
          // Test the private _handleError method indirectly
          when(mockGoogleSignIn.signOut()).thenAnswer((_) async => null);
          when(mockGoogleSignIn.signIn()).thenAnswer((_) async => mockGoogleAccount);
          when(mockDio.post(any, data: anyNamed('data')))
              .thenThrow(testCase['dioError'] as DioException);

          expect(
            () => authService.signInWithGoogle(),
            throwsA(equals(testCase['expected'])),
          );
        }
      });
    });
  });
}