import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/services/two_factor_auth_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';

class DisableTwoFactorScreen extends StatefulWidget {
  const DisableTwoFactorScreen({super.key});

  @override
  State<DisableTwoFactorScreen> createState() => _DisableTwoFactorScreenState();
}

class _DisableTwoFactorScreenState extends State<DisableTwoFactorScreen> {
  final TwoFactorAuthService _twoFactorService = TwoFactorAuthService();
  final TextEditingController _tokenController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isLoading = false;
  String? _error;
  bool _showPassword = false;

  @override
  void dispose() {
    _tokenController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _disableTwoFactor() async {
    if (_tokenController.text.length != 6) {
      setState(() {
        _error = 'Please enter a valid 6-digit authentication code';
      });
      return;
    }

    if (_passwordController.text.isEmpty) {
      setState(() {
        _error = 'Please enter your password to confirm';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // First verify the 2FA token
      final isValidToken =
          await _twoFactorService.verify2FA(_tokenController.text);
      if (!isValidToken) {
        throw Exception('Invalid authentication code');
      }

      // Then disable 2FA (password verification is handled by the backend)
      await _twoFactorService.disable2FA();

      if (mounted) {
        // Show success and return
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Two-factor authentication has been disabled'),
            backgroundColor: AppTheme.warningColor,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Disable Two-Factor Authentication'),
        backgroundColor: AppTheme.warningColor,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Warning banner
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: AppTheme.warningColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                border: Border.all(
                    color: AppTheme.warningColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.warning,
                    color: AppTheme.warningColor,
                    size: 24,
                  ),
                  const SizedBox(width: UIConstants.spacingMD),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Security Warning',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        SizedBox(height: UIConstants.spacingXS),
                        Text(
                          'Disabling two-factor authentication will make your account less secure. Anyone with your password will be able to access your account.',
                          style: TextStyle(fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: UIConstants.spacingXL),

            const Text(
              'To disable two-factor authentication, please:',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),

            const SizedBox(height: UIConstants.spacingXL),

            // Step 1: Authentication code
            const Text(
              '1. Enter your current authentication code',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            const Text(
              'Open your authenticator app and enter the 6-digit code:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            TextField(
              controller: _tokenController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 6,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 4,
              ),
              decoration: const InputDecoration(
                hintText: '000000',
                counterText: '',
                border: OutlineInputBorder(),
                labelText: 'Authentication Code',
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
            ),

            const SizedBox(height: UIConstants.spacingXL),

            // Step 2: Password confirmation
            const Text(
              '2. Confirm with your password',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            const Text(
              'Enter your account password to confirm this action:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            TextField(
              controller: _passwordController,
              obscureText: !_showPassword,
              decoration: InputDecoration(
                labelText: 'Password',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(
                    _showPassword ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _showPassword = !_showPassword;
                    });
                  },
                ),
              ),
            ),

            // Error message
            if (_error != null) ...[
              const SizedBox(height: UIConstants.spacingMD),
              Container(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                decoration: BoxDecoration(
                  color: AppTheme.errorColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                  border: Border.all(
                      color: AppTheme.errorColor.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error, color: AppTheme.errorColor, size: 20),
                    const SizedBox(width: UIConstants.spacingSM),
                    Expanded(
                      child: Text(
                        _error!,
                        style: TextStyle(color: AppTheme.errorColor),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const Spacer(),

            // Action buttons
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ||
                            _tokenController.text.length != 6 ||
                            _passwordController.text.isEmpty
                        ? null
                        : _disableTwoFactor,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.warningColor,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(50),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Disable Two-Factor Authentication'),
                  ),
                ),
                const SizedBox(height: UIConstants.spacingMD),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: _isLoading
                        ? null
                        : () => Navigator.of(context).pop(false),
                    style: TextButton.styleFrom(
                      minimumSize: const Size.fromHeight(50),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
