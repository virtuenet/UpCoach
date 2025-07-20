import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  final int initialTab;

  const SettingsScreen({
    super.key,
    this.initialTab = 0,
  });

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Notification settings
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _taskReminders = true;
  bool _goalReminders = true;
  bool _moodReminders = true;
  
  // Privacy settings
  bool _shareAnalytics = true;
  bool _publicProfile = false;
  
  // App settings
  String _theme = 'system';
  String _language = 'english';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialTab,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryColor,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          tabs: const [
            Tab(text: 'General'),
            Tab(text: 'Security'),
            Tab(text: 'Notifications'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildGeneralSettings(),
          _buildSecuritySettings(),
          _buildNotificationSettings(),
        ],
      ),
    );
  }

  Widget _buildGeneralSettings() {
    return ListView(
      children: [
        _buildSectionHeader('Appearance'),
        RadioListTile<String>(
          title: const Text('System Default'),
          subtitle: const Text('Follow system theme'),
          value: 'system',
          groupValue: _theme,
          onChanged: (value) {
            setState(() {
              _theme = value!;
            });
          },
        ),
        RadioListTile<String>(
          title: const Text('Light Mode'),
          subtitle: const Text('Always use light theme'),
          value: 'light',
          groupValue: _theme,
          onChanged: (value) {
            setState(() {
              _theme = value!;
            });
          },
        ),
        RadioListTile<String>(
          title: const Text('Dark Mode'),
          subtitle: const Text('Always use dark theme'),
          value: 'dark',
          groupValue: _theme,
          onChanged: (value) {
            setState(() {
              _theme = value!;
            });
          },
        ),
        
        const Divider(),
        
        _buildSectionHeader('Language'),
        ListTile(
          title: const Text('App Language'),
          subtitle: Text(_language == 'english' ? 'English' : 'Other'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            // TODO: Show language selection
          },
        ),
        
        const Divider(),
        
        _buildSectionHeader('Data & Storage'),
        ListTile(
          title: const Text('Clear Cache'),
          subtitle: const Text('Free up storage space'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            _showClearCacheDialog();
          },
        ),
        ListTile(
          title: const Text('Download Data'),
          subtitle: const Text('Export your data'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            // TODO: Implement data export
          },
        ),
      ],
    );
  }

  Widget _buildSecuritySettings() {
    return ListView(
      children: [
        _buildSectionHeader('Account Security'),
        ListTile(
          title: const Text('Change Password'),
          subtitle: const Text('Update your password'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            _showChangePasswordDialog();
          },
        ),
        ListTile(
          title: const Text('Two-Factor Authentication'),
          subtitle: const Text('Add an extra layer of security'),
          trailing: Switch(
            value: false,
            onChanged: (value) {
              // TODO: Implement 2FA
            },
          ),
        ),
        
        const Divider(),
        
        _buildSectionHeader('Privacy'),
        SwitchListTile(
          title: const Text('Share Analytics'),
          subtitle: const Text('Help us improve the app'),
          value: _shareAnalytics,
          onChanged: (value) {
            setState(() {
              _shareAnalytics = value;
            });
          },
        ),
        SwitchListTile(
          title: const Text('Public Profile'),
          subtitle: const Text('Let others see your achievements'),
          value: _publicProfile,
          onChanged: (value) {
            setState(() {
              _publicProfile = value;
            });
          },
        ),
        
        const Divider(),
        
        _buildSectionHeader('Account Management'),
        ListTile(
          title: const Text(
            'Delete Account',
            style: TextStyle(color: AppTheme.errorColor),
          ),
          subtitle: const Text('Permanently delete your account and data'),
          trailing: const Icon(
            Icons.chevron_right,
            color: AppTheme.errorColor,
          ),
          onTap: () {
            _showDeleteAccountDialog();
          },
        ),
      ],
    );
  }

  Widget _buildNotificationSettings() {
    return ListView(
      children: [
        _buildSectionHeader('Push Notifications'),
        SwitchListTile(
          title: const Text('Enable Notifications'),
          subtitle: const Text('Receive push notifications'),
          value: _pushNotifications,
          onChanged: (value) {
            setState(() {
              _pushNotifications = value;
            });
          },
        ),
        
        const Divider(),
        
        _buildSectionHeader('Notification Types'),
        SwitchListTile(
          title: const Text('Task Reminders'),
          subtitle: const Text('Get reminded about your tasks'),
          value: _taskReminders,
          onChanged: _pushNotifications ? (value) {
            setState(() {
              _taskReminders = value;
            });
          } : null,
        ),
        SwitchListTile(
          title: const Text('Goal Updates'),
          subtitle: const Text('Track your goal progress'),
          value: _goalReminders,
          onChanged: _pushNotifications ? (value) {
            setState(() {
              _goalReminders = value;
            });
          } : null,
        ),
        SwitchListTile(
          title: const Text('Mood Check-ins'),
          subtitle: const Text('Daily mood tracking reminders'),
          value: _moodReminders,
          onChanged: _pushNotifications ? (value) {
            setState(() {
              _moodReminders = value;
            });
          } : null,
        ),
        
        const Divider(),
        
        _buildSectionHeader('Email Notifications'),
        SwitchListTile(
          title: const Text('Email Updates'),
          subtitle: const Text('Receive weekly summaries'),
          value: _emailNotifications,
          onChanged: (value) {
            setState(() {
              _emailNotifications = value;
            });
          },
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary,
        ),
      ),
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text('This will clear all cached data. You may need to re-download some content.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Cache cleared successfully'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('Clear'),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.errorColor,
            ),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPasswordController,
              decoration: const InputDecoration(
                labelText: 'Current Password',
                prefixIcon: Icon(Icons.lock_outline),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: newPasswordController,
              decoration: const InputDecoration(
                labelText: 'New Password',
                prefixIcon: Icon(Icons.lock),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: confirmPasswordController,
              decoration: const InputDecoration(
                labelText: 'Confirm New Password',
                prefixIcon: Icon(Icons.lock),
              ),
              obscureText: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (newPasswordController.text != confirmPasswordController.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Passwords do not match'),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
                return;
              }

              try {
                await ref.read(profileProvider.notifier).updatePassword(
                  currentPassword: currentPasswordController.text,
                  newPassword: newPasswordController.text,
                );
                
                if (mounted) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password changed successfully'),
                      backgroundColor: AppTheme.successColor,
                    ),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to change password: $e'),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              }
            },
            child: const Text('Change'),
          ),
        ],
      ),
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
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              
              final confirmDelete = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Final Confirmation'),
                  content: const Text(
                    'This is your last chance. Are you absolutely sure?',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: const Text('No, Keep My Account'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      child: const Text('Yes, Delete Everything'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.errorColor,
                      ),
                    ),
                  ],
                ),
              );

              if (confirmDelete == true) {
                try {
                  await ref.read(profileProvider.notifier).deleteAccount();
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Failed to delete account: $e'),
                        backgroundColor: AppTheme.errorColor,
                      ),
                    );
                  }
                }
              }
            },
            child: const Text('Delete'),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.errorColor,
            ),
          ),
        ],
      ),
    );
  }
} 