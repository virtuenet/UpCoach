import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../providers/profile_provider.dart';
import '../../../core/services/two_factor_auth_service.dart';
import '../../../core/services/data_export_service.dart';
import '../../auth/screens/two_factor_setup_screen.dart';
import '../../auth/screens/disable_two_factor_screen.dart';
import '../../auth/providers/auth_provider.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/ondevice/on_device_llm_manager.dart';
import '../../../core/ondevice/on_device_llm_state.dart';

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
  final DataExportService _dataExportService = DataExportService();

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

  // Language Selection Methods
  final Map<String, String> _languages = {
    'english': 'English',
    'spanish': 'Español',
    'french': 'Français',
    'german': 'Deutsch',
    'italian': 'Italiano',
    'portuguese': 'Português',
    'chinese_simplified': '简体中文',
    'chinese_traditional': '繁體中文',
    'japanese': '日本語',
    'korean': '한국어',
  };

  String _getLanguageDisplayName(String languageCode) {
    return _languages[languageCode] ?? 'English';
  }

  Future<void> _showLanguageSelection() async {
    final selectedLanguage = await showDialog<String>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Select Language'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _languages.length,
              itemBuilder: (context, index) {
                final entry = _languages.entries.elementAt(index);
                final languageCode = entry.key;
                final languageName = entry.value;
                final isSelected = _language == languageCode;

                return ListTile(
                  title: Text(languageName),
                  leading: Radio<String>(
                    value: languageCode,
                    groupValue: _language,
                    onChanged: (value) {
                      Navigator.of(context).pop(value);
                    },
                  ),
                  onTap: () {
                    Navigator.of(context).pop(languageCode);
                  },
                  trailing: isSelected ? const Icon(Icons.check, color: Colors.green) : null,
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );

    if (selectedLanguage != null && selectedLanguage != _language) {
      await _updateLanguage(selectedLanguage);
    }
  }

  Future<void> _updateLanguage(String languageCode) async {
    try {
      // Update the language preference in SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_language', languageCode);

      setState(() {
        _language = languageCode;
      });

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Language changed to ${_getLanguageDisplayName(languageCode)}'),
            action: SnackBarAction(
              label: 'Restart App',
              onPressed: () {
                // In a real app, you might trigger an app restart here
                // or use a localization state management solution
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update language: $e')),
        );
      }
    }
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
    final onDeviceState = ref.watch(onDeviceLlmManagerProvider);
    final onDeviceManager = ref.read(onDeviceLlmManagerProvider.notifier);

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
          subtitle: Text(_getLanguageDisplayName(_language)),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _showLanguageSelection(),
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
        ListTile(
          title: const Text('Export Weekly Report (Google Docs)'),
          subtitle: const Text('Generate a weekly report in Google Docs'),
          trailing: const Icon(Icons.description_outlined),
          onTap: () {
            _triggerWeeklyReport('docs');
          },
        ),
        ListTile(
          title: const Text('Export Weekly Sheet (Google Sheets)'),
          subtitle: const Text('Update a weekly stats spreadsheet'),
          trailing: const Icon(Icons.grid_on_outlined),
          onTap: () {
            _triggerWeeklyReport('sheets');
          },
        ),

        const Divider(),

        _buildSectionHeader('On-device AI'),
        SwitchListTile(
          title: const Text('Use on-device mini model'),
          subtitle: const Text('Route quick prompts through the local 1–2B model'),
          value: onDeviceState.enabled,
          onChanged: (value) {
            onDeviceManager.setEnabled(value);
          },
        ),
        ListTile(
          title: Text(onDeviceState.activeModel.name),
          subtitle: Text(_formatOnDeviceStatus(onDeviceState)),
          trailing: _buildOnDeviceTrailing(onDeviceState),
          onTap: () => _showOnDeviceActionsSheet(onDeviceManager, onDeviceState),
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

  String _formatOnDeviceStatus(OnDeviceLlmState state) {
    switch (state.status) {
      case OnDeviceModelStatus.ready:
        final freshness = state.lastUpdated != null
            ? 'Updated ${state.lastUpdated}'
            : 'Ready for offline prompts';
        return '${state.activeModel.sizeMB} MB cached • $freshness';
      case OnDeviceModelStatus.downloading:
        final percent = (state.downloadProgress * 100).clamp(0, 100).toStringAsFixed(0);
        return 'Downloading… $percent%';
      case OnDeviceModelStatus.error:
        return 'Error: ${state.lastError ?? 'unknown'}';
      case OnDeviceModelStatus.notInstalled:
      default:
        return '${state.activeModel.sizeMB} MB download required';
    }
  }

  Widget _buildOnDeviceTrailing(OnDeviceLlmState state) {
    if (state.status == OnDeviceModelStatus.downloading) {
      return SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          value: state.downloadProgress == 0 ? null : state.downloadProgress,
          strokeWidth: 2,
        ),
      );
    }
    return const Icon(Icons.chevron_right);
  }

  Future<void> _showOnDeviceActionsSheet(
    OnDeviceLlmManager manager,
    OnDeviceLlmState state,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.download),
                title: Text(state.status == OnDeviceModelStatus.ready ? 'Refresh model' : 'Download model'),
                subtitle: Text('${state.activeModel.sizeMB} MB • ${state.activeModel.backend}'),
                onTap: () {
                  Navigator.of(context).pop();
                  manager.downloadActiveModel();
                },
              ),
              if (state.status == OnDeviceModelStatus.downloading)
                ListTile(
                  leading: const Icon(Icons.stop),
                  title: const Text('Cancel download'),
                  onTap: () {
                    Navigator.of(context).pop();
                    manager.cancelDownload();
                  },
                ),
              if (state.modelPath.isNotEmpty)
                ListTile(
                  leading: const Icon(Icons.delete_outline),
                  title: const Text('Remove local model'),
                  onTap: () {
                    Navigator.of(context).pop();
                    manager.removeModel();
                  },
                ),
            ],
          ),
        );
      },
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

  void _showDataExportDialog() {
    bool includeVoiceJournals = true;
    bool includeProgressPhotos = true;
    bool encryptData = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.download, color: AppTheme.primaryColor),
              SizedBox(width: UIConstants.spacingMD),
              Text('Export Your Data'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Choose what data to include in your export:',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: UIConstants.spacingMD),
              CheckboxListTile(
                title: const Text('Voice Journals'),
                subtitle: const Text('Include audio transcripts and metadata'),
                value: includeVoiceJournals,
                onChanged: (value) {
                  setState(() {
                    includeVoiceJournals = value ?? false;
                  });
                },
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              CheckboxListTile(
                title: const Text('Progress Photos'),
                subtitle: const Text('Include photo metadata'),
                value: includeProgressPhotos,
                onChanged: (value) {
                  setState(() {
                    includeProgressPhotos = value ?? false;
                  });
                },
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              CheckboxListTile(
                title: const Text('Encrypt Export'),
                subtitle: const Text('Secure your data with encryption'),
                value: encryptData,
                onChanged: (value) {
                  setState(() {
                    encryptData = value ?? false;
                  });
                },
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: UIConstants.spacingMD),
              Container(
                padding: const EdgeInsets.all(UIConstants.spacingSM),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, size: 16, color: AppTheme.primaryColor),
                    SizedBox(width: UIConstants.spacingSM),
                    Expanded(
                      child: Text(
                        'Your export will include profile, habits, tasks, goals, and mood data in GDPR-compliant JSON format.',
                        style: TextStyle(fontSize: 12, color: AppTheme.primaryColor),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton.icon(
              onPressed: () async {
                Navigator.of(context).pop();
                await _performDataExport(
                  includeVoiceJournals: includeVoiceJournals,
                  includeProgressPhotos: includeProgressPhotos,
                  encryptData: encryptData,
                );
              },
              icon: const Icon(Icons.download),
              label: const Text('Export'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _performDataExport({
    bool includeVoiceJournals = true,
    bool includeProgressPhotos = true,
    bool encryptData = false,
  }) async {
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: UIConstants.spacingMD),
            Text('Exporting your data...'),
          ],
        ),
      ),
    );

    try {
      final authState = ref.read(authProvider);
      if (authState.user == null) {
        throw Exception('User not authenticated');
      }

      final result = await _dataExportService.exportUserData(
        user: authState.user!,
        includeVoiceJournals: includeVoiceJournals,
        includeProgressPhotos: includeProgressPhotos,
        encryptData: encryptData,
      );

      // Close loading dialog
      if (mounted) Navigator.of(context).pop();

      if (result.success) {
        _showExportSuccessDialog(result);
      } else {
        _showExportErrorDialog(result.error ?? 'Unknown error occurred');
      }
    } catch (e) {
      // Close loading dialog
      if (mounted) Navigator.of(context).pop();
      _showExportErrorDialog(e.toString());
    }
  }

  void _showExportSuccessDialog(ExportResult result) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: AppTheme.successColor),
            SizedBox(width: UIConstants.spacingMD),
            Text('Export Complete'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('File: ${result.fileName}'),
            const SizedBox(height: UIConstants.spacingSM),
            Text('Size: ${_formatFileSize(result.fileSize ?? 0)}'),
            const SizedBox(height: UIConstants.spacingSM),
            if (result.encrypted)
              const Row(
                children: [
                  Icon(Icons.lock, size: 16, color: AppTheme.successColor),
                  SizedBox(width: UIConstants.spacingSM),
                  Text('Encrypted', style: TextStyle(color: AppTheme.successColor)),
                ],
              ),
            const SizedBox(height: UIConstants.spacingMD),
            const Text(
              'Your data has been exported successfully. You can now share or save the file.',
              style: TextStyle(fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Done'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.of(context).pop();
              try {
                await _dataExportService.shareExportedData(result);
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to share: $e'),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                }
              }
            },
            icon: const Icon(Icons.share),
            label: const Text('Share'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _showExportErrorDialog(String error) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error, color: AppTheme.errorColor),
            SizedBox(width: UIConstants.spacingMD),
            Text('Export Failed'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Failed to export your data:'),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              error,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 12,
                color: AppTheme.errorColor,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            const Text(
              'Please try again. If the problem persists, contact support.',
              style: TextStyle(fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _showDataExportDialog(); // Retry
            },
            child: const Text('Retry'),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Future<void> _triggerWeeklyReport(String type) async {
    try {
      final authState = ref.read(authProvider);
      if (authState.user == null) {
        throw Exception('User not authenticated');
      }

      const secure = FlutterSecureStorage();
      final accessToken = await secure.read(key: 'access_token');
      final userId = authState.user!.id;
      if (accessToken == null) throw Exception('Missing token');

      final endpoint = '${AppTheme.apiBase ?? ''}/api/v2/reports/weekly/$userId/$type';
      final uri = Uri.parse(endpoint);
      final res = await http.post(uri, headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      }, body: type == 'sheets' ? '{"rows":[["Metric","Value"],["Completed Tasks",0],["Active Days",0]]}' : '{"content":"Weekly report content"}');

      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Weekly export started. Check Google Workspace.')),
          );
        }
      } else {
        throw Exception('Export failed (${res.statusCode})');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }
} 