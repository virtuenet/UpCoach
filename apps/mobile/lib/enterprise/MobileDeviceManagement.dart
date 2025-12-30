import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// MDM policy
class MDMPolicy {
  final String id;
  final String name;
  final Map<String, dynamic> rules;
  final DateTime createdAt;
  final DateTime? expiresAt;
  final bool enforced;

  const MDMPolicy({
    required this.id,
    required this.name,
    required this.rules,
    required this.createdAt,
    this.expiresAt,
    this.enforced = true,
  });

  factory MDMPolicy.fromJson(Map<String, dynamic> json) {
    return MDMPolicy(
      id: json['id'] as String,
      name: json['name'] as String,
      rules: Map<String, dynamic>.from(json['rules']),
      createdAt: DateTime.parse(json['createdAt'] as String),
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt'] as String) : null,
      enforced: json['enforced'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'rules': rules,
      'createdAt': createdAt.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'enforced': enforced,
    };
  }

  bool isExpired() {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }
}

/// Device compliance status
class ComplianceStatus {
  final bool isCompliant;
  final List<String> violations;
  final DateTime checkedAt;
  final Map<String, dynamic>? details;

  const ComplianceStatus({
    required this.isCompliant,
    required this.violations,
    required this.checkedAt,
    this.details,
  });

  factory ComplianceStatus.fromJson(Map<String, dynamic> json) {
    return ComplianceStatus(
      isCompliant: json['isCompliant'] as bool,
      violations: List<String>.from(json['violations']),
      checkedAt: DateTime.parse(json['checkedAt'] as String),
      details: json['details'] != null ? Map<String, dynamic>.from(json['details']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isCompliant': isCompliant,
      'violations': violations,
      'checkedAt': checkedAt.toIso8601String(),
      'details': details,
    };
  }
}

/// Remote configuration
class RemoteConfig {
  final String id;
  final Map<String, dynamic> config;
  final int version;
  final DateTime updatedAt;

  const RemoteConfig({
    required this.id,
    required this.config,
    required this.version,
    required this.updatedAt,
  });

