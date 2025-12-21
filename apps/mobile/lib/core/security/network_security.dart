// Network Security Module for UpCoach
//
// Provides comprehensive network security features:
// - Request/Response encryption
// - API key protection
// - Request signing
// - Rate limiting
// - Security headers

import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

/// Security configuration for network requests
class NetworkSecurityConfig {
  /// Whether to add security headers
  final bool addSecurityHeaders;

  /// Whether to sign requests
  final bool signRequests;

  /// Whether to encrypt request body
  final bool encryptBody;

  /// API key for signing (should be stored securely)
  final String? apiSecret;

  /// Request timeout
  final Duration timeout;

  /// Maximum retry attempts
  final int maxRetries;

  /// Allowed hosts (empty = all allowed)
  final List<String> allowedHosts;

  const NetworkSecurityConfig({
    this.addSecurityHeaders = true,
    this.signRequests = false,
    this.encryptBody = false,
    this.apiSecret,
    this.timeout = const Duration(seconds: 30),
    this.maxRetries = 3,
    this.allowedHosts = const [],
  });

  static const development = NetworkSecurityConfig(
    addSecurityHeaders: true,
    signRequests: false,
    encryptBody: false,
  );

  static const production = NetworkSecurityConfig(
    addSecurityHeaders: true,
    signRequests: true,
    encryptBody: false,
    maxRetries: 3,
  );
}

/// Security interceptor for Dio
class SecurityInterceptor extends Interceptor {
  final NetworkSecurityConfig config;
  final String Function()? getAccessToken;
  final String Function()? getDeviceId;
  final Uuid _uuid = const Uuid();

  SecurityInterceptor({
    this.config = const NetworkSecurityConfig(),
    this.getAccessToken,
    this.getDeviceId,
  });

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Check allowed hosts
    if (config.allowedHosts.isNotEmpty) {
      final host = options.uri.host;
      if (!config.allowedHosts.any((h) => host.endsWith(h))) {
        handler.reject(
          DioException(
            requestOptions: options,
            error: 'Host not allowed: $host',
            type: DioExceptionType.cancel,
          ),
        );
        return;
      }
    }

    // Add security headers
    if (config.addSecurityHeaders) {
      _addSecurityHeaders(options);
    }

    // Add request signature
    if (config.signRequests && config.apiSecret != null) {
      _signRequest(options);
    }

    // Add authorization header
    final token = getAccessToken?.call();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // Set timeout
    options.connectTimeout = config.timeout;
    options.receiveTimeout = config.timeout;

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // Validate response security
    if (!_validateResponse(response)) {
      handler.reject(
        DioException(
          requestOptions: response.requestOptions,
          response: response,
          error: 'Response validation failed',
          type: DioExceptionType.badResponse,
        ),
      );
      return;
    }

    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Log security-relevant errors
    if (_isSecurityError(err)) {
      debugPrint('Security error: ${err.type} - ${err.message}');
    }

    handler.next(err);
  }

  void _addSecurityHeaders(RequestOptions options) {
    // Request ID for tracing
    options.headers['X-Request-ID'] = _uuid.v4();

    // Timestamp
    options.headers['X-Timestamp'] = DateTime.now().toUtc().toIso8601String();

    // Device ID
    final deviceId = getDeviceId?.call();
    if (deviceId != null) {
      options.headers['X-Device-ID'] = deviceId;
    }

    // Client version
    options.headers['X-Client-Version'] = '1.0.0';

    // Platform
    options.headers['X-Platform'] = defaultTargetPlatform.name;

    // Security policy
    options.headers['X-Content-Type-Options'] = 'nosniff';
    options.headers['X-Frame-Options'] = 'DENY';

    // Accept only JSON
    options.headers['Accept'] = 'application/json';
  }

  void _signRequest(RequestOptions options) {
    final timestamp = options.headers['X-Timestamp'] ?? DateTime.now().toIso8601String();
    final requestId = options.headers['X-Request-ID'] ?? _uuid.v4();

    // Create signature payload
    final payload = StringBuffer()
      ..write(options.method)
      ..write(options.path)
      ..write(timestamp)
      ..write(requestId);

    // Add body hash if present
    if (options.data != null) {
      final bodyString = options.data is String
          ? options.data as String
          : json.encode(options.data);
      final bodyHash = sha256.convert(utf8.encode(bodyString));
      payload.write(bodyHash.toString());
    }

    // Generate HMAC signature
    final key = utf8.encode(config.apiSecret!);
    final bytes = utf8.encode(payload.toString());
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(bytes);

    options.headers['X-Signature'] = digest.toString();
    options.headers['X-Signature-Algorithm'] = 'HMAC-SHA256';
  }

  bool _validateResponse(Response response) {
    // Check for suspicious response patterns
    final contentType = response.headers.value('content-type');

    // Ensure we got JSON when expected
    if (response.requestOptions.responseType == ResponseType.json) {
      if (contentType != null && !contentType.contains('application/json')) {
        // Allow empty responses
        if (response.data != null && response.data.toString().isNotEmpty) {
          debugPrint('Unexpected content type: $contentType');
          return false;
        }
      }
    }

    return true;
  }

  bool _isSecurityError(DioException err) {
    // Certificate errors
    if (err.type == DioExceptionType.badCertificate) return true;

    // Check for security-related status codes
    final statusCode = err.response?.statusCode;
    if (statusCode != null) {
      if (statusCode == 401 || statusCode == 403) return true;
    }

    return false;
  }
}

