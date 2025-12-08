import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/data_export_service.dart';
import '../../../core/services/biometric_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../../settings/presentation/screens/biometric_settings_screen.dart';
import '../../auth/screens/two_factor_setup_screen.dart';
import '../../auth/screens/disable_two_factor_screen.dart';

class PrivacySecurityScreen extends ConsumerStatefulWidget {
  const PrivacySecurityScreen({super.key});

  @override
  ConsumerState<PrivacySecurityScreen> createState() =>
      _PrivacySecurityScreenState();
}

class _PrivacySecurityScreenState extends ConsumerState<PrivacySecurityScreen> {
  bool _biometricEnabled = false;
  bool _twoFactorEnabled = false;
  bool _dataSharing = true;
  bool _analyticsEnabled = true;
  bool _isExporting = false;

  final DataExportService _dataExportService = DataExportService();

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final biometricService = ref.read(biometricServiceProvider);
      final biometricEnabled = await biometricService.isBiometricEnabled();
      if (mounted) {
        setState(() {
          _biometricEnabled = biometricEnabled;
        });
      }
    } catch (e) {
      // Biometric service not initialized yet
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Privacy & Security'),
      body: ListView(
        children: [
          _buildSectionHeader('Security'),
          _buildActionTile(
            icon: Icons.fingerprint,
            title: 'Biometric Login',
            subtitle: _biometricEnabled
                ? 'Enabled - Tap to configure'
                : 'Use fingerprint or Face ID to unlock',
            onTap: _openBiometricSettings,
            trailing: Switch.adaptive(
              value: _biometricEnabled,
              onChanged: (value) async {
                if (value) {
                  _openBiometricSettings();
                } else {
                  try {
                    final biometricService = ref.read(biometricServiceProvider);
                    await biometricService.setBiometricEnabled(false);
                    setState(() => _biometricEnabled = false);
                  } catch (e) {
                    // Handle error
                  }
                }
              },
              activeTrackColor: AppColors.primary.withValues(alpha: 0.5),
              activeThumbColor: AppColors.primary,
            ),
          ),
          _buildActionTile(
            icon: Icons.security,
            title: 'Two-Factor Authentication',
            subtitle: _twoFactorEnabled
                ? 'Enabled - Extra security active'
                : 'Add an extra layer of security',
            onTap: _toggleTwoFactor,
            trailing: Switch.adaptive(
              value: _twoFactorEnabled,
              onChanged: (_) => _toggleTwoFactor(),
              activeTrackColor: AppColors.primary.withValues(alpha: 0.5),
              activeThumbColor: AppColors.primary,
            ),
          ),
          _buildActionTile(
            icon: Icons.password,
            title: 'Change Password',
            subtitle: 'Update your account password',
            onTap: _showChangePasswordDialog,
          ),
          const Divider(),
          _buildSectionHeader('Privacy'),
          _buildSwitchTile(
            icon: Icons.share,
            title: 'Data Sharing',
            subtitle: 'Share anonymized data to improve the app',
            value: _dataSharing,
            onChanged: (value) {
              setState(() => _dataSharing = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.analytics,
            title: 'Analytics',
            subtitle: 'Help us understand how you use the app',
            value: _analyticsEnabled,
            onChanged: (value) {
              setState(() => _analyticsEnabled = value);
            },
          ),
          _buildActionTile(
            icon: Icons.download,
            title: 'Download My Data',
            subtitle: 'Get a copy of your personal data (GDPR)',
            onTap: _exportData,
            trailing: _isExporting
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.chevron_right),
          ),
          _buildActionTile(
            icon: Icons.delete_forever,
            title: 'Delete Account',
            subtitle: 'Permanently delete your account and data',
            onTap: _showDeleteAccountDialog,
            isDestructive: true,
          ),
          const SizedBox(height: UIConstants.spacing2XL),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeTrackColor: AppColors.primary.withValues(alpha: 0.5),
        activeThumbColor: AppColors.primary,
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Widget? trailing,
    bool isDestructive = false,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isDestructive ? AppColors.error : AppColors.primary,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isDestructive ? AppColors.error : null,
        ),
      ),
      subtitle: Text(subtitle),
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  void _openBiometricSettings() {
    Navigator.of(context)
        .push(
          MaterialPageRoute(
            builder: (context) => const BiometricSettingsScreen(),
          ),
        )
        .then((_) => _loadSettings());
  }

  Future<void> _toggleTwoFactor() async {
    try {
      if (_twoFactorEnabled) {
        // Disable 2FA
        final result = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (context) => const DisableTwoFactorScreen(),
          ),
        );

        if (result == true) {
          setState(() => _twoFactorEnabled = false);
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Two-factor authentication disabled'),
              backgroundColor: AppTheme.warningColor,
            ),
          );
        }
      } else {
        // Enable 2FA
        final result = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (context) => const TwoFactorSetupScreen(),
          ),
        );

        if (result == true) {
          setState(() => _twoFactorEnabled = true);
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Two-factor authentication enabled successfully'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool obscureCurrent = true;
    bool obscureNew = true;
    bool obscureConfirm = true;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Change Password'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: currentPasswordController,
                  obscureText: obscureCurrent,
                  decoration: InputDecoration(
                    labelText: 'Current Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(obscureCurrent
                          ? Icons.visibility
                          : Icons.visibility_off),
                      onPressed: () => setDialogState(
                          () => obscureCurrent = !obscureCurrent),
                    ),
                  ),
                ),
                const SizedBox(height: UIConstants.spacingMD),
                TextField(
                  controller: newPasswordController,
                  obscureText: obscureNew,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(
                          obscureNew ? Icons.visibility : Icons.visibility_off),
                      onPressed: () =>
                          setDialogState(() => obscureNew = !obscureNew),
                    ),
                    helperText: 'At least 8 characters',
                  ),
                ),
                const SizedBox(height: UIConstants.spacingMD),
                TextField(
                  controller: confirmPasswordController,
                  obscureText: obscureConfirm,
                  decoration: InputDecoration(
                    labelText: 'Confirm New Password',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(obscureConfirm
                          ? Icons.visibility
                          : Icons.visibility_off),
                      onPressed: () => setDialogState(
                          () => obscureConfirm = !obscureConfirm),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                // Validate
                if (currentPasswordController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Please enter your current password')),
                  );
                  return;
                }
                if (newPasswordController.text.length < 8) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content:
                            Text('New password must be at least 8 characters')),
                  );
                  return;
                }
                if (newPasswordController.text !=
                    confirmPasswordController.text) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Passwords do not match')),
                  );
                  return;
                }

                try {
                  await ref.read(profileProvider.notifier).updatePassword(
                        currentPassword: currentPasswordController.text,
                        newPassword: newPasswordController.text,
                      );

                  if (!context.mounted) return;
                  Navigator.pop(dialogContext);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password changed successfully'),
                      backgroundColor: AppTheme.successColor,
                    ),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to change password: $e'),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                }
              },
              child: const Text('Change Password'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _exportData() async {
    final authState = ref.read(authProvider);
    final user = authState.user;

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to export your data')),
      );
      return;
    }

    // Show export options dialog
    final exportOptions = await showDialog<Map<String, bool>>(
      context: context,
      builder: (dialogContext) => _ExportOptionsDialog(),
    );

    if (exportOptions == null) return;

    setState(() => _isExporting = true);

    try {
      final result = await _dataExportService.exportUserData(
        user: user,
        includeVoiceJournals: exportOptions['voiceJournals'] ?? true,
        includeProgressPhotos: exportOptions['progressPhotos'] ?? true,
        encryptData: exportOptions['encrypt'] ?? false,
      );

      setState(() => _isExporting = false);

      if (!mounted) return;

      if (result.success) {
        _showExportSuccessDialog(result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.error ?? 'Export failed'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } catch (e) {
      setState(() => _isExporting = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Export error: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showExportSuccessDialog(ExportResult result) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        icon: const Icon(Icons.check_circle,
            color: AppTheme.successColor, size: 48),
        title: const Text('Export Complete'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Your data has been exported successfully.'),
            const SizedBox(height: UIConstants.spacingMD),
            _buildExportDetailRow('File', result.fileName ?? 'N/A'),
            _buildExportDetailRow(
                'Size', _formatFileSize(result.fileSize ?? 0)),
            _buildExportDetailRow('Encrypted', result.encrypted ? 'Yes' : 'No'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Done'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.pop(dialogContext);
              try {
                await _dataExportService.shareExportedData(result);
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to share: $e'),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              }
            },
            icon: const Icon(Icons.share),
            label: const Text('Share'),
          ),
        ],
      ),
    );
  }

  Widget _buildExportDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        icon: const Icon(Icons.warning_amber_rounded,
            color: AppColors.error, size: 48),
        title: const Text('Delete Account'),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.\n\nThis includes:\n'
          '- All habits and tracking data\n'
          '- Goals and progress\n'
          '- Voice journals and recordings\n'
          '- Profile information',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              _confirmDeleteAccount();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteAccount() {
    final confirmController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Confirm Deletion'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Type "DELETE" to confirm account deletion:'),
            const SizedBox(height: UIConstants.spacingMD),
            TextField(
              controller: confirmController,
              decoration: const InputDecoration(
                hintText: 'Type DELETE',
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.characters,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (confirmController.text.toUpperCase() != 'DELETE') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Please type DELETE to confirm')),
                );
                return;
              }

              try {
                await ref.read(profileProvider.notifier).deleteAccount();
                if (!dialogContext.mounted) return;
                Navigator.pop(dialogContext);
                // Navigate to login screen
                if (!dialogContext.mounted) return;
                GoRouter.of(dialogContext).go('/login');
              } catch (e) {
                if (!dialogContext.mounted) return;
                ScaffoldMessenger.of(dialogContext).showSnackBar(
                  SnackBar(
                    content: Text('Failed to delete account: $e'),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete Forever'),
          ),
        ],
      ),
    );
  }
}

