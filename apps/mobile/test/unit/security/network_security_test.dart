// Unit tests for Network Security Services
//
// Tests for request sanitization, rate limiting, and security interceptors

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/security/network_security.dart';

void main() {
  group('RequestSanitizer', () {
    test('should remove HTML tags from strings', () {
      final input = '<script>alert("xss")</script>Hello World';
      final result = RequestSanitizer.sanitizeString(input);

      expect(result, isNot(contains('<')));
      expect(result, isNot(contains('>')));
      expect(result, contains('Hello World'));
    });

    test('should remove quotes from strings', () {
      final input = 'Hello "World" with \'quotes\'';
      final result = RequestSanitizer.sanitizeString(input);

      expect(result, isNot(contains('"')));
      expect(result, isNot(contains("'")));
      expect(result, contains('Hello'));
      expect(result, contains('World'));
    });

    test('should remove javascript: protocol', () {
      final input = 'javascript:alert(1)';
      final result = RequestSanitizer.sanitizeString(input);

      expect(result.toLowerCase(), isNot(contains('javascript:')));
    });

    test('should remove data: protocol', () {
      final input = 'data:text/html,<h1>test</h1>';
      final result = RequestSanitizer.sanitizeString(input);

      expect(result.toLowerCase(), isNot(contains('data:')));
    });

    test('should trim whitespace', () {
      final input = '  Hello World  ';
      final result = RequestSanitizer.sanitizeString(input);

      expect(result, equals('Hello World'));
    });

    test('should handle empty strings', () {
      final result = RequestSanitizer.sanitizeString('');

      expect(result, isEmpty);
    });

    test('should sanitize nested maps', () {
      final input = {
        'name': '<script>alert(1)</script>John',
        'nested': {
          'value': 'javascript:void(0)',
        },
      };

      final result = RequestSanitizer.sanitizeData(input) as Map;

      // Sanitizer removes < > characters
      expect((result['name'] as String), isNot(contains('<')));
      expect((result['name'] as String), isNot(contains('>')));
      expect(
          ((result['nested'] as Map)['value'] as String).toLowerCase(),
          isNot(contains('javascript:')));
    });

    test('should sanitize lists', () {
      final input = ['<b>bold</b>', 'normal', '<script>bad</script>'];

      final result = RequestSanitizer.sanitizeData(input) as List;

      expect(result[0], isNot(contains('<')));
      expect(result[1], equals('normal'));
      expect(result[2], isNot(contains('<')));
    });

    test('should return null for null input', () {
      final result = RequestSanitizer.sanitizeData(null);

      expect(result, isNull);
    });

    test('should pass through numbers unchanged', () {
      final result = RequestSanitizer.sanitizeData(42);

      expect(result, equals(42));
    });

    test('should pass through booleans unchanged', () {
      final result = RequestSanitizer.sanitizeData(true);

      expect(result, isTrue);
    });
  });

  group('NetworkSecurityConfig', () {
    test('development config should have sensible defaults', () {
      const config = NetworkSecurityConfig.development;

      expect(config.addSecurityHeaders, isTrue);
      expect(config.signRequests, isFalse);
      expect(config.encryptBody, isFalse);
    });

    test('production config should enable signing', () {
      const config = NetworkSecurityConfig.production;

      expect(config.addSecurityHeaders, isTrue);
      expect(config.signRequests, isTrue);
      expect(config.maxRetries, equals(3));
    });

    test('default config should have reasonable values', () {
      const config = NetworkSecurityConfig();

      expect(config.timeout, equals(const Duration(seconds: 30)));
      expect(config.maxRetries, equals(3));
      expect(config.allowedHosts, isEmpty);
    });

    test('custom config should accept all parameters', () {
      const config = NetworkSecurityConfig(
        addSecurityHeaders: false,
        signRequests: true,
        encryptBody: true,
        apiSecret: 'test-secret',
        timeout: Duration(seconds: 60),
        maxRetries: 5,
        allowedHosts: ['api.example.com'],
      );

      expect(config.addSecurityHeaders, isFalse);
      expect(config.signRequests, isTrue);
      expect(config.encryptBody, isTrue);
      expect(config.apiSecret, equals('test-secret'));
      expect(config.timeout, equals(const Duration(seconds: 60)));
      expect(config.maxRetries, equals(5));
      expect(config.allowedHosts, contains('api.example.com'));
    });
  });

  group('RateLimitInterceptor', () {
    test('should track remaining requests', () {
      final interceptor = RateLimitInterceptor(maxRequestsPerMinute: 10);

      expect(interceptor.remainingRequests, equals(10));
    });

    test('should return null reset time when no requests made', () {
      final interceptor = RateLimitInterceptor(maxRequestsPerMinute: 10);

      expect(interceptor.resetTime, isNull);
    });

    test('should accept custom rate limit', () {
      final interceptor = RateLimitInterceptor(maxRequestsPerMinute: 100);

      expect(interceptor.remainingRequests, equals(100));
    });
  });

  group('SecurityInterceptor', () {
    test('should be created with default config', () {
      final interceptor = SecurityInterceptor();

      expect(interceptor, isNotNull);
      expect(interceptor.config, isNotNull);
    });

    test('should accept custom config', () {
      const config = NetworkSecurityConfig(
        signRequests: true,
        apiSecret: 'secret',
      );
      final interceptor = SecurityInterceptor(config: config);

      expect(interceptor.config.signRequests, isTrue);
      expect(interceptor.config.apiSecret, equals('secret'));
    });

    test('should accept token and device ID callbacks', () {
      String getToken() => 'test-token';
      String getDeviceId() => 'device-123';

      final interceptor = SecurityInterceptor(
        getAccessToken: getToken,
        getDeviceId: getDeviceId,
      );

      expect(interceptor.getAccessToken?.call(), equals('test-token'));
      expect(interceptor.getDeviceId?.call(), equals('device-123'));
    });
  });

  group('RetryInterceptor', () {
    late Dio dio;

    setUp(() {
      dio = Dio();
    });

    test('should have default retry configuration', () {
      final interceptor = RetryInterceptor(
        dio: dio,
        maxRetries: 3,
        initialDelay: const Duration(seconds: 1),
      );

      expect(interceptor.maxRetries, equals(3));
      expect(interceptor.initialDelay, equals(const Duration(seconds: 1)));
    });

    test('should accept custom retry status codes', () {
      final customCodes = {500, 502, 503};
      final interceptor = RetryInterceptor(
        dio: dio,
        retryStatusCodes: customCodes,
      );

      expect(interceptor.retryStatusCodes, equals(customCodes));
    });
  });

  group('SanitizingInterceptor', () {
    test('should enable request sanitization by default', () {
      final interceptor = SanitizingInterceptor();

      expect(interceptor.sanitizeRequests, isTrue);
      expect(interceptor.sanitizeResponses, isFalse);
    });

    test('should accept custom sanitization settings', () {
      final interceptor = SanitizingInterceptor(
        sanitizeRequests: false,
        sanitizeResponses: true,
      );

      expect(interceptor.sanitizeRequests, isFalse);
      expect(interceptor.sanitizeResponses, isTrue);
    });
  });
}
