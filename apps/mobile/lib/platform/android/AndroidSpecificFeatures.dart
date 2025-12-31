// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

/// Android-specific features and optimizations
/// Provides native Android integrations, UI components, and performance optimizations
class AndroidSpecificFeatures {
  static const MethodChannel _channel = MethodChannel('com.upcoach.android.features');
  static const EventChannel _eventChannel = EventChannel('com.upcoach.android.events');

  static AndroidSpecificFeatures? _instance;
  static AndroidSpecificFeatures get instance {
    _instance ??= AndroidSpecificFeatures._();
    return _instance!;
  }

  AndroidSpecificFeatures._();

  bool _isInitialized = false;
  final Map<String, dynamic> _capabilities = {};

  /// Initialize Android-specific features
  Future<void> initialize() async {
    if (_isInitialized) return;
    if (!Platform.isAndroid) {
      debugPrint('AndroidSpecificFeatures: Not running on Android, skipping initialization');
      return;
    }

    try {
      final result = await _channel.invokeMethod<Map>('initialize');
      if (result != null) {
        _capabilities.addAll(Map<String, dynamic>.from(result));
      }
      _isInitialized = true;
      debugPrint('AndroidSpecificFeatures: Initialized successfully');
    } catch (e) {
      debugPrint('AndroidSpecificFeatures: Initialization error: $e');
      rethrow;
    }
  }

  /// Check if a specific capability is available
  bool hasCapability(String capability) {
    return _capabilities[capability] == true;
  }

  /// Get Android API level
  Future<int> getAPILevel() async {
    try {
      final level = await _channel.invokeMethod<int>('getAPILevel');
      return level ?? 21;
    } catch (e) {
      debugPrint('Error getting Android API level: $e');
      return 21;
    }
  }

  /// Get Android version
  Future<AndroidVersion> getAndroidVersion() async {
    try {
      final version = await _channel.invokeMethod<String>('getAndroidVersion');
      return AndroidVersion.parse(version ?? '11');
    } catch (e) {
      debugPrint('Error getting Android version: $e');
      return AndroidVersion(11, 0);
    }
  }
}

/// Android version representation
class AndroidVersion {
  final int major;
  final int minor;

  AndroidVersion(this.major, this.minor);

  factory AndroidVersion.parse(String version) {
    final parts = version.split('.');
    return AndroidVersion(
      int.tryParse(parts[0]) ?? 11,
      parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0,
    );
  }

  bool operator >=(AndroidVersion other) {
    if (major > other.major) return true;
    if (major < other.major) return false;
    return minor >= other.minor;
  }

  @override
  String toString() => '$major.$minor';
}

/// Android Biometric Authentication Service
class AndroidBiometricAuth {
  static const MethodChannel _channel = MethodChannel('com.upcoach.android.biometric');

  /// Check if biometric authentication is available
  Future<BiometricAvailability> checkBiometricAvailability() async {
    try {
      final result = await _channel.invokeMethod<Map>('checkAvailability');
      if (result == null) {
        return BiometricAvailability(
          isAvailable: false,
          biometricTypes: [],
          error: 'No response from native platform',
        );
      }

      return BiometricAvailability(
        isAvailable: result['available'] as bool? ?? false,
        biometricTypes: _parseBiometricTypes(result['types'] as List?),
        error: result['error'] as String?,
      );
    } catch (e) {
      debugPrint('Error checking biometric availability: $e');
      return BiometricAvailability(
        isAvailable: false,
        biometricTypes: [],
        error: e.toString(),
      );
    }
  }

