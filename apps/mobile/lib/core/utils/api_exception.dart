import 'package:dio/dio.dart';

/// Custom API exception for handling API errors
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  final Map<String, dynamic>? details;
  final DioException? originalError;

  ApiException({
    required this.message,
    this.statusCode,
    this.code,
    this.details,
    this.originalError,
  });

  /// Create ApiException from DioException
  factory ApiException.fromDioError(DioException error) {
    String message;
    int? statusCode;
    String? code;
    Map<String, dynamic>? details;

    if (error.response != null) {
      statusCode = error.response!.statusCode;
      final data = error.response!.data;

      if (data is Map<String, dynamic>) {
        message = data['message'] as String? ?? 'An error occurred';
        code = data['code'] as String?;
        if (data['details'] is Map<String, dynamic>) {
          details = data['details'] as Map<String, dynamic>;
        }
      } else {
        message = 'Server error occurred';
      }
    } else {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          message = 'Connection timeout';
          code = 'CONNECTION_TIMEOUT';
          break;
        case DioExceptionType.sendTimeout:
          message = 'Send timeout';
          code = 'SEND_TIMEOUT';
          break;
        case DioExceptionType.receiveTimeout:
          message = 'Receive timeout';
          code = 'RECEIVE_TIMEOUT';
          break;
        case DioExceptionType.connectionError:
          message = 'No internet connection';
          code = 'NO_CONNECTION';
          break;
        case DioExceptionType.cancel:
          message = 'Request cancelled';
          code = 'CANCELLED';
          break;
        case DioExceptionType.badCertificate:
          message = 'Invalid certificate';
          code = 'BAD_CERTIFICATE';
          break;
        case DioExceptionType.badResponse:
          message = 'Bad response from server';
          code = 'BAD_RESPONSE';
          break;
        case DioExceptionType.unknown:
        default:
          message = error.message ?? 'An unexpected error occurred';
          code = 'UNKNOWN';
      }
    }

    return ApiException(
      message: message,
      statusCode: statusCode,
      code: code,
      details: details,
      originalError: error,
    );
  }

  /// Check if error is a network error
  bool get isNetworkError =>
      code == 'NO_CONNECTION' ||
      code == 'CONNECTION_TIMEOUT' ||
      code == 'SEND_TIMEOUT' ||
      code == 'RECEIVE_TIMEOUT';

  /// Check if error is an authentication error
  bool get isAuthError => statusCode == 401 || statusCode == 403;

  /// Check if error is a not found error
  bool get isNotFoundError => statusCode == 404;

  /// Check if error is a server error
  bool get isServerError => statusCode != null && statusCode! >= 500;

  @override
  String toString() => message;
}