class _ExportOptionsDialog extends StatefulWidget {
  @override
  State<_ExportOptionsDialog> createState() => _ExportOptionsDialogState();
}

class _ExportOptionsDialogState extends State<_ExportOptionsDialog> {
  bool _includeVoiceJournals = true;
  bool _includeProgressPhotos = true;
  bool _encryptData = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Export Options'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Choose what data to include in your export:',
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          CheckboxListTile(
            title: const Text('Voice Journals'),
            subtitle: const Text('Transcripts only (audio files excluded)'),
            value: _includeVoiceJournals,
            onChanged: (value) {
              setState(() => _includeVoiceJournals = value ?? true);
            },
            controlAffinity: ListTileControlAffinity.leading,
          ),
          CheckboxListTile(
            title: const Text('Progress Photos'),
            subtitle: const Text('Photo metadata only'),
            value: _includeProgressPhotos,
            onChanged: (value) {
              setState(() => _includeProgressPhotos = value ?? true);
            },
            controlAffinity: ListTileControlAffinity.leading,
          ),
          const Divider(),
          CheckboxListTile(
            title: const Text('Encrypt Export'),
            subtitle: const Text('Secure your data with encryption'),
            value: _encryptData,
            onChanged: (value) {
              setState(() => _encryptData = value ?? false);
            },
            controlAffinity: ListTileControlAffinity.leading,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.pop(context, {
              'voiceJournals': _includeVoiceJournals,
              'progressPhotos': _includeProgressPhotos,
              'encrypt': _encryptData,
            });
          },
          icon: const Icon(Icons.download),
          label: const Text('Export'),
        ),
      ],
    );
  }
}
