import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';

enum HabitNotificationTime {
  morning,
  afternoon,
  evening,
  custom,
}

enum HabitPrivacy {
  public,
  friendsOnly,
  private,
}

enum HabitDifficulty {
  easy,
  medium,
  hard,
  expert,
}

class HabitSettingsScreen extends ConsumerStatefulWidget {
  const HabitSettingsScreen({super.key});

  @override
  ConsumerState<HabitSettingsScreen> createState() => _HabitSettingsScreenState();
}

class _HabitSettingsScreenState extends ConsumerState<HabitSettingsScreen> {
  bool _globalNotifications = true;
  bool _streakReminders = true;
  bool _dailyReports = false;
  bool _weeklyReports = true;
  bool _achievementNotifications = true;
  bool _motivationalQuotes = false;
  bool _soundEffects = true;
  bool _vibration = true;
  bool _autoBackup = true;
  bool _offlineMode = false;
  bool _analyticsSharing = false;

  HabitNotificationTime _defaultNotificationTime = HabitNotificationTime.morning;
  HabitPrivacy _defaultPrivacy = HabitPrivacy.private;
  HabitDifficulty _defaultDifficulty = HabitDifficulty.medium;

  TimeOfDay _customNotificationTime = const TimeOfDay(hour: 9, minute: 0);
  int _reminderFrequency = 1; // hours
  int _streakGoal = 30; // days

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Habit Settings'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _resetToDefaults,
            child: const Text(
              'Reset',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        children: [
          // Notifications Section
          _buildSectionHeader('Notifications', Icons.notifications),
          _buildNotificationSettings(),
          const SizedBox(height: UIConstants.spacingLG),

          // Default Settings Section
          _buildSectionHeader('Default Settings', Icons.settings),
          _buildDefaultSettings(),
          const SizedBox(height: UIConstants.spacingLG),

          // Privacy & Sharing Section
          _buildSectionHeader('Privacy & Sharing', Icons.privacy_tip),
          _buildPrivacySettings(),
          const SizedBox(height: UIConstants.spacingLG),

          // Data & Backup Section
          _buildSectionHeader('Data & Backup', Icons.backup),
          _buildDataSettings(),
          const SizedBox(height: UIConstants.spacingLG),

          // Advanced Section
          _buildSectionHeader('Advanced', Icons.tune),
          _buildAdvancedSettings(),
          const SizedBox(height: UIConstants.spacingLG),

          // Danger Zone
          _buildDangerZone(),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: UIConstants.spacingMD),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primaryColor),
          const SizedBox(width: UIConstants.spacingSM),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationSettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            SwitchListTile(
              title: const Text('Global Notifications'),
              subtitle: const Text('Enable all habit notifications'),
              value: _globalNotifications,
              onChanged: (value) => setState(() => _globalNotifications = value),
              secondary: const Icon(Icons.notifications_active),
            ),

