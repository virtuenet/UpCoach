import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/biometric_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/app_localizations.dart';

class BiometricLockScreen extends ConsumerStatefulWidget {
  final VoidCallback onAuthenticated;
  final VoidCallback? onCancel;

  const BiometricLockScreen({
    Key? key,
    required this.onAuthenticated,
    this.onCancel,
  }) : super(key: key);

  @override
  ConsumerState<BiometricLockScreen> createState() => _BiometricLockScreenState();
}

class _BiometricLockScreenState extends ConsumerState<BiometricLockScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isAuthenticating = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.repeat(reverse: true);
    
    // Auto-trigger authentication on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _authenticate();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primaryColor.withOpacity(0.1),
              Colors.white,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(UIConstants.spacingLG),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                // App Logo
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primaryColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.lock_outline,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingXL),
                Text(
                  'UpCoach',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryColor,
                      ),
                ),
                const SizedBox(height: UIConstants.spacingSM),
                Text(
                  'Authentication Required',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
                const Spacer(),
                // Biometric Icon
                AnimatedBuilder(
                  animation: _scaleAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _scaleAnimation.value,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primaryColor.withOpacity(0.1),
                        ),
                        child: Icon(
                          Icons.fingerprint,
                          size: 60,
                          color: AppColors.primaryColor,
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: UIConstants.spacingXL),
                Text(
                  _isAuthenticating
                      ? 'Authenticating...'
                      : 'Touch the fingerprint sensor',
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const Spacer(),
                // Action Buttons
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _isAuthenticating ? null : _authenticate,
                      icon: Icon(Icons.fingerprint),
                      label: Text('Authenticate'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                        ),
                      ),
                    ),
                    const SizedBox(height: UIConstants.spacingMD),
                    OutlinedButton(
                      onPressed: _isAuthenticating ? null : _usePassword,
                      child: Text('Use Password Instead'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                        ),
                      ),
                    ),
                    if (widget.onCancel != null) ...[
                      const SizedBox(height: UIConstants.spacingSM),
                      TextButton(
                        onPressed: widget.onCancel,
                        child: Text(l10n.cancel),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: UIConstants.spacingLG),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;

    setState(() => _isAuthenticating = true);

    try {
      final biometricAuth = ref.read(biometricAuthProvider.notifier);
      final authenticated = await biometricAuth.authenticate(
        'Authenticate to access UpCoach',
      );

      if (authenticated) {
        widget.onAuthenticated();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Authentication failed. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isAuthenticating = false);
      }
    }
  }

  void _usePassword() {
    // Navigate to password authentication
    // This would typically navigate to the login screen
    widget.onAuthenticated(); // For now, just authenticate
  }
}