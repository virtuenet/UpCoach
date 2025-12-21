// Unit tests for Certificate Pinning Service
//
// Tests for certificate pin configuration and validation

import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/security/certificate_pinning.dart';

void main() {
  group('CertificatePin', () {
    test('should create with required sha256', () {
      const pin = CertificatePin(sha256: 'abc123');

      expect(pin.sha256, equals('abc123'));
      expect(pin.expiresAt, isNull);
      expect(pin.isBackup, isFalse);
    });

    test('should create backup pin', () {
      const pin = CertificatePin(
        sha256: 'backup123',
        isBackup: true,
      );

      expect(pin.sha256, equals('backup123'));
      expect(pin.isBackup, isTrue);
    });

    test('should not be expired when no expiry set', () {
      const pin = CertificatePin(sha256: 'test');

      expect(pin.isExpired, isFalse);
    });

    test('should be expired when past expiry date', () {
      final pin = CertificatePin(
        sha256: 'test',
        expiresAt: DateTime.now().subtract(const Duration(days: 1)),
      );

      expect(pin.isExpired, isTrue);
    });

    test('should not be expired when before expiry date', () {
      final pin = CertificatePin(
        sha256: 'test',
        expiresAt: DateTime.now().add(const Duration(days: 1)),
      );

      expect(pin.isExpired, isFalse);
    });

    test('should serialize to JSON correctly', () {
      final expiresAt = DateTime(2025, 12, 31);
      final pin = CertificatePin(
        sha256: 'hash123',
        expiresAt: expiresAt,
        isBackup: true,
      );

      final json = pin.toJson();

      expect(json['sha256'], equals('hash123'));
      expect(json['expiresAt'], equals(expiresAt.toIso8601String()));
      expect(json['isBackup'], isTrue);
    });

    test('should deserialize from JSON correctly', () {
      final json = {
        'sha256': 'hash456',
        'expiresAt': '2025-06-15T00:00:00.000',
        'isBackup': false,
      };

      final pin = CertificatePin.fromJson(json);

      expect(pin.sha256, equals('hash456'));
      expect(pin.expiresAt, isNotNull);
      expect(pin.isBackup, isFalse);
    });

    test('should handle missing optional fields in JSON', () {
      final json = {
        'sha256': 'minimal',
      };

      final pin = CertificatePin.fromJson(json);

      expect(pin.sha256, equals('minimal'));
      expect(pin.expiresAt, isNull);
      expect(pin.isBackup, isFalse);
    });
  });

  group('DomainPinConfig', () {
    test('should create with required fields', () {
      const config = DomainPinConfig(
        domain: 'example.com',
        pins: [CertificatePin(sha256: 'pin1')],
      );

      expect(config.domain, equals('example.com'));
      expect(config.pins, hasLength(1));
      expect(config.includeSubdomains, isTrue);
      expect(config.reportOnly, isFalse);
    });

    test('should filter valid pins', () {
      final config = DomainPinConfig(
        domain: 'example.com',
        pins: [
          const CertificatePin(sha256: 'valid'),
          CertificatePin(
            sha256: 'expired',
            expiresAt: DateTime.now().subtract(const Duration(days: 1)),
          ),
        ],
      );

      expect(config.validPins, hasLength(1));
      expect(config.validPins.first.sha256, equals('valid'));
    });

    test('should filter primary and backup pins', () {
      const config = DomainPinConfig(
        domain: 'example.com',
        pins: [
          CertificatePin(sha256: 'primary1'),
          CertificatePin(sha256: 'primary2'),
          CertificatePin(sha256: 'backup1', isBackup: true),
        ],
      );

      expect(config.primaryPins, hasLength(2));
      expect(config.backupPins, hasLength(1));
    });

    test('should deserialize from JSON correctly', () {
      final json = {
        'domain': 'api.test.com',
        'pins': [
          {'sha256': 'hash1'},
          {'sha256': 'hash2', 'isBackup': true},
        ],
        'includeSubdomains': false,
        'reportOnly': true,
      };

      final config = DomainPinConfig.fromJson(json);

      expect(config.domain, equals('api.test.com'));
      expect(config.pins, hasLength(2));
      expect(config.includeSubdomains, isFalse);
      expect(config.reportOnly, isTrue);
    });
  });

  group('PinValidationResult', () {
    test('should have all expected values', () {
      expect(PinValidationResult.values, contains(PinValidationResult.valid));
      expect(PinValidationResult.values, contains(PinValidationResult.invalid));
      expect(
          PinValidationResult.values, contains(PinValidationResult.notPinned));
      expect(PinValidationResult.values, contains(PinValidationResult.error));
    });
  });

  group('PinValidationReport', () {
    test('should create with required fields', () {
      final report = PinValidationReport(
        host: 'api.example.com',
        result: PinValidationResult.valid,
      );

      expect(report.host, equals('api.example.com'));
      expect(report.result, equals(PinValidationResult.valid));
      expect(report.matchedPin, isNull);
      expect(report.certificateChainHashes, isEmpty);
      expect(report.errorMessage, isNull);
      expect(report.timestamp, isNotNull);
    });

    test('should create with all fields', () {
      final report = PinValidationReport(
        host: 'api.example.com',
        result: PinValidationResult.valid,
        matchedPin: 'abc123',
        certificateChainHashes: ['hash1', 'hash2'],
        timestamp: DateTime(2025, 1, 1),
        errorMessage: null,
      );

      expect(report.matchedPin, equals('abc123'));
      expect(report.certificateChainHashes, hasLength(2));
      expect(report.timestamp, equals(DateTime(2025, 1, 1)));
    });

    test('should serialize to JSON correctly', () {
      final report = PinValidationReport(
        host: 'test.com',
        result: PinValidationResult.invalid,
        errorMessage: 'Pin mismatch',
      );

      final json = report.toJson();

      expect(json['host'], equals('test.com'));
      expect(json['result'], equals('invalid'));
      expect(json['errorMessage'], equals('Pin mismatch'));
      expect(json['timestamp'], isNotNull);
    });
  });

  group('CertificatePinningService', () {
    late CertificatePinningService service;

    setUp(() {
      service = CertificatePinningService();
    });

    test('should be a singleton', () {
      final service1 = CertificatePinningService();
      final service2 = CertificatePinningService();

      expect(identical(service1, service2), isTrue);
    });

    test('should initialize with domain configs', () {
      service.initialize(
        domainConfigs: [
          const DomainPinConfig(
            domain: 'api.example.com',
            pins: [CertificatePin(sha256: 'test')],
          ),
        ],
      );

      final config = service.getConfigForHost('api.example.com');
      expect(config, isNotNull);
      expect(config!.domain, equals('api.example.com'));
    });

    test('should find config for subdomain when enabled', () {
      service.initialize(
        domainConfigs: [
          const DomainPinConfig(
            domain: 'example.com',
            pins: [CertificatePin(sha256: 'test')],
            includeSubdomains: true,
          ),
        ],
      );

      final config = service.getConfigForHost('api.example.com');
      expect(config, isNotNull);
    });

    test('should not find config for unrelated domain', () {
      service.initialize(
        domainConfigs: [
          const DomainPinConfig(
            domain: 'example.com',
            pins: [CertificatePin(sha256: 'test')],
          ),
        ],
      );

      final config = service.getConfigForHost('other.com');
      expect(config, isNull);
    });

    test('should add pin at runtime', () {
      service.initialize(domainConfigs: []);

      service.addPin('api.test.com', const CertificatePin(sha256: 'new-pin'));

      final config = service.getConfigForHost('api.test.com');
      expect(config, isNotNull);
      expect(config!.pins, hasLength(1));
    });

    test('should remove pins for domain', () {
      service.initialize(
        domainConfigs: [
          const DomainPinConfig(
            domain: 'api.example.com',
            pins: [CertificatePin(sha256: 'test')],
          ),
        ],
      );

      service.removePins('api.example.com');

      final config = service.getConfigForHost('api.example.com');
      expect(config, isNull);
    });

    test('should enable and disable pinning', () {
      service.setEnabled(true);
      expect(service.getStatus()['enabled'], isTrue);

      service.setEnabled(false);
      expect(service.getStatus()['enabled'], isFalse);
    });

    test('should provide status information', () {
      service.initialize(
        domainConfigs: [
          const DomainPinConfig(
            domain: 'api.example.com',
            pins: [
              CertificatePin(sha256: 'pin1'),
              CertificatePin(sha256: 'pin2'),
            ],
          ),
        ],
      );

      final status = service.getStatus();

      expect(status.containsKey('enabled'), isTrue);
      expect(status.containsKey('isActive'), isTrue);
      expect(status.containsKey('pinnedDomains'), isTrue);
      expect(status.containsKey('totalPins'), isTrue);
      expect(status['totalPins'], equals(2));
    });

    test('should clear validation reports', () {
      service.clearReports();

      expect(service.validationReports, isEmpty);
    });

    test('getDefaultPins should return UpCoach domains', () {
      final pins = CertificatePinningService.getDefaultPins();

      expect(pins, isNotEmpty);
      expect(
        pins.any((p) => p.domain.contains('upcoach')),
        isTrue,
      );
    });
  });
}
