import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:device_calendar/device_calendar.dart';
import '../../../../core/services/widget_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/app_localizations.dart';

class WidgetSettingsScreen extends ConsumerStatefulWidget {
  const WidgetSettingsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<WidgetSettingsScreen> createState() => _WidgetSettingsScreenState();
}

class _WidgetSettingsScreenState extends ConsumerState<WidgetSettingsScreen> {
  final DeviceCalendarPlugin _deviceCalendarPlugin = DeviceCalendarPlugin();
  bool _calendarPermissionGranted = false;
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isEnabled = ref.watch(isWidgetEnabledProvider);
    final currentType = ref.watch(widgetTypeProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Home Screen Widgets'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        children: [
          _buildEnableCard(l10n, isEnabled),
          if (isEnabled.value ?? false) ...[
            const SizedBox(height: UIConstants.spacingMD),
            _buildWidgetTypeCard(l10n, currentType),
            const SizedBox(height: UIConstants.spacingMD),
            _buildPreviewCard(l10n, currentType),
          ],
          const SizedBox(height: UIConstants.spacingMD),
          _buildCalendarCard(),
          const SizedBox(height: UIConstants.spacingMD),
          _buildInstructionsCard(l10n),
        ],
      ),
    );
  }

  Widget _buildCalendarCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.event_available, color: Colors.green, size: 24),
                SizedBox(width: 8),
                Text('Calendar Sync'),
              ],
            ),
            const SizedBox(height: UIConstants.spacingSM),
            SwitchListTile(
              value: _calendarPermissionGranted,
              onChanged: (_) => _requestCalendarPermissions(),
              title: const Text('Allow calendar access'),
              subtitle: const Text('Enable UpCoach to add session reminders'),
              contentPadding: EdgeInsets.zero,
            ),
            ListTile(
              title: const Text('Create test reminder'),
              subtitle: const Text('Adds a test event to your default calendar'),
              trailing: const Icon(Icons.add_alert_outlined),
              onTap: _calendarPermissionGranted ? _addTestEvent : null,
              enabled: _calendarPermissionGranted,
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _requestCalendarPermissions() async {
    try {
      final result = await _deviceCalendarPlugin.requestPermissions();
      setState(() {
        _calendarPermissionGranted = result.isGranted;
      });
    } catch (_) {}
  }

  Future<void> _addTestEvent() async {
    try {
      final calendarsResult = await _deviceCalendarPlugin.retrieveCalendars();
      final calendars = calendarsResult.data ?? [];
      if (calendars.isEmpty) return;
      final defaultCal = calendars.firstWhere((c) => (c.isDefault ?? false), orElse: () => calendars.first);
      final event = Event(
        defaultCal.id!,
        title: 'UpCoach Session Reminder',
        description: 'Your coaching session reminder from UpCoach',
        start: DateTime.now().add(const Duration(days: 1, hours: 9)),
        end: DateTime.now().add(const Duration(days: 1, hours: 10)),
      );
      await _deviceCalendarPlugin.createOrUpdateEvent(event);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Calendar event created')),
        );
      }
    } catch (_) {}
  }

  Widget _buildEnableCard(AppLocalizations l10n, AsyncValue<bool> isEnabled) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.widgets,
                  color: AppColors.primaryColor,
                  size: 28,
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Enable Widgets',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: UIConstants.spacingXS),
                      Text(
                        'Show UpCoach information on your home screen',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            isEnabled.when(
              data: (enabled) => SwitchListTile(
                value: enabled,
                onChanged: (value) => _toggleWidgets(value),
                title: Text(enabled ? 'Enabled' : 'Disabled'),
                contentPadding: EdgeInsets.zero,
              ),
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const Text('Error loading settings'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWidgetTypeCard(AppLocalizations l10n, AsyncValue<String> currentType) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Widget Type',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'Choose what information to display',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            currentType.when(
              data: (type) => Column(
                children: availableWidgets.map((config) {
                  return RadioListTile<String>(
                    value: config.type,
                    groupValue: type,
                    onChanged: (value) => _changeWidgetType(value!),
                    title: Row(
                      children: [
                        Icon(config.icon, size: 20, color: AppColors.primaryColor),
                        const SizedBox(width: UIConstants.spacingSM),
                        Text(config.title),
                      ],
                    ),
                    subtitle: Text(
                      config.description,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                    contentPadding: EdgeInsets.zero,
                  );
                }).toList(),
              ),
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const Text('Error loading widget types'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewCard(AppLocalizations l10n, AsyncValue<String> currentType) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Widget Preview',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            currentType.when(
              data: (type) => Container(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: _buildPreviewContent(type),
              ),
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const Text('Error loading preview'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewContent(String type) {
    switch (type) {
      case 'goals':
        return _buildGoalsPreview();
      case 'tasks':
        return _buildTasksPreview();
      case 'streak':
        return _buildStreakPreview();
      case 'progress':
        return _buildProgressPreview();
      default:
        return const SizedBox();
    }
  }

  Widget _buildGoalsPreview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Goals Progress',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
              ),
              child: Text(
                '3/5',
                style: TextStyle(
                  color: AppColors.primaryColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: UIConstants.spacingMD),
        _buildGoalItem('Complete fitness assessment', 0.8, 'in_progress'),
        _buildGoalItem('Read 10 books this year', 0.5, 'in_progress'),
        _buildGoalItem('Learn Spanish basics', 1.0, 'completed'),
      ],
    );
  }

  Widget _buildGoalItem(String title, double progress, String status) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            status == 'completed' ? Icons.check_circle : Icons.circle_outlined,
            size: 16,
            color: status == 'completed' ? Colors.green : Colors.grey,
          ),
          const SizedBox(width: UIConstants.spacingSM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    status == 'completed' ? Colors.green : AppColors.primaryColor,
                  ),
                  minHeight: 3,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTasksPreview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Today\'s Tasks',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Row(
              children: [
                Icon(Icons.check_circle, size: 16, color: Colors.green),
                const SizedBox(width: UIConstants.spacingXS),
                Text(
                  '2',
                  style: TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(width: UIConstants.spacingSM),
                Icon(Icons.pending, size: 16, color: Colors.orange),
                const SizedBox(width: UIConstants.spacingXS),
                Text(
                  '3',
                  style: TextStyle(
                    color: Colors.orange,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: UIConstants.spacingMD),
        _buildTaskItem('Morning meditation', 'high', false),
        _buildTaskItem('Review project proposal', 'medium', false),
        _buildTaskItem('Team sync meeting', 'high', true),
      ],
    );
  }

  Widget _buildTaskItem(String title, String priority, bool isCompleted) {
    Color priorityColor = priority == 'high' ? Colors.red : 
                         priority == 'medium' ? Colors.orange : Colors.green;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            isCompleted ? Icons.check_box : Icons.check_box_outline_blank,
            size: 20,
            color: isCompleted ? Colors.green : Colors.grey,
          ),
          const SizedBox(width: UIConstants.spacingSM),
          Container(
            width: 4,
            height: 16,
            decoration: BoxDecoration(
              color: priorityColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: UIConstants.spacingSM),
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                    color: isCompleted ? Colors.grey : null,
                  ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakPreview() {
    return Column(
      children: [
        Icon(
          Icons.local_fire_department,
          size: 48,
          color: Colors.orange,
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Text(
          '7 Day Streak!',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: UIConstants.spacingXS),
        Text(
          'Keep it up!',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(7, (index) {
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: index < 7 ? Colors.orange : Colors.grey[300],
              ),
              child: Center(
                child: Text(
                  ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index],
                  style: TextStyle(
                    fontSize: 10,
                    color: index < 7 ? Colors.white : Colors.grey[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildProgressPreview() {
    return Column(
      children: [
        Text(
          'Weekly Progress',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: UIConstants.spacingMD),
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 80,
              height: 80,
              child: CircularProgressIndicator(
                value: 0.75,
                strokeWidth: 8,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryColor),
              ),
            ),
            Text(
              '75%',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: UIConstants.spacingMD),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildProgressStat('Sessions', '5'),
            _buildProgressStat('Points', '250'),
            _buildProgressStat('Next Level', '50 pts'),
          ],
        ),
      ],
    );
  }

  Widget _buildProgressStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
                fontSize: 10,
              ),
        ),
      ],
    );
  }

  Widget _buildInstructionsCard(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: AppColors.primaryColor,
                  size: 24,
                ),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  'How to Add Widget',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            _buildInstruction('1. Long press on your home screen'),
            _buildInstruction('2. Tap the + button or "Add Widget"'),
            _buildInstruction('3. Search for "UpCoach"'),
            _buildInstruction('4. Select your preferred widget size'),
            _buildInstruction('5. Place the widget on your home screen'),
            const SizedBox(height: UIConstants.spacingMD),
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.lightbulb_outline,
                    color: Colors.blue,
                    size: 20,
                  ),
                  const SizedBox(width: UIConstants.spacingSM),
                  Expanded(
                    child: Text(
                      'Widget data updates automatically when you use the app',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstruction(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: TextStyle(color: Colors.grey[600])),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleWidgets(bool enable) async {
    final widgetConfig = ref.read(widgetConfigProvider.notifier);
    await widgetConfig.setEnabled(enable);
    ref.invalidate(isWidgetEnabledProvider);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(enable ? 'Widgets enabled' : 'Widgets disabled'),
        ),
      );
    }
  }

  Future<void> _changeWidgetType(String type) async {
    final widgetConfig = ref.read(widgetConfigProvider.notifier);
    await widgetConfig.setWidgetType(type);
    ref.invalidate(widgetTypeProvider);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Widget type updated'),
        ),
      );
    }
  }
}