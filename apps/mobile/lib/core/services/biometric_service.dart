import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum BiometricType {
  face,
  fingerprint,
  iris,
  unknown,
}

class BiometricService {
  final LocalAuthentication _localAuth = LocalAuthentication();
  final SharedPreferences _prefs;
  
  static const String _biometricEnabledKey = 'biometric_enabled';
  static const String _lastAuthTimeKey = 'last_biometric_auth';
  static const String _authRequiredAfterKey = 'auth_required_after_seconds';
  
  BiometricService(this._prefs);
  
  Future<bool> isBiometricAvailable() async {
    try {
      final isAvailable = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return isAvailable && isDeviceSupported;
    } catch (e) {
      return false;
    }
  }
  
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      final availableBiometrics = await _localAuth.getAvailableBiometrics();
      return availableBiometrics.map((biometric) {
        switch (biometric) {
          case BiometricType.face:
            return BiometricType.face;
          case BiometricType.fingerprint:
            return BiometricType.fingerprint;
          case BiometricType.iris:
            return BiometricType.iris;
          default:
            return BiometricType.unknown;
        }
      }).toList();
    } catch (e) {
      return [];
    }
  }
  
  Future<bool> authenticateWithBiometrics({
    required String reason,
    bool stickyAuth = true,
  }) async {
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          stickyAuth: stickyAuth,
          biometricOnly: true,
        ),
      );
      
      if (authenticated) {
        await _updateLastAuthTime();
      }
      
      return authenticated;
    } catch (e) {
      return false;
    }
  }
  
  Future<bool> isBiometricEnabled() async {
    return _prefs.getBool(_biometricEnabledKey) ?? false;
  }
  
  Future<void> setBiometricEnabled(bool enabled) async {
    await _prefs.setBool(_biometricEnabledKey, enabled);
  }
  
  Future<void> setAuthRequiredAfter(int seconds) async {
    await _prefs.setInt(_authRequiredAfterKey, seconds);
  }
  
  Future<int> getAuthRequiredAfter() async {
    return _prefs.getInt(_authRequiredAfterKey) ?? 300; // Default 5 minutes
  }
  
  Future<bool> isAuthenticationRequired() async {
    final isEnabled = await isBiometricEnabled();
    if (!isEnabled) return false;
    
    final lastAuthTime = _prefs.getInt(_lastAuthTimeKey);
    if (lastAuthTime == null) return true;
    
    final authRequiredAfter = await getAuthRequiredAfter();
    final timeSinceLastAuth = DateTime.now().millisecondsSinceEpoch - lastAuthTime;
    
    return timeSinceLastAuth > (authRequiredAfter * 1000);
  }
  
  Future<void> _updateLastAuthTime() async {
    await _prefs.setInt(_lastAuthTimeKey, DateTime.now().millisecondsSinceEpoch);
  }
  
  Future<void> clearAuthTime() async {
    await _prefs.remove(_lastAuthTimeKey);
  }
}

// Providers
final biometricServiceProvider = Provider<BiometricService>((ref) {
  throw UnimplementedError('biometricServiceProvider must be overridden');
});

final isBiometricAvailableProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(biometricServiceProvider);
  return service.isBiometricAvailable();
});

final isBiometricEnabledProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(biometricServiceProvider);
  return service.isBiometricEnabled();
});

final availableBiometricsProvider = FutureProvider<List<BiometricType>>((ref) async {
  final service = ref.watch(biometricServiceProvider);
  return service.getAvailableBiometrics();
});

class BiometricAuthNotifier extends StateNotifier<bool> {
  final BiometricService _service;
  
  BiometricAuthNotifier(this._service) : super(false) {
    _checkInitialAuth();
  }
  
  Future<void> _checkInitialAuth() async {
    final isRequired = await _service.isAuthenticationRequired();
    state = !isRequired;
  }
  
  Future<bool> authenticate(String reason) async {
    final result = await _service.authenticateWithBiometrics(reason: reason);
    if (result) {
      state = true;
    }
    return result;
  }
  
  void lock() {
    state = false;
    _service.clearAuthTime();
  }
}

final biometricAuthProvider = StateNotifierProvider<BiometricAuthNotifier, bool>((ref) {
  final service = ref.watch(biometricServiceProvider);
  return BiometricAuthNotifier(service);
});