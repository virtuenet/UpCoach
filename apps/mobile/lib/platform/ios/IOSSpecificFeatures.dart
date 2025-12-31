// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

/// iOS-specific features and optimizations
/// Provides native iOS integrations, UI components, and performance optimizations
class IOSSpecificFeatures {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.features');
  static const EventChannel _eventChannel = EventChannel('com.upcoach.ios.events');

  static IOSSpecificFeatures? _instance;
  static IOSSpecificFeatures get instance {
    _instance ??= IOSSpecificFeatures._();
    return _instance!;
  }

  IOSSpecificFeatures._();

  bool _isInitialized = false;
  final Map<String, dynamic> _capabilities = {};

  /// Initialize iOS-specific features
  Future<void> initialize() async {
    if (_isInitialized) return;
    if (!Platform.isIOS) {
      debugPrint('IOSSpecificFeatures: Not running on iOS, skipping initialization');
      return;
    }

    try {
      final result = await _channel.invokeMethod<Map>('initialize');
      if (result != null) {
        _capabilities.addAll(Map<String, dynamic>.from(result));
      }
      _isInitialized = true;
      debugPrint('IOSSpecificFeatures: Initialized successfully');
    } catch (e) {
      debugPrint('IOSSpecificFeatures: Initialization error: $e');
      rethrow;
    }
  }

  /// Check if a specific capability is available
  bool hasCapability(String capability) {
    return _capabilities[capability] == true;
  }

  /// Get iOS version
  Future<IOSVersion> getIOSVersion() async {
    try {
      final version = await _channel.invokeMethod<String>('getIOSVersion');
      return IOSVersion.parse(version ?? '15.0');
    } catch (e) {
      debugPrint('Error getting iOS version: $e');
      return IOSVersion(15, 0, 0);
    }
  }
}

/// iOS version representation
class IOSVersion {
  final int major;
  final int minor;
  final int patch;

  IOSVersion(this.major, this.minor, this.patch);

  factory IOSVersion.parse(String version) {
    final parts = version.split('.');
    return IOSVersion(
      int.tryParse(parts[0]) ?? 15,
      parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0,
      parts.length > 2 ? (int.tryParse(parts[2]) ?? 0) : 0,
    );
  }

  bool operator >=(IOSVersion other) {
    if (major > other.major) return true;
    if (major < other.major) return false;
    if (minor > other.minor) return true;
    if (minor < other.minor) return false;
    return patch >= other.patch;
  }

  @override
  String toString() => '$major.$minor.$patch';
}

/// iOS Biometric Authentication Service
class IOSBiometricAuth {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.biometric');

  /// Check if biometric authentication is available
  Future<BiometricAvailability> checkBiometricAvailability() async {
    try {
      final result = await _channel.invokeMethod<Map>('checkAvailability');
      if (result == null) {
        return BiometricAvailability(
          isAvailable: false,
          biometricType: BiometricType.none,
          error: 'No response from native platform',
        );
      }

      return BiometricAvailability(
        isAvailable: result['available'] as bool? ?? false,
        biometricType: _parseBiometricType(result['type'] as String?),
        error: result['error'] as String?,
      );
    } catch (e) {
      debugPrint('Error checking biometric availability: $e');
      return BiometricAvailability(
        isAvailable: false,
        biometricType: BiometricType.none,
        error: e.toString(),
      );
    }
  }

  /// Authenticate using biometrics
  Future<BiometricAuthResult> authenticate({
    required String reason,
    bool useFallback = true,
    BiometricPolicy policy = BiometricPolicy.deviceOwnerAuthenticationWithBiometrics,
  }) async {
    try {
      final result = await _channel.invokeMethod<Map>('authenticate', {
        'reason': reason,
        'useFallback': useFallback,
        'policy': policy.index,
      });

      if (result == null) {
        return BiometricAuthResult(
          success: false,
          error: BiometricAuthError.unknown,
          errorMessage: 'No response from native platform',
        );
      }

      return BiometricAuthResult(
        success: result['success'] as bool? ?? false,
        error: _parseAuthError(result['errorCode'] as int?),
        errorMessage: result['errorMessage'] as String?,
      );
    } catch (e) {
      debugPrint('Error during biometric authentication: $e');
      return BiometricAuthResult(
        success: false,
        error: BiometricAuthError.unknown,
        errorMessage: e.toString(),
      );
    }
  }

