import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:vibration/vibration.dart';
import '../../../shared/models/video_call_models.dart';

/// Service for managing call notifications and ringing
class CallNotificationService {
  static final CallNotificationService _instance =
      CallNotificationService._internal();
  factory CallNotificationService() => _instance;
  CallNotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  final AudioPlayer _ringtonePlayer = AudioPlayer();
  final AudioPlayer _ringbackPlayer = AudioPlayer();
  final AudioPlayer _endCallPlayer = AudioPlayer();

  Timer? _vibrationTimer;
  Timer? _ringtoneTimer;
  bool _isRinging = false;
  bool _isInitialized = false;

  // Notification channel IDs
  static const String _callChannelId = 'call_notifications';
  static const String _callChannelName = 'Call Notifications';
  static const String _callChannelDescription =
      'Notifications for incoming calls';

  // Notification IDs
  static const int _incomingCallNotificationId = 1000;
  static const int _ongoingCallNotificationId = 1001;
  static const int _missedCallNotificationId = 1002;

  // Event stream for call actions
  final StreamController<CallNotificationAction> _actionController =
      StreamController<CallNotificationAction>.broadcast();
  Stream<CallNotificationAction> get callActions => _actionController.stream;

  /// Initialize the notification service
  Future<void> initialize() async {
    if (_isInitialized) return;

    // Initialize local notifications
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _handleNotificationResponse,
      onDidReceiveBackgroundNotificationResponse: _handleBackgroundNotification,
    );

    // Create notification channel for Android
    if (Platform.isAndroid) {
      await _createNotificationChannel();
    }

    // Pre-load audio assets
    await _preloadAudioAssets();

