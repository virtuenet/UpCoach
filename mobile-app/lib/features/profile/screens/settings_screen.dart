import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../providers/profile_provider.dart';
import '../../../core/services/two_factor_auth_service.dart';
import '../../../core/services/language_service.dart';
import '../../auth/screens/two_factor_setup_screen.dart';
import '../../auth/screens/disable_two_factor_screen.dart';

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
  final TwoFactorAuthService _twoFactorService = TwoFactorAuthService();

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

  // Security settings
  bool _twoFactorEnabled = false;
  bool _isLoading2FAStatus = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialTab,
    );
    _load2FAStatus();
  }

  Future<void> _load2FAStatus() async {
    setState(() => _isLoading2FAStatus = true);
    try {
      final status = await _twoFactorService.get2FAStatus();
      setState(() {
        _twoFactorEnabled = status['enabled'] ?? false;
        _isLoading2FAStatus = false;
      });
    } catch (e) {
      setState(() => _isLoading2FAStatus = false);
      // Silently handle errors in settings screen
    }
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
        Consumer(
          builder: (context, ref, child) {
            final currentLanguageAsync = ref.watch(currentLanguageProvider);

            return currentLanguageAsync.when(
              data: (currentLangCode) {
                final currentLanguage = LanguageService.supportedLanguages
                    .firstWhere((lang) => lang.code == currentLangCode);

                return ListTile(
                  title: const Text('App Language'),
                  subtitle: Text('${currentLanguage.flag} ${currentLanguage.nativeName}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showLanguageSelection(context, ref, currentLangCode),
                );
              },
              loading: () => ListTile(
                title: const Text('App Language'),
                subtitle: const Text('Loading...'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
              error: (_, __) => ListTile(
                title: const Text('App Language'),
                subtitle: const Text('English'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showLanguageSelection(context, ref, 'en'),
              ),
            );
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
            _showDataExportDialog();
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
          subtitle: Text(_twoFactorEnabled
            ? 'Enhanced security enabled'
            : 'Add an extra layer of security'),
          trailing: _isLoading2FAStatus
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Switch(
                value: _twoFactorEnabled,
                onChanged: (value) async {
                  if (value) {
                    await _setupTwoFactor();
                  } else {
                    await _disableTwoFactor();
                  }
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
            const SizedBox(height: UIConstants.spacingMD),
            TextField(
              controller: newPasswordController,
              decoration: const InputDecoration(
                labelText: 'New Password',
                prefixIcon: Icon(Icons.lock),
              ),
              obscureText: true,
            ),
            const SizedBox(height: UIConstants.spacingMD),
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

  Future<void> _setupTwoFactor() async {
    try {
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (context) => const TwoFactorSetupScreen(),
        ),
      );

      if (result == true) {
        setState(() {
          _twoFactorEnabled = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Two-factor authentication enabled successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to setup 2FA: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _disableTwoFactor() async {
    try {
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (context) => const DisableTwoFactorScreen(),
        ),
      );

      if (result == true) {
        setState(() {
          _twoFactorEnabled = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Two-factor authentication disabled'),
            backgroundColor: AppTheme.warningColor,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to disable 2FA: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
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

  void _showLanguageSelection(BuildContext context, WidgetRef ref, String currentLanguageCode) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Handle bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppTheme.textSecondary.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                  const Expanded(
                    child: Text(
                      'Select Language',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(width: 48), // Balance the close button
                ],
              ),

              const SizedBox(height: 16),

              // Language list
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: LanguageService.supportedLanguages.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final language = LanguageService.supportedLanguages[index];
                    final isSelected = language.code == currentLanguageCode;

                    return ListTile(
                      leading: Text(
                        language.flag,
                        style: const TextStyle(fontSize: 24),
                      ),
                      title: Text(
                        language.nativeName,
                        style: TextStyle(
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      subtitle: Text(
                        language.name,
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      trailing: isSelected
                          ? Icon(
                              Icons.check_circle,
                              color: AppTheme.primaryColor,
                            )
                          : null,
                      onTap: () async {
                        if (language.code != currentLanguageCode) {
                          try {
                            // Update language in service
                            final languageService = ref.read(languageServiceProvider);
                            await languageService.setSelectedLanguage(language.code);

                            // Update UI state
                            if (ref.read(localeProvider.notifier).mounted) {
                              await ref.read(localeProvider.notifier).setLanguage(language.code);
                            }

                            // Refresh the current language provider
                            ref.refresh(currentLanguageProvider);

                            // Show success feedback
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Language changed to ${language.nativeName}'),
                                  backgroundColor: AppTheme.successColor,
                                ),
                              );
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Failed to change language: $e'),
                                  backgroundColor: AppTheme.errorColor,
                                ),
                              );
                            }
                          }
                        }

                        Navigator.of(context).pop();
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDataExportDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Your Data'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Choose what data you want to export:',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 16),
            _buildExportOption('Profile Information', Icons.person),
            _buildExportOption('Goals & Progress', Icons.track_changes),
            _buildExportOption('Voice Journal Entries', Icons.mic),
            _buildExportOption('Chat History', Icons.chat),
            _buildExportOption('Analytics Data', Icons.analytics),
            const SizedBox(height: 16),
            const Text(
              'Your data will be exported as a ZIP file containing JSON and CSV files.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _exportUserData();
            },
            child: const Text('Export Data'),
          ),
        ],
      ),
    );
  }

  Widget _buildExportOption(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primaryColor),
          const SizedBox(width: 12),
          Text(title),
        ],
      ),
    );
  }

  Future<void> _exportUserData() async {
    try {
      // Show loading indicator
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Preparing your data export...'),
            ],
          ),
        ),
      );

      // Call the profile provider to export data
      await ref.read(profileProvider.notifier).exportUserData();

      // Close loading dialog
      if (mounted) Navigator.of(context).pop();

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Data export completed! Check your downloads folder.'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      // Close loading dialog
      if (mounted) Navigator.of(context).pop();

      // Show error message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to export data: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }
} 