  BiometricType _parseBiometricType(String? type) {
    switch (type) {
      case 'faceID':
        return BiometricType.faceID;
      case 'touchID':
        return BiometricType.touchID;
      default:
        return BiometricType.none;
    }
  }

  BiometricAuthError _parseAuthError(int? code) {
    switch (code) {
      case -1:
        return BiometricAuthError.userCancel;
      case -2:
        return BiometricAuthError.userFallback;
      case -3:
        return BiometricAuthError.systemCancel;
      case -4:
        return BiometricAuthError.passcodeNotSet;
      case -5:
        return BiometricAuthError.notAvailable;
      case -6:
        return BiometricAuthError.notEnrolled;
      case -7:
        return BiometricAuthError.lockout;
      case -8:
        return BiometricAuthError.appCancel;
      default:
        return BiometricAuthError.unknown;
    }
  }
}

enum BiometricType { none, touchID, faceID }

enum BiometricPolicy {
  deviceOwnerAuthenticationWithBiometrics,
  deviceOwnerAuthentication,
}

class BiometricAvailability {
  final bool isAvailable;
  final BiometricType biometricType;
  final String? error;

  BiometricAvailability({
    required this.isAvailable,
    required this.biometricType,
    this.error,
  });
}

class BiometricAuthResult {
  final bool success;
  final BiometricAuthError error;
  final String? errorMessage;

  BiometricAuthResult({
    required this.success,
    required this.error,
    this.errorMessage,
  });
}

enum BiometricAuthError {
  none,
  userCancel,
  userFallback,
  systemCancel,
  passcodeNotSet,
  notAvailable,
  notEnrolled,
  lockout,
  appCancel,
  unknown,
}