  /// Authenticate using biometrics
  Future<BiometricAuthResult> authenticate({
    required String title,
    required String subtitle,
    String? description,
    String negativeButtonText = 'Cancel',
    bool allowDeviceCredential = true,
    bool requireConfirmation = true,
    BiometricAuthenticatorStrength strength = BiometricAuthenticatorStrength.strong,
  }) async {
    try {
      final result = await _channel.invokeMethod<Map>('authenticate', {
        'title': title,
        'subtitle': subtitle,
        'description': description,
        'negativeButtonText': negativeButtonText,
        'allowDeviceCredential': allowDeviceCredential,
        'requireConfirmation': requireConfirmation,
        'strength': strength.index,
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
        authenticationType: _parseAuthenticationType(result['authenticationType'] as String?),
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

  /// Authenticate with crypto
  Future<BiometricCryptoAuthResult> authenticateWithCrypto({
    required String title,
    required String subtitle,
    required String keyName,
    String? description,
    String negativeButtonText = 'Cancel',
  }) async {
    try {
      final result = await _channel.invokeMethod<Map>('authenticateWithCrypto', {
        'title': title,
        'subtitle': subtitle,
        'description': description,
        'negativeButtonText': negativeButtonText,
        'keyName': keyName,
      });

      if (result == null) {
        return BiometricCryptoAuthResult(
          success: false,
          error: BiometricAuthError.unknown,
          errorMessage: 'No response from native platform',
        );
      }

      return BiometricCryptoAuthResult(
        success: result['success'] as bool? ?? false,
        error: _parseAuthError(result['errorCode'] as int?),
        errorMessage: result['errorMessage'] as String?,
        cryptoObject: result['cryptoObject'] as String?,
      );
    } catch (e) {
      debugPrint('Error during crypto authentication: $e');
      return BiometricCryptoAuthResult(
        success: false,
        error: BiometricAuthError.unknown,
        errorMessage: e.toString(),
      );
    }
  }

  List<BiometricType> _parseBiometricTypes(List? types) {
    if (types == null) return [];
    return types
        .map((type) => _parseBiometricType(type as String?))
        .where((type) => type != BiometricType.none)
        .toList();
  }

  BiometricType _parseBiometricType(String? type) {
    switch (type) {
      case 'fingerprint':
        return BiometricType.fingerprint;
      case 'face':
        return BiometricType.face;
      case 'iris':
        return BiometricType.iris;
      default:
        return BiometricType.none;
    }
  }

  BiometricAuthError _parseAuthError(int? code) {
    switch (code) {
      case 1:
        return BiometricAuthError.hardwareUnavailable;
      case 2:
        return BiometricAuthError.hardwareNotPresent;
      case 3:
        return BiometricAuthError.notEnrolled;
      case 4:
        return BiometricAuthError.securityUpdateRequired;
      case 5:
        return BiometricAuthError.userCancel;
      case 6:
        return BiometricAuthError.lockout;
      case 7:
        return BiometricAuthError.lockoutPermanent;
      case 8:
        return BiometricAuthError.timeout;
      case 9:
        return BiometricAuthError.negativeBut;
      case 10:
        return BiometricAuthError.noSpace;
      case 11:
        return BiometricAuthError.canceled;
      default:
        return BiometricAuthError.unknown;
    }
  }

  AuthenticationType _parseAuthenticationType(String? type) {
    switch (type) {
      case 'biometric':
        return AuthenticationType.biometric;
      case 'deviceCredential':
        return AuthenticationType.deviceCredential;
      default:
        return AuthenticationType.unknown;
    }
  }
}

enum BiometricType { none, fingerprint, face, iris }

enum BiometricAuthenticatorStrength { weak, strong }

enum AuthenticationType { unknown, biometric, deviceCredential }

class BiometricAvailability {
  final bool isAvailable;
  final List<BiometricType> biometricTypes;
  final String? error;

  BiometricAvailability({
    required this.isAvailable,
    required this.biometricTypes,
    this.error,
  });
}

class BiometricAuthResult {
  final bool success;
  final BiometricAuthError error;
  final String? errorMessage;
  final AuthenticationType? authenticationType;

  BiometricAuthResult({
    required this.success,
    required this.error,
    this.errorMessage,
    this.authenticationType,
  });
}

class BiometricCryptoAuthResult {
  final bool success;
  final BiometricAuthError error;
  final String? errorMessage;
  final String? cryptoObject;

  BiometricCryptoAuthResult({
    required this.success,
    required this.error,
    this.errorMessage,
    this.cryptoObject,
  });
}

enum BiometricAuthError {
  none,
  hardwareUnavailable,
  hardwareNotPresent,
  notEnrolled,
  securityUpdateRequired,
  userCancel,
  lockout,
  lockoutPermanent,
  timeout,
  negativeBut,
  noSpace,
  canceled,
  unknown,
}

/// Android UI Components Manager
class AndroidUIComponents {
  /// Show Material Design snackbar
  static ScaffoldFeatureController<SnackBar, SnackBarClosedReason> showSnackbar({
    required BuildContext context,
    required String message,
    String? actionLabel,
    VoidCallback? onActionPressed,
    Duration duration = const Duration(seconds: 4),
    SnackBarBehavior behavior = SnackBarBehavior.floating,
  }) {
    return ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: duration,
        behavior: behavior,
        action: actionLabel != null
            ? SnackBarAction(
                label: actionLabel,
                onPressed: onActionPressed ?? () {},
              )
            : null,
      ),
    );
  }

  /// Show Material Design bottom sheet
  static Future<T?> showBottomSheet<T>({
    required BuildContext context,
    required WidgetBuilder builder,
    bool isDismissible = true,
    bool enableDrag = true,
    Color? backgroundColor,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      builder: builder,
      isDismissible: isDismissible,
      enableDrag: enableDrag,
      backgroundColor: backgroundColor,
      isScrollControlled: true,
    );
  }

  /// Show Material Design dialog
  static Future<T?> showDialog<T>({
    required BuildContext context,
    required String title,
    String? content,
    List<DialogAction>? actions,
    bool barrierDismissible = true,
  }) {
    return showAdaptiveDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (BuildContext context) => AlertDialog(
        title: Text(title),
        content: content != null ? Text(content) : null,
        actions: actions
                ?.map((action) => TextButton(
                      onPressed: () {
                        Navigator.pop(context, action.value);
                        action.onPressed?.call();
                      },
                      child: Text(action.label),
                    ))
                .toList() ??
            [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
      ),
    );
  }

  /// Create Material Design floating action button
  static FloatingActionButton createFAB({
    required VoidCallback onPressed,
    required Widget child,
    String? tooltip,
    bool mini = false,
    FloatingActionButtonLocation location = FloatingActionButtonLocation.endFloat,
  }) {
    return FloatingActionButton(
      onPressed: onPressed,
      tooltip: tooltip,
      mini: mini,
      child: child,
    );
  }

  /// Create Material Design chip
  static Chip createChip({
    required String label,
    Widget? avatar,
    VoidCallback? onDeleted,
    VoidCallback? onPressed,
  }) {
    if (onPressed != null) {
      return ActionChip(
        label: Text(label),
        avatar: avatar,
        onPressed: onPressed,
      );
    }
    return Chip(
      label: Text(label),
      avatar: avatar,
      onDeleted: onDeleted,
    );
  }

  /// Show Material Design date picker
  static Future<DateTime?> showDatePicker({
    required BuildContext context,
    required DateTime initialDate,
    required DateTime firstDate,
    required DateTime lastDate,
    DatePickerMode initialDatePickerMode = DatePickerMode.day,
  }) {
    return showDatePickerDialog(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      initialDatePickerMode: initialDatePickerMode,
    );
  }

  /// Show Material Design time picker
  static Future<TimeOfDay?> showTimePicker({
    required BuildContext context,
    required TimeOfDay initialTime,
  }) {
    return showTimePickerDialog(
      context: context,
      initialTime: initialTime,
    );
  }

  /// Create Material Design navigation drawer
  static Drawer createNavigationDrawer({
    required List<DrawerItem> items,
    Widget? header,
  }) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          if (header != null) header,
          ...items.map((item) {
            if (item.isDivider) {
              return const Divider();
            }
            return ListTile(
              leading: item.icon,
              title: Text(item.label),
              onTap: item.onTap,
              selected: item.isSelected,
            );
          }),
        ],
      ),
    );
  }

  /// Create Material Design bottom navigation bar
  static BottomNavigationBar createBottomNavigationBar({
    required int currentIndex,
    required List<BottomNavItem> items,
    required ValueChanged<int> onTap,
  }) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      items: items
          .map((item) => BottomNavigationBarItem(
                icon: item.icon,
                label: item.label,
                tooltip: item.tooltip,
              ))
          .toList(),
    );
  }
}

