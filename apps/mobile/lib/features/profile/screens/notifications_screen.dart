import 'package:flutter/material.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../core/theme/app_colors.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _goalReminders = true;
  bool _habitReminders = true;
  bool _taskReminders = true;
  bool _coachMessages = true;
  bool _weeklyReports = true;
  bool _achievements = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Notifications'),
      body: ListView(
        children: [
          _buildSectionHeader('General'),
          _buildSwitchTile(
            icon: Icons.notifications,
            title: 'Push Notifications',
            subtitle: 'Receive notifications on your device',
            value: _pushNotifications,
            onChanged: (value) {
              setState(() => _pushNotifications = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.email,
            title: 'Email Notifications',
            subtitle: 'Receive updates via email',
            value: _emailNotifications,
            onChanged: (value) {
              setState(() => _emailNotifications = value);
            },
          ),
          const Divider(),
          _buildSectionHeader('Reminders'),
          _buildSwitchTile(
            icon: Icons.flag,
            title: 'Goal Reminders',
            subtitle: 'Get reminded about your goals',
            value: _goalReminders,
            onChanged: (value) {
              setState(() => _goalReminders = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.repeat,
            title: 'Habit Reminders',
            subtitle: 'Daily reminders for your habits',
            value: _habitReminders,
            onChanged: (value) {
              setState(() => _habitReminders = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.task_alt,
            title: 'Task Reminders',
            subtitle: 'Reminders for upcoming tasks',
            value: _taskReminders,
            onChanged: (value) {
              setState(() => _taskReminders = value);
            },
          ),
          const Divider(),
          _buildSectionHeader('Updates'),
          _buildSwitchTile(
            icon: Icons.message,
            title: 'Coach Messages',
            subtitle: 'Messages from your coach',
            value: _coachMessages,
            onChanged: (value) {
              setState(() => _coachMessages = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.analytics,
            title: 'Weekly Reports',
            subtitle: 'Weekly progress summaries',
            value: _weeklyReports,
            onChanged: (value) {
              setState(() => _weeklyReports = value);
            },
          ),
          _buildSwitchTile(
            icon: Icons.emoji_events,
            title: 'Achievements',
            subtitle: 'When you earn new achievements',
            value: _achievements,
            onChanged: (value) {
              setState(() => _achievements = value);
            },
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
        onChanged: _pushNotifications ? onChanged : null,
        activeColor: AppColors.primary,
      ),
    );
  }
}