/// iOS UI Components Manager
class IOSUIComponents {
  /// Show iOS-style action sheet
  static Future<int?> showActionSheet({
    required BuildContext context,
    required String title,
    String? message,
    required List<ActionSheetOption> options,
    ActionSheetOption? cancelOption,
    ActionSheetOption? destructiveOption,
  }) async {
    return showCupertinoModalPopup<int>(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: Text(title),
        message: message != null ? Text(message) : null,
        actions: options
            .asMap()
            .entries
            .map((entry) => CupertinoActionSheetAction(
                  onPressed: () => Navigator.pop(context, entry.key),
                  child: Text(entry.value.label),
                ))
            .toList(),
        cancelButton: cancelOption != null
            ? CupertinoActionSheetAction(
                isDefaultAction: true,
                onPressed: () => Navigator.pop(context, -1),
                child: Text(cancelOption.label),
              )
            : null,
      ),
    );
  }

  /// Show iOS-style alert dialog
  static Future<bool?> showAlert({
    required BuildContext context,
    required String title,
    String? message,
    String confirmText = 'OK',
    String? cancelText,
  }) async {
    return showCupertinoDialog<bool>(
      context: context,
      builder: (BuildContext context) => CupertinoAlertDialog(
        title: Text(title),
        content: message != null ? Text(message) : null,
        actions: [
          if (cancelText != null)
            CupertinoDialogAction(
              onPressed: () => Navigator.pop(context, false),
              child: Text(cancelText),
            ),
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () => Navigator.pop(context, true),
            child: Text(confirmText),
          ),
        ],
      ),
    );
  }

  /// Show iOS-style date picker
  static Future<DateTime?> showDatePicker({
    required BuildContext context,
    required DateTime initialDate,
    DateTime? minimumDate,
    DateTime? maximumDate,
    CupertinoDatePickerMode mode = CupertinoDatePickerMode.date,
  }) async {
    DateTime? selectedDate = initialDate;

    await showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => Container(
        height: 300,
        color: CupertinoColors.systemBackground.resolveFrom(context),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                CupertinoButton(
                  child: const Text('Cancel'),
                  onPressed: () {
                    selectedDate = null;
                    Navigator.pop(context);
                  },
                ),
                CupertinoButton(
                  child: const Text('Done'),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            Expanded(
              child: CupertinoDatePicker(
                mode: mode,
                initialDateTime: initialDate,
                minimumDate: minimumDate,
                maximumDate: maximumDate,
                onDateTimeChanged: (DateTime newDate) {
                  selectedDate = newDate;
                },
              ),
            ),
          ],
        ),
      ),
    );

    return selectedDate;
  }

  /// Create iOS-style navigation bar
  static CupertinoNavigationBar createNavigationBar({
    required String title,
    Widget? leading,
    List<Widget>? trailing,
    Color? backgroundColor,
    bool automaticallyImplyLeading = true,
  }) {
    return CupertinoNavigationBar(
      middle: Text(title),
      leading: leading,
      trailing: trailing != null && trailing.isNotEmpty
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: trailing,
            )
          : null,
      backgroundColor: backgroundColor,
      automaticallyImplyLeading: automaticallyImplyLeading,
    );
  }

  /// Create iOS-style search bar
  static CupertinoSearchTextField createSearchBar({
    required TextEditingController controller,
    required ValueChanged<String> onChanged,
    VoidCallback? onSubmitted,
    String placeholder = 'Search',
  }) {
    return CupertinoSearchTextField(
      controller: controller,
      onChanged: onChanged,
      onSubmitted: (_) => onSubmitted?.call(),
      placeholder: placeholder,
    );
  }

  /// Create iOS-style segmented control
  static CupertinoSegmentedControl<T> createSegmentedControl<T>({
    required Map<T, Widget> children,
    required T groupValue,
    required ValueChanged<T> onValueChanged,
    Color? selectedColor,
  }) {
    return CupertinoSegmentedControl<T>(
      children: children,
      groupValue: groupValue,
      onValueChanged: onValueChanged,
      selectedColor: selectedColor,
    );
  }
}

class ActionSheetOption {
  final String label;
  final bool isDestructive;

  ActionSheetOption({
    required this.label,
    this.isDestructive = false,
  });
}

/// iOS System Integration
class IOSSystemIntegration {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.system');

  /// Setup App Clips
  Future<void> setupAppClips({
    required String clipURL,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      await _channel.invokeMethod('setupAppClips', {
        'url': clipURL,
        'metadata': metadata ?? {},
      });
    } catch (e) {
      debugPrint('Error setting up App Clips: $e');
    }
  }