            if (_globalNotifications) ...[
              const Divider(),

              SwitchListTile(
                title: const Text('Streak Reminders'),
                subtitle: const Text('Get reminded about maintaining streaks'),
                value: _streakReminders,
                onChanged: (value) => setState(() => _streakReminders = value),
                secondary: const Icon(Icons.local_fire_department),
              ),

              SwitchListTile(
                title: const Text('Achievement Notifications'),
                subtitle: const Text('Celebrate when you unlock achievements'),
                value: _achievementNotifications,
                onChanged: (value) => setState(() => _achievementNotifications = value),
                secondary: const Icon(Icons.emoji_events),
              ),

              SwitchListTile(
                title: const Text('Daily Reports'),
                subtitle: const Text('Daily summary of habit completion'),
                value: _dailyReports,
                onChanged: (value) => setState(() => _dailyReports = value),
                secondary: const Icon(Icons.today),
              ),

              SwitchListTile(
                title: const Text('Weekly Reports'),
                subtitle: const Text('Weekly analysis and insights'),
                value: _weeklyReports,
                onChanged: (value) => setState(() => _weeklyReports = value),
                secondary: const Icon(Icons.view_week),
              ),

              SwitchListTile(
                title: const Text('Motivational Quotes'),
                subtitle: const Text('Daily inspirational messages'),
                value: _motivationalQuotes,
                onChanged: (value) => setState(() => _motivationalQuotes = value),
                secondary: const Icon(Icons.format_quote),
              ),

              const Divider(),

              // Default Notification Time
              ListTile(
                title: const Text('Default Notification Time'),
                subtitle: Text(_getNotificationTimeDescription(_defaultNotificationTime)),
                leading: const Icon(Icons.schedule),
                trailing: const Icon(Icons.chevron_right),
                onTap: _showNotificationTimeDialog,
              ),

              // Custom Time (if selected)
              if (_defaultNotificationTime == HabitNotificationTime.custom)
                ListTile(
                  title: const Text('Custom Time'),
                  subtitle: Text(_customNotificationTime.format(context)),
                  leading: const Icon(Icons.access_time),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _selectCustomTime,
                ),

              // Reminder Frequency
              ListTile(
                title: const Text('Reminder Frequency'),
                subtitle: Text('Every $_reminderFrequency hour${_reminderFrequency > 1 ? 's' : ''}'),
                leading: const Icon(Icons.repeat),
                trailing: SizedBox(
                  width: 100,
                  child: Slider(
                    value: _reminderFrequency.toDouble(),
                    min: 1,
                    max: 12,
                    divisions: 11,
                    onChanged: (value) => setState(() => _reminderFrequency = value.round()),
                  ),
                ),
              ),

              const Divider(),

              // Sound & Vibration
              SwitchListTile(
                title: const Text('Sound Effects'),
                subtitle: const Text('Play sounds for completions and notifications'),
                value: _soundEffects,
                onChanged: (value) => setState(() => _soundEffects = value),
                secondary: const Icon(Icons.volume_up),
              ),

              SwitchListTile(
                title: const Text('Vibration'),
                subtitle: const Text('Vibrate for notifications'),
                value: _vibration,
                onChanged: (value) => setState(() => _vibration = value),
                secondary: const Icon(Icons.vibration),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultSettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            ListTile(
              title: const Text('Default Privacy Level'),
              subtitle: Text(_getPrivacyDescription(_defaultPrivacy)),
              leading: const Icon(Icons.lock),
              trailing: const Icon(Icons.chevron_right),
              onTap: _showPrivacyDialog,
            ),

            const Divider(),

            ListTile(
              title: const Text('Default Difficulty'),
              subtitle: Text(_getDifficultyDescription(_defaultDifficulty)),
              leading: const Icon(Icons.fitness_center),
              trailing: const Icon(Icons.chevron_right),
              onTap: _showDifficultyDialog,
            ),

            const Divider(),

            ListTile(
              title: const Text('Default Streak Goal'),
              subtitle: Text('$_streakGoal days'),
              leading: const Icon(Icons.flag),
              trailing: SizedBox(
                width: 100,
                child: Slider(
                  value: _streakGoal.toDouble(),
                  min: 7,
                  max: 365,
                  divisions: 51,
                  onChanged: (value) => setState(() => _streakGoal = value.round()),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrivacySettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            SwitchListTile(
              title: const Text('Analytics Sharing'),
              subtitle: const Text('Help improve the app with anonymous usage data'),
              value: _analyticsSharing,
              onChanged: (value) => setState(() => _analyticsSharing = value),
              secondary: const Icon(Icons.analytics),
            ),

            const Divider(),

            ListTile(
              title: const Text('Export Data'),
              subtitle: const Text('Download your habit data as CSV'),
              leading: const Icon(Icons.download),
              trailing: const Icon(Icons.chevron_right),
              onTap: _exportData,
            ),

            ListTile(
              title: const Text('Privacy Policy'),
              subtitle: const Text('View our privacy policy'),
              leading: const Icon(Icons.policy),
              trailing: const Icon(Icons.open_in_new),
              onTap: _openPrivacyPolicy,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataSettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            SwitchListTile(
              title: const Text('Auto Backup'),
              subtitle: const Text('Automatically backup your data to cloud'),
              value: _autoBackup,
              onChanged: (value) => setState(() => _autoBackup = value),
              secondary: const Icon(Icons.cloud_upload),
            ),

            SwitchListTile(
              title: const Text('Offline Mode'),
              subtitle: const Text('Allow app to work without internet'),
              value: _offlineMode,
              onChanged: (value) => setState(() => _offlineMode = value),
              secondary: const Icon(Icons.offline_bolt),
            ),

            const Divider(),

            ListTile(
              title: const Text('Backup Now'),
              subtitle: const Text('Manually backup your data'),
              leading: const Icon(Icons.backup),
              trailing: const Icon(Icons.chevron_right),
              onTap: _backupNow,
            ),

            ListTile(
              title: const Text('Restore Data'),
              subtitle: const Text('Restore from a previous backup'),
              leading: const Icon(Icons.restore),
              trailing: const Icon(Icons.chevron_right),
              onTap: _restoreData,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdvancedSettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            ListTile(
              title: const Text('Habit Categories'),
              subtitle: const Text('Manage custom habit categories'),
              leading: const Icon(Icons.category),
              trailing: const Icon(Icons.chevron_right),
              onTap: _manageCategories,
            ),

            ListTile(
              title: const Text('Smart Suggestions'),
              subtitle: const Text('Configure AI-powered habit suggestions'),
              leading: const Icon(Icons.psychology),
              trailing: const Icon(Icons.chevron_right),
              onTap: _configureSmartSuggestions,
            ),

            ListTile(
              title: const Text('Widget Settings'),
              subtitle: const Text('Customize home screen widgets'),
              leading: const Icon(Icons.widgets),
              trailing: const Icon(Icons.chevron_right),
              onTap: _configureWidgets,
            ),

            ListTile(
              title: const Text('Developer Options'),
              subtitle: const Text('Advanced debugging options'),
              leading: const Icon(Icons.developer_mode),
              trailing: const Icon(Icons.chevron_right),
              onTap: _showDeveloperOptions,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDangerZone() {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning, color: Colors.red.shade600),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  'Danger Zone',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.red.shade600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),

            ListTile(
              title: Text(
                'Clear All Data',
                style: TextStyle(color: Colors.red.shade600),
              ),
              subtitle: const Text('Permanently delete all habit data'),
              leading: Icon(Icons.delete_forever, color: Colors.red.shade600),
              trailing: const Icon(Icons.chevron_right),
              onTap: _showClearDataDialog,
            ),
          ],
        ),
      ),
    );
  }

  // Dialog Methods
  void _showNotificationTimeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Default Notification Time'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: HabitNotificationTime.values.map((time) {
            return RadioListTile<HabitNotificationTime>(
              title: Text(_getNotificationTimeDescription(time)),
              value: time,
              groupValue: _defaultNotificationTime,
              onChanged: (value) {
                setState(() => _defaultNotificationTime = value!);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showPrivacyDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Default Privacy Level'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: HabitPrivacy.values.map((privacy) {
            return RadioListTile<HabitPrivacy>(
              title: Text(_getPrivacyDescription(privacy)),
              value: privacy,
              groupValue: _defaultPrivacy,
              onChanged: (value) {
                setState(() => _defaultPrivacy = value!);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showDifficultyDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Default Difficulty'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: HabitDifficulty.values.map((difficulty) {
            return RadioListTile<HabitDifficulty>(
              title: Text(_getDifficultyDescription(difficulty)),
              value: difficulty,
              groupValue: _defaultDifficulty,
              onChanged: (value) {
                setState(() => _defaultDifficulty = value!);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  Future<void> _selectCustomTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _customNotificationTime,
    );
    if (time != null) {
      setState(() => _customNotificationTime = time);
    }
  }

  void _showClearDataDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Data'),
        content: const Text(
          'This will permanently delete all your habits, completions, and achievements. This action cannot be undone.\n\nAre you sure you want to continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _clearAllData();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete Everything'),
          ),
        ],
      ),
    );
  }

  // Helper Methods
  String _getNotificationTimeDescription(HabitNotificationTime time) {
    switch (time) {
      case HabitNotificationTime.morning:
        return 'Morning (9:00 AM)';
      case HabitNotificationTime.afternoon:
        return 'Afternoon (2:00 PM)';
      case HabitNotificationTime.evening:
        return 'Evening (7:00 PM)';
      case HabitNotificationTime.custom:
        return 'Custom Time';
    }
  }

  String _getPrivacyDescription(HabitPrivacy privacy) {
    switch (privacy) {
      case HabitPrivacy.public:
        return 'Public - Visible to everyone';
      case HabitPrivacy.friendsOnly:
        return 'Friends Only - Visible to friends';
      case HabitPrivacy.private:
        return 'Private - Only visible to you';
    }
  }

  String _getDifficultyDescription(HabitDifficulty difficulty) {
    switch (difficulty) {
      case HabitDifficulty.easy:
        return 'Easy - Simple daily tasks';
      case HabitDifficulty.medium:
        return 'Medium - Regular effort required';
      case HabitDifficulty.hard:
        return 'Hard - Significant commitment';
      case HabitDifficulty.expert:
        return 'Expert - Maximum challenge';
    }
  }

  // Action Methods
  void _resetToDefaults() {
    setState(() {
      _globalNotifications = true;
      _streakReminders = true;
      _dailyReports = false;
      _weeklyReports = true;
      _achievementNotifications = true;
      _motivationalQuotes = false;
      _soundEffects = true;
      _vibration = true;
      _autoBackup = true;
      _offlineMode = false;
      _analyticsSharing = false;
      _defaultNotificationTime = HabitNotificationTime.morning;
      _defaultPrivacy = HabitPrivacy.private;
      _defaultDifficulty = HabitDifficulty.medium;
      _customNotificationTime = const TimeOfDay(hour: 9, minute: 0);
      _reminderFrequency = 1;
      _streakGoal = 30;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Settings reset to defaults'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _exportData() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting data... (Feature coming soon)')),
    );
  }

  void _openPrivacyPolicy() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening privacy policy... (Feature coming soon)')),
    );
  }

  void _backupNow() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Creating backup... (Feature coming soon)'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _restoreData() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Restore data... (Feature coming soon)')),
    );
  }

  void _manageCategories() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Manage categories... (Feature coming soon)')),
    );
  }

  void _configureSmartSuggestions() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Smart suggestions... (Feature coming soon)')),
    );
  }

  void _configureWidgets() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Widget settings... (Feature coming soon)')),
    );
  }

  void _showDeveloperOptions() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Developer options... (Feature coming soon)')),
    );
  }

  void _clearAllData() {
    final habitNotifier = ref.read(habitProvider.notifier);
    // habitNotifier.clearAllData(); // Implement this method in the provider

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All data cleared'),
        backgroundColor: Colors.red,
      ),
    );
  }
}