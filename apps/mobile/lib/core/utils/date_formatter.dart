import 'package:intl/intl.dart';

/// Utility class for date formatting
class DateFormatter {
  DateFormatter._();

  /// Format date as readable string (e.g., "Jan 15, 2024")
  static String formatDate(DateTime date) {
    return DateFormat.yMMMd().format(date);
  }

  /// Format date with time (e.g., "Jan 15, 2024 3:30 PM")
  static String formatDateTime(DateTime date) {
    return DateFormat.yMMMd().add_jm().format(date);
  }

  /// Format time only (e.g., "3:30 PM")
  static String formatTime(DateTime date) {
    return DateFormat.jm().format(date);
  }

  /// Format relative time (e.g., "2 hours ago", "Yesterday")
  static String formatRelative(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return DateFormat.EEEE().format(date);
    } else {
      return formatDate(date);
    }
  }

  /// Format day of week (e.g., "Monday")
  static String formatDayOfWeek(DateTime date) {
    return DateFormat.EEEE().format(date);
  }

  /// Format short day of week (e.g., "Mon")
  static String formatShortDayOfWeek(DateTime date) {
    return DateFormat.E().format(date);
  }

  /// Format month and year (e.g., "January 2024")
  static String formatMonthYear(DateTime date) {
    return DateFormat.yMMMM().format(date);
  }

  /// Format short date (e.g., "1/15/24")
  static String formatShortDate(DateTime date) {
    return DateFormat.yMd().format(date);
  }

  /// Format ISO 8601 date
  static String formatISO(DateTime date) {
    return date.toIso8601String();
  }

  /// Format duration as readable string (e.g., "1h 30m")
  static String formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      final hours = duration.inHours;
      final minutes = duration.inMinutes.remainder(60);
      return minutes > 0 ? '${hours}h ${minutes}m' : '${hours}h';
    } else if (duration.inMinutes > 0) {
      return '${duration.inMinutes}m';
    } else {
      return '${duration.inSeconds}s';
    }
  }

  /// Format countdown (e.g., "2 days left", "3 hours remaining")
  static String formatCountdown(DateTime targetDate) {
    final now = DateTime.now();
    final difference = targetDate.difference(now);

    if (difference.isNegative) {
      return 'Overdue';
    } else if (difference.inDays > 0) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} left';
    } else if (difference.inHours > 0) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} left';
    } else if (difference.inMinutes > 0) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} left';
    } else {
      return 'Less than a minute';
    }
  }

  /// Check if date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  /// Check if date is yesterday
  static bool isYesterday(DateTime date) {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return date.year == yesterday.year &&
        date.month == yesterday.month &&
        date.day == yesterday.day;
  }

  /// Check if date is this week
  static bool isThisWeek(DateTime date) {
    final now = DateTime.now();
    final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
    final endOfWeek = startOfWeek.add(const Duration(days: 7));
    return date.isAfter(startOfWeek) && date.isBefore(endOfWeek);
  }
}
