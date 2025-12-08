import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/biometric_service.dart';
import '../../features/auth/presentation/screens/biometric_lock_screen.dart';

class AppLifecycleObserver extends ConsumerStatefulWidget {
  final Widget child;

  const AppLifecycleObserver({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<AppLifecycleObserver> createState() =>
      _AppLifecycleObserverState();
}

class _AppLifecycleObserverState extends ConsumerState<AppLifecycleObserver>
    with WidgetsBindingObserver {
  bool _isLocked = false;
  DateTime? _pausedTime;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkInitialBiometricLock();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    switch (state) {
      case AppLifecycleState.paused:
        _pausedTime = DateTime.now();
        break;
      case AppLifecycleState.resumed:
        _checkBiometricLock();
        break;
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        break;
    }
  }

  Future<void> _checkInitialBiometricLock() async {
    final biometricService = ref.read(biometricServiceProvider);
    final isEnabled = await biometricService.isBiometricEnabled();
    final isAuthRequired = await biometricService.isAuthenticationRequired();

    if (isEnabled && isAuthRequired && mounted) {
      setState(() => _isLocked = true);
    }
  }

  Future<void> _checkBiometricLock() async {
    if (_isLocked) return; // Already locked

    final biometricService = ref.read(biometricServiceProvider);
    final isEnabled = await biometricService.isBiometricEnabled();

    if (!isEnabled) return;

    // Check if enough time has passed
    if (_pausedTime != null) {
      final authRequiredAfter = await biometricService.getAuthRequiredAfter();
      final timeSincePause = DateTime.now().difference(_pausedTime!).inSeconds;

      if (timeSincePause >= authRequiredAfter && mounted) {
        setState(() => _isLocked = true);
      }
    }
  }

  void _onAuthenticated() {
    setState(() => _isLocked = false);
    _pausedTime = null;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLocked) {
      return BiometricLockScreen(
        onAuthenticated: _onAuthenticated,
      );
    }

    return widget.child;
  }
}

// Provider for easy access
final appLifecycleProvider = Provider<AppLifecycleObserver>((ref) {
  throw UnimplementedError('appLifecycleProvider must be overridden');
});
