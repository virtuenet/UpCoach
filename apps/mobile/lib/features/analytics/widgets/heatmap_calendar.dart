import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// GitHub-style contribution heatmap for habit check-ins
/// Phase 11 Week 3
class HeatmapCalendar extends StatefulWidget {
  final Map<DateTime, double> checkInData; // Date -> completion rate (0.0-1.0)
  final DateTime startDate;
  final DateTime endDate;
  final Color lowColor;
  final Color highColor;
  final Function(DateTime)? onDayTap;

  const HeatmapCalendar({
    super.key,
    required this.checkInData,
    required this.startDate,
    required this.endDate,
    this.lowColor = const Color(0xFFE0E0E0),
    this.highColor = const Color(0xFF4CAF50),
    this.onDayTap,
  });

  @override
  State<HeatmapCalendar> createState() => _HeatmapCalendarState();
}

class _HeatmapCalendarState extends State<HeatmapCalendar> {
  CalendarView _currentView = CalendarView.month;
  DateTime? _selectedDate;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildViewSelector(),
        const SizedBox(height: 16),
        _buildCalendar(),
        const SizedBox(height: 16),
        _buildLegend(),
        if (_selectedDate != null) ...[
          const SizedBox(height: 16),
          _buildDayDetails(),
        ],
      ],
    );
  }

  Widget _buildViewSelector() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        _buildViewButton(CalendarView.month, 'Month'),
        const SizedBox(width: 8),
        _buildViewButton(CalendarView.year, 'Year'),
      ],
    );
  }

  Widget _buildViewButton(CalendarView view, String label) {
    final isSelected = _currentView == view;

    return OutlinedButton(
      onPressed: () => setState(() => _currentView = view),
      style: OutlinedButton.styleFrom(
        backgroundColor: isSelected ? Theme.of(context).primaryColor : null,
        foregroundColor: isSelected ? Colors.white : null,
      ),
      child: Text(label),
    );
  }

  Widget _buildCalendar() {
    switch (_currentView) {
      case CalendarView.month:
        return _buildMonthView();
      case CalendarView.year:
        return _buildYearView();
    }
  }

  Widget _buildMonthView() {
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1);
    final lastDayOfMonth = DateTime(now.year, now.month + 1, 0);

    return Column(
      children: [
        // Header with month name
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: Text(
            DateFormat('MMMM yyyy').format(now),
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        // Weekday labels
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
              .map((day) => SizedBox(
                    width: 40,
                    child: Center(
                      child: Text(
                        day,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 8),
        // Calendar grid
        _buildMonthGrid(firstDayOfMonth, lastDayOfMonth),
      ],
    );
  }

  Widget _buildMonthGrid(DateTime firstDay, DateTime lastDay) {
    final weeks = <Widget>[];
    var currentDate = firstDay.subtract(Duration(days: firstDay.weekday % 7));

    while (currentDate.isBefore(lastDay) ||
        currentDate.month == lastDay.month) {
      final weekDays = <Widget>[];

      for (int i = 0; i < 7; i++) {
        weekDays.add(_buildDayCell(currentDate, currentDate.month == firstDay.month));
        currentDate = currentDate.add(const Duration(days: 1));
      }

      weeks.add(Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: weekDays,
      ));
      weeks.add(const SizedBox(height: 4));
    }

    return Column(children: weeks);
  }

  Widget _buildYearView() {
    final now = DateTime.now();
    final startOfYear = DateTime(now.year, 1, 1);
    final weeks = <Widget>[];

    var currentDate = startOfYear.subtract(
        Duration(days: startOfYear.weekday % 7));

    for (int week = 0; week < 53; week++) {
      final weekDays = <Widget>[];

      for (int day = 0; day < 7; day++) {
        weekDays.add(_buildDayCell(currentDate, currentDate.year == now.year, compact: true));
        currentDate = currentDate.add(const Duration(days: 1));
      }

      weeks.add(Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: weekDays,
      ));
      weeks.add(const SizedBox(height: 2));
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Text(
              'Year ${now.year}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          ...weeks,
        ],
      ),
    );
  }

  Widget _buildDayCell(DateTime date, bool isCurrentMonth, {bool compact = false}) {
    final completionRate = widget.checkInData[_normalizeDate(date)];
    final cellColor = _getColorForRate(completionRate);
    final size = compact ? 12.0 : 40.0;

    return GestureDetector(
      onTap: () {
        if (isCurrentMonth) {
          setState(() => _selectedDate = date);
          widget.onDayTap?.call(date);
        }
      },
      child: Container(
        width: size,
        height: size,
        margin: EdgeInsets.all(compact ? 1.0 : 2.0),
        decoration: BoxDecoration(
          color: isCurrentMonth ? cellColor : Colors.transparent,
          borderRadius: BorderRadius.circular(compact ? 2 : 4),
          border: _selectedDate != null && _normalizeDate(_selectedDate!) == _normalizeDate(date)
              ? Border.all(color: Theme.of(context).primaryColor, width: 2)
              : null,
        ),
        child: !compact && isCurrentMonth
            ? Center(
                child: Text(
                  '${date.day}',
                  style: TextStyle(
                    fontSize: 12,
                    color: completionRate != null && completionRate > 0.5
                        ? Colors.white
                        : Colors.black87,
                  ),
                ),
              )
            : null,
      ),
    );
  }

  Color _getColorForRate(double? rate) {
    if (rate == null) return widget.lowColor.withOpacity(0.3);

    // Interpolate between low and high color
    return Color.lerp(widget.lowColor, widget.highColor, rate)!;
  }

  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        const Text('Less', style: TextStyle(fontSize: 12)),
        const SizedBox(width: 8),
        ...List.generate(
          5,
          (index) => Container(
            width: 16,
            height: 16,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              color: Color.lerp(widget.lowColor, widget.highColor, index / 4),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(width: 8),
        const Text('More', style: TextStyle(fontSize: 12)),
      ],
    );
  }

  Widget _buildDayDetails() {
    final rate = widget.checkInData[_normalizeDate(_selectedDate!)];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              DateFormat('EEEE, MMMM d, yyyy').format(_selectedDate!),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (rate != null) ...[
              Text('Completion Rate: ${(rate * 100).toStringAsFixed(0)}%'),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: rate,
                backgroundColor: widget.lowColor,
                valueColor: AlwaysStoppedAnimation(widget.highColor),
              ),
            ] else
              const Text('No check-ins recorded'),
          ],
        ),
      ),
    );
  }

  DateTime _normalizeDate(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }
}

enum CalendarView { month, year }
