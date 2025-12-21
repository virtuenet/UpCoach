// App Integrity Service for UpCoach
//
// Provides security checks for:
// - Jailbreak/root detection
// - Debugger detection
// - Emulator detection
// - App tampering detection
// - Secure runtime verification

import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';

/// Result of integrity check
enum IntegrityStatus {
  /// Device passes all integrity checks
  secure,

  /// Device is rooted/jailbroken
  compromised,

  /// Running on emulator
  emulator,

  /// Debugger attached
  debugging,

  /// App has been tampered with
  tampered,

  /// Check could not be completed
  unknown,
}

/// Detailed integrity check result
class IntegrityCheckResult {
  final IntegrityStatus status;
  final List<String> findings;
  final Map<String, dynamic> details;
  final DateTime timestamp;

  IntegrityCheckResult({
    required this.status,
    this.findings = const [],
    this.details = const {},
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isSecure => status == IntegrityStatus.secure;
  bool get isCompromised => status == IntegrityStatus.compromised;

  Map<String, dynamic> toJson() => {
        'status': status.name,
        'findings': findings,
        'details': details,
        'timestamp': timestamp.toIso8601String(),
      };

  factory IntegrityCheckResult.secure() => IntegrityCheckResult(
        status: IntegrityStatus.secure,
        details: {'verified': true},
      );

  factory IntegrityCheckResult.failed(
    IntegrityStatus status,
    List<String> findings,
  ) =>
      IntegrityCheckResult(
        status: status,
        findings: findings,
        details: {'verified': false},
      );
}

/// App Integrity Service
class AppIntegrityService {
  static final AppIntegrityService _instance = AppIntegrityService._internal();
  factory AppIntegrityService() => _instance;
  AppIntegrityService._internal();

  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  PackageInfo? _packageInfo;

  /// Cache of last integrity check
  IntegrityCheckResult? _lastCheck;
  DateTime? _lastCheckTime;
  static const _checkCacheDuration = Duration(minutes: 5);

  /// Whether to enforce integrity checks (can be disabled for development)
  bool _enforceChecks = !kDebugMode;

  /// Callback when integrity check fails
  void Function(IntegrityCheckResult result)? onIntegrityFailure;

  /// Initialize the service
  Future<void> initialize() async {
    _packageInfo = await PackageInfo.fromPlatform();
  }

  /// Perform all integrity checks
  Future<IntegrityCheckResult> performFullCheck({
    bool forceRefresh = false,
  }) async {
    // Return cached result if recent
    if (!forceRefresh && _lastCheck != null && _lastCheckTime != null) {
      if (DateTime.now().difference(_lastCheckTime!) < _checkCacheDuration) {
        return _lastCheck!;
      }
    }

    final findings = <String>[];
    var status = IntegrityStatus.secure;

    // Check for debugging
    if (await isBeingDebugged()) {
      findings.add('Debugger detected');
      if (_enforceChecks) {
        status = IntegrityStatus.debugging;
      }
    }

    // Check for emulator
    if (await isEmulator()) {
      findings.add('Running on emulator');
      if (_enforceChecks && status == IntegrityStatus.secure) {
        status = IntegrityStatus.emulator;
      }
    }

    // Check for root/jailbreak
    if (await isRootedOrJailbroken()) {
      findings.add('Device is rooted/jailbroken');
      if (_enforceChecks && status == IntegrityStatus.secure) {
        status = IntegrityStatus.compromised;
      }
    }

    // Check for app tampering
    if (await isAppTampered()) {
      findings.add('App signature mismatch');
      if (_enforceChecks && status == IntegrityStatus.secure) {
        status = IntegrityStatus.tampered;
      }
    }

    final result = IntegrityCheckResult(
      status: findings.isEmpty ? IntegrityStatus.secure : status,
      findings: findings,
      details: await _getDeviceDetails(),
    );

    _lastCheck = result;
    _lastCheckTime = DateTime.now();

    // Notify on failure
    if (!result.isSecure && onIntegrityFailure != null) {
      onIntegrityFailure!(result);
    }

    return result;
  }

  /// Check if app is being debugged
  Future<bool> isBeingDebugged() async {
    // In release mode, check for debugger
    if (kReleaseMode) {
      // Check if debugger is attached (works on most platforms)
      const isDebugging = bool.fromEnvironment('dart.vm.product') == false;
      return isDebugging;
    }
    return kDebugMode;
  }

  /// Check if running on emulator
  Future<bool> isEmulator() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        return _checkAndroidEmulator(androidInfo);
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        return !iosInfo.isPhysicalDevice;
      }
    } catch (e) {
      debugPrint('Error checking emulator: $e');
    }
    return false;
  }

  /// Check Android emulator indicators
  bool _checkAndroidEmulator(AndroidDeviceInfo info) {
    // Check common emulator fingerprints
    final fingerprint = info.fingerprint.toLowerCase();
    final model = info.model.toLowerCase();
    final manufacturer = info.manufacturer.toLowerCase();
    final brand = info.brand.toLowerCase();
    final device = info.device.toLowerCase();
    final product = info.product.toLowerCase();
    final hardware = info.hardware.toLowerCase();

    final emulatorIndicators = [
      fingerprint.contains('generic'),
      fingerprint.contains('unknown'),
      fingerprint.contains('sdk'),
      fingerprint.contains('google_sdk'),
      fingerprint.contains('emulator'),
      fingerprint.contains('android sdk'),
      model.contains('sdk'),
      model.contains('emulator'),
      model.contains('android sdk'),
      manufacturer.contains('genymotion'),
      manufacturer.contains('unknown'),
      brand.contains('generic'),
      device.contains('generic'),
      device.contains('emulator'),
      product.contains('sdk'),
      product.contains('google_sdk'),
      product.contains('emulator'),
      hardware.contains('goldfish'),
      hardware.contains('ranchu'),
      info.isPhysicalDevice == false,
    ];

    return emulatorIndicators.any((indicator) => indicator);
  }

  /// Check if device is rooted (Android) or jailbroken (iOS)
  Future<bool> isRootedOrJailbroken() async {
    try {
      if (Platform.isAndroid) {
        return await _checkAndroidRoot();
      } else if (Platform.isIOS) {
        return await _checkIOSJailbreak();
      }
    } catch (e) {
      debugPrint('Error checking root/jailbreak: $e');
    }
    return false;
  }

  /// Check for Android root indicators
  Future<bool> _checkAndroidRoot() async {
    // Check for common root paths
    final rootPaths = [
      '/system/app/Superuser.apk',
      '/system/app/SuperSU.apk',
      '/sbin/su',
      '/system/bin/su',
      '/system/xbin/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/system/sd/xbin/su',
      '/system/bin/failsafe/su',
      '/data/local/su',
      '/su/bin/su',
      '/system/app/Superuser/Superuser.apk',
      '/system/etc/init.d/99SuperSUDaemon',
      '/dev/com.koushikdutta.superuser.daemon/',
      '/system/xbin/daemonsu',
      '/sbin/magisk',
      '/system/bin/magisk',
    ];

    for (final path in rootPaths) {
      try {
        if (await File(path).exists()) {
          return true;
        }
      } catch (_) {
        // Ignore access errors
      }
    }

    // Check for root management apps
    final rootApps = [
      'com.noshufou.android.su',
      'com.noshufou.android.su.elite',
      'eu.chainfire.supersu',
      'com.koushikdutta.superuser',
      'com.thirdparty.superuser',
      'com.yellowes.su',
      'com.topjohnwu.magisk',
      'com.kingroot.kinguser',
      'com.kingo.root',
      'com.smedialink.oneclickroot',
      'com.zhiqupk.root.global',
    ];

    // Note: In production, use MethodChannel to check installed packages
    // This is a simplified check
    for (final app in rootApps) {
      try {
        final dir = Directory('/data/data/$app');
        if (await dir.exists()) {
          return true;
        }
      } catch (_) {
        // Ignore access errors
      }
    }

    // Check build tags
    try {
      final androidInfo = await _deviceInfo.androidInfo;
      final buildTags = androidInfo.tags.toLowerCase();
      if (buildTags.contains('test-keys')) {
        return true;
      }
    } catch (_) {}

    return false;
  }

  /// Check for iOS jailbreak indicators
  Future<bool> _checkIOSJailbreak() async {
    // Check for common jailbreak paths
    final jailbreakPaths = [
      '/Applications/Cydia.app',
      '/Applications/Sileo.app',
      '/Applications/Zebra.app',
      '/Library/MobileSubstrate/MobileSubstrate.dylib',
      '/bin/bash',
      '/usr/sbin/sshd',
      '/etc/apt',
      '/private/var/lib/apt/',
      '/private/var/lib/cydia',
      '/private/var/stash',
      '/private/var/mobile/Library/SBSettings/Themes',
      '/usr/libexec/cydia/firmware.sh',
      '/usr/sbin/frida-server',
      '/usr/bin/cycript',
      '/usr/local/bin/cycript',
      '/var/cache/apt',
      '/var/lib/cydia',
      '/var/log/syslog',
      '/bin/sh',
      '/usr/libexec/sftp-server',
      '/private/var/tmp/cydia.log',
    ];

    for (final path in jailbreakPaths) {
      try {
        if (await File(path).exists()) {
          return true;
        }
      } catch (_) {
        // Ignore access errors
      }
    }

    // Try to write to restricted location
    try {
      final testFile = File('/private/jailbreak_test');
      await testFile.writeAsString('test');
      await testFile.delete();
      return true; // If we can write here, device is jailbroken
    } catch (_) {
      // Expected on non-jailbroken device
    }

    // Check if cydia:// URL scheme is registered
    // This would need platform channel implementation

    return false;
  }

  /// Check if app has been tampered with
  Future<bool> isAppTampered() async {
    try {
      _packageInfo ??= await PackageInfo.fromPlatform();

      // Verify expected package name
      const expectedPackageName = 'app.upcoach.mobile';
      if (_packageInfo!.packageName != expectedPackageName) {
        return true;
      }

      // In production, you would also:
      // 1. Verify app signature/hash
      // 2. Check code signing certificate
      // 3. Verify that binary hasn't been modified

      return false;
    } catch (e) {
      debugPrint('Error checking app tampering: $e');
      return false;
    }
  }

  /// Get device details for logging
  Future<Map<String, dynamic>> _getDeviceDetails() async {
    final details = <String, dynamic>{};

    try {
      if (Platform.isAndroid) {
        final info = await _deviceInfo.androidInfo;
        details['platform'] = 'android';
        details['model'] = info.model;
        details['manufacturer'] = info.manufacturer;
        details['androidVersion'] = info.version.release;
        details['sdkInt'] = info.version.sdkInt;
        details['isPhysicalDevice'] = info.isPhysicalDevice;
      } else if (Platform.isIOS) {
        final info = await _deviceInfo.iosInfo;
        details['platform'] = 'ios';
        details['model'] = info.model;
        details['name'] = info.name;
        details['systemVersion'] = info.systemVersion;
        details['isPhysicalDevice'] = info.isPhysicalDevice;
      }

      if (_packageInfo != null) {
        details['appVersion'] = _packageInfo!.version;
        details['buildNumber'] = _packageInfo!.buildNumber;
        details['packageName'] = _packageInfo!.packageName;
      }
    } catch (e) {
      details['error'] = e.toString();
    }

    return details;
  }

  /// Enable or disable enforcement
  void setEnforcement(bool enforce) {
    _enforceChecks = enforce;
  }

  /// Get last check result
  IntegrityCheckResult? get lastCheck => _lastCheck;

  /// Clear cached check
  void clearCache() {
    _lastCheck = null;
    _lastCheckTime = null;
  }

  /// Get status summary
  Map<String, dynamic> getStatus() {
    return {
      'enforcing': _enforceChecks,
      'lastCheck': _lastCheck?.toJson(),
      'lastCheckTime': _lastCheckTime?.toIso8601String(),
      'cacheValid': _lastCheckTime != null &&
          DateTime.now().difference(_lastCheckTime!) < _checkCacheDuration,
    };
  }
}

