import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/services/two_factor_auth_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';

class TwoFactorSetupScreen extends StatefulWidget {
  const TwoFactorSetupScreen({super.key});

  @override
  State<TwoFactorSetupScreen> createState() => _TwoFactorSetupScreenState();
}

class _TwoFactorSetupScreenState extends State<TwoFactorSetupScreen> {
  final TwoFactorAuthService _twoFactorService = TwoFactorAuthService();
  final TextEditingController _tokenController = TextEditingController();
  final PageController _pageController = PageController();

  bool _isLoading = false;
  bool _isVerifying = false;
  String? _error;
  String? _qrCodeUrl;
  String? _manualEntryKey;
  List<String>? _backupCodes;
  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    _generateSecret();
  }

  @override
  void dispose() {
    _tokenController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _generateSecret() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await _twoFactorService.generateTOTPSecret();
      setState(() {
        _qrCodeUrl = result['qrCodeUrl'];
        _manualEntryKey = result['secret'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyAndEnable() async {
    if (_tokenController.text.length != 6) {
      setState(() {
        _error = 'Please enter a 6-digit code';
      });
      return;
    }

    setState(() {
      _isVerifying = true;
      _error = null;
    });

    try {
      final result =
          await _twoFactorService.verifyAndEnableTOTP(_tokenController.text);
      setState(() {
        _backupCodes = List<String>.from(result['backupCodes'] ?? []);
        _isVerifying = false;
      });
      _nextStep();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isVerifying = false;
      });
    }
  }

  void _nextStep() {
    if (_currentStep < 2) {
      setState(() {
        _currentStep++;
      });
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _copyBackupCodes() {
    if (_backupCodes != null) {
      final codesText = _backupCodes!.join('\n');
      _copyToClipboard(codesText);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Setup Two-Factor Authentication'),
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _previousStep,
              )
            : null,
      ),
      body: Column(
        children: [
          // Progress indicator
          Container(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Row(
              children: List.generate(3, (index) {
                return Expanded(
                  child: Container(
                    height: 4,
                    margin: EdgeInsets.only(
                      right: index < 2 ? UIConstants.spacingSM : 0,
                    ),
                    decoration: BoxDecoration(
                      color: index <= _currentStep
                          ? AppTheme.primaryColor
                          : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                );
              }),
            ),
          ),

          // Page content
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildStep1(),
                _buildStep2(),
                _buildStep3(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Step 1: Download an Authenticator App',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          const Text(
            'To use two-factor authentication, you\'ll need an authenticator app. We recommend:',
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: UIConstants.spacingLG),

          // Recommended apps
          _buildAppRecommendation(
            'Google Authenticator',
            'Free, simple, and reliable',
            Icons.security,
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _buildAppRecommendation(
            'Authy',
            'Cloud backup and multi-device sync',
            Icons.cloud_sync,
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _buildAppRecommendation(
            'Microsoft Authenticator',
            'Push notifications and password management',
            Icons.notifications,
          ),

          const Spacer(),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: const Text('I have an authenticator app'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Step 2: Scan QR Code',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          const Text(
            'Open your authenticator app and scan this QR code:',
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: UIConstants.spacingLG),
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_qrCodeUrl != null) ...[
            Center(
              child: Container(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: QrImageView(
                  data: _qrCodeUrl!,
                  version: QrVersions.auto,
                  size: 200.0,
                ),
              ),
            ),
            const SizedBox(height: UIConstants.spacingLG),

            // Manual entry option
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Can\'t scan? Enter this code manually:',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          _manualEntryKey ?? '',
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 14,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy),
                        onPressed: () =>
                            _copyToClipboard(_manualEntryKey ?? ''),
                        tooltip: 'Copy code',
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: UIConstants.spacingXL),

            // Verification step
            const Text(
              'Enter the 6-digit code from your app:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
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
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
            ),

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
          ],
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isVerifying || _tokenController.text.length != 6
                  ? null
                  : _verifyAndEnable,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: _isVerifying
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Verify and Enable'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep3() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Setup Complete!',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Container(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            decoration: BoxDecoration(
              color: AppTheme.successColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(UIConstants.radiusMD),
              border: Border.all(
                  color: AppTheme.successColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: AppTheme.successColor),
                const SizedBox(width: UIConstants.spacingMD),
                const Expanded(
                  child: Text(
                    'Two-factor authentication is now enabled for your account.',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: UIConstants.spacingXL),
          const Text(
            'Save Your Backup Codes',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          const Text(
            'Keep these backup codes in a safe place. You can use them to access your account if you lose your phone.',
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          if (_backupCodes != null) ...[
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Backup Codes:',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: _copyBackupCodes,
                        icon: const Icon(Icons.copy),
                        label: const Text('Copy All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  ...(_backupCodes!.map((code) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Text(
                          code,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 16,
                          ),
                        ),
                      ))),
                ],
              ),
            ),
          ],
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: const Text('Done'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppRecommendation(
      String name, String description, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: Row(
        children: [
          Icon(icon, size: 40, color: AppTheme.primaryColor),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingXS),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
