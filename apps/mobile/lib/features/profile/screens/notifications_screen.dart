import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:app_settings/app_settings.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/notification_provider.dart';
import '../../../core/services/notification_scheduler_service.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(notificationProvider);
    final permissionAsync = ref.watch(pushPermissionProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Notifications'),
      body: settings.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await ref.read(notificationProvider.notifier).refresh();
              },
              child: ListView(
                children: [
                  // Permission Banner
                  permissionAsync.when(
                    data: (hasPermission) => hasPermission
                        ? const SizedBox.shrink()
                        : _buildPermissionBanner(),
                    loading: () => const SizedBox.shrink(),
                    error: (_, _) => const SizedBox.shrink(),
                  ),

                  // Error Banner
                  if (settings.error != null)
                    _buildErrorBanner(settings.error!),

                  _buildSectionHeader('General'),
                  _buildSwitchTile(
                    icon: Icons.notifications,
                    title: 'Push Notifications',
                    subtitle: 'Receive notifications on your device',
                    value: settings.pushEnabled,
                    onChanged: (value) async {
                      await ref
                          .read(notificationProvider.notifier)
                          .setPushEnabled(value);
                    },
                  ),
                  _buildSwitchTile(
                    icon: Icons.email,
                    title: 'Email Notifications',
                    subtitle: 'Receive updates via email',
                    value: settings.emailEnabled,
                    onChanged: (value) async {
                      await ref
                          .read(notificationProvider.notifier)
                          .setEmailEnabled(value);
                    },
                  ),

                  const Divider(),

                  _buildSectionHeader('Reminders'),
                  _buildSwitchTile(
                    icon: Icons.flag,
                    title: 'Goal Reminders',
                    subtitle: 'Get reminded about your goals',
                    value: settings.goalReminders,
                    onChanged: settings.pushEnabled
                        ? (value) async {
                            await ref
                                .read(notificationProvider.notifier)
                                .setGoalReminders(value);
                          }
                        : null,
                    enabled: settings.pushEnabled,
                  ),
                  _buildSwitchTile(
                    icon: Icons.repeat,
                    title: 'Habit Reminders',
                    subtitle: 'Daily reminders for your habits',
                    value: settings.habitReminders,
                    onChanged: settings.pushEnabled
                        ? (value) async {
                            await ref
                                .read(notificationProvider.notifier)
                                .setHabitReminders(value);
                          }
                        : null,
                    enabled: settings.pushEnabled,
                  ),
                  _buildSwitchTile(
                    icon: Icons.task_alt,
                    title: 'Task Reminders',
                    subtitle: 'Reminders for upcoming tasks',
                    value: settings.taskReminders,
                    onChanged: settings.pushEnabled
                        ? (value) async {
                            await ref
                                .read(notificationProvider.notifier)
                                .setTaskReminders(value);
                          }
                        : null,
                    enabled: settings.pushEnabled,
                  ),

                  const Divider(),

                  _buildSectionHeader('Updates'),
                  _buildSwitchTile(
                    icon: Icons.message,
                    title: 'Coach Messages',
                    subtitle: 'Messages from your coach',
                    value: settings.coachMessages,
                    onChanged: settings.pushEnabled
                        ? (value) async {
                            await ref
                                .read(notificationProvider.notifier)
                                .setCoachMessages(value);
                          }
                        : null,
                    enabled: settings.pushEnabled,
                  ),
                  _buildSwitchTile(
                    icon: Icons.analytics,
                    title: 'Weekly Reports',
                    subtitle: 'Weekly progress summaries',
                    value: settings.weeklyReports,
                    onChanged: settings.pushEnabled
                        ? (value) async {
                            await ref
                                .read(notificationProvider.notifier)
                                .setWeeklyReports(value);
                          }
                        : null,
                    enabled: settings.pushEnabled,
                  ),
                  _buildSwitchTile(
                    icon: Icons.emoji_events,
                    title: 'Achievements',
                    subtitle: 'When you earn new achievements',
                    value: settings.achievements,
                    onChanged: settings.pushEnabled
                        ? (value) async {
                            await ref
                                .read(notificationProvider.notifier)
                                .setAchievements(value);
                          }
                        : null,
                    enabled: settings.pushEnabled,
                  ),

                  const Divider(),

                  // Notification Test Section
                  _buildSectionHeader('Test'),
                  ListTile(
                    leading: const Icon(Icons.send, color: AppColors.primary),
                    title: const Text('Send Test Notification'),
                    subtitle: const Text('Verify notifications are working'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _sendTestNotification(),
                  ),

                  const SizedBox(height: UIConstants.spacingLG),

                  // FCM Token (Debug only)
                  if (const bool.fromEnvironment('dart.vm.product') == false)
                    _buildDebugSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildPermissionBanner() {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber, color: AppColors.warning),
              SizedBox(width: 8),
              Text(
                'Notifications Disabled',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.warning,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Push notifications are disabled in your device settings. Enable them to receive reminders and updates.',
            style: TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    final granted = await ref
                        .read(notificationProvider.notifier)
                        .requestPermission();
                    if (!granted && mounted) {
                      AppSettings.openAppSettings(
                          type: AppSettingsType.notification);
                    }
                    ref.invalidate(pushPermissionProvider);
                  },
                  child: const Text('Enable Notifications'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String error) {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Failed to sync settings: $error',
              style: const TextStyle(color: AppColors.error, fontSize: 13),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.error),
            onPressed: () async {
              await ref.read(notificationProvider.notifier).refresh();
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
    required ValueChanged<bool>? onChanged,
    bool enabled = true,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: enabled ? AppColors.primary : AppColors.textSecondary,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: enabled ? null : AppColors.textSecondary,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          color: enabled ? AppColors.textSecondary : AppColors.textTertiary,
        ),
      ),
      trailing: Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeTrackColor: AppColors.primary.withValues(alpha: 0.5),
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primary;
          }
          return null;
        }),
      ),
    );
  }

  Widget _buildDebugSection() {
    final fcmToken = ref.read(notificationProvider.notifier).fcmToken;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Debug Info'),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
          padding: const EdgeInsets.all(UIConstants.spacingSM),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(UIConstants.radiusSM),
            border: Border.all(color: AppColors.outline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'FCM Token:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
              const SizedBox(height: 4),
              SelectableText(
                fcmToken ?? 'Not available',
                style: const TextStyle(fontSize: 10, fontFamily: 'monospace'),
              ),
            ],
          ),
        ),
        const SizedBox(height: UIConstants.spacingLG),
      ],
    );
  }

  Future<void> _sendTestNotification() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.send, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Send Test'),
          ],
        ),
        content: const Text(
          'A test notification will be sent to your device. '
          'Make sure notifications are enabled.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _triggerTestNotification();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }

  Future<void> _triggerTestNotification() async {
    final scheduler = ref.read(notificationSchedulerProvider);

    // Show a local notification for testing
    await scheduler.showInstantNotification(
      title: 'Test Notification',
      body:
          'This is a test notification from UpCoach. Your notifications are working!',
      type: NotificationType.general,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content:
              Text('Test notification sent! Check your notification tray.'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }
}
