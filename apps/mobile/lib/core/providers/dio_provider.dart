import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';
import '../utils/logger.dart';

/// Provider for Dio HTTP client
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio();

  // Base configuration
  dio.options.baseUrl = AppConstants.apiUrl;
  dio.options.connectTimeout =
      const Duration(seconds: AppConstants.requestTimeoutSeconds);
  dio.options.receiveTimeout =
      const Duration(seconds: AppConstants.requestTimeoutSeconds);
  dio.options.headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add logging interceptor
  dio.interceptors.add(_LoggingInterceptor());

  // Add error interceptor
  dio.interceptors.add(_ErrorInterceptor());

  return dio;
});

/// Logging interceptor for debugging
class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    logger.d('🌐 ${options.method} ${options.uri}');
    if (options.data != null) {
      logger.d('📤 Request data: ${options.data}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    logger.d('✅ ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    logger.e(
        '❌ ${err.response?.statusCode ?? 'No Status'} ${err.requestOptions.uri}');
    logger.e('Error: ${err.message}');
    handler.next(err);
  }
}

/// Error handling interceptor
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Log the error
    logger.e('API Error: ${err.message}', error: err);
    handler.next(err);
  }
}