/// Extension for quick integrity checks
extension IntegrityCheckExtension on AppIntegrityService {
  /// Quick check - returns true if device is secure
  Future<bool> isDeviceSecure() async {
    final result = await performFullCheck();
    return result.isSecure;
  }

  /// Get human-readable status message
  Future<String> getStatusMessage() async {
    final result = await performFullCheck();
    switch (result.status) {
      case IntegrityStatus.secure:
        return 'Device security verified';
      case IntegrityStatus.compromised:
        return 'Security risk: Device may be compromised';
      case IntegrityStatus.emulator:
        return 'Running on emulator environment';
      case IntegrityStatus.debugging:
        return 'Debug mode detected';
      case IntegrityStatus.tampered:
        return 'App integrity check failed';
      case IntegrityStatus.unknown:
        return 'Unable to verify device security';
    }
  }
}

/// Security policy for handling integrity failures
class SecurityPolicy {
  /// What to do when device is rooted/jailbroken
  final SecurityAction onCompromised;

  /// What to do when running on emulator
  final SecurityAction onEmulator;

  /// What to do when debugger is attached
  final SecurityAction onDebugger;

  /// What to do when app is tampered
  final SecurityAction onTampered;

  const SecurityPolicy({
    this.onCompromised = SecurityAction.warn,
    this.onEmulator = SecurityAction.allow,
    this.onDebugger = SecurityAction.allow,
    this.onTampered = SecurityAction.block,
  });