    _isInitialized = true;
    debugPrint('CallNotificationService initialized');
  }

  Future<void> _createNotificationChannel() async {
    final androidPlugin = _notifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();

    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _callChannelId,
        _callChannelName,
        description: _callChannelDescription,
        importance: Importance.max,
        playSound: false, // We handle ringtone separately
        enableVibration: false, // We handle vibration separately
        showBadge: true,
      ),
    );
  }

  Future<void> _preloadAudioAssets() async {
    try {
      // Set audio player settings for ringtone
      await _ringtonePlayer.setReleaseMode(ReleaseMode.loop);
      await _ringbackPlayer.setReleaseMode(ReleaseMode.loop);
      await _endCallPlayer.setReleaseMode(ReleaseMode.release);
    } catch (e) {
      debugPrint('Error preloading audio assets: $e');
    }
  }

  void _handleNotificationResponse(NotificationResponse response) {
    debugPrint('Notification action: ${response.actionId}');
    debugPrint('Notification payload: ${response.payload}');

    final action = _parseNotificationAction(response);
    if (action != null) {
      _actionController.add(action);
    }
  }

  @pragma('vm:entry-point')
  static void _handleBackgroundNotification(NotificationResponse response) {
    debugPrint('Background notification action: ${response.actionId}');
    // Background handling is limited - actual action will be processed when app opens
  }

  CallNotificationAction? _parseNotificationAction(
      NotificationResponse response) {
    final payload = response.payload;
    if (payload == null) return null;

    final parts = payload.split('|');
    if (parts.length < 2) return null;

    final sessionId = int.tryParse(parts[0]);
    final callType = parts[1] == 'video' ? CallType.video : CallType.audio;
    final callerName = parts.length > 2 ? parts[2] : null;

    switch (response.actionId) {
      case 'accept':
        return CallNotificationAction(
          type: CallActionType.accept,
          sessionId: sessionId,
          callType: callType,
          callerName: callerName,
        );
      case 'decline':
        return CallNotificationAction(
          type: CallActionType.decline,
          sessionId: sessionId,
          callType: callType,
          callerName: callerName,
        );
      default:
        // Tapped on notification itself
        return CallNotificationAction(
          type: CallActionType.open,
          sessionId: sessionId,
          callType: callType,
          callerName: callerName,
        );
    }
  }

  // ============================================================================
  // Incoming Call
  // ============================================================================

  /// Show incoming call notification with ringing
  Future<void> showIncomingCall({
    required int sessionId,
    required String callerName,
    required CallType callType,
    String? callerImageUrl,
  }) async {
    debugPrint('Showing incoming call from $callerName');

    // Show notification
    await _showIncomingCallNotification(
      sessionId: sessionId,
      callerName: callerName,
      callType: callType,
    );

    // Start ringing
    await startRinging();
  }

  Future<void> _showIncomingCallNotification({
    required int sessionId,
    required String callerName,
    required CallType callType,
  }) async {
    final payload = '$sessionId|${callType.name}|$callerName';

    // Android notification details with actions
    final androidDetails = AndroidNotificationDetails(
      _callChannelId,
      _callChannelName,
      channelDescription: _callChannelDescription,
      importance: Importance.max,
      priority: Priority.max,
      fullScreenIntent: true,
      category: AndroidNotificationCategory.call,
      visibility: NotificationVisibility.public,
      autoCancel: false,
      ongoing: true,
      playSound: false,
      enableVibration: false,
      actions: [
        const AndroidNotificationAction(
          'decline',
          'Decline',
          cancelNotification: true,
          showsUserInterface: false,
        ),
        const AndroidNotificationAction(
          'accept',
          'Accept',
          cancelNotification: true,
          showsUserInterface: true,
        ),
      ],
    );

    // iOS notification details
    const iosDetails = DarwinNotificationDetails(
      presentSound: true,
      presentBadge: true,
      presentAlert: true,
      categoryIdentifier: 'INCOMING_CALL',
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final title = callType == CallType.video
        ? 'Incoming Video Call'
        : 'Incoming Voice Call';

    await _notifications.show(
      _incomingCallNotificationId,
      title,
      callerName,
      details,
      payload: payload,
    );
  }

  /// Dismiss incoming call notification
  Future<void> dismissIncomingCall() async {
    await _notifications.cancel(_incomingCallNotificationId);
    await stopRinging();
  }

  // ============================================================================
  // Ongoing Call
  // ============================================================================

  /// Show ongoing call notification
  Future<void> showOngoingCall({
    required int sessionId,
    required String callerName,
    required CallType callType,
    required Duration duration,
  }) async {
    final payload = '$sessionId|${callType.name}|$callerName';

    final androidDetails = AndroidNotificationDetails(
      _callChannelId,
      _callChannelName,
      channelDescription: _callChannelDescription,
      importance: Importance.low,
      priority: Priority.low,
      ongoing: true,
      autoCancel: false,
      showWhen: false,
      usesChronometer: true,
      chronometerCountDown: false,
      category: AndroidNotificationCategory.call,
      actions: [
        const AndroidNotificationAction(
          'hangup',
          'Hang Up',
          cancelNotification: true,
          showsUserInterface: true,
        ),
      ],
    );

    const iosDetails = DarwinNotificationDetails(
      presentSound: false,
      presentBadge: true,
      presentAlert: false,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final title = callType == CallType.video ? 'Video Call' : 'Voice Call';
    final formattedDuration = _formatDuration(duration);

    await _notifications.show(
      _ongoingCallNotificationId,
      '$title - $formattedDuration',
      'Tap to return to call',
      details,
      payload: payload,
    );
  }

  /// Update ongoing call duration
  Future<void> updateOngoingCallDuration({
    required int sessionId,
    required String callerName,
    required CallType callType,
    required Duration duration,
  }) async {
    await showOngoingCall(
      sessionId: sessionId,
      callerName: callerName,
      callType: callType,
      duration: duration,
    );
  }

  /// Dismiss ongoing call notification
  Future<void> dismissOngoingCall() async {
    await _notifications.cancel(_ongoingCallNotificationId);
  }

  // ============================================================================
  // Missed Call
  // ============================================================================

  /// Show missed call notification
  Future<void> showMissedCall({
    required int sessionId,
    required String callerName,
    required CallType callType,
    required DateTime missedAt,
  }) async {
    final payload = '$sessionId|${callType.name}|$callerName';

    final androidDetails = AndroidNotificationDetails(
      _callChannelId,
      _callChannelName,
      channelDescription: _callChannelDescription,
      importance: Importance.high,
      priority: Priority.high,
      category: AndroidNotificationCategory.missedCall,
      actions: [
        const AndroidNotificationAction(
          'callback',
          'Call Back',
          showsUserInterface: true,
        ),
        const AndroidNotificationAction(
          'message',
          'Message',
          showsUserInterface: true,
        ),
      ],
    );

    const iosDetails = DarwinNotificationDetails(
      presentSound: true,
      presentBadge: true,
      presentAlert: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final title =
        callType == CallType.video ? 'Missed Video Call' : 'Missed Voice Call';

    await _notifications.show(
      _missedCallNotificationId,
      title,
      '$callerName - ${_formatTime(missedAt)}',
      details,
      payload: payload,
    );
  }

  /// Clear missed call notification
  Future<void> clearMissedCall() async {
    await _notifications.cancel(_missedCallNotificationId);
  }

  // ============================================================================
  // Ringing / Sound Effects
  // ============================================================================

  /// Start ringing for incoming call
  Future<void> startRinging() async {
    if (_isRinging) return;
    _isRinging = true;

    try {
      // Play ringtone
      await _ringtonePlayer.play(
        AssetSource('audio/ringtone.mp3'),
        volume: 1.0,
      );

      // Start vibration pattern
      await _startVibrationPattern();

      // Auto-stop after 60 seconds
      _ringtoneTimer = Timer(const Duration(seconds: 60), () {
        stopRinging();
      });
    } catch (e) {
      debugPrint('Error starting ringtone: $e');
      // Fallback to system haptic
      HapticFeedback.heavyImpact();
    }
  }

  /// Stop ringing
  Future<void> stopRinging() async {
    if (!_isRinging) return;
    _isRinging = false;

    _ringtoneTimer?.cancel();
    _vibrationTimer?.cancel();

    try {
      await _ringtonePlayer.stop();
      final hasVibrator = await Vibration.hasVibrator();
      if (hasVibrator == true) {
        Vibration.cancel();
      }
    } catch (e) {
      debugPrint('Error stopping ringtone: $e');
    }
  }

  /// Play ringback tone (outgoing call)
  Future<void> startRingback() async {
    try {
      await _ringbackPlayer.play(
        AssetSource('audio/ringback.mp3'),
        volume: 0.8,
      );
    } catch (e) {
      debugPrint('Error starting ringback: $e');
    }
  }

  /// Stop ringback tone
  Future<void> stopRingback() async {
    try {
      await _ringbackPlayer.stop();
    } catch (e) {
      debugPrint('Error stopping ringback: $e');
    }
  }

  /// Play call connected sound
  Future<void> playCallConnected() async {
    try {
      await _endCallPlayer.play(
        AssetSource('audio/call_connected.mp3'),
        volume: 0.5,
      );
    } catch (e) {
      debugPrint('Error playing call connected sound: $e');
    }
  }

  /// Play call ended sound
  Future<void> playCallEnded() async {
    try {
      await _endCallPlayer.play(
        AssetSource('audio/call_ended.mp3'),
        volume: 0.5,
      );
    } catch (e) {
      debugPrint('Error playing call ended sound: $e');
    }
  }

  Future<void> _startVibrationPattern() async {
    final hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator != true) return;

    // Vibration pattern: vibrate 500ms, pause 300ms
    _vibrationTimer = Timer.periodic(const Duration(milliseconds: 800), (_) {
      if (_isRinging) {
        Vibration.vibrate(duration: 500);
      }
    });

    // Initial vibration
    Vibration.vibrate(duration: 500);
  }

  // ============================================================================
  // Call Screen Wake Lock
  // ============================================================================

  /// Keep screen on during call
  Future<void> enableCallWakeLock() async {
    // This would typically use wakelock_plus package
    // Placeholder for implementation
    debugPrint('Enabling call wake lock');
  }

  /// Disable screen wake lock
  Future<void> disableCallWakeLock() async {
    debugPrint('Disabling call wake lock');
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  String _formatTime(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  Future<void> dispose() async {
    await stopRinging();
    await _ringtonePlayer.dispose();
    await _ringbackPlayer.dispose();
    await _endCallPlayer.dispose();
    await _actionController.close();
    _isInitialized = false;
  }
}

// ============================================================================
// Call Action Types
// ============================================================================

enum CallActionType {
  accept,
  decline,
  open,
  hangup,
  callback,
  message,
}

class CallNotificationAction {
  final CallActionType type;
  final int? sessionId;
  final CallType? callType;
  final String? callerName;

  const CallNotificationAction({
    required this.type,
    this.sessionId,
    this.callType,
    this.callerName,
  });
}

// ============================================================================
// Provider
// ============================================================================

final callNotificationServiceProvider =
    Provider<CallNotificationService>((ref) {
  final service = CallNotificationService();
  ref.onDispose(() => service.dispose());
  return service;
});
