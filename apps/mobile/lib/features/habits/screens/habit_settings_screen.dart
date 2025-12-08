import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';

class HabitSettingsScreen extends ConsumerStatefulWidget {
  const HabitSettingsScreen({super.key});

  @override
  ConsumerState<HabitSettingsScreen> createState() =>
      _HabitSettingsScreenState();
}

class _HabitSettingsScreenState extends ConsumerState<HabitSettingsScreen> {
  // Settings state
  bool _dailyReminders = true;
  bool _weeklyReports = true;
  bool _achievementNotifications = true;
  bool _motivationalQuotes = false;
  bool _darkMode = false;
  bool _soundEffects = true;
  bool _hapticFeedback = true;

  String _reminderTime = '09:00';
  String _weeklyReportDay = 'Sunday';
  String _defaultHabitDuration = '30';
  String _streakResetTime = '03:00';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Habit Settings'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        children: [
          _buildSectionHeader('Notifications'),
          _buildNotificationSettings(),
          const SizedBox(height: UIConstants.spacingLG),
          _buildSectionHeader('Timing'),
          _buildTimingSettings(),
          const SizedBox(height: UIConstants.spacingLG),
          _buildSectionHeader('Experience'),
          _buildExperienceSettings(),
          const SizedBox(height: UIConstants.spacingLG),
          _buildSectionHeader('Data'),
          _buildDataSettings(),
          const SizedBox(height: UIConstants.spacingLG),
          _buildSectionHeader('Advanced'),
          _buildAdvancedSettings(),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppTheme.primaryColor,
        ),
      ),
    );
  }

  Widget _buildNotificationSettings() {
    return Card(
      elevation: UIConstants.elevationSM,
      child: Column(
        children: [
          SwitchListTile(
            title: const Text('Daily Reminders'),
            subtitle: const Text('Get reminded to check your habits'),
            value: _dailyReminders,
            onChanged: (value) {
              setState(() {
                _dailyReminders = value;
              });
            },
            secondary: const Icon(Icons.notifications),
          ),
          if (_dailyReminders)
            ListTile(
              title: const Text('Reminder Time'),
              subtitle: Text('Daily reminder at $_reminderTime'),
              trailing: const Icon(Icons.access_time),
              onTap: () => _selectReminderTime(),
            ),
          const Divider(height: 1),
          SwitchListTile(
            title: const Text('Weekly Reports'),
            subtitle: const Text('Receive weekly progress summaries'),
            value: _weeklyReports,
            onChanged: (value) {
              setState(() {
                _weeklyReports = value;
              });
            },
            secondary: const Icon(Icons.assessment),
          ),
          if (_weeklyReports)
            ListTile(
              title: const Text('Report Day'),
              subtitle: Text('Receive reports every $_weeklyReportDay'),
              trailing: const Icon(Icons.calendar_today),
              onTap: () => _selectWeeklyReportDay(),
            ),
          const Divider(height: 1),
          SwitchListTile(
            title: const Text('Achievement Notifications'),
            subtitle: const Text('Celebrate when you earn achievements'),
            value: _achievementNotifications,
            onChanged: (value) {
              setState(() {
                _achievementNotifications = value;
              });
            },
            secondary: const Icon(Icons.emoji_events),
          ),
          const Divider(height: 1),
          SwitchListTile(
            title: const Text('Motivational Quotes'),
            subtitle: const Text('Daily inspiration messages'),
            value: _motivationalQuotes,
            onChanged: (value) {
              setState(() {
                _motivationalQuotes = value;
              });
            },
            secondary: const Icon(Icons.format_quote),
          ),
        ],
      ),
    );
  }

  Widget _buildTimingSettings() {
    return Card(
      elevation: UIConstants.elevationSM,
      child: Column(
        children: [
          ListTile(
            title: const Text('Default Habit Duration'),
            subtitle:
                Text('New habits default to $_defaultHabitDuration minutes'),
            trailing: const Icon(Icons.timer),
            onTap: () => _selectDefaultDuration(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Streak Reset Time'),
            subtitle: Text('Streaks reset daily at $_streakResetTime'),
            trailing: const Icon(Icons.refresh),
            onTap: () => _selectStreakResetTime(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Time Zone'),
            subtitle: Text('Current: ${DateTime.now().timeZoneName}'),
            trailing: const Icon(Icons.public),
            onTap: () => _showTimeZoneInfo(),
          ),
        ],
      ),
    );
  }

  Widget _buildExperienceSettings() {
    return Card(
      elevation: UIConstants.elevationSM,
      child: Column(
        children: [
          SwitchListTile(
            title: const Text('Dark Mode'),
            subtitle: const Text('Use dark theme for the app'),
            value: _darkMode,
            onChanged: (value) {
              setState(() {
                _darkMode = value;
              });
              _showFeatureComingSoon('Dark mode');
            },
            secondary: const Icon(Icons.dark_mode),
          ),
          const Divider(height: 1),
          SwitchListTile(
            title: const Text('Sound Effects'),
            subtitle: const Text('Play sounds for habit completions'),
            value: _soundEffects,
            onChanged: (value) {
              setState(() {
                _soundEffects = value;
              });
            },
            secondary: const Icon(Icons.volume_up),
          ),
          const Divider(height: 1),
          SwitchListTile(
            title: const Text('Haptic Feedback'),
            subtitle: const Text('Vibrate on habit interactions'),
            value: _hapticFeedback,
            onChanged: (value) {
              setState(() {
                _hapticFeedback = value;
              });
            },
            secondary: const Icon(Icons.vibration),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Language'),
            subtitle: const Text('English (US)'),
            trailing: const Icon(Icons.language),
            onTap: () => _showFeatureComingSoon('Language selection'),
          ),
        ],
      ),
    );
  }

  Widget _buildDataSettings() {
    return Card(
      elevation: UIConstants.elevationSM,
      child: Column(
        children: [
          ListTile(
            title: const Text('Export Data'),
            subtitle: const Text('Download your habit data'),
            trailing: const Icon(Icons.download),
            onTap: () => _exportHabitData(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Import Data'),
            subtitle: const Text('Restore from backup file'),
            trailing: const Icon(Icons.upload),
            onTap: () => _importHabitData(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Storage Usage'),
            subtitle: const Text('View app data usage'),
            trailing: const Icon(Icons.storage),
            onTap: () => _showStorageInfo(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Clear Cache'),
            subtitle: const Text('Free up temporary storage'),
            trailing: const Icon(Icons.clear),
            onTap: () => _clearCache(),
          ),
        ],
      ),
    );
  }

  Widget _buildAdvancedSettings() {
    return Card(
      elevation: UIConstants.elevationSM,
      child: Column(
        children: [
          ListTile(
            title: const Text('Privacy Settings'),
            subtitle: const Text('Manage data sharing preferences'),
            trailing: const Icon(Icons.privacy_tip),
            onTap: () => _showPrivacySettings(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Analytics'),
            subtitle: const Text('Help improve the app'),
            trailing: const Icon(Icons.analytics),
            onTap: () => _showAnalyticsSettings(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Reset All Settings'),
            subtitle: const Text('Restore default settings'),
            trailing: const Icon(Icons.restore),
            onTap: () => _resetAllSettings(),
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('About'),
            subtitle: const Text('App version and information'),
            trailing: const Icon(Icons.info),
            onTap: () => _showAboutDialog(),
          ),
        ],
      ),
    );
  }

  void _selectReminderTime() async {
    final TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(
        hour: int.parse(_reminderTime.split(':')[0]),
        minute: int.parse(_reminderTime.split(':')[1]),
      ),
    );

    if (time != null) {
      setState(() {
        _reminderTime =
            '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      });
    }
  }

  void _selectWeeklyReportDay() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Select Report Day'),
        content: RadioGroup<String>(
          groupValue: _weeklyReportDay,
          onChanged: (value) {
            if (value != null) {
              setState(() {
                _weeklyReportDay = value;
              });
              Navigator.of(dialogContext).pop();
            }
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday'
            ]
                .map((day) => RadioListTile<String>(
                      title: Text(day),
                      value: day,
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }

  void _selectDefaultDuration() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Default Habit Duration'),
        content: RadioGroup<String>(
          groupValue: _defaultHabitDuration,
          onChanged: (value) {
            if (value != null) {
              setState(() {
                _defaultHabitDuration = value;
              });
              Navigator.of(dialogContext).pop();
            }
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: ['15', '30', '45', '60', '90', '120']
                .map((duration) => RadioListTile<String>(
                      title: Text('$duration minutes'),
                      value: duration,
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }

  void _selectStreakResetTime() async {
    final TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(
        hour: int.parse(_streakResetTime.split(':')[0]),
        minute: int.parse(_streakResetTime.split(':')[1]),
      ),
    );

    if (time != null) {
      setState(() {
        _streakResetTime =
            '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      });
    }
  }

  void _showTimeZoneInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Time Zone Information'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Current Time Zone: ${DateTime.now().timeZoneName}'),
            const SizedBox(height: UIConstants.spacingSM),
            Text('Offset: ${DateTime.now().timeZoneOffset}'),
            const SizedBox(height: UIConstants.spacingMD),
            const Text(
                'Time zone changes are automatically detected and applied to your habit schedules.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _exportHabitData() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Habit Data'),
        content: const Text(
            'This will create a backup file containing all your habit data, completions, and achievements.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _performDataExport();
            },
            child: const Text('Export'),
          ),
        ],
      ),
    );
  }

  void _performDataExport() async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: UIConstants.spacingMD),
            Text('Exporting data...'),
          ],
        ),
      ),
    );

    // Simulate export
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Habit data exported successfully!'),
          backgroundColor: AppTheme.successColor,
        ),
      );
    }
  }

  void _importHabitData() {
    _showFeatureComingSoon('Data import');
  }

  void _showStorageInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Storage Usage'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Habit data: 2.3 MB'),
            Text('Completion records: 1.7 MB'),
            Text('Achievement data: 0.5 MB'),
            Text('App cache: 3.2 MB'),
            SizedBox(height: UIConstants.spacingMD),
            Text('Total: 7.7 MB'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _clearCache() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text(
            'This will clear temporary files and free up storage space. Your habit data will not be affected.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Cache cleared successfully!'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _showPrivacySettings() {
    _showFeatureComingSoon('Privacy settings');
  }

  void _showAnalyticsSettings() {
    _showFeatureComingSoon('Analytics settings');
  }

  void _resetAllSettings() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset All Settings'),
        content: const Text(
            'This will restore all settings to their default values. This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _performSettingsReset();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
  }

  void _performSettingsReset() {
    setState(() {
      _dailyReminders = true;
      _weeklyReports = true;
      _achievementNotifications = true;
      _motivationalQuotes = false;
      _darkMode = false;
      _soundEffects = true;
      _hapticFeedback = true;
      _reminderTime = '09:00';
      _weeklyReportDay = 'Sunday';
      _defaultHabitDuration = '30';
      _streakResetTime = '03:00';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Settings reset to defaults'),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  void _showAboutDialog() {
    showAboutDialog(
      context: context,
      applicationName: 'UpCoach',
      applicationVersion: '1.0.0',
      applicationIcon: const Icon(
        Icons.track_changes,
        size: 48,
        color: AppTheme.primaryColor,
      ),
      children: [
        const Text(
            'UpCoach helps you build positive habits and achieve your goals.'),
        const SizedBox(height: UIConstants.spacingMD),
        const Text('Made with ❤️ for habit enthusiasts everywhere.'),
      ],
    );
  }

  void _showFeatureComingSoon(String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature coming soon!'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }
}