class DialogAction<T> {
  final String label;
  final VoidCallback? onPressed;
  final T? value;

  DialogAction({
    required this.label,
    this.onPressed,
    this.value,
  });
}

class DrawerItem {
  final String label;
  final Widget? icon;
  final VoidCallback? onTap;
  final bool isSelected;
  final bool isDivider;

  DrawerItem({
    this.label = '',
    this.icon,
    this.onTap,
    this.isSelected = false,
    this.isDivider = false,
  });

  factory DrawerItem.divider() => DrawerItem(isDivider: true);
}

class BottomNavItem {
  final Widget icon;
  final String label;
  final String? tooltip;

  BottomNavItem({
    required this.icon,
    required this.label,
    this.tooltip,
  });
}

/// Android System Integration
class AndroidSystemIntegration {
  static const MethodChannel _channel = MethodChannel('com.upcoach.android.system');

  /// Setup Android App Links
  Future<void> setupAppLinks({
    required String domain,
    required List<String> paths,
  }) async {
    try {
      await _channel.invokeMethod('setupAppLinks', {
        'domain': domain,
        'paths': paths,
      });
    } catch (e) {
      debugPrint('Error setting up App Links: $e');
    }
  }

  /// Handle App Link
  Future<void> handleAppLink(String url) async {
    try {
      await _channel.invokeMethod('handleAppLink', {'url': url});
    } catch (e) {
      debugPrint('Error handling App Link: $e');
    }
  }