  /// Sync data to iCloud
  Future<bool> syncToiCloud({
    required String key,
    required dynamic value,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('iCloudSync', {
        'key': key,
        'value': value,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error syncing to iCloud: $e');
      return false;
    }
  }

  /// Get data from iCloud
  Future<dynamic> getFromiCloud(String key) async {
    try {
      return await _channel.invokeMethod('iCloudGet', {'key': key});
    } catch (e) {
      debugPrint('Error getting from iCloud: $e');
      return null;
    }
  }

  /// Save to Keychain
  Future<bool> saveToKeychain({
    required String key,
    required String value,
    KeychainAccessibility accessibility = KeychainAccessibility.whenUnlockedThisDeviceOnly,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('keychainSave', {
        'key': key,
        'value': value,
        'accessibility': accessibility.index,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error saving to Keychain: $e');
      return false;
    }
  }

  /// Get from Keychain
  Future<String?> getFromKeychain(String key) async {
    try {
      return await _channel.invokeMethod<String>('keychainGet', {'key': key});
    } catch (e) {
      debugPrint('Error getting from Keychain: $e');
      return null;
    }
  }

  /// Delete from Keychain
  Future<bool> deleteFromKeychain(String key) async {
    try {
      final result = await _channel.invokeMethod<bool>('keychainDelete', {'key': key});
      return result ?? false;
    } catch (e) {
      debugPrint('Error deleting from Keychain: $e');
      return false;
    }
  }

  /// Setup Universal Links
  Future<void> setupUniversalLinks({
    required String domain,
    required List<String> paths,
  }) async {
    try {
      await _channel.invokeMethod('setupUniversalLinks', {
        'domain': domain,
        'paths': paths,
      });
    } catch (e) {
      debugPrint('Error setting up Universal Links: $e');
    }
  }

  /// Handle Universal Link
  Future<void> handleUniversalLink(String url) async {
    try {
      await _channel.invokeMethod('handleUniversalLink', {'url': url});
    } catch (e) {
      debugPrint('Error handling Universal Link: $e');
    }
  }

  /// Add to Spotlight Search
  Future<bool> addToSpotlight({
    required String identifier,
    required String title,
    required String description,
    String? thumbnailURL,
    Map<String, dynamic>? attributes,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('spotlightAdd', {
        'identifier': identifier,
        'title': title,
        'description': description,
        'thumbnailURL': thumbnailURL,
        'attributes': attributes ?? {},
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error adding to Spotlight: $e');
      return false;
    }
  }

  /// Remove from Spotlight Search
  Future<bool> removeFromSpotlight(String identifier) async {
    try {
      final result = await _channel.invokeMethod<bool>('spotlightRemove', {
        'identifier': identifier,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error removing from Spotlight: $e');
      return false;
    }
  }

  /// Setup Quick Actions (3D Touch/Haptic Touch)
  Future<void> setupQuickActions(List<QuickAction> actions) async {
    try {
      await _channel.invokeMethod('setupQuickActions', {
        'actions': actions.map((a) => a.toMap()).toList(),
      });
    } catch (e) {
      debugPrint('Error setting up Quick Actions: $e');
    }
  }

  /// Handle Quick Action
  Stream<QuickAction> get quickActionStream {
    return const EventChannel('com.upcoach.ios.quickaction')
        .receiveBroadcastStream()
        .map((event) => QuickAction.fromMap(Map<String, dynamic>.from(event as Map)));
  }

  /// Setup CallKit
  Future<void> setupCallKit({
    required String providerIdentifier,
    required String localizedName,
  }) async {
    try {
      await _channel.invokeMethod('setupCallKit', {
        'providerIdentifier': providerIdentifier,
        'localizedName': localizedName,
      });
    } catch (e) {
      debugPrint('Error setting up CallKit: $e');
    }
  }

  /// Report incoming call
  Future<void> reportIncomingCall({
    required String uuid,
    required String handle,
    required String callerName,
    bool hasVideo = false,
  }) async {
    try {
      await _channel.invokeMethod('reportIncomingCall', {
        'uuid': uuid,
        'handle': handle,
        'callerName': callerName,
        'hasVideo': hasVideo,
      });
    } catch (e) {
      debugPrint('Error reporting incoming call: $e');
    }
  }

  /// Setup SiriKit
  Future<void> setupSiriKit({
    required List<String> intents,
  }) async {
    try {
      await _channel.invokeMethod('setupSiriKit', {
        'intents': intents,
      });
    } catch (e) {
      debugPrint('Error setting up SiriKit: $e');
    }
  }

  /// Donate Siri interaction
  Future<void> donateSiriInteraction({
    required String intent,
    Map<String, dynamic>? parameters,
  }) async {
    try {
      await _channel.invokeMethod('donateSiriInteraction', {
        'intent': intent,
        'parameters': parameters ?? {},
      });
    } catch (e) {
      debugPrint('Error donating Siri interaction: $e');
    }
  }

  /// Setup HealthKit
  Future<bool> requestHealthKitAuthorization({
    required List<String> readTypes,
    required List<String> writeTypes,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('healthKitAuthorize', {
        'readTypes': readTypes,
        'writeTypes': writeTypes,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error requesting HealthKit authorization: $e');
      return false;
    }
  }

  /// Read HealthKit data
  Future<List<HealthKitSample>> readHealthKitData({
    required String type,
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final result = await _channel.invokeMethod<List>('healthKitRead', {
        'type': type,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
      });
      return (result ?? [])
          .map((item) => HealthKitSample.fromMap(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('Error reading HealthKit data: $e');
      return [];
    }
  }

  /// Write HealthKit data
  Future<bool> writeHealthKitData({
    required String type,
    required double value,
    required String unit,
    DateTime? date,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('healthKitWrite', {
        'type': type,
        'value': value,
        'unit': unit,
        'date': (date ?? DateTime.now()).toIso8601String(),
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error writing HealthKit data: $e');
      return false;
    }
  }

  /// Setup Live Activities (ActivityKit)
  Future<String?> startLiveActivity({
    required String activityType,
    required Map<String, dynamic> contentState,
    required Map<String, dynamic> staticContent,
  }) async {
    try {
      return await _channel.invokeMethod<String>('liveActivityStart', {
        'activityType': activityType,
        'contentState': contentState,
        'staticContent': staticContent,
      });
    } catch (e) {
      debugPrint('Error starting Live Activity: $e');
      return null;
    }
  }

  /// Update Live Activity
  Future<bool> updateLiveActivity({
    required String activityId,
    required Map<String, dynamic> contentState,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('liveActivityUpdate', {
        'activityId': activityId,
        'contentState': contentState,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error updating Live Activity: $e');
      return false;
    }
  }

  /// End Live Activity
  Future<bool> endLiveActivity({
    required String activityId,
    Map<String, dynamic>? finalContentState,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('liveActivityEnd', {
        'activityId': activityId,
        'finalContentState': finalContentState,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error ending Live Activity: $e');
      return false;
    }
  }

  /// Setup StoreKit 2
  Future<void> setupStoreKit() async {
    try {
      await _channel.invokeMethod('storeKitSetup');
    } catch (e) {
      debugPrint('Error setting up StoreKit: $e');
    }
  }

  /// Get available products
  Future<List<StoreProduct>> getProducts(List<String> productIds) async {
    try {
      final result = await _channel.invokeMethod<List>('storeKitGetProducts', {
        'productIds': productIds,
      });
      return (result ?? [])
          .map((item) => StoreProduct.fromMap(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('Error getting products: $e');
      return [];
    }
  }

  /// Purchase product
  Future<PurchaseResult> purchaseProduct(String productId) async {
    try {
      final result = await _channel.invokeMethod<Map>('storeKitPurchase', {
        'productId': productId,
      });
      return PurchaseResult.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error purchasing product: $e');
      return PurchaseResult(success: false, error: e.toString());
    }
  }

  /// Restore purchases
  Future<bool> restorePurchases() async {
    try {
      final result = await _channel.invokeMethod<bool>('storeKitRestore');
      return result ?? false;
    } catch (e) {
      debugPrint('Error restoring purchases: $e');
      return false;
    }
  }

  /// Setup Background App Refresh
  Future<void> setupBackgroundAppRefresh() async {
    try {
      await _channel.invokeMethod('setupBackgroundAppRefresh');
    } catch (e) {
      debugPrint('Error setting up Background App Refresh: $e');
    }
  }

  /// Schedule background refresh
  Future<bool> scheduleBackgroundRefresh({
    required String taskIdentifier,
    required DateTime earliestBeginDate,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('scheduleBackgroundRefresh', {
        'taskIdentifier': taskIdentifier,
        'earliestBeginDate': earliestBeginDate.toIso8601String(),
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error scheduling background refresh: $e');
      return false;
    }
  }

  /// Register for silent push notifications
  Future<bool> registerForSilentPush() async {
    try {
      final result = await _channel.invokeMethod<bool>('registerSilentPush');
      return result ?? false;
    } catch (e) {
      debugPrint('Error registering for silent push: $e');
      return false;
    }
  }
}

enum KeychainAccessibility {
  whenUnlocked,
  afterFirstUnlock,
  whenUnlockedThisDeviceOnly,
  afterFirstUnlockThisDeviceOnly,
  whenPasscodeSetThisDeviceOnly,
}

class QuickAction {
  final String type;
  final String title;
  final String? subtitle;
  final String? icon;

  QuickAction({
    required this.type,
    required this.title,
    this.subtitle,
    this.icon,
  });

  Map<String, dynamic> toMap() {
    return {
      'type': type,
      'title': title,
      'subtitle': subtitle,
      'icon': icon,
    };
  }

  factory QuickAction.fromMap(Map<String, dynamic> map) {
    return QuickAction(
      type: map['type'] as String? ?? '',
      title: map['title'] as String? ?? '',
      subtitle: map['subtitle'] as String?,
      icon: map['icon'] as String?,
    );
  }
}

class HealthKitSample {
  final String type;
  final double value;
  final String unit;
  final DateTime startDate;
  final DateTime endDate;

  HealthKitSample({
    required this.type,
    required this.value,
    required this.unit,
    required this.startDate,
    required this.endDate,
  });

  factory HealthKitSample.fromMap(Map<String, dynamic> map) {
    return HealthKitSample(
      type: map['type'] as String? ?? '',
      value: (map['value'] as num?)?.toDouble() ?? 0.0,
      unit: map['unit'] as String? ?? '',
      startDate: DateTime.parse(map['startDate'] as String? ?? DateTime.now().toIso8601String()),
      endDate: DateTime.parse(map['endDate'] as String? ?? DateTime.now().toIso8601String()),
    );
  }
}

class StoreProduct {
  final String id;
  final String title;
  final String description;
  final double price;
  final String currencyCode;

  StoreProduct({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.currencyCode,
  });

  factory StoreProduct.fromMap(Map<String, dynamic> map) {
    return StoreProduct(
      id: map['id'] as String? ?? '',
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      currencyCode: map['currencyCode'] as String? ?? 'USD',
    );
  }
}

class PurchaseResult {
  final bool success;
  final String? transactionId;
  final String? error;

  PurchaseResult({
    required this.success,
    this.transactionId,
    this.error,
  });

  factory PurchaseResult.fromMap(Map<String, dynamic> map) {
    return PurchaseResult(
      success: map['success'] as bool? ?? false,
      transactionId: map['transactionId'] as String?,
      error: map['error'] as String?,
    );
  }
}

/// iOS Performance Optimization
class IOSPerformanceOptimization {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.performance');

  /// Enable Metal GPU acceleration
  Future<bool> enableMetalAcceleration() async {
    try {
      final result = await _channel.invokeMethod<bool>('enableMetal');
      return result ?? false;
    } catch (e) {
      debugPrint('Error enabling Metal acceleration: $e');
      return false;
    }
  }

  /// Optimize Core Animation
  Future<void> optimizeCoreAnimation({
    bool shouldRasterize = true,
    bool enableOffscreenRendering = false,
  }) async {
    try {
      await _channel.invokeMethod('optimizeCoreAnimation', {
        'shouldRasterize': shouldRasterize,
        'enableOffscreenRendering': enableOffscreenRendering,
      });
    } catch (e) {
      debugPrint('Error optimizing Core Animation: $e');
    }
  }

  /// Optimize memory usage
  Future<void> optimizeMemory() async {
    try {
      await _channel.invokeMethod('optimizeMemory');
    } catch (e) {
      debugPrint('Error optimizing memory: $e');
    }
  }

  /// Get memory usage
  Future<MemoryUsage> getMemoryUsage() async {
    try {
      final result = await _channel.invokeMethod<Map>('getMemoryUsage');
      return MemoryUsage.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error getting memory usage: $e');
      return MemoryUsage(used: 0, available: 0, total: 0);
    }
  }

  /// Optimize launch time
  Future<void> optimizeLaunchTime() async {
    try {
      await _channel.invokeMethod('optimizeLaunchTime');
    } catch (e) {
      debugPrint('Error optimizing launch time: $e');
    }
  }

  /// Measure app startup time
  Future<Duration> measureStartupTime() async {
    try {
      final result = await _channel.invokeMethod<int>('measureStartupTime');
      return Duration(milliseconds: result ?? 0);
    } catch (e) {
      debugPrint('Error measuring startup time: $e');
      return Duration.zero;
    }
  }

  /// Optimize app size
  Future<AppSizeInfo> getAppSizeInfo() async {
    try {
      final result = await _channel.invokeMethod<Map>('getAppSizeInfo');
      return AppSizeInfo.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error getting app size info: $e');
      return AppSizeInfo(appSize: 0, documentsSize: 0, cachesSize: 0);
    }
  }

  /// Clear caches
  Future<bool> clearCaches() async {
    try {
      final result = await _channel.invokeMethod<bool>('clearCaches');
      return result ?? false;
    } catch (e) {
      debugPrint('Error clearing caches: $e');
      return false;
    }
  }
}

class MemoryUsage {
  final int used;
  final int available;
  final int total;

  MemoryUsage({
    required this.used,
    required this.available,
    required this.total,
  });

  factory MemoryUsage.fromMap(Map<String, dynamic> map) {
    return MemoryUsage(
      used: map['used'] as int? ?? 0,
      available: map['available'] as int? ?? 0,
      total: map['total'] as int? ?? 0,
    );
  }

  double get usagePercentage => total > 0 ? (used / total) * 100 : 0;
}

class AppSizeInfo {
  final int appSize;
  final int documentsSize;
  final int cachesSize;

  AppSizeInfo({
    required this.appSize,
    required this.documentsSize,
    required this.cachesSize,
  });

  factory AppSizeInfo.fromMap(Map<String, dynamic> map) {
    return AppSizeInfo(
      appSize: map['appSize'] as int? ?? 0,
      documentsSize: map['documentsSize'] as int? ?? 0,
      cachesSize: map['cachesSize'] as int? ?? 0,
    );
  }

  int get totalSize => appSize + documentsSize + cachesSize;
}

/// iOS Haptic Feedback Generator
class IOSHapticFeedback {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.haptic');

  /// Generate impact feedback
  static Future<void> impact(HapticImpactStyle style) async {
    try {
      await _channel.invokeMethod('impact', {'style': style.index});
    } catch (e) {
      debugPrint('Error generating impact haptic: $e');
    }
  }

  /// Generate selection feedback
  static Future<void> selection() async {
    try {
      await _channel.invokeMethod('selection');
    } catch (e) {
      debugPrint('Error generating selection haptic: $e');
    }
  }

  /// Generate notification feedback
  static Future<void> notification(HapticNotificationType type) async {
    try {
      await _channel.invokeMethod('notification', {'type': type.index});
    } catch (e) {
      debugPrint('Error generating notification haptic: $e');
    }
  }
}

enum HapticImpactStyle {
  light,
  medium,
  heavy,
  soft,
  rigid,
}

enum HapticNotificationType {
  success,
  warning,
  error,
}

/// iOS Safe Area Manager
class IOSSafeAreaManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.safearea');

  /// Get safe area insets
  static Future<SafeAreaInsets> getSafeAreaInsets() async {
    try {
      final result = await _channel.invokeMethod<Map>('getSafeAreaInsets');
      return SafeAreaInsets.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error getting safe area insets: $e');
      return SafeAreaInsets(top: 0, bottom: 0, left: 0, right: 0);
    }
  }
}

class SafeAreaInsets {
  final double top;
  final double bottom;
  final double left;
  final double right;

  SafeAreaInsets({
    required this.top,
    required this.bottom,
    required this.left,
    required this.right,
  });

  factory SafeAreaInsets.fromMap(Map<String, dynamic> map) {
    return SafeAreaInsets(
      top: (map['top'] as num?)?.toDouble() ?? 0.0,
      bottom: (map['bottom'] as num?)?.toDouble() ?? 0.0,
      left: (map['left'] as num?)?.toDouble() ?? 0.0,
      right: (map['right'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// iOS Dark Mode Manager
class IOSDarkModeManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.darkmode');

  /// Get current interface style
  static Future<InterfaceStyle> getInterfaceStyle() async {
    try {
      final result = await _channel.invokeMethod<String>('getInterfaceStyle');
      return result == 'dark' ? InterfaceStyle.dark : InterfaceStyle.light;
    } catch (e) {
      debugPrint('Error getting interface style: $e');
      return InterfaceStyle.light;
    }
  }

  /// Listen to interface style changes
  static Stream<InterfaceStyle> get interfaceStyleStream {
    return const EventChannel('com.upcoach.ios.darkmode.events')
        .receiveBroadcastStream()
        .map((event) => event == 'dark' ? InterfaceStyle.dark : InterfaceStyle.light);
  }

  /// Set preferred interface style
  static Future<void> setPreferredInterfaceStyle(InterfaceStyle style) async {
    try {
      await _channel.invokeMethod('setPreferredInterfaceStyle', {
        'style': style == InterfaceStyle.dark ? 'dark' : 'light',
      });
    } catch (e) {
      debugPrint('Error setting preferred interface style: $e');
    }
  }
}

enum InterfaceStyle {
  light,
  dark,
}

/// iOS Dynamic Type Manager
class IOSDynamicTypeManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.ios.dynamictype');

  /// Get current content size category
  static Future<ContentSizeCategory> getContentSizeCategory() async {
    try {
      final result = await _channel.invokeMethod<String>('getContentSizeCategory');
      return _parseContentSizeCategory(result ?? 'medium');
    } catch (e) {
      debugPrint('Error getting content size category: $e');
      return ContentSizeCategory.medium;
    }
  }

  /// Listen to content size category changes
  static Stream<ContentSizeCategory> get contentSizeCategoryStream {
    return const EventChannel('com.upcoach.ios.dynamictype.events')
        .receiveBroadcastStream()
        .map((event) => _parseContentSizeCategory(event as String? ?? 'medium'));
  }

  static ContentSizeCategory _parseContentSizeCategory(String category) {
    switch (category.toLowerCase()) {
      case 'extrasmall':
        return ContentSizeCategory.extraSmall;
      case 'small':
        return ContentSizeCategory.small;
      case 'medium':
        return ContentSizeCategory.medium;
      case 'large':
        return ContentSizeCategory.large;
      case 'extralarge':
        return ContentSizeCategory.extraLarge;
      case 'extraextralarge':
        return ContentSizeCategory.extraExtraLarge;
      case 'extraextraextralarge':
        return ContentSizeCategory.extraExtraExtraLarge;
      case 'accessibilitymedium':
        return ContentSizeCategory.accessibilityMedium;
      case 'accessibilitylarge':
        return ContentSizeCategory.accessibilityLarge;
      case 'accessibilityextralarge':
        return ContentSizeCategory.accessibilityExtraLarge;
      case 'accessibilityextraextralarge':
        return ContentSizeCategory.accessibilityExtraExtraLarge;
      case 'accessibilityextraextraextralarge':
        return ContentSizeCategory.accessibilityExtraExtraExtraLarge;
      default:
        return ContentSizeCategory.medium;
    }
  }
}

enum ContentSizeCategory {
  extraSmall,
  small,
  medium,
  large,
  extraLarge,
  extraExtraLarge,
  extraExtraExtraLarge,
  accessibilityMedium,
  accessibilityLarge,
  accessibilityExtraLarge,
  accessibilityExtraExtraLarge,
  accessibilityExtraExtraExtraLarge,
}

/// iOS Scroll Physics
class IOSScrollPhysics extends ScrollPhysics {
  const IOSScrollPhysics({super.parent});

  @override
  IOSScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return IOSScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => SpringDescription.withDampingRatio(
        mass: 0.5,
        stiffness: 100.0,
        ratio: 1.1,
      );

  @override
  double get minFlingVelocity => 50.0;

  @override
  double get maxFlingVelocity => 8000.0;

  @override
  double get dragStartDistanceMotionThreshold => 3.5;
}
