import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/auth_service.dart';

// 2FA Models
class TwoFactorAuthSetup {
  final String secretKey;
  final String qrCodeUrl;
  final List<String> backupCodes;

  const TwoFactorAuthSetup({
    required this.secretKey,
    required this.qrCodeUrl,
    required this.backupCodes,
  });
}

class TwoFactorAuthState {
  final bool isEnabled;
  final bool isLoading;
  final bool isVerifying;
  final String? error;
  final TwoFactorAuthSetup? setup;
  final bool hasBackupCodes;
  final bool smsEnabled;
  final String? phoneNumber;
  final bool biometricEnabled;

  const TwoFactorAuthState({
    this.isEnabled = false,
    this.isLoading = false,
    this.isVerifying = false,
    this.error,
    this.setup,
    this.hasBackupCodes = false,
    this.smsEnabled = false,
    this.phoneNumber,
    this.biometricEnabled = false,
  });

  TwoFactorAuthState copyWith({
    bool? isEnabled,
    bool? isLoading,
    bool? isVerifying,
    String? error,
    TwoFactorAuthSetup? setup,
    bool? hasBackupCodes,
    bool? smsEnabled,
    String? phoneNumber,
    bool? biometricEnabled,
  }) {
    return TwoFactorAuthState(
      isEnabled: isEnabled ?? this.isEnabled,
      isLoading: isLoading ?? this.isLoading,
      isVerifying: isVerifying ?? this.isVerifying,
      error: error,
      setup: setup ?? this.setup,
      hasBackupCodes: hasBackupCodes ?? this.hasBackupCodes,
      smsEnabled: smsEnabled ?? this.smsEnabled,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
    );
  }
}

// 2FA Provider
class TwoFactorAuthNotifier extends StateNotifier<TwoFactorAuthState> {
  final AuthService _authService;

  TwoFactorAuthNotifier(this._authService) : super(const TwoFactorAuthState()) {
    _loadTwoFactorStatus();
  }

  Future<void> _loadTwoFactorStatus() async {
    state = state.copyWith(isLoading: true);
    
    try {
      // In a real implementation, this would check with the backend
      // For now, we'll check local storage
      final twoFactorEnabled = await _authService.isTwoFactorEnabled();
      final smsEnabled = await _authService.isSMSTwoFactorEnabled();
      final biometricEnabled = await _authService.isBiometricEnabled();
      final phoneNumber = await _authService.getPhoneNumber();
      
      state = state.copyWith(
        isEnabled: twoFactorEnabled,
        smsEnabled: smsEnabled,
        biometricEnabled: biometricEnabled,
        phoneNumber: phoneNumber,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<TwoFactorAuthSetup> initializeTOTPSetup() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final setup = await _authService.initializeTOTPSetup();
      
      state = state.copyWith(
        setup: setup,
        isLoading: false,
      );
      
      return setup;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      rethrow;
    }
  }

  Future<bool> verifyAndEnableTOTP(String verificationCode) async {
    state = state.copyWith(isVerifying: true, error: null);
    
    try {
      final success = await _authService.verifyAndEnableTOTP(verificationCode);
      
      if (success) {
        state = state.copyWith(
          isEnabled: true,
          hasBackupCodes: true,
          isVerifying: false,
        );
      } else {
        state = state.copyWith(
          error: 'Invalid verification code',
          isVerifying: false,
        );
      }
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isVerifying: false,
      );
      return false;
    }
  }

  Future<bool> disableTOTP(String currentPassword) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final success = await _authService.disableTOTP(currentPassword);
      
      if (success) {
        state = state.copyWith(
          isEnabled: false,
          setup: null,
          hasBackupCodes: false,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          error: 'Failed to disable 2FA',
          isLoading: false,
        );
      }
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<List<String>> generateBackupCodes() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final codes = await _authService.generateBackupCodes();
      
      state = state.copyWith(
        hasBackupCodes: true,
        isLoading: false,
      );
      
      return codes;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      rethrow;
    }
  }

  Future<bool> setupSMSTwoFactor(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final success = await _authService.setupSMSTwoFactor(phoneNumber);
      
      if (success) {
        state = state.copyWith(
          smsEnabled: true,
          phoneNumber: phoneNumber,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          error: 'Failed to setup SMS 2FA',
          isLoading: false,
        );
      }
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<bool> sendSMSVerificationCode() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final success = await _authService.sendSMSVerificationCode();
      
      state = state.copyWith(isLoading: false);
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<bool> verifySMSCode(String code) async {
    state = state.copyWith(isVerifying: true, error: null);
    
    try {
      final success = await _authService.verifySMSCode(code);
      
      state = state.copyWith(isVerifying: false);
      
      if (!success) {
        state = state.copyWith(error: 'Invalid SMS code');
      }
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isVerifying: false,
      );
      return false;
    }
  }

  Future<bool> enableBiometricAuth() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final success = await _authService.enableBiometricAuth();
      
      state = state.copyWith(
        biometricEnabled: success,
        isLoading: false,
      );
      
      if (!success) {
        state = state.copyWith(error: 'Failed to enable biometric authentication');
      }
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<bool> disableBiometricAuth() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      await _authService.disableBiometricAuth();
      
      state = state.copyWith(
        biometricEnabled: false,
        isLoading: false,
      );
      
      return true;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      return false;
    }
  }

  Future<bool> verifyTwoFactorCode(String code, {bool isBackupCode = false}) async {
    state = state.copyWith(isVerifying: true, error: null);
    
    try {
      final success = await _authService.verifyTwoFactorCode(code, isBackupCode: isBackupCode);
      
      state = state.copyWith(isVerifying: false);
      
      if (!success) {
        state = state.copyWith(error: 'Invalid verification code');
      }
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isVerifying: false,
      );
      return false;
    }
  }

  Future<bool> authenticateWithBiometrics() async {
    state = state.copyWith(isVerifying: true, error: null);
    
    try {
      final success = await _authService.authenticateWithBiometrics();
      
      state = state.copyWith(isVerifying: false);
      
      if (!success) {
        state = state.copyWith(error: 'Biometric authentication failed');
      }
      
      return success;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isVerifying: false,
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Provider
final twoFactorAuthProvider = StateNotifierProvider<TwoFactorAuthNotifier, TwoFactorAuthState>((ref) {
  final authService = ref.read(authServiceProvider);
  return TwoFactorAuthNotifier(authService);
});