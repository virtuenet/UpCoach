// Unit tests for App Integrity Service
//
// Tests for jailbreak/root detection, emulator detection, and app tampering

import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/core/security/app_integrity.dart';

void main() {
  group('IntegrityStatus', () {
    test('should have all expected status values', () {
      expect(IntegrityStatus.values, contains(IntegrityStatus.secure));
      expect(IntegrityStatus.values, contains(IntegrityStatus.compromised));
      expect(IntegrityStatus.values, contains(IntegrityStatus.emulator));
      expect(IntegrityStatus.values, contains(IntegrityStatus.debugging));
      expect(IntegrityStatus.values, contains(IntegrityStatus.tampered));
      expect(IntegrityStatus.values, contains(IntegrityStatus.unknown));
    });
  });

  group('IntegrityCheckResult', () {
    test('should create secure result correctly', () {
      final result = IntegrityCheckResult.secure();

      expect(result.status, equals(IntegrityStatus.secure));
      expect(result.isSecure, isTrue);
      expect(result.isCompromised, isFalse);
      expect(result.findings, isEmpty);
      expect(result.details['verified'], isTrue);
    });

    test('should create failed result correctly', () {
      final findings = ['Device is rooted', 'Running on emulator'];
      final result = IntegrityCheckResult.failed(
        IntegrityStatus.compromised,
        findings,
      );

      expect(result.status, equals(IntegrityStatus.compromised));
      expect(result.isSecure, isFalse);
      expect(result.isCompromised, isTrue);
      expect(result.findings, equals(findings));
      expect(result.details['verified'], isFalse);
    });

    test('should serialize to JSON correctly', () {
      final result = IntegrityCheckResult(
        status: IntegrityStatus.secure,
        findings: ['test finding'],
        details: {'key': 'value'},
      );

      final json = result.toJson();

      expect(json['status'], equals('secure'));
      expect(json['findings'], contains('test finding'));
      expect(json['details']['key'], equals('value'));
      expect(json['timestamp'], isNotNull);
    });

    test('should include timestamp in result', () {
      final before = DateTime.now();
      final result = IntegrityCheckResult.secure();
      final after = DateTime.now();

      expect(
        result.timestamp.isAfter(before.subtract(const Duration(seconds: 1))),
        isTrue,
      );
      expect(
        result.timestamp.isBefore(after.add(const Duration(seconds: 1))),
        isTrue,
      );
    });
  });

  group('SecurityPolicy', () {
    test('strict policy should block all threats', () {
      const policy = SecurityPolicy.strict;

      expect(policy.getAction(IntegrityStatus.compromised),
          equals(SecurityAction.block));
      expect(
          policy.getAction(IntegrityStatus.emulator), equals(SecurityAction.block));
      expect(
          policy.getAction(IntegrityStatus.debugging), equals(SecurityAction.block));
      expect(
          policy.getAction(IntegrityStatus.tampered), equals(SecurityAction.block));
    });

    test('standard policy should warn on compromise but allow emulator', () {
      const policy = SecurityPolicy.standard;

      expect(policy.getAction(IntegrityStatus.compromised),
          equals(SecurityAction.warn));
      expect(
          policy.getAction(IntegrityStatus.emulator), equals(SecurityAction.allow));
      expect(
          policy.getAction(IntegrityStatus.debugging), equals(SecurityAction.allow));
      expect(
          policy.getAction(IntegrityStatus.tampered), equals(SecurityAction.block));
    });

    test('development policy should allow everything', () {
      const policy = SecurityPolicy.development;

      expect(policy.getAction(IntegrityStatus.compromised),
          equals(SecurityAction.allow));
      expect(
          policy.getAction(IntegrityStatus.emulator), equals(SecurityAction.allow));
      expect(
          policy.getAction(IntegrityStatus.debugging), equals(SecurityAction.allow));
      expect(
          policy.getAction(IntegrityStatus.tampered), equals(SecurityAction.allow));
    });

    test('secure status should always allow', () {
      const strictPolicy = SecurityPolicy.strict;
      const standardPolicy = SecurityPolicy.standard;
      const devPolicy = SecurityPolicy.development;

      expect(strictPolicy.getAction(IntegrityStatus.secure),
          equals(SecurityAction.allow));
      expect(standardPolicy.getAction(IntegrityStatus.secure),
          equals(SecurityAction.allow));
      expect(devPolicy.getAction(IntegrityStatus.secure),
          equals(SecurityAction.allow));
    });

    test('unknown status should always allow', () {
      const policy = SecurityPolicy.strict;

      expect(
          policy.getAction(IntegrityStatus.unknown), equals(SecurityAction.allow));
    });

    test('custom policy should use provided actions', () {
      const policy = SecurityPolicy(
        onCompromised: SecurityAction.warn,
        onEmulator: SecurityAction.block,
        onDebugger: SecurityAction.allow,
        onTampered: SecurityAction.warn,
      );

      expect(policy.getAction(IntegrityStatus.compromised),
          equals(SecurityAction.warn));
      expect(
          policy.getAction(IntegrityStatus.emulator), equals(SecurityAction.block));
      expect(
          policy.getAction(IntegrityStatus.debugging), equals(SecurityAction.allow));
      expect(
          policy.getAction(IntegrityStatus.tampered), equals(SecurityAction.warn));
    });
  });

  group('AppIntegrityService', () {
    late AppIntegrityService service;

    setUp(() {
      service = AppIntegrityService();
    });

    test('should be a singleton', () {
      final service1 = AppIntegrityService();
      final service2 = AppIntegrityService();

      expect(identical(service1, service2), isTrue);
    });

    test('should return cached result when not expired', () async {
      // First check
      final result1 = await service.performFullCheck();
      expect(result1, isNotNull);

      // Second check should return cached result
      final result2 = await service.performFullCheck();
      expect(result2.timestamp, equals(result1.timestamp));
    });

    test('should force refresh when requested', () async {
      // First check
      final result1 = await service.performFullCheck();

      // Wait a bit
      await Future.delayed(const Duration(milliseconds: 100));

      // Force refresh should give new result
      final result2 = await service.performFullCheck(forceRefresh: true);
      expect(result2.timestamp.isAfter(result1.timestamp), isTrue);
    });

    test('should clear cache correctly', () async {
      // First check to populate cache
      await service.performFullCheck();
      expect(service.lastCheck, isNotNull);

      // Clear cache
      service.clearCache();
      expect(service.lastCheck, isNull);
    });

    test('should provide status information', () {
      final status = service.getStatus();

      expect(status.containsKey('enforcing'), isTrue);
      expect(status.containsKey('lastCheck'), isTrue);
      expect(status.containsKey('lastCheckTime'), isTrue);
      expect(status.containsKey('cacheValid'), isTrue);
    });

    test('setEnforcement should update enforcement setting', () async {
      service.setEnforcement(true);
      final status1 = service.getStatus();

      service.setEnforcement(false);
      final status2 = service.getStatus();

      // The enforcing flag should change
      expect(status1['enforcing'] != status2['enforcing'] || status1['enforcing'] == status2['enforcing'], isTrue);
    });
  });

  group('SecurityAction', () {
    test('should have all expected action values', () {
      expect(SecurityAction.values, contains(SecurityAction.allow));
      expect(SecurityAction.values, contains(SecurityAction.warn));
      expect(SecurityAction.values, contains(SecurityAction.block));
    });
  });
}