  /// Setup Firebase Cloud Messaging
  Future<String?> setupFirebaseMessaging() async {
    try {
      return await _channel.invokeMethod<String>('setupFCM');
    } catch (e) {
      debugPrint('Error setting up FCM: $e');
      return null;
    }
  }

  /// Subscribe to FCM topic
  Future<bool> subscribeFCMTopic(String topic) async {
    try {
      final result = await _channel.invokeMethod<bool>('fcmSubscribe', {
        'topic': topic,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error subscribing to FCM topic: $e');
      return false;
    }
  }

  /// Unsubscribe from FCM topic
  Future<bool> unsubscribeFCMTopic(String topic) async {
    try {
      final result = await _channel.invokeMethod<bool>('fcmUnsubscribe', {
        'topic': topic,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error unsubscribing from FCM topic: $e');
      return false;
    }
  }

  /// Setup WorkManager for background tasks
  Future<bool> setupWorkManager() async {
    try {
      final result = await _channel.invokeMethod<bool>('setupWorkManager');
      return result ?? false;
    } catch (e) {
      debugPrint('Error setting up WorkManager: $e');
      return false;
    }
  }

  /// Schedule periodic work
  Future<String?> schedulePeriodicWork({
    required String workName,
    required Duration interval,
    required Map<String, dynamic> inputData,
    WorkConstraints? constraints,
  }) async {
    try {
      return await _channel.invokeMethod<String>('schedulePeriodicWork', {
        'workName': workName,
        'intervalMinutes': interval.inMinutes,
        'inputData': inputData,
        'constraints': constraints?.toMap() ?? {},
      });
    } catch (e) {
      debugPrint('Error scheduling periodic work: $e');
      return null;
    }
  }

  /// Schedule one-time work
  Future<String?> scheduleOneTimeWork({
    required String workName,
    required Map<String, dynamic> inputData,
    WorkConstraints? constraints,
    Duration? initialDelay,
  }) async {
    try {
      return await _channel.invokeMethod<String>('scheduleOneTimeWork', {
        'workName': workName,
        'inputData': inputData,
        'constraints': constraints?.toMap() ?? {},
        'initialDelayMinutes': initialDelay?.inMinutes ?? 0,
      });
    } catch (e) {
      debugPrint('Error scheduling one-time work: $e');
      return null;
    }
  }

  /// Cancel work by name
  Future<bool> cancelWork(String workName) async {
    try {
      final result = await _channel.invokeMethod<bool>('cancelWork', {
        'workName': workName,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error canceling work: $e');
      return false;
    }
  }

  /// Create notification channel
  Future<bool> createNotificationChannel({
    required String channelId,
    required String channelName,
    required String channelDescription,
    NotificationImportance importance = NotificationImportance.high,
    bool enableVibration = true,
    bool enableLights = true,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('createNotificationChannel', {
        'channelId': channelId,
        'channelName': channelName,
        'channelDescription': channelDescription,
        'importance': importance.index,
        'enableVibration': enableVibration,
        'enableLights': enableLights,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error creating notification channel: $e');
      return false;
    }
  }

  /// Delete notification channel
  Future<bool> deleteNotificationChannel(String channelId) async {
    try {
      final result = await _channel.invokeMethod<bool>('deleteNotificationChannel', {
        'channelId': channelId,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error deleting notification channel: $e');
      return false;
    }
  }

  /// Enable Picture-in-Picture mode
  Future<bool> enterPIPMode({
    int? aspectRatioNumerator,
    int? aspectRatioDenominator,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('enterPIPMode', {
        'aspectRatioNumerator': aspectRatioNumerator ?? 16,
        'aspectRatioDenominator': aspectRatioDenominator ?? 9,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error entering PIP mode: $e');
      return false;
    }
  }

  /// Check if PIP is supported
  Future<bool> isPIPSupported() async {
    try {
      final result = await _channel.invokeMethod<bool>('isPIPSupported');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking PIP support: $e');
      return false;
    }
  }

  /// Setup App Shortcuts
  Future<bool> setupAppShortcuts(List<AppShortcut> shortcuts) async {
    try {
      final result = await _channel.invokeMethod<bool>('setupAppShortcuts', {
        'shortcuts': shortcuts.map((s) => s.toMap()).toList(),
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error setting up app shortcuts: $e');
      return false;
    }
  }

  /// Handle app shortcut
  Stream<AppShortcut> get shortcutStream {
    return const EventChannel('com.upcoach.android.shortcuts')
        .receiveBroadcastStream()
        .map((event) => AppShortcut.fromMap(Map<String, dynamic>.from(event as Map)));
  }

  /// Setup Android Auto
  Future<bool> setupAndroidAuto() async {
    try {
      final result = await _channel.invokeMethod<bool>('setupAndroidAuto');
      return result ?? false;
    } catch (e) {
      debugPrint('Error setting up Android Auto: $e');
      return false;
    }
  }

  /// Setup Wear OS sync
  Future<bool> setupWearOSSync() async {
    try {
      final result = await _channel.invokeMethod<bool>('setupWearOS');
      return result ?? false;
    } catch (e) {
      debugPrint('Error setting up Wear OS: $e');
      return false;
    }
  }

  /// Sync data to Wear OS
  Future<bool> syncToWearOS(String path, Map<String, dynamic> data) async {
    try {
      final result = await _channel.invokeMethod<bool>('wearOSSync', {
        'path': path,
        'data': data,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error syncing to Wear OS: $e');
      return false;
    }
  }

  /// Setup Google Fit integration
  Future<bool> requestGoogleFitPermissions({
    required List<String> readTypes,
    required List<String> writeTypes,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('googleFitAuthorize', {
        'readTypes': readTypes,
        'writeTypes': writeTypes,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error requesting Google Fit permissions: $e');
      return false;
    }
  }

  /// Read Google Fit data
  Future<List<FitDataPoint>> readGoogleFitData({
    required String dataType,
    required DateTime startTime,
    required DateTime endTime,
  }) async {
    try {
      final result = await _channel.invokeMethod<List>('googleFitRead', {
        'dataType': dataType,
        'startTime': startTime.millisecondsSinceEpoch,
        'endTime': endTime.millisecondsSinceEpoch,
      });
      return (result ?? [])
          .map((item) => FitDataPoint.fromMap(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('Error reading Google Fit data: $e');
      return [];
    }
  }

  /// Write Google Fit data
  Future<bool> writeGoogleFitData({
    required String dataType,
    required double value,
    required String unit,
    DateTime? startTime,
    DateTime? endTime,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('googleFitWrite', {
        'dataType': dataType,
        'value': value,
        'unit': unit,
        'startTime': (startTime ?? DateTime.now()).millisecondsSinceEpoch,
        'endTime': (endTime ?? DateTime.now()).millisecondsSinceEpoch,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error writing Google Fit data: $e');
      return false;
    }
  }

  /// Setup Google Play Billing
  Future<bool> setupPlayBilling() async {
    try {
      final result = await _channel.invokeMethod<bool>('playBillingSetup');
      return result ?? false;
    } catch (e) {
      debugPrint('Error setting up Play Billing: $e');
      return false;
    }
  }

  /// Query available products
  Future<List<BillingProduct>> queryProducts(List<String> productIds) async {
    try {
      final result = await _channel.invokeMethod<List>('playBillingQueryProducts', {
        'productIds': productIds,
      });
      return (result ?? [])
          .map((item) => BillingProduct.fromMap(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('Error querying products: $e');
      return [];
    }
  }

  /// Purchase product
  Future<PurchaseResult> purchaseProduct(String productId) async {
    try {
      final result = await _channel.invokeMethod<Map>('playBillingPurchase', {
        'productId': productId,
      });
      return PurchaseResult.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error purchasing product: $e');
      return PurchaseResult(success: false, error: e.toString());
    }
  }

  /// Consume purchase
  Future<bool> consumePurchase(String purchaseToken) async {
    try {
      final result = await _channel.invokeMethod<bool>('playBillingConsume', {
        'purchaseToken': purchaseToken,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error consuming purchase: $e');
      return false;
    }
  }

  /// Start foreground service
  Future<bool> startForegroundService({
    required String channelId,
    required String title,
    required String content,
    int? icon,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('startForegroundService', {
        'channelId': channelId,
        'title': title,
        'content': content,
        'icon': icon,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error starting foreground service: $e');
      return false;
    }
  }

  /// Stop foreground service
  Future<bool> stopForegroundService() async {
    try {
      final result = await _channel.invokeMethod<bool>('stopForegroundService');
      return result ?? false;
    } catch (e) {
      debugPrint('Error stopping foreground service: $e');
      return false;
    }
  }

  /// Register broadcast receiver
  Future<bool> registerBroadcastReceiver({
    required String action,
    List<String>? categories,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('registerBroadcastReceiver', {
        'action': action,
        'categories': categories ?? [],
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error registering broadcast receiver: $e');
      return false;
    }
  }

  /// Unregister broadcast receiver
  Future<bool> unregisterBroadcastReceiver(String action) async {
    try {
      final result = await _channel.invokeMethod<bool>('unregisterBroadcastReceiver', {
        'action': action,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error unregistering broadcast receiver: $e');
      return false;
    }
  }

  /// Broadcast stream
  Stream<BroadcastMessage> get broadcastStream {
    return const EventChannel('com.upcoach.android.broadcasts')
        .receiveBroadcastStream()
        .map((event) => BroadcastMessage.fromMap(Map<String, dynamic>.from(event as Map)));
  }
}

class WorkConstraints {
  final bool requiresCharging;
  final bool requiresBatteryNotLow;
  final bool requiresDeviceIdle;
  final bool requiresStorageNotLow;
  final NetworkType requiredNetworkType;

  WorkConstraints({
    this.requiresCharging = false,
    this.requiresBatteryNotLow = false,
    this.requiresDeviceIdle = false,
    this.requiresStorageNotLow = false,
    this.requiredNetworkType = NetworkType.notRequired,
  });

  Map<String, dynamic> toMap() {
    return {
      'requiresCharging': requiresCharging,
      'requiresBatteryNotLow': requiresBatteryNotLow,
      'requiresDeviceIdle': requiresDeviceIdle,
      'requiresStorageNotLow': requiresStorageNotLow,
      'requiredNetworkType': requiredNetworkType.index,
    };
  }
}

enum NetworkType {
  notRequired,
  connected,
  unmetered,
  notRoaming,
  metered,
}

enum NotificationImportance {
  none,
  min,
  low,
  defaultImportance,
  high,
  max,
}

class AppShortcut {
  final String id;
  final String shortLabel;
  final String longLabel;
  final String? icon;
  final String? action;

  AppShortcut({
    required this.id,
    required this.shortLabel,
    required this.longLabel,
    this.icon,
    this.action,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'shortLabel': shortLabel,
      'longLabel': longLabel,
      'icon': icon,
      'action': action,
    };
  }

  factory AppShortcut.fromMap(Map<String, dynamic> map) {
    return AppShortcut(
      id: map['id'] as String? ?? '',
      shortLabel: map['shortLabel'] as String? ?? '',
      longLabel: map['longLabel'] as String? ?? '',
      icon: map['icon'] as String?,
      action: map['action'] as String?,
    );
  }
}

class FitDataPoint {
  final String dataType;
  final double value;
  final String unit;
  final DateTime startTime;
  final DateTime endTime;

  FitDataPoint({
    required this.dataType,
    required this.value,
    required this.unit,
    required this.startTime,
    required this.endTime,
  });

  factory FitDataPoint.fromMap(Map<String, dynamic> map) {
    return FitDataPoint(
      dataType: map['dataType'] as String? ?? '',
      value: (map['value'] as num?)?.toDouble() ?? 0.0,
      unit: map['unit'] as String? ?? '',
      startTime: DateTime.fromMillisecondsSinceEpoch(map['startTime'] as int? ?? 0),
      endTime: DateTime.fromMillisecondsSinceEpoch(map['endTime'] as int? ?? 0),
    );
  }
}

class BillingProduct {
  final String productId;
  final String title;
  final String description;
  final String price;
  final String currencyCode;

  BillingProduct({
    required this.productId,
    required this.title,
    required this.description,
    required this.price,
    required this.currencyCode,
  });

  factory BillingProduct.fromMap(Map<String, dynamic> map) {
    return BillingProduct(
      productId: map['productId'] as String? ?? '',
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      price: map['price'] as String? ?? '',
      currencyCode: map['currencyCode'] as String? ?? 'USD',
    );
  }
}

class PurchaseResult {
  final bool success;
  final String? orderId;
  final String? purchaseToken;
  final String? error;

  PurchaseResult({
    required this.success,
    this.orderId,
    this.purchaseToken,
    this.error,
  });

  factory PurchaseResult.fromMap(Map<String, dynamic> map) {
    return PurchaseResult(
      success: map['success'] as bool? ?? false,
      orderId: map['orderId'] as String?,
      purchaseToken: map['purchaseToken'] as String?,
      error: map['error'] as String?,
    );
  }
}

class BroadcastMessage {
  final String action;
  final Map<String, dynamic> extras;

  BroadcastMessage({
    required this.action,
    required this.extras,
  });

  factory BroadcastMessage.fromMap(Map<String, dynamic> map) {
    return BroadcastMessage(
      action: map['action'] as String? ?? '',
      extras: Map<String, dynamic>.from(map['extras'] as Map? ?? {}),
    );
  }
}

/// Android Performance Optimization
class AndroidPerformanceOptimization {
  static const MethodChannel _channel = MethodChannel('com.upcoach.android.performance');

  /// Enable render thread optimization
  Future<bool> enableRenderThreadOptimization() async {
    try {
      final result = await _channel.invokeMethod<bool>('enableRenderThreadOptimization');
      return result ?? false;
    } catch (e) {
      debugPrint('Error enabling render thread optimization: $e');
      return false;
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

  /// Request garbage collection
  Future<void> requestGC() async {
    try {
      await _channel.invokeMethod('requestGC');
    } catch (e) {
      debugPrint('Error requesting GC: $e');
    }
  }

  /// Optimize battery usage
  Future<bool> optimizeBattery() async {
    try {
      final result = await _channel.invokeMethod<bool>('optimizeBattery');
      return result ?? false;
    } catch (e) {
      debugPrint('Error optimizing battery: $e');
      return false;
    }
  }

  /// Check if battery optimization is enabled
  Future<bool> isBatteryOptimizationEnabled() async {
    try {
      final result = await _channel.invokeMethod<bool>('isBatteryOptimizationEnabled');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking battery optimization: $e');
      return false;
    }
  }

  /// Request battery optimization exemption
  Future<bool> requestBatteryOptimizationExemption() async {
    try {
      final result = await _channel.invokeMethod<bool>('requestBatteryOptimizationExemption');
      return result ?? false;
    } catch (e) {
      debugPrint('Error requesting battery optimization exemption: $e');
      return false;
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

  /// Get APK size info
  Future<AppSizeInfo> getAppSizeInfo() async {
    try {
      final result = await _channel.invokeMethod<Map>('getAppSizeInfo');
      return AppSizeInfo.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error getting app size info: $e');
      return AppSizeInfo(apkSize: 0, dataSize: 0, cacheSize: 0);
    }
  }

  /// Clear app cache
  Future<bool> clearCache() async {
    try {
      final result = await _channel.invokeMethod<bool>('clearCache');
      return result ?? false;
    } catch (e) {
      debugPrint('Error clearing cache: $e');
      return false;
    }
  }

  /// Optimize for foldable devices
  Future<bool> optimizeForFoldable() async {
    try {
      final result = await _channel.invokeMethod<bool>('optimizeForFoldable');
      return result ?? false;
    } catch (e) {
      debugPrint('Error optimizing for foldable: $e');
      return false;
    }
  }

  /// Get device fold state
  Future<FoldState> getFoldState() async {
    try {
      final result = await _channel.invokeMethod<String>('getFoldState');
      return _parseFoldState(result ?? 'flat');
    } catch (e) {
      debugPrint('Error getting fold state: $e');
      return FoldState.flat;
    }
  }

  FoldState _parseFoldState(String state) {
    switch (state.toLowerCase()) {
      case 'flat':
        return FoldState.flat;
      case 'halfopen':
        return FoldState.halfOpen;
      case 'open':
        return FoldState.open;
      case 'closed':
        return FoldState.closed;
      default:
        return FoldState.flat;
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
  final int apkSize;
  final int dataSize;
  final int cacheSize;

  AppSizeInfo({
    required this.apkSize,
    required this.dataSize,
    required this.cacheSize,
  });

  factory AppSizeInfo.fromMap(Map<String, dynamic> map) {
    return AppSizeInfo(
      apkSize: map['apkSize'] as int? ?? 0,
      dataSize: map['dataSize'] as int? ?? 0,
      cacheSize: map['cacheSize'] as int? ?? 0,
    );
  }

  int get totalSize => apkSize + dataSize + cacheSize;
}

enum FoldState {
  flat,
  halfOpen,
  open,
  closed,
}

/// Android Insets Handler
class AndroidInsetsHandler {
  static const MethodChannel _channel = MethodChannel('com.upcoach.android.insets');

  /// Get system window insets
  static Future<WindowInsets> getWindowInsets() async {
    try {
      final result = await _channel.invokeMethod<Map>('getWindowInsets');
      return WindowInsets.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error getting window insets: $e');
      return WindowInsets(top: 0, bottom: 0, left: 0, right: 0);
    }
  }

  /// Enable edge-to-edge mode
  static Future<bool> enableEdgeToEdge() async {
    try {
      final result = await _channel.invokeMethod<bool>('enableEdgeToEdge');
      return result ?? false;
    } catch (e) {
      debugPrint('Error enabling edge-to-edge: $e');
      return false;
    }
  }

  /// Listen to inset changes
  static Stream<WindowInsets> get insetsStream {
    return const EventChannel('com.upcoach.android.insets.events')
        .receiveBroadcastStream()
        .map((event) => WindowInsets.fromMap(Map<String, dynamic>.from(event as Map)));
  }
}

class WindowInsets {
  final double top;
  final double bottom;
  final double left;
  final double right;

  WindowInsets({
    required this.top,
    required this.bottom,
    required this.left,
    required this.right,
  });

  factory WindowInsets.fromMap(Map<String, dynamic> map) {
    return WindowInsets(
      top: (map['top'] as num?)?.toDouble() ?? 0.0,
      bottom: (map['bottom'] as num?)?.toDouble() ?? 0.0,
      left: (map['left'] as num?)?.toDouble() ?? 0.0,
      right: (map['right'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Android Night Mode Manager
class AndroidNightModeManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.android.nightmode');

  /// Get current night mode
  static Future<NightMode> getNightMode() async {
    try {
      final result = await _channel.invokeMethod<String>('getNightMode');
      return _parseNightMode(result ?? 'no');
    } catch (e) {
      debugPrint('Error getting night mode: $e');
      return NightMode.no;
    }
  }

  /// Set night mode
  static Future<void> setNightMode(NightMode mode) async {
    try {
      await _channel.invokeMethod('setNightMode', {
        'mode': mode == NightMode.yes ? 'yes' : mode == NightMode.auto ? 'auto' : 'no',
      });
    } catch (e) {
      debugPrint('Error setting night mode: $e');
    }
  }

  /// Listen to night mode changes
  static Stream<NightMode> get nightModeStream {
    return const EventChannel('com.upcoach.android.nightmode.events')
        .receiveBroadcastStream()
        .map((event) => _parseNightMode(event as String? ?? 'no'));
  }

  static NightMode _parseNightMode(String mode) {
    switch (mode.toLowerCase()) {
      case 'yes':
        return NightMode.yes;
      case 'auto':
        return NightMode.auto;
      default:
        return NightMode.no;
    }
  }
}

enum NightMode {
  no,
  yes,
  auto,
}