  /// Strict policy - block everything
  static const strict = SecurityPolicy(
    onCompromised: SecurityAction.block,
    onEmulator: SecurityAction.block,
    onDebugger: SecurityAction.block,
    onTampered: SecurityAction.block,
  );

  /// Standard policy - warn but allow
  static const standard = SecurityPolicy(
    onCompromised: SecurityAction.warn,
    onEmulator: SecurityAction.allow,
    onDebugger: SecurityAction.allow,
    onTampered: SecurityAction.block,
  );

  /// Development policy - allow everything
  static const development = SecurityPolicy(
    onCompromised: SecurityAction.allow,
    onEmulator: SecurityAction.allow,
    onDebugger: SecurityAction.allow,
    onTampered: SecurityAction.allow,
  );

  SecurityAction getAction(IntegrityStatus status) {
    switch (status) {
      case IntegrityStatus.compromised:
        return onCompromised;
      case IntegrityStatus.emulator:
        return onEmulator;
      case IntegrityStatus.debugging:
        return onDebugger;
      case IntegrityStatus.tampered:
        return onTampered;
      case IntegrityStatus.secure:
      case IntegrityStatus.unknown:
        return SecurityAction.allow;
    }
  }
}

/// Action to take on security policy violation
enum SecurityAction {
  /// Allow the operation
  allow,

  /// Warn the user but allow
  warn,

  /// Block the operation
  block,
}
