import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';
import '../../features/auth/providers/auth_provider.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late final Dio _dio;
  Ref? _ref;

  ApiService._internal() {
    _dio = Dio();
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    
    // Add interceptors
    _dio.interceptors.add(_AuthInterceptor());
    _dio.interceptors.add(_ErrorInterceptor());
    _dio.interceptors.add(_LoggingInterceptor());
  }

  void setRef(Ref ref) {
    _ref = ref;
  }

  Dio get dio => _dio;

  // Helper methods for common operations
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}

class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Get access token from auth provider if available
    // This would be injected properly in a real app
    final token = _getCurrentAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    // Add common headers
    options.headers['Content-Type'] = 'application/json';
    options.headers['Accept'] = 'application/json';
    
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired, try to refresh
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        // Retry the original request
        final cloneReq = await _cloneRequest(err.requestOptions);
        handler.resolve(cloneReq);
        return;
      }
    }
    handler.next(err);
  }

  String? _getCurrentAccessToken() {
    // In a real app, this would be properly injected
    return null;
  }

  Future<bool> _tryRefreshToken() async {
    try {
      // In a real app, this would call the auth provider
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<Response<dynamic>> _cloneRequest(RequestOptions options) async {
    final token = _getCurrentAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return ApiService().dio.fetch(options);
  }
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final apiError = ApiError.fromDioException(err);
    handler.next(DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: apiError,
    ));
  }
}

class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('🌐 ${options.method} ${options.uri}');
    if (options.data != null) {
      print('📤 Request data: ${options.data}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print('✅ ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print('❌ ${err.response?.statusCode ?? 'No Status'} ${err.requestOptions.uri}');
    print('Error: ${err.message}');
    handler.next(err);
  }
}

class ApiError {
  final String message;
  final int? statusCode;
  final String? code;
  final Map<String, dynamic>? details;

  ApiError({
    required this.message,
    this.statusCode,
    this.code,
    this.details,
  });

  factory ApiError.fromDioException(DioException exception) {
    String message;
    int? statusCode;
    String? code;
    Map<String, dynamic>? details;

    if (exception.response != null) {
      statusCode = exception.response!.statusCode;
      final data = exception.response!.data;
      
      if (data is Map<String, dynamic>) {
        message = data['message'] ?? 'An error occurred';
        code = data['code'];
        details = data['details'];
      } else {
        message = 'Server error occurred';
      }
    } else {
      switch (exception.type) {
        case DioExceptionType.connectionTimeout:
          message = 'Connection timeout';
          break;
        case DioExceptionType.sendTimeout:
          message = 'Send timeout';
          break;
        case DioExceptionType.receiveTimeout:
          message = 'Receive timeout';
          break;
        case DioExceptionType.connectionError:
          message = 'No internet connection';
          break;
        case DioExceptionType.cancel:
          message = 'Request cancelled';
          break;
        default:
          message = 'An unexpected error occurred';
      }
    }

    return ApiError(
      message: message,
      statusCode: statusCode,
      code: code,
      details: details,
    );
  }

  @override
  String toString() => message;
}

// Provider for ApiService
final apiServiceProvider = Provider<ApiService>((ref) {
  final apiService = ApiService();
  apiService.setRef(ref);
  return apiService;
}); 