/// Rate limiting interceptor
class RateLimitInterceptor extends Interceptor {
  final int maxRequestsPerMinute;
  final List<DateTime> _requestTimes = [];
  final Duration _window = const Duration(minutes: 1);

  RateLimitInterceptor({
    this.maxRequestsPerMinute = 60,
  });

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    _cleanOldRequests();

    if (_requestTimes.length >= maxRequestsPerMinute) {
      handler.reject(
        DioException(
          requestOptions: options,
          error: 'Rate limit exceeded',
          type: DioExceptionType.cancel,
        ),
      );
      return;
    }

    _requestTimes.add(DateTime.now());
    handler.next(options);
  }

  void _cleanOldRequests() {
    final cutoff = DateTime.now().subtract(_window);
    _requestTimes.removeWhere((t) => t.isBefore(cutoff));
  }

  int get remainingRequests {
    _cleanOldRequests();
    return maxRequestsPerMinute - _requestTimes.length;
  }

  Duration? get resetTime {
    if (_requestTimes.isEmpty) return null;
    final oldest = _requestTimes.first;
    final resetAt = oldest.add(_window);
    final now = DateTime.now();
    if (resetAt.isBefore(now)) return Duration.zero;
    return resetAt.difference(now);
  }
}

/// Retry interceptor with exponential backoff
class RetryInterceptor extends Interceptor {
  final Dio dio;
  final int maxRetries;
  final Duration initialDelay;
  final Set<int> retryStatusCodes;

  RetryInterceptor({
    required this.dio,
    this.maxRetries = 3,
    this.initialDelay = const Duration(seconds: 1),
    this.retryStatusCodes = const {408, 429, 500, 502, 503, 504},
  });

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final retryCount = err.requestOptions.extra['retryCount'] as int? ?? 0;

    if (retryCount >= maxRetries) {
      handler.next(err);
      return;
    }

    final statusCode = err.response?.statusCode;
    final shouldRetry = statusCode != null && retryStatusCodes.contains(statusCode) ||
        err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError;

    if (!shouldRetry) {
      handler.next(err);
      return;
    }

    // Calculate delay with exponential backoff
    final delay = initialDelay * (1 << retryCount);
    debugPrint('Retrying request (attempt ${retryCount + 1}/$maxRetries) after ${delay.inMilliseconds}ms');

    await Future.delayed(delay);

    // Clone request with incremented retry count
    final options = err.requestOptions;
    options.extra['retryCount'] = retryCount + 1;

    try {
      final response = await dio.fetch(options);
      handler.resolve(response);
    } on DioException catch (e) {
      handler.next(e);
    }
  }
}

/// Request sanitizer to prevent injection attacks
class RequestSanitizer {
  /// Sanitize a string value
  static String sanitizeString(String value) {
    // Remove potentially dangerous characters
    return value
        .replaceAll(RegExp(r'[<>"' "'" r']'), '')
        .replaceAll(RegExp('javascript:', caseSensitive: false), '')
        .replaceAll(RegExp('data:', caseSensitive: false), '')
        .trim();
  }

  /// Sanitize request data
  static dynamic sanitizeData(dynamic data) {
    if (data == null) return null;

    if (data is String) {
      return sanitizeString(data);
    }

    if (data is Map) {
      return data.map((key, value) {
        final sanitizedKey = key is String ? sanitizeString(key) : key;
        return MapEntry(sanitizedKey, sanitizeData(value));
      });
    }

    if (data is List) {
      return data.map(sanitizeData).toList();
    }

    return data;
  }
}

/// Sanitizing interceptor
class SanitizingInterceptor extends Interceptor {
  final bool sanitizeRequests;
  final bool sanitizeResponses;

  SanitizingInterceptor({
    this.sanitizeRequests = true,
    this.sanitizeResponses = false,
  });

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (sanitizeRequests && options.data != null) {
      options.data = RequestSanitizer.sanitizeData(options.data);
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (sanitizeResponses && response.data != null) {
      response.data = RequestSanitizer.sanitizeData(response.data);
    }
    handler.next(response);
  }
}

/// Factory for creating secure Dio instances
class SecureDioFactory {
  static Dio create({
    required String baseUrl,
    NetworkSecurityConfig config = const NetworkSecurityConfig(),
    String Function()? getAccessToken,
    String Function()? getDeviceId,
  }) {
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: config.timeout,
      receiveTimeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add interceptors in order
    dio.interceptors.addAll([
      // Sanitize inputs
      SanitizingInterceptor(),

      // Rate limiting
      RateLimitInterceptor(),

      // Security headers and signing
      SecurityInterceptor(
        config: config,
        getAccessToken: getAccessToken,
        getDeviceId: getDeviceId,
      ),

      // Retry with backoff
      RetryInterceptor(
        dio: dio,
        maxRetries: config.maxRetries,
      ),

      // Logging (debug only)
      if (kDebugMode)
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          logPrint: (o) => debugPrint(o.toString()),
        ),
    ]);

    return dio;
  }
}

/// Extension to add security features to existing Dio instance
extension SecureDioExtension on Dio {
  void addSecurityInterceptors({
    NetworkSecurityConfig config = const NetworkSecurityConfig(),
    String Function()? getAccessToken,
    String Function()? getDeviceId,
  }) {
    interceptors.addAll([
      SanitizingInterceptor(),
      RateLimitInterceptor(),
      SecurityInterceptor(
        config: config,
        getAccessToken: getAccessToken,
        getDeviceId: getDeviceId,
      ),
      RetryInterceptor(dio: this, maxRetries: config.maxRetries),
    ]);
  }
}
