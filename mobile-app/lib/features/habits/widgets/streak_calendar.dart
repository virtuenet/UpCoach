import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../../../shared/models/habit_model.dart';

class StreakCalendar extends StatefulWidget {
  final Habit habit;
  final List<HabitCompletion> completions;
  final DateTimeRange dateRange;

  const StreakCalendar({
    super.key,
    required this.habit,
    required this.completions,
    required this.dateRange,
  });

  @override
  State<StreakCalendar> createState() => _StreakCalendarState();
}

class _StreakCalendarState extends State<StreakCalendar> {
  late DateTime _currentMonth;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _currentMonth = DateTime(DateTime.now().year, DateTime.now().month);
    _pageController = PageController(
      initialPage: _getInitialPage(),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  int _getInitialPage() {
    final startDate = DateTime(widget.dateRange.start.year, widget.dateRange.start.month);
    final currentDate = DateTime(DateTime.now().year, DateTime.now().month);
    return currentDate.difference(startDate).inDays ~/ 30;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Month Navigation
        _buildMonthHeader(),
        const SizedBox(height: UIConstants.spacingMD),

        // Calendar Grid
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentMonth = DateTime(
                  widget.dateRange.start.year,
                  widget.dateRange.start.month + index,
                );
              });
            },
            itemBuilder: (context, index) {
              final monthDate = DateTime(
                widget.dateRange.start.year,
                widget.dateRange.start.month + index,
              );
              return _buildCalendarGrid(monthDate);
            },
          ),
        ),

        // Legend
        _buildLegend(),
      ],
    );
  }

  Widget _buildMonthHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: () {
            _pageController.previousPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          },
        ),
        Text(
          DateFormat('MMMM yyyy').format(_currentMonth),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () {
            _pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          },
        ),
      ],
    );
  }

  Widget _buildCalendarGrid(DateTime month) {
    final firstDayOfMonth = DateTime(month.year, month.month, 1);
    final lastDayOfMonth = DateTime(month.year, month.month + 1, 0);
    final firstDayOfWeek = firstDayOfMonth.weekday;
    final daysInMonth = lastDayOfMonth.day;

    return Column(
      children: [
        // Weekday headers
        _buildWeekdayHeaders(),
        const SizedBox(height: UIConstants.spacingSM),

        // Calendar days
        Expanded(
          child: GridView.builder(
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              crossAxisSpacing: 4,
              mainAxisSpacing: 4,
            ),
            itemCount: 42, // 6 weeks * 7 days
            itemBuilder: (context, index) {
              final dayIndex = index - (firstDayOfWeek - 1);

              if (dayIndex < 1 || dayIndex > daysInMonth) {
                // Empty cell for days outside current month
                return const SizedBox.shrink();
              }

              final date = DateTime(month.year, month.month, dayIndex);
              return _buildDayCell(date);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildWeekdayHeaders() {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return Row(
      children: weekdays.map((day) {
        return Expanded(
          child: Center(
            child: Text(
              day,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade600,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDayCell(DateTime date) {
    final isToday = _isSameDay(date, DateTime.now());
    final isInRange = date.isAfter(widget.dateRange.start.subtract(const Duration(days: 1))) &&
                     date.isBefore(widget.dateRange.end.add(const Duration(days: 1)));
    final completion = _getCompletionForDate(date);
    final isCompleted = completion != null;
    final isScheduled = _isHabitScheduledForDate(date);

    Color backgroundColor;
    Color textColor;
    Widget? icon;

    if (!isInRange) {
      // Date outside selected range
      backgroundColor = Colors.grey.shade100;
      textColor = Colors.grey.shade400;
    } else if (isCompleted) {
      // Habit completed on this date
      backgroundColor = Colors.green;
      textColor = Colors.white;
      icon = const Icon(Icons.check, color: Colors.white, size: 12);
    } else if (isScheduled && date.isBefore(DateTime.now())) {
      // Habit was scheduled but not completed (missed)
      backgroundColor = Colors.red.shade200;
      textColor = Colors.red.shade800;
      icon = Icon(Icons.close, color: Colors.red.shade800, size: 12);
    } else if (isScheduled) {
      // Habit is scheduled for this date (future)
      backgroundColor = AppTheme.primaryColor.withOpacity(0.2);
      textColor = AppTheme.primaryColor;
    } else {
      // Not scheduled for this date
      backgroundColor = Colors.grey.shade50;
      textColor = Colors.grey.shade600;
    }

    if (isToday) {
      // Highlight today
      textColor = isCompleted ? Colors.white : AppTheme.primaryColor;
    }

    return GestureDetector(
      onTap: isInRange ? () => _showDayDetails(date, completion) : null,
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(UIConstants.radiusSM),
          border: isToday
              ? Border.all(color: AppTheme.primaryColor, width: 2)
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              date.day.toString(),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: textColor,
                fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (icon != null) ...[
              const SizedBox(height: 2),
              icon,
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLegend() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Legend',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Row(
              children: [
                _buildLegendItem(
                  color: Colors.green,
                  icon: Icons.check,
                  label: 'Completed',
                ),
                const SizedBox(width: UIConstants.spacingMD),
                _buildLegendItem(
                  color: Colors.red.shade200,
                  icon: Icons.close,
                  label: 'Missed',
                  iconColor: Colors.red.shade800,
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Row(
              children: [
                _buildLegendItem(
                  color: AppTheme.primaryColor.withOpacity(0.2),
                  label: 'Scheduled',
                  textColor: AppTheme.primaryColor,
                ),
                const SizedBox(width: UIConstants.spacingMD),
                _buildLegendItem(
                  color: Colors.grey.shade50,
                  label: 'Not scheduled',
                  textColor: Colors.grey.shade600,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem({
    required Color color,
    required String label,
    IconData? icon,
    Color? iconColor,
    Color? textColor,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
          child: icon != null
              ? Icon(icon, size: 10, color: iconColor ?? Colors.white)
              : null,
        ),
        const SizedBox(width: UIConstants.spacingXS),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: textColor,
          ),
        ),
      ],
    );
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
           date1.month == date2.month &&
           date1.day == date2.day;
  }

  HabitCompletion? _getCompletionForDate(DateTime date) {
    return widget.completions.where((completion) {
      return _isSameDay(completion.completedAt, date);
    }).firstOrNull;
  }

  bool _isHabitScheduledForDate(DateTime date) {
    switch (widget.habit.frequency) {
      case HabitFrequency.daily:
        return date.isAfter(widget.habit.createdAt.subtract(const Duration(days: 1)));

      case HabitFrequency.weekly:
        if (widget.habit.weekdays.isEmpty) return false;
        return widget.habit.weekdays.contains(date.weekday) &&
               date.isAfter(widget.habit.createdAt.subtract(const Duration(days: 1)));

      case HabitFrequency.monthly:
        return date.day == widget.habit.createdAt.day &&
               date.isAfter(widget.habit.createdAt.subtract(const Duration(days: 1)));

      case HabitFrequency.custom:
        if (widget.habit.customInterval == null) return false;
        final daysSinceCreation = date.difference(widget.habit.createdAt).inDays;
        return daysSinceCreation >= 0 &&
               daysSinceCreation % widget.habit.customInterval! == 0;
    }
  }

  void _showDayDetails(DateTime date, HabitCompletion? completion) {
    final isCompleted = completion != null;
    final isScheduled = _isHabitScheduledForDate(date);
    final isPast = date.isBefore(DateTime.now());
    final isToday = _isSameDay(date, DateTime.now());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(DateFormat('EEEE, MMM dd, yyyy').format(date)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.habit.name,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            if (isCompleted) ...[
              Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  const SizedBox(width: UIConstants.spacingSM),
                  const Text('Completed'),
                ],
              ),
              if (completion!.notes != null && completion.notes!.isNotEmpty) ...[
                const SizedBox(height: UIConstants.spacingSM),
                Text(
                  'Note: ${completion.notes}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
              const SizedBox(height: UIConstants.spacingSM),
              Text(
                'Completed at ${DateFormat('HH:mm').format(completion.completedAt)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                ),
              ),
            ] else if (isScheduled) ...[
              if (isPast && !isToday) ...[
                Row(
                  children: [
                    Icon(Icons.cancel, color: Colors.red),
                    const SizedBox(width: UIConstants.spacingSM),
                    const Text('Missed'),
                  ],
                ),
              ] else if (isToday) ...[
                Row(
                  children: [
                    Icon(Icons.schedule, color: Colors.orange),
                    const SizedBox(width: UIConstants.spacingSM),
                    const Text('Scheduled for today'),
                  ],
                ),
              ] else ...[
                Row(
                  children: [
                    Icon(Icons.event, color: AppTheme.primaryColor),
                    const SizedBox(width: UIConstants.spacingSM),
                    const Text('Scheduled'),
                  ],
                ),
              ],
            ] else ...[
              Row(
                children: [
                  Icon(Icons.event_busy, color: Colors.grey),
                  const SizedBox(width: UIConstants.spacingSM),
                  const Text('Not scheduled'),
                ],
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}