  factory RemoteConfig.fromJson(Map<String, dynamic> json) {
    return RemoteConfig(
      id: json['id'] as String,
      config: Map<String, dynamic>.from(json['config']),
      version: json['version'] as int,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'config': config,
      'version': version,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

/// MDM configuration profile
class ConfigurationProfile {
  final String id;
  final String name;
  final Map<String, dynamic> settings;
  final bool isSystem;

  const ConfigurationProfile({
    required this.id,
    required this.name,
    required this.settings,
    this.isSystem = false,
  });

  factory ConfigurationProfile.fromJson(Map<String, dynamic> json) {
    return ConfigurationProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      settings: Map<String, dynamic>.from(json['settings']),
      isSystem: json['isSystem'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'settings': settings,
      'isSystem': isSystem,
    };
  }
}

/// Service for Mobile Device Management
class MobileDeviceManagement extends ChangeNotifier {
  static const String _policyKey = 'mdm_policies';
  static const String _configKey = 'mdm_remote_config';
  static const String _complianceKey = 'mdm_compliance';
  static const String _profileKey = 'mdm_profiles';

  final SharedPreferences _prefs;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  List<MDMPolicy> _policies = [];
  RemoteConfig? _remoteConfig;
  ComplianceStatus? _lastComplianceCheck;
  List<ConfigurationProfile> _profiles = [];
  bool _initialized = false;

  static const MethodChannel _platform = MethodChannel('com.upcoach.mdm');

  MobileDeviceManagement({
    required SharedPreferences prefs,
  }) : _prefs = prefs;

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      await _loadPolicies();
      await _loadRemoteConfig();
      await _loadProfiles();
      await _loadComplianceStatus();

      // Check compliance on startup
      await checkCompliance();

      _initialized = true;
      debugPrint('MDM initialized');
    } catch (e) {
      debugPrint('Error initializing MDM: $e');
    }
  }

  // ============================================================================
  // Policy Management
  // ============================================================================

  Future<void> _loadPolicies() async {
    final policiesJson = _prefs.getString(_policyKey);
    if (policiesJson != null) {
      final policiesList = jsonDecode(policiesJson) as List;
      _policies = policiesList.map((p) => MDMPolicy.fromJson(p)).toList();
    }
  }

  Future<void> setPolicies(List<MDMPolicy> policies) async {
    _policies = policies;
    final policiesJson = jsonEncode(policies.map((p) => p.toJson()).toList());
    await _prefs.setString(_policyKey, policiesJson);
    
    // Re-check compliance after policy update
    await checkCompliance();
    notifyListeners();
  }

  Future<void> addPolicy(MDMPolicy policy) async {
    _policies.add(policy);
    await setPolicies(_policies);
  }

  Future<void> removePolicy(String policyId) async {
    _policies.removeWhere((p) => p.id == policyId);
    await setPolicies(_policies);
  }

  List<MDMPolicy> getPolicies() => List.unmodifiable(_policies);

  MDMPolicy? getPolicy(String id) {
    try {
      return _policies.firstWhere((p) => p.id == id);
    } catch (e) {
      return null;
    }
  }

  // ============================================================================
  // Remote Configuration
  // ============================================================================

  Future<void> _loadRemoteConfig() async {
    final configJson = _prefs.getString(_configKey);
    if (configJson != null) {
      _remoteConfig = RemoteConfig.fromJson(jsonDecode(configJson));
    }
  }

  Future<void> updateRemoteConfig(RemoteConfig config) async {
    _remoteConfig = config;
    await _prefs.setString(_configKey, jsonEncode(config.toJson()));
    notifyListeners();
  }

  Future<void> fetchRemoteConfig() async {
    try {
      // In production, fetch from MDM server
      debugPrint('Fetching remote configuration');
      
      // Simulate remote config fetch
      final config = RemoteConfig(
        id: 'default',
        config: {'feature_flags': {}, 'settings': {}},
        version: 1,
        updatedAt: DateTime.now(),
      );
      
      await updateRemoteConfig(config);
    } catch (e) {
      debugPrint('Error fetching remote config: $e');
    }
  }

  RemoteConfig? getRemoteConfig() => _remoteConfig;

  dynamic getConfigValue(String key, {dynamic defaultValue}) {
    return _remoteConfig?.config[key] ?? defaultValue;
  }

  // ============================================================================
  // Device Compliance
  // ============================================================================

  Future<void> _loadComplianceStatus() async {
    final statusJson = _prefs.getString(_complianceKey);
    if (statusJson != null) {
      _lastComplianceCheck = ComplianceStatus.fromJson(jsonDecode(statusJson));
    }
  }

  Future<ComplianceStatus> checkCompliance() async {
    final violations = <String>[];
    final details = <String, dynamic>{};

    try {
      // Get device info
      final deviceInfo = await _getDeviceInfo();
      details['device'] = deviceInfo;

      // Check each policy
      for (final policy in _policies) {
        if (!policy.enforced || policy.isExpired()) continue;

        final policyViolations = await _checkPolicy(policy, deviceInfo);
        violations.addAll(policyViolations);
      }

      // Check OS version
      final osVersion = deviceInfo['osVersion'] as String?;
      if (osVersion != null && !_isOSVersionCompliant(osVersion)) {
        violations.add('OS version outdated');
      }

      // Check app version
      final appInfo = await PackageInfo.fromPlatform();
      details['app'] = {
        'version': appInfo.version,
        'buildNumber': appInfo.buildNumber,
      };

      // Check encryption
      if (Platform.isAndroid) {
        final isEncrypted = await _checkDeviceEncryption();
        if (!isEncrypted) {
          violations.add('Device storage not encrypted');
        }
      }

      final status = ComplianceStatus(
        isCompliant: violations.isEmpty,
        violations: violations,
        checkedAt: DateTime.now(),
        details: details,
      );

      _lastComplianceCheck = status;
      await _prefs.setString(_complianceKey, jsonEncode(status.toJson()));
      notifyListeners();

      return status;
    } catch (e) {
      debugPrint('Error checking compliance: $e');
      return ComplianceStatus(
        isCompliant: false,
        violations: ['Error checking compliance'],
        checkedAt: DateTime.now(),
      );
    }
  }

  Future<List<String>> _checkPolicy(MDMPolicy policy, Map<String, dynamic> deviceInfo) async {
    final violations = <String>[];
    
    // Check password policy
    if (policy.rules.containsKey('requirePassword')) {
      final required = policy.rules['requirePassword'] as bool;
      if (required) {
        final hasPassword = await _checkDeviceHasPassword();
        if (!hasPassword) {
          violations.add('Device password not set');
        }
      }
    }

    // Check minimum OS version
    if (policy.rules.containsKey('minOSVersion')) {
      final minVersion = policy.rules['minOSVersion'] as String;
      final currentVersion = deviceInfo['osVersion'] as String;
      if (!_compareVersions(currentVersion, minVersion)) {
        violations.add('OS version below minimum: $minVersion');
      }
    }

    // Check allowed apps
    if (policy.rules.containsKey('blockedApps')) {
      final blockedApps = policy.rules['blockedApps'] as List;
      // Check for blocked apps (would require platform-specific implementation)
    }

    // Check network restrictions
    if (policy.rules.containsKey('requireVPN')) {
      final requireVPN = policy.rules['requireVPN'] as bool;
      if (requireVPN) {
        final hasVPN = await _checkVPNConnection();
        if (!hasVPN) {
          violations.add('VPN connection required');
        }
      }
    }

    return violations;
  }

  Future<Map<String, dynamic>> _getDeviceInfo() async {
    if (Platform.isAndroid) {
      final info = await _deviceInfo.androidInfo;
      return {
        'platform': 'android',
        'model': info.model,
        'manufacturer': info.manufacturer,
        'osVersion': info.version.release,
        'sdkInt': info.version.sdkInt,
        'isPhysicalDevice': info.isPhysicalDevice,
      };
    } else if (Platform.isIOS) {
      final info = await _deviceInfo.iosInfo;
      return {
        'platform': 'ios',
        'model': info.model,
        'name': info.name,
        'osVersion': info.systemVersion,
        'isPhysicalDevice': info.isPhysicalDevice,
      };
    }
    return {};
  }

  bool _isOSVersionCompliant(String version) {
    // Check if OS version meets minimum requirements
    if (Platform.isAndroid) {
      return _compareVersions(version, '10.0');
    } else if (Platform.isIOS) {
      return _compareVersions(version, '14.0');
    }
    return true;
  }

  bool _compareVersions(String current, String minimum) {
    try {
      final currentParts = current.split('.').map(int.parse).toList();
      final minimumParts = minimum.split('.').map(int.parse).toList();
      
      for (int i = 0; i < minimumParts.length && i < currentParts.length; i++) {
        if (currentParts[i] < minimumParts[i]) return false;
        if (currentParts[i] > minimumParts[i]) return true;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _checkDeviceHasPassword() async {
    try {
      final result = await _platform.invokeMethod('checkPassword');
      return result as bool? ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _checkDeviceEncryption() async {
    try {
      final result = await _platform.invokeMethod('checkEncryption');
      return result as bool? ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _checkVPNConnection() async {
    try {
      final result = await _platform.invokeMethod('checkVPN');
      return result as bool? ?? false;
    } catch (e) {
      return false;
    }
  }

  ComplianceStatus? getLastComplianceCheck() => _lastComplianceCheck;

  bool isCompliant() => _lastComplianceCheck?.isCompliant ?? false;

  // ============================================================================
  // App Distribution
  // ============================================================================

  Future<void> checkForUpdates() async {
    try {
      // Check for app updates from MDM server
      debugPrint('Checking for app updates');
    } catch (e) {
      debugPrint('Error checking for updates: $e');
    }
  }

  Future<void> installUpdate(String updateUrl) async {
    try {
      await _platform.invokeMethod('installUpdate', {'url': updateUrl});
    } catch (e) {
      debugPrint('Error installing update: $e');
    }
  }

  // ============================================================================
  // Remote Wipe
  // ============================================================================

  Future<void> performRemoteWipe() async {
    try {
      // Clear all app data
      await _prefs.clear();
      
      // Invoke platform-specific wipe
      await _platform.invokeMethod('wipeData');
      
      debugPrint('Remote wipe completed');
    } catch (e) {
      debugPrint('Error performing remote wipe: $e');
    }
  }

  // ============================================================================
  // Configuration Profiles
  // ============================================================================

  Future<void> _loadProfiles() async {
    final profilesJson = _prefs.getString(_profileKey);
    if (profilesJson != null) {
      final profilesList = jsonDecode(profilesJson) as List;
      _profiles = profilesList.map((p) => ConfigurationProfile.fromJson(p)).toList();
    }
  }

  Future<void> installProfile(ConfigurationProfile profile) async {
    _profiles.add(profile);
    await _saveProfiles();
    await _applyProfile(profile);
    notifyListeners();
  }

  Future<void> removeProfile(String profileId) async {
    _profiles.removeWhere((p) => p.id == profileId);
    await _saveProfiles();
    notifyListeners();
  }

  Future<void> _saveProfiles() async {
    final profilesJson = jsonEncode(_profiles.map((p) => p.toJson()).toList());
    await _prefs.setString(_profileKey, profilesJson);
  }

  Future<void> _applyProfile(ConfigurationProfile profile) async {
    try {
      // Apply profile settings
      for (final entry in profile.settings.entries) {
        await _applyProfileSetting(entry.key, entry.value);
      }
    } catch (e) {
      debugPrint('Error applying profile: $e');
    }
  }

  Future<void> _applyProfileSetting(String key, dynamic value) async {
    // Apply individual profile setting
    debugPrint('Applying setting: $key = $value');
  }

  List<ConfigurationProfile> getProfiles() => List.unmodifiable(_profiles);

  // ============================================================================
  // Device Lock
  // ============================================================================

  Future<void> lockDevice() async {
    try {
      await _platform.invokeMethod('lockDevice');
    } catch (e) {
      debugPrint('Error locking device: $e');
    }
  }

  // ============================================================================
  // Reporting
  // ============================================================================

  Future<void> reportStatus() async {
    try {
      final status = await checkCompliance();
      final deviceInfo = await _getDeviceInfo();
      
      final report = {
        'compliance': status.toJson(),
        'device': deviceInfo,
        'policies': _policies.length,
        'timestamp': DateTime.now().toIso8601String(),
      };

      // Send report to MDM server
      debugPrint('Reporting status: $report');
    } catch (e) {
      debugPrint('Error reporting status: $e');
    }
  }
}
