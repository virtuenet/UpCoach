// Unit tests for ErrorHandler and AppException
//
// Tests error classification, parsing, and user-friendly messages

import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:upcoach_mobile/core/errors/error_handler.dart';

void main() {
  group('AppErrorType', () {
    test('should have all expected error types', () {
      expect(AppErrorType.values, contains(AppErrorType.network));
      expect(AppErrorType.values, contains(AppErrorType.server));
      expect(AppErrorType.values, contains(AppErrorType.authentication));
      expect(AppErrorType.values, contains(AppErrorType.validation));
      expect(AppErrorType.values, contains(AppErrorType.notFound));
      expect(AppErrorType.values, contains(AppErrorType.timeout));
      expect(AppErrorType.values, contains(AppErrorType.cancelled));
      expect(AppErrorType.values, contains(AppErrorType.unknown));
    });
  });

  group('AppException', () {
    test('should create exception with message and type', () {
      const exception = AppException(
        message: 'Test error',
        type: AppErrorType.network,
      );

      expect(exception.message, 'Test error');
      expect(exception.type, AppErrorType.network);
      expect(exception.code, isNull);
      expect(exception.originalError, isNull);
    });

    test('should create exception with code', () {
      const exception = AppException(
        message: 'Auth failed',
        type: AppErrorType.authentication,
        code: 'AUTH_001',
      );

      expect(exception.code, 'AUTH_001');
    });

    test('toString should return message', () {
      const exception = AppException(
        message: 'Connection failed',
        type: AppErrorType.network,
      );

      expect(exception.toString(), 'Connection failed');
    });

    group('fromError factory', () {
      test('should pass through AppException unchanged', () {
        const original = AppException(
          message: 'Original error',
          type: AppErrorType.validation,
          code: 'VAL_001',
        );

        final result = AppException.fromError(original);

        expect(result.message, original.message);
        expect(result.type, original.type);
        expect(result.code, original.code);
      });

      test('should convert SocketException to network error', () {
        final socketException = SocketException('Connection refused');

        final result = AppException.fromError(socketException);

        expect(result.type, AppErrorType.network);
        expect(
            result.message.toLowerCase(),
            anyOf(
              contains('internet'),
              contains('network'),
              contains('connection'),
            ));
      });

      test('should convert generic Exception', () {
        final exception = Exception('Something went wrong');

        final result = AppException.fromError(exception);

        expect(result.type, AppErrorType.unknown);
      });

      test('should convert String errors', () {
        const errorString = 'String error message';

        final result = AppException.fromError(errorString);

        expect(result.message, errorString);
        expect(result.type, AppErrorType.unknown);
      });
    });

    group('fromDioError', () {
      test('should handle connection timeout', () {
        final dioError = DioException(
          type: DioExceptionType.connectionTimeout,
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.timeout);
        expect(result.message.toLowerCase(), contains('connection'));
      });

      test('should handle send timeout', () {
        final dioError = DioException(
          type: DioExceptionType.sendTimeout,
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.timeout);
      });

      test('should handle receive timeout', () {
        final dioError = DioException(
          type: DioExceptionType.receiveTimeout,
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.timeout);
      });

      test('should handle connection error', () {
        final dioError = DioException(
          type: DioExceptionType.connectionError,
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.network);
      });

      test('should handle cancel', () {
        final dioError = DioException(
          type: DioExceptionType.cancel,
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.cancelled);
      });

      test('should handle 400 Bad Request', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 400,
            requestOptions: RequestOptions(path: '/test'),
            data: {'message': 'Invalid input'},
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.validation);
      });

      test('should handle 401 Unauthorized', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 401,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.authentication);
      });

      test('should handle 403 Forbidden', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 403,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.authentication);
      });

      test('should handle 404 Not Found', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 404,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.notFound);
      });

      test('should handle 422 Unprocessable Entity', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 422,
            requestOptions: RequestOptions(path: '/test'),
            data: {
              'message': 'Validation failed',
              'errors': {'email': 'Email is invalid'},
            },
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.validation);
      });

      test('should handle 500 Internal Server Error', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 500,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.server);
      });

      test('should handle 502 Bad Gateway', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 502,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.server);
      });

      test('should handle 503 Service Unavailable', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 503,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.type, AppErrorType.server);
      });

      test('should extract message from response data', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 400,
            requestOptions: RequestOptions(path: '/test'),
            data: {'message': 'Custom error message'},
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.message, 'Custom error message');
      });

      test('should extract error code from response data', () {
        final dioError = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 400,
            requestOptions: RequestOptions(path: '/test'),
            data: {
              'message': 'Error occurred',
              'code': 'ERR_001',
            },
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        final result = AppException.fromError(dioError);

        expect(result.code, 'ERR_001');
      });
    });
  });

  group('ErrorHandler', () {
    late ErrorHandler errorHandler;

    setUp(() {
      errorHandler = ErrorHandler();
    });

    group('handle', () {
      test('should convert error to AppException', () {
        final error = Exception('Test error');

        final result = errorHandler.handle(error);

        expect(result, isA<AppException>());
      });

      test('should return same AppException if already converted', () {
        const original = AppException(
          message: 'Already converted',
          type: AppErrorType.validation,
        );

        final result = errorHandler.handle(original);

        expect(result.message, original.message);
        expect(result.type, original.type);
      });
    });

    group('isRecoverable', () {
      test('should identify network errors as recoverable', () {
        final error = SocketException('Connection refused');

        expect(errorHandler.isRecoverable(error), true);
      });

      test('should identify timeout errors as recoverable', () {
        final error = DioException(
          type: DioExceptionType.connectionTimeout,
          requestOptions: RequestOptions(path: '/test'),
        );

        expect(errorHandler.isRecoverable(error), true);
      });

      test('should identify server errors (5xx) as recoverable', () {
        final error = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 500,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        expect(errorHandler.isRecoverable(error), true);
      });

      test('should identify client errors (4xx) as not recoverable', () {
        final error = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 400,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        expect(errorHandler.isRecoverable(error), false);
      });

      test('should identify authentication errors as not recoverable', () {
        final error = DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 401,
            requestOptions: RequestOptions(path: '/test'),
          ),
          requestOptions: RequestOptions(path: '/test'),
        );

        expect(errorHandler.isRecoverable(error), false);
      });

      test('should identify cancelled requests as not recoverable', () {
        final error = DioException(
          type: DioExceptionType.cancel,
          requestOptions: RequestOptions(path: '/test'),
        );

        expect(errorHandler.isRecoverable(error), false);
      });
    });
  });

  group('User-friendly error messages', () {
    test('should provide friendly message for network errors', () {
      final error = SocketException('No internet');
      final appError = AppException.fromError(error);

      expect(
          appError.message.toLowerCase(),
          anyOf(
            contains('network'),
            contains('connection'),
            contains('internet'),
          ));
    });

    test('should provide friendly message for timeout errors', () {
      final error = DioException(
        type: DioExceptionType.connectionTimeout,
        requestOptions: RequestOptions(path: '/test'),
      );
      final appError = AppException.fromError(error);

      expect(
          appError.message.toLowerCase(),
          anyOf(
            contains('timeout'),
            contains('took too long'),
            contains('connection'),
          ));
    });

    test('should provide friendly message for server errors', () {
      final error = DioException(
        type: DioExceptionType.badResponse,
        response: Response(
          statusCode: 500,
          requestOptions: RequestOptions(path: '/test'),
        ),
        requestOptions: RequestOptions(path: '/test'),
      );
      final appError = AppException.fromError(error);

      expect(
          appError.message.toLowerCase(),
          anyOf(
            contains('server'),
            contains('try again'),
            contains('error'),
          ));
    });
  });
}
