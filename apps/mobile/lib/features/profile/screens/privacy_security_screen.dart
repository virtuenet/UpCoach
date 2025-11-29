import 'package:flutter/material.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../core/theme/app_colors.dart';

class PrivacySecurityScreen extends StatefulWidget {
  const PrivacySecurityScreen({super.key});

  @override
  State<PrivacySecurityScreen> createState() => _PrivacySecurityScreenState();
}

class _PrivacySecurityScreenState extends State<PrivacySecurityScreen> {
  bool _biometricEnabled = false;
  bool _twoFactorEnabled = false;
  bool _dataSharing = true;
  bool _analyticsEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Privacy & Security'),
      body: ListView(
        children: [
          _buildSectionHeader('Security'),
          _buildSwitchTile(
            icon: Icons.fingerprint,
            title: 'Biometric Login',
            subtitle: 'Use fingerprint or Face ID to unlock',
            value: _biometricEnabled,
            onChanged: (value) {
              setState(() => _biometricEnabled = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.security,
            title: 'Two-Factor Authentication',
            subtitle: 'Add an extra layer of security',
            value: _twoFactorEnabled,
            onChanged: (value) {
              setState(() => _twoFactorEnabled = value);
            },
          ),
          _buildActionTile(
            icon: Icons.password,
            title: 'Change Password',
            subtitle: 'Update your account password',
            onTap: () {
              // TODO: Navigate to change password screen
            },
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
            subtitle: 'Get a copy of your personal data',
            onTap: () {
              // TODO: Trigger data export
            },
          ),
          _buildActionTile(
            icon: Icons.delete_forever,
            title: 'Delete Account',
            subtitle: 'Permanently delete your account and data',
            onTap: () {
              _showDeleteAccountDialog();
            },
            isDestructive: true,
          ),
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
        activeColor: AppColors.primary,
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
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
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement account deletion
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
