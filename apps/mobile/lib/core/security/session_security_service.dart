/// Session Security Service
///
/// Provides secure session management for mobile apps:
/// - Session lifecycle management
/// - Inactivity timeout
/// - Background session protection
/// - Session binding to device
/// - Secure session token handling

import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'secure_storage_service.dart';
import 'biometric_auth_service.dart';
import 'device_attestation_service.dart';

/// Session state
enum SessionState {
  /// No active session
  inactive,

  /// Session is active and valid
  active,

  /// Session is locked (requires re-authentication)
  locked,

  /// Session has expired
  expired,

  /// Session is being validated
  validating,

  /// Session was terminated (logged out)
  terminated,
}

/// Session lock reason
enum LockReason {
  /// User manually locked
  userInitiated,

  /// Inactivity timeout
  inactivity,

  /// App went to background
  backgrounded,

  /// Suspicious activity detected
  suspiciousActivity,

  /// Device integrity issue
  integrityViolation,
}

/// Secure session data
class SecureSession {
  final String sessionId;
  final String userId;
  final DateTime createdAt;
  final DateTime lastActiveAt;
  final DateTime expiresAt;
  final String deviceFingerprint;
  final Map<String, dynamic> metadata;
  final bool isLocked;
  final LockReason? lockReason;

  const SecureSession({
    required this.sessionId,
    required this.userId,
    required this.createdAt,
    required this.lastActiveAt,
    required this.expiresAt,
    required this.deviceFingerprint,
    this.metadata = const {},
    this.isLocked = false,
    this.lockReason,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isValid => !isExpired && !isLocked;

  Duration get remainingTime => expiresAt.difference(DateTime.now());
  Duration get idleTime => DateTime.now().difference(lastActiveAt);

  SecureSession copyWith({
    DateTime? lastActiveAt,
    DateTime? expiresAt,
    bool? isLocked,
    LockReason? lockReason,
    Map<String, dynamic>? metadata,
  }) {
    return SecureSession(
      sessionId: sessionId,
      userId: userId,
      createdAt: createdAt,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
      expiresAt: expiresAt ?? this.expiresAt,
      deviceFingerprint: deviceFingerprint,
      metadata: metadata ?? this.metadata,
      isLocked: isLocked ?? this.isLocked,
      lockReason: isLocked == true ? lockReason : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'userId': userId,
        'createdAt': createdAt.toIso8601String(),
        'lastActiveAt': lastActiveAt.toIso8601String(),
        'expiresAt': expiresAt.toIso8601String(),
        'deviceFingerprint': deviceFingerprint,
        'metadata': metadata,
        'isLocked': isLocked,
        'lockReason': lockReason?.name,
      };

  factory SecureSession.fromJson(Map<String, dynamic> json) {
    return SecureSession(
      sessionId: json['sessionId'] as String,
      userId: json['userId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastActiveAt: DateTime.parse(json['lastActiveAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      deviceFingerprint: json['deviceFingerprint'] as String,
      metadata: Map<String, dynamic>.from(json['metadata'] ?? {}),
      isLocked: json['isLocked'] == true,
      lockReason: json['lockReason'] != null
          ? LockReason.values.firstWhere(
              (r) => r.name == json['lockReason'],
              orElse: () => LockReason.userInitiated,
            )
          : null,
    );
  }
}

/// Session security configuration
class SessionSecurityConfig {
  final Duration sessionTimeout;
  final Duration inactivityTimeout;
  final Duration backgroundGracePeriod;
  final bool lockOnBackground;
  final bool requireBiometricToUnlock;
  final bool validateDeviceIntegrity;
  final bool extendOnActivity;

  const SessionSecurityConfig({
    this.sessionTimeout = const Duration(hours: 24),
    this.inactivityTimeout = const Duration(minutes: 15),
    this.backgroundGracePeriod = const Duration(minutes: 5),
    this.lockOnBackground = true,
    this.requireBiometricToUnlock = true,
    this.validateDeviceIntegrity = true,
    this.extendOnActivity = true,
  });

  static const standard = SessionSecurityConfig();

  static const highSecurity = SessionSecurityConfig(
    sessionTimeout: Duration(hours: 8),
    inactivityTimeout: Duration(minutes: 5),
    backgroundGracePeriod: Duration(minutes: 1),
    lockOnBackground: true,
    requireBiometricToUnlock: true,
    validateDeviceIntegrity: true,
  );

  static const convenient = SessionSecurityConfig(
    sessionTimeout: Duration(days: 7),
    inactivityTimeout: Duration(hours: 1),
    backgroundGracePeriod: Duration(minutes: 30),
    lockOnBackground: false,
    requireBiometricToUnlock: false,
    validateDeviceIntegrity: false,
  );
}

/// Session security event
class SessionSecurityEvent {
  final String type;
  final SessionState state;
  final DateTime timestamp;
  final Map<String, dynamic>? details;

  SessionSecurityEvent({
    required this.type,
    required this.state,
    Map<String, dynamic>? details,
  })  : timestamp = DateTime.now(),
        details = details;

  Map<String, dynamic> toJson() => {
        'type': type,
        'state': state.name,
        'timestamp': timestamp.toIso8601String(),
        'details': details,
      };
}

/// Session security service
class SessionSecurityService extends ChangeNotifier {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach/session_security');

  final SecureStorageService _storage = SecureStorageService();
  final BiometricAuthService _biometricAuth = BiometricAuthService();
  final DeviceAttestationService _deviceAttestation = DeviceAttestationService();

  SecureSession? _currentSession;
  SessionState _state = SessionState.inactive;
  SessionSecurityConfig _config = SessionSecurityConfig.standard;

  Timer? _inactivityTimer;
  Timer? _sessionExpiryTimer;
  DateTime? _backgroundedAt;

  final List<SessionSecurityEvent> _events = [];
  final StreamController<SessionSecurityEvent> _eventController =
      StreamController<SessionSecurityEvent>.broadcast();
  final StreamController<SessionState> _stateController =
      StreamController<SessionState>.broadcast();

  // Getters
  SecureSession? get currentSession => _currentSession;
  SessionState get state => _state;
  SessionSecurityConfig get config => _config;
  Stream<SessionSecurityEvent> get events => _eventController.stream;
  Stream<SessionState> get stateChanges => _stateController.stream;
  bool get isAuthenticated => _state == SessionState.active;
  bool get isLocked => _state == SessionState.locked;

  /// Initialize the session security service
  Future<void> initialize({SessionSecurityConfig? config}) async {
    if (config != null) {
      _config = config;
    }

    await _storage.initialize();
    await _biometricAuth.initialize();

    // Try to restore existing session
    await _restoreSession();

    // Set up app lifecycle observer
    _setupAppLifecycleObserver();

    debugPrint('SessionSecurityService: Initialized with state: $_state');
  }

  /// Start a new session
  Future<SecureSession?> startSession({
    required String userId,
    required String accessToken,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      // Validate device integrity if configured
      if (_config.validateDeviceIntegrity) {
        final assessment = await _deviceAttestation.attestDevice();
        if (!assessment.isValid) {
          _emitEvent('session_blocked', SessionState.inactive, {
            'reason': 'device_integrity_failed',
            'assessment': assessment.toJson(),
          });
          return null;
        }
      }

      // Generate device fingerprint
      final fingerprint = await _generateDeviceFingerprint();

      // Create session
      final now = DateTime.now();
      final session = SecureSession(
        sessionId: _generateSessionId(userId, fingerprint),
        userId: userId,
        createdAt: now,
        lastActiveAt: now,
        expiresAt: now.add(_config.sessionTimeout),
        deviceFingerprint: fingerprint,
        metadata: metadata ?? {},
      );

      // Store session securely
      await _persistSession(session);

      // Store tokens
      await _storage.setAccessToken(accessToken);

      _currentSession = session;
      _updateState(SessionState.active);

      // Start timers
      _startInactivityTimer();
      _startSessionExpiryTimer();

      _emitEvent('session_started', SessionState.active, {
        'sessionId': session.sessionId,
        'userId': userId,
      });

      return session;
    } catch (e) {
      debugPrint('SessionSecurityService: Error starting session: $e');
      _emitEvent('session_start_failed', SessionState.inactive, {'error': e.toString()});
      return null;
    }
  }

  /// Update session activity (call on user interaction)
  Future<void> updateActivity() async {
    if (_currentSession == null || _state != SessionState.active) return;

    final now = DateTime.now();

    _currentSession = _currentSession!.copyWith(
      lastActiveAt: now,
      expiresAt: _config.extendOnActivity
          ? now.add(_config.sessionTimeout)
          : _currentSession!.expiresAt,
    );

    await _persistSession(_currentSession!);
    _resetInactivityTimer();
  }

  /// Lock the session
  Future<void> lockSession({LockReason reason = LockReason.userInitiated}) async {
    if (_currentSession == null) return;

    _currentSession = _currentSession!.copyWith(
      isLocked: true,
      lockReason: reason,
    );

    await _persistSession(_currentSession!);
    _updateState(SessionState.locked);
    _cancelTimers();

    _emitEvent('session_locked', SessionState.locked, {
      'reason': reason.name,
    });
  }

  /// Unlock the session (requires authentication)
  Future<bool> unlockSession() async {
    if (_currentSession == null || _state != SessionState.locked) {
      return false;
    }

    // Check if session has expired while locked
    if (_currentSession!.isExpired) {
      await endSession(reason: 'expired_while_locked');
      return false;
    }

    // Require biometric authentication if configured
    if (_config.requireBiometricToUnlock) {
      final authResult = await _biometricAuth.authenticate(
        reason: 'Unlock your session',
      );

      if (authResult != AuthResult.success) {
        _emitEvent('unlock_failed', SessionState.locked, {
          'authResult': authResult.name,
        });
        return false;
      }
    }

    // Verify device fingerprint
    final currentFingerprint = await _generateDeviceFingerprint();
    if (currentFingerprint != _currentSession!.deviceFingerprint) {
      await endSession(reason: 'device_fingerprint_mismatch');
      return false;
    }

    // Unlock session
    final now = DateTime.now();
    _currentSession = _currentSession!.copyWith(
      isLocked: false,
      lastActiveAt: now,
      expiresAt: _config.extendOnActivity
          ? now.add(_config.sessionTimeout)
          : _currentSession!.expiresAt,
    );

    await _persistSession(_currentSession!);
    _updateState(SessionState.active);

    _startInactivityTimer();
    _startSessionExpiryTimer();

    _emitEvent('session_unlocked', SessionState.active);
    return true;
  }

  /// End the session (logout)
  Future<void> endSession({String? reason}) async {
    _cancelTimers();

    // Clear stored session data
    await _storage.clearSession();
    await _storage.delete(key: 'secure_session');

    final sessionId = _currentSession?.sessionId;
    _currentSession = null;
    _updateState(SessionState.terminated);

    _emitEvent('session_ended', SessionState.terminated, {
      'sessionId': sessionId,
      'reason': reason ?? 'user_initiated',
    });
  }

  /// Validate current session
  Future<bool> validateSession() async {
    if (_currentSession == null) return false;

    _updateState(SessionState.validating);

    try {
      // Check expiration
      if (_currentSession!.isExpired) {
        await endSession(reason: 'expired');
        return false;
      }

      // Verify device fingerprint
      final currentFingerprint = await _generateDeviceFingerprint();
      if (currentFingerprint != _currentSession!.deviceFingerprint) {
        await endSession(reason: 'device_changed');
        return false;
      }

      // Validate device integrity if configured
      if (_config.validateDeviceIntegrity) {
        final assessment = await _deviceAttestation.attestDevice();
        if (!assessment.isValid) {
          await lockSession(reason: LockReason.integrityViolation);
          return false;
        }
      }

      // Session is valid
      _updateState(_currentSession!.isLocked ? SessionState.locked : SessionState.active);
      return true;
    } catch (e) {
      debugPrint('SessionSecurityService: Validation error: $e');
      _updateState(SessionState.inactive);
      return false;
    }
  }

  /// Handle app returning to foreground
  Future<void> onAppResumed() async {
    if (_currentSession == null) return;

    if (_backgroundedAt != null) {
      final backgroundDuration = DateTime.now().difference(_backgroundedAt!);

      if (backgroundDuration > _config.backgroundGracePeriod && _config.lockOnBackground) {
        await lockSession(reason: LockReason.backgrounded);
      } else {
        await updateActivity();
      }

      _backgroundedAt = null;
    }
  }

  /// Handle app going to background
  void onAppPaused() {
    _backgroundedAt = DateTime.now();
    _cancelInactivityTimer();
  }

  /// Configure session security
  void configure(SessionSecurityConfig config) {
    _config = config;

    // Restart timers with new config
    if (_state == SessionState.active) {
      _startInactivityTimer();
      _startSessionExpiryTimer();
    }
  }

  /// Get session security events
  List<SessionSecurityEvent> getEvents({int limit = 50}) {
    return _events.take(limit).toList();
  }

  /// Get session info for display
  Map<String, dynamic> getSessionInfo() {
    if (_currentSession == null) {
      return {'state': _state.name, 'hasSession': false};
    }

    return {
      'state': _state.name,
      'hasSession': true,
      'sessionId': _currentSession!.sessionId,
      'userId': _currentSession!.userId,
      'createdAt': _currentSession!.createdAt.toIso8601String(),
      'lastActiveAt': _currentSession!.lastActiveAt.toIso8601String(),
      'expiresAt': _currentSession!.expiresAt.toIso8601String(),
      'remainingSeconds': _currentSession!.remainingTime.inSeconds,
      'idleSeconds': _currentSession!.idleTime.inSeconds,
      'isLocked': _currentSession!.isLocked,
      'lockReason': _currentSession!.lockReason?.name,
    };
  }

  // Private methods

  Future<void> _restoreSession() async {
    try {
      final result = await _storage.read(
        key: 'secure_session',
        options: SecureStorageOptions.biometric,
      );

      if (result.success && result.data != null) {
        final sessionJson = jsonDecode(result.data!) as Map<String, dynamic>;
        _currentSession = SecureSession.fromJson(sessionJson);

        if (_currentSession!.isExpired) {
          await endSession(reason: 'expired_on_restore');
        } else if (_currentSession!.isLocked) {
          _updateState(SessionState.locked);
        } else {
          await validateSession();
        }
      }
    } catch (e) {
      debugPrint('SessionSecurityService: Error restoring session: $e');
    }
  }

  Future<void> _persistSession(SecureSession session) async {
    await _storage.write(
      key: 'secure_session',
      value: jsonEncode(session.toJson()),
      options: SecureStorageOptions.biometric,
    );
  }

  String _generateSessionId(String userId, String fingerprint) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final data = '$userId:$fingerprint:$timestamp';
    final hash = sha256.convert(utf8.encode(data));
    return 'sess_${hash.toString().substring(0, 32)}';
  }

  Future<String> _generateDeviceFingerprint() async {
    try {
      final fingerprint = await _deviceAttestation.getDeviceFingerprint();
      return fingerprint ?? 'unknown_device';
    } catch (e) {
      return 'unknown_device';
    }
  }

  void _updateState(SessionState newState) {
    if (_state != newState) {
      _state = newState;
      _stateController.add(newState);
      notifyListeners();
    }
  }

  void _emitEvent(String type, SessionState state, [Map<String, dynamic>? details]) {
    final event = SessionSecurityEvent(
      type: type,
      state: state,
      details: details,
    );

    _events.insert(0, event);
    if (_events.length > 100) {
      _events.removeRange(100, _events.length);
    }

    _eventController.add(event);
  }

  void _startInactivityTimer() {
    _cancelInactivityTimer();

    _inactivityTimer = Timer(_config.inactivityTimeout, () async {
      if (_state == SessionState.active) {
        await lockSession(reason: LockReason.inactivity);
      }
    });
  }

  void _resetInactivityTimer() {
    _startInactivityTimer();
  }

  void _cancelInactivityTimer() {
    _inactivityTimer?.cancel();
    _inactivityTimer = null;
  }

  void _startSessionExpiryTimer() {
    _sessionExpiryTimer?.cancel();

    if (_currentSession == null) return;

    final remaining = _currentSession!.remainingTime;
    if (remaining.isNegative) {
      endSession(reason: 'expired');
      return;
    }

    _sessionExpiryTimer = Timer(remaining, () async {
      await endSession(reason: 'expired');
    });
  }

  void _cancelTimers() {
    _cancelInactivityTimer();
    _sessionExpiryTimer?.cancel();
    _sessionExpiryTimer = null;
  }

  void _setupAppLifecycleObserver() {
    // Platform channel for lifecycle events
    _channel.setMethodCallHandler((call) async {
      switch (call.method) {
        case 'onPaused':
          onAppPaused();
          break;
        case 'onResumed':
          await onAppResumed();
          break;
      }
    });
  }

  @override
  void dispose() {
    _cancelTimers();
    _eventController.close();
    _stateController.close();
    super.dispose();
  }
}

/// Global instance
final sessionSecurityService = SessionSecurityService();
