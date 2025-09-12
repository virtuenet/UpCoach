import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import '../../../core/services/biometric_auth_service.dart';

/// Biometric authentication button widget
class BiometricAuthButton extends ConsumerStatefulWidget {
  final VoidCallback? onSuccess;
  final Function(String)? onError;
  final bool showText;
  final double iconSize;
  final Color? color;

  const BiometricAuthButton({
    Key? key,
    this.onSuccess,
    this.onError,
    this.showText = true,
    this.iconSize = 48,
    this.color,
  }) : super(key: key);

  @override
  ConsumerState<BiometricAuthButton> createState() => _BiometricAuthButtonState();
}

class _BiometricAuthButtonState extends ConsumerState<BiometricAuthButton> {
  final BiometricAuthService _biometricService = BiometricAuthService();
  bool _isAuthenticating = false;
  BiometricType? _biometricType;

  @override
  void initState() {
    super.initState();
    _checkBiometricType();
  }

  Future<void> _checkBiometricType() async {
    final biometrics = await _biometricService.getAvailableBiometrics();
    if (mounted) {
      setState(() {
        if (biometrics.contains(BiometricType.face)) {
          _biometricType = BiometricType.face;
        } else if (biometrics.contains(BiometricType.fingerprint)) {
          _biometricType = BiometricType.fingerprint;
        } else if (biometrics.contains(BiometricType.iris)) {
          _biometricType = BiometricType.iris;
        }
      });
    }
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;

    setState(() {
      _isAuthenticating = true;
    });

    try {
      final promptMessage = await _biometricService.getBiometricPromptMessage();
      final result = await _biometricService.authenticate(
        reason: promptMessage,
        useErrorDialogs: true,
      );

      if (result.success) {
        widget.onSuccess?.call();
      } else {
        widget.onError?.call(result.message);
      }
    } catch (e) {
      widget.onError?.call('Authentication failed: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isAuthenticating = false;
        });
      }
    }
  }

  IconData _getBiometricIcon() {
    switch (_biometricType) {
      case BiometricType.face:
        return Icons.face;
      case BiometricType.fingerprint:
        return Icons.fingerprint;
      case BiometricType.iris:
        return Icons.remove_red_eye;
      default:
        return Icons.security;
    }
  }

  String _getBiometricLabel() {
    switch (_biometricType) {
      case BiometricType.face:
        return 'Face ID';
      case BiometricType.fingerprint:
        return 'Touch ID';
      case BiometricType.iris:
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = widget.color ?? theme.colorScheme.primary;

    if (_biometricType == null) {
      return const SizedBox.shrink();
    }

    return InkWell(
      onTap: _isAuthenticating ? null : _authenticate,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              child: _isAuthenticating
                  ? SizedBox(
                      width: widget.iconSize,
                      height: widget.iconSize,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                      ),
                    )
                  : Icon(
                      _getBiometricIcon(),
                      size: widget.iconSize,
                      color: color,
                    ),
            ),
            if (widget.showText) ...[
              const SizedBox(height: 8),
              Text(
                _isAuthenticating ? 'Authenticating...' : _getBiometricLabel(),
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Biometric setup card for settings screen
class BiometricSetupCard extends ConsumerStatefulWidget {
  const BiometricSetupCard({Key? key}) : super(key: key);

  @override
  ConsumerState<BiometricSetupCard> createState() => _BiometricSetupCardState();
}

class _BiometricSetupCardState extends ConsumerState<BiometricSetupCard> {
  final BiometricAuthService _biometricService = BiometricAuthService();
  bool _isLoading = false;
  bool _isEnabled = false;
  bool _isAvailable = false;
  String _biometricTypeName = 'Biometric Authentication';

  @override
  void initState() {
    super.initState();
    _checkBiometricStatus();
  }

  Future<void> _checkBiometricStatus() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final isAvailable = await _biometricService.isBiometricAvailable();
      final isEnabled = await _biometricService.isBiometricEnabled();
      final typeName = await _biometricService.getBiometricTypeName();

      if (mounted) {
        setState(() {
          _isAvailable = isAvailable;
          _isEnabled = isEnabled;
          _biometricTypeName = typeName;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _toggleBiometric(bool value) async {
    setState(() {
      _isLoading = true;
    });

    try {
      if (value) {
        final result = await _biometricService.enableBiometric();
        if (result.success) {
          setState(() {
            _isEnabled = true;
          });
          _showMessage('$_biometricTypeName enabled successfully');
        } else {
          _showMessage(result.message, isError: true);
        }
      } else {
        final success = await _biometricService.disableBiometric();
        if (success) {
          setState(() {
            _isEnabled = false;
          });
          _showMessage('$_biometricTypeName disabled');
        } else {
          _showMessage('Failed to disable $_biometricTypeName', isError: true);
        }
      }
    } catch (e) {
      _showMessage('An error occurred: $e', isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : null,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (!_isAvailable) {
      return Card(
        child: ListTile(
          leading: Icon(
            Icons.info_outline,
            color: theme.colorScheme.secondary,
          ),
          title: const Text('Biometric Authentication'),
          subtitle: const Text('Not available on this device'),
        ),
      );
    }

    return Card(
      child: ListTile(
        leading: Icon(
          Icons.fingerprint,
          color: _isEnabled ? theme.colorScheme.primary : null,
        ),
        title: Text(_biometricTypeName),
        subtitle: Text(
          _isEnabled
              ? 'Quick and secure access to your account'
              : 'Enable for faster sign-in',
        ),
        trailing: _isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Switch(
                value: _isEnabled,
                onChanged: _toggleBiometric,
              ),
      ),
    );
  }
}