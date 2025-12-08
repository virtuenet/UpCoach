import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';

class NotificationsStep extends StatefulWidget {
  final bool notificationsEnabled;
  final bool marketingEmailsEnabled;
  final bool isSaving;
  final void Function({
    required bool notificationsEnabled,
    required bool marketingEmailsEnabled,
  }) onUpdateNotifications;
  final VoidCallback onComplete;

  const NotificationsStep({
    super.key,
    required this.notificationsEnabled,
    required this.marketingEmailsEnabled,
    required this.isSaving,
    required this.onUpdateNotifications,
    required this.onComplete,
  });

  @override
  State<NotificationsStep> createState() => _NotificationsStepState();
}

class _NotificationsStepState extends State<NotificationsStep> {
  late bool _notificationsEnabled;
  late bool _marketingEmailsEnabled;
  bool _permissionRequested = false;

  @override
  void initState() {
    super.initState();
    _notificationsEnabled = widget.notificationsEnabled;
    _marketingEmailsEnabled = widget.marketingEmailsEnabled;
  }

  Future<void> _requestNotificationPermission() async {
    final status = await Permission.notification.request();
    setState(() {
      _permissionRequested = true;
      _notificationsEnabled = status.isGranted;
    });

    widget.onUpdateNotifications(
      notificationsEnabled: _notificationsEnabled,
      marketingEmailsEnabled: _marketingEmailsEnabled,
    );
  }

  void _updateMarketingEmails(bool value) {
    setState(() {
      _marketingEmailsEnabled = value;
    });
    widget.onUpdateNotifications(
      notificationsEnabled: _notificationsEnabled,
      marketingEmailsEnabled: _marketingEmailsEnabled,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        children: [
          const Spacer(),

          // Icon
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_active,
              size: 50,
              color: AppTheme.primaryColor,
            ),
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Title
          Text(
            'Stay in the Loop',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: UIConstants.spacingMD),

          Text(
            'Get notified about upcoming sessions, messages from your coach, '
            'and important updates.',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 15,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Push notifications option
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              child: Column(
                children: [
                  _NotificationOption(
                    icon: Icons.notifications,
                    title: 'Push Notifications',
                    description:
                        'Session reminders, messages, and achievements',
                    isEnabled: _notificationsEnabled,
                    onChanged: (value) async {
                      if (value) {
                        await _requestNotificationPermission();
                      } else {
                        setState(() => _notificationsEnabled = false);
                        widget.onUpdateNotifications(
                          notificationsEnabled: false,
                          marketingEmailsEnabled: _marketingEmailsEnabled,
                        );
                      }
                    },
                    showPermissionButton:
                        !_permissionRequested && !_notificationsEnabled,
                    onRequestPermission: _requestNotificationPermission,
                  ),
                  const Divider(height: 32),
                  _NotificationOption(
                    icon: Icons.email,
                    title: 'Email Updates',
                    description: 'Tips, new features, and special offers',
                    isEnabled: _marketingEmailsEnabled,
                    onChanged: _updateMarketingEmails,
                  ),
                ],
              ),
            ),
          ),

          const Spacer(),

          // Benefits list
          _BenefitItem(
            icon: Icons.schedule,
            text: 'Never miss a session',
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _BenefitItem(
            icon: Icons.chat_bubble,
            text: 'Instant message alerts',
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _BenefitItem(
            icon: Icons.emoji_events,
            text: 'Achievement celebrations',
          ),

          const Spacer(),

          // Complete button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: widget.isSaving ? null : widget.onComplete,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: widget.isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Complete Setup',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),

          const SizedBox(height: UIConstants.spacingMD),

          Text(
            'You can change these settings anytime',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
            ),
          ),

          const SizedBox(height: UIConstants.spacingMD),
        ],
      ),
    );
  }
}

class _NotificationOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool isEnabled;
  final void Function(bool) onChanged;
  final bool showPermissionButton;
  final VoidCallback? onRequestPermission;

  const _NotificationOption({
    required this.icon,
    required this.title,
    required this.description,
    required this.isEnabled,
    required this.onChanged,
    this.showPermissionButton = false,
    this.onRequestPermission,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: isEnabled
                ? AppTheme.primaryColor.withValues(alpha: 0.1)
                : Colors.grey.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            color: isEnabled ? AppTheme.primaryColor : AppTheme.textSecondary,
          ),
        ),
        const SizedBox(width: UIConstants.spacingMD),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                description,
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
        ),
        if (showPermissionButton)
          TextButton(
            onPressed: onRequestPermission,
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.primaryColor,
            ),
            child: const Text('Enable'),
          )
        else
          Switch(
            value: isEnabled,
            onChanged: onChanged,
            activeTrackColor: AppTheme.primaryColor,
            thumbColor: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return Colors.white;
              }
              return null;
            }),
          ),
      ],
    );
  }
}

class _BenefitItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _BenefitItem({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          icon,
          size: 18,
          color: Colors.green,
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
