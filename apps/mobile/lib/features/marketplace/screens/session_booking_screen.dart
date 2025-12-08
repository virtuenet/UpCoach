import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../shared/models/coach_models.dart' hide PaymentStatus;
import '../../../shared/models/payment_models.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/coach_booking_provider.dart';
import '../services/coach_booking_service.dart';
import '../../payments/providers/payment_provider.dart';

class SessionBookingScreen extends ConsumerStatefulWidget {
  final int coachId;

  const SessionBookingScreen({super.key, required this.coachId});

  @override
  ConsumerState<SessionBookingScreen> createState() =>
      _SessionBookingScreenState();
}

class _SessionBookingScreenState extends ConsumerState<SessionBookingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _loadCoachIfNeeded();
  }

  void _loadCoachIfNeeded() async {
    final state = ref.read(sessionBookingProvider);
    if (state.coach == null || state.coach!.id != widget.coachId) {
      final service = ref.read(coachBookingServiceProvider);
      try {
        final coach = await service.getCoachProfile(widget.coachId);
        ref.read(sessionBookingProvider.notifier).setCoach(coach);
      } catch (e) {
        debugPrint('Error loading coach: $e');
      }
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(sessionBookingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Session'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _previousPage,
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              _buildProgressIndicator(),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (index) {
                    setState(() => _currentPage = index);
                  },
                  children: [
                    _SessionTypeStep(onNext: _nextPage),
                    _DateTimeStep(coachId: widget.coachId, onNext: _nextPage),
                    _DurationStep(onNext: _nextPage),
                    _ConfirmStep(onComplete: _handleBooking),
                  ],
                ),
              ),
            ],
          ),
          if (bookingState.isBooking)
            Container(
              color: Colors.black26,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    final steps = ['Type', 'Date & Time', 'Duration', 'Confirm'];
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: List.generate(steps.length, (index) {
          final isCompleted = index < _currentPage;
          final isCurrent = index == _currentPage;
          return Expanded(
            child: Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isCompleted || isCurrent
                        ? AppColors.primary
                        : Colors.grey[300],
                  ),
                  child: Center(
                    child: isCompleted
                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                        : Text(
                            '${index + 1}',
                            style: TextStyle(
                              color:
                                  isCurrent ? Colors.white : Colors.grey[600],
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
                if (index < steps.length - 1)
                  Expanded(
                    child: Container(
                      height: 2,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      color: isCompleted ? AppColors.primary : Colors.grey[300],
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Future<void> _handleBooking() async {
    final bookingState = ref.read(sessionBookingProvider);
    final coach = bookingState.coach;

    if (coach == null) return;

    // Calculate amount in cents for Stripe
    final amountInCents = (bookingState.totalPrice * 100).toInt();

    // Process payment first
    final paymentResult =
        await ref.read(paymentProvider.notifier).processSessionPayment(
              sessionId: 0, // Will be assigned after booking
              amount: amountInCents,
              coachName: coach.displayName,
            );

    if (!paymentResult.success) {
      // Payment failed or cancelled
      if (paymentResult.status != PaymentStatus.cancelled && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(paymentResult.errorMessage ?? 'Payment failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    // Payment succeeded, now book the session
    final success =
        await ref.read(sessionBookingProvider.notifier).bookSession();
    if (success && mounted) {
      _showSuccessDialog();
    }
  }

  void _showSuccessDialog() {
    final state = ref.read(sessionBookingProvider);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 32),
            SizedBox(width: 12),
            Text('Booking Confirmed!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                'Your session with ${state.coach?.displayName} has been booked.'),
            const SizedBox(height: 16),
            if (state.bookedSession != null) ...[
              _InfoRow(
                icon: Icons.calendar_today,
                text: DateFormat('EEEE, MMMM d, yyyy')
                    .format(state.bookedSession!.scheduledAt),
              ),
              const SizedBox(height: 8),
              _InfoRow(
                icon: Icons.access_time,
                text: DateFormat('h:mm a')
                    .format(state.bookedSession!.scheduledAt),
              ),
              const SizedBox(height: 8),
              _InfoRow(
                icon: Icons.timer,
                text: state.bookedSession!.formattedDuration,
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.go('/marketplace/my-sessions');
            },
            child: const Text('View My Sessions'),
          ),
          ElevatedButton(
            onPressed: () {
              ref.read(sessionBookingProvider.notifier).reset();
              Navigator.of(context).pop();
              context.pop();
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}

class _SessionTypeStep extends ConsumerWidget {
  final VoidCallback onNext;

  const _SessionTypeStep({required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(sessionBookingProvider);
    final selectedType = state.selectedSessionType;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Session Type',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose how you\'d like to connect with your coach',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: [
                _SessionTypeCard(
                  type: SessionType.video,
                  title: 'Video Call',
                  description: 'Face-to-face coaching via video conferencing',
                  icon: Icons.videocam,
                  isSelected: selectedType == SessionType.video,
                  onTap: () {
                    ref
                        .read(sessionBookingProvider.notifier)
                        .setSessionType(SessionType.video);
                  },
                ),
                _SessionTypeCard(
                  type: SessionType.audio,
                  title: 'Audio Call',
                  description: 'Voice-only coaching session',
                  icon: Icons.phone,
                  isSelected: selectedType == SessionType.audio,
                  onTap: () {
                    ref
                        .read(sessionBookingProvider.notifier)
                        .setSessionType(SessionType.audio);
                  },
                ),
                _SessionTypeCard(
                  type: SessionType.chat,
                  title: 'Chat Session',
                  description: 'Text-based coaching conversation',
                  icon: Icons.chat,
                  isSelected: selectedType == SessionType.chat,
                  onTap: () {
                    ref
                        .read(sessionBookingProvider.notifier)
                        .setSessionType(SessionType.chat);
                  },
                ),
                _SessionTypeCard(
                  type: SessionType.inPerson,
                  title: 'In-Person',
                  description: 'Meet your coach face-to-face',
                  icon: Icons.person,
                  isSelected: selectedType == SessionType.inPerson,
                  onTap: () {
                    ref
                        .read(sessionBookingProvider.notifier)
                        .setSessionType(SessionType.inPerson);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: selectedType != null ? onNext : null,
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionTypeCard extends StatelessWidget {
  final SessionType type;
  final String title;
  final String description;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _SessionTypeCard({
    required this.type,
    required this.title,
    required this.description,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppColors.primary : Colors.transparent,
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary.withValues(alpha: 0.1)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: isSelected ? AppColors.primary : Colors.grey[600],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                const Icon(Icons.check_circle, color: AppColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}

class _DateTimeStep extends ConsumerStatefulWidget {
  final int coachId;
  final VoidCallback onNext;

  const _DateTimeStep({required this.coachId, required this.onNext});

  @override
  ConsumerState<_DateTimeStep> createState() => _DateTimeStepState();
}

class _DateTimeStepState extends ConsumerState<_DateTimeStep> {
  DateTime _selectedMonth = DateTime.now();
  List<TimeSlot> _availableSlots = [];
  bool _isLoadingSlots = false;

  @override
  void initState() {
    super.initState();
    _loadAvailability();
  }

  void _loadAvailability() async {
    setState(() => _isLoadingSlots = true);
    try {
      final service = ref.read(coachBookingServiceProvider);
      final startDate = DateTime(_selectedMonth.year, _selectedMonth.month, 1);
      final endDate =
          DateTime(_selectedMonth.year, _selectedMonth.month + 1, 0);
      final slots = await service.getCoachAvailability(
        widget.coachId,
        startDate: startDate,
        endDate: endDate,
      );
      if (mounted) {
        setState(() {
          _availableSlots = slots;
          _isLoadingSlots = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingSlots = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sessionBookingProvider);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Date & Time',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose when you\'d like to have your session',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 24),
          _buildCalendarHeader(),
          const SizedBox(height: 16),
          _buildCalendar(state.selectedDate),
          const SizedBox(height: 24),
          if (state.selectedDate != null) ...[
            Text(
              'Available Times',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            _buildTimeSlots(state),
          ],
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed:
                  state.selectedDate != null && state.selectedTimeSlot != null
                      ? widget.onNext
                      : null,
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: () {
            setState(() {
              _selectedMonth =
                  DateTime(_selectedMonth.year, _selectedMonth.month - 1);
            });
            _loadAvailability();
          },
        ),
        Text(
          DateFormat('MMMM yyyy').format(_selectedMonth),
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () {
            setState(() {
              _selectedMonth =
                  DateTime(_selectedMonth.year, _selectedMonth.month + 1);
            });
            _loadAvailability();
          },
        ),
      ],
    );
  }

  Widget _buildCalendar(DateTime? selectedDate) {
    final daysInMonth =
        DateTime(_selectedMonth.year, _selectedMonth.month + 1, 0).day;
    final firstDayOfMonth =
        DateTime(_selectedMonth.year, _selectedMonth.month, 1);
    final startingWeekday = firstDayOfMonth.weekday % 7;
    final today = DateTime.now();

    return Column(
      children: [
        Row(
          children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              .map((day) => Expanded(
                    child: Center(
                      child: Text(
                        day,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            childAspectRatio: 1,
          ),
          itemCount: startingWeekday + daysInMonth,
          itemBuilder: (context, index) {
            if (index < startingWeekday) {
              return const SizedBox();
            }

            final day = index - startingWeekday + 1;
            final date =
                DateTime(_selectedMonth.year, _selectedMonth.month, day);
            final isPast =
                date.isBefore(DateTime(today.year, today.month, today.day));
            final isSelected = selectedDate != null &&
                selectedDate.year == date.year &&
                selectedDate.month == date.month &&
                selectedDate.day == date.day;
            final hasAvailability = _availableSlots.any((slot) =>
                slot.startTime.year == date.year &&
                slot.startTime.month == date.month &&
                slot.startTime.day == date.day);

            return GestureDetector(
              onTap: isPast || !hasAvailability
                  ? null
                  : () {
                      ref.read(sessionBookingProvider.notifier).setDate(date);
                    },
              child: Container(
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary
                      : hasAvailability
                          ? AppColors.primary.withValues(alpha: 0.1)
                          : null,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '$day',
                    style: TextStyle(
                      color: isSelected
                          ? Colors.white
                          : isPast
                              ? Colors.grey[400]
                              : hasAvailability
                                  ? AppColors.primary
                                  : Colors.black,
                      fontWeight: isSelected || hasAvailability
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildTimeSlots(SessionBookingState state) {
    if (_isLoadingSlots) {
      return const Center(child: CircularProgressIndicator());
    }

    final slotsForDay = _availableSlots
        .where((slot) =>
            slot.startTime.year == state.selectedDate!.year &&
            slot.startTime.month == state.selectedDate!.month &&
            slot.startTime.day == state.selectedDate!.day)
        .toList();

    if (slotsForDay.isEmpty) {
      return const Center(child: Text('No available slots for this date'));
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: slotsForDay.map((slot) {
        final isSelected = state.selectedTimeSlot == slot;
        return ChoiceChip(
          label: Text(DateFormat('h:mm a').format(slot.startTime)),
          selected: isSelected,
          selectedColor: AppColors.primary,
          labelStyle: TextStyle(
            color: isSelected ? Colors.white : null,
          ),
          onSelected: slot.isAvailable
              ? (selected) {
                  if (selected) {
                    ref.read(sessionBookingProvider.notifier).setTimeSlot(slot);
                  }
                }
              : null,
        );
      }).toList(),
    );
  }
}

class _DurationStep extends ConsumerWidget {
  final VoidCallback onNext;

  const _DurationStep({required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(sessionBookingProvider);
    final durations = [30, 45, 60, 90, 120];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Duration',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'How long would you like your session to be?',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: durations.map((minutes) {
                final isSelected = state.durationMinutes == minutes;
                final price = state.coach?.calculateSessionPrice(minutes) ?? 0;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color:
                          isSelected ? AppColors.primary : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: InkWell(
                    onTap: () {
                      ref
                          .read(sessionBookingProvider.notifier)
                          .setDuration(minutes);
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _formatDuration(minutes),
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              if (minutes == 60)
                                Text(
                                  'Most popular',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: AppColors.primary,
                                      ),
                                ),
                            ],
                          ),
                          Text(
                            '\$${price.toStringAsFixed(2)}',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onNext,
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) return '$minutes minutes';
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (mins == 0) return '$hours hour${hours > 1 ? 's' : ''}';
    return '$hours hour${hours > 1 ? 's' : ''} $mins min';
  }
}

class _ConfirmStep extends ConsumerWidget {
  final VoidCallback onComplete;

  const _ConfirmStep({required this.onComplete});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(sessionBookingProvider);
    final coach = state.coach;

    if (coach == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Confirm Booking',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Review your session details before confirming',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: coach.profileImageUrl != null
                            ? NetworkImage(coach.profileImageUrl!)
                            : null,
                        child: coach.profileImageUrl == null
                            ? Text(coach.displayName.substring(0, 1))
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              coach.displayName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            if (coach.title != null)
                              Text(
                                coach.title!,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 32),
                  _InfoRow(
                    icon: Icons.category,
                    text:
                        state.selectedSessionType?.name.toUpperCase() ?? 'N/A',
                  ),
                  const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.calendar_today,
                    text: state.selectedDate != null
                        ? DateFormat('EEEE, MMMM d, yyyy')
                            .format(state.selectedDate!)
                        : 'N/A',
                  ),
                  const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.access_time,
                    text: state.selectedTimeSlot != null
                        ? DateFormat('h:mm a')
                            .format(state.selectedTimeSlot!.startTime)
                        : 'N/A',
                  ),
                  const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.timer,
                    text: '${state.durationMinutes} minutes',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add Notes (Optional)',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText:
                          'Share what you\'d like to discuss or any preparation notes...',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      ref
                          .read(sessionBookingProvider.notifier)
                          .setClientNotes(value);
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Card(
            color: Colors.grey[50],
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Session Fee'),
                      Text('\$${state.totalPrice.toStringAsFixed(2)}'),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      Text(
                        '\$${state.totalPrice.toStringAsFixed(2)}',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          if (state.error != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(child: Text(state.error!)),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: state.isBooking ? null : onComplete,
              child: state.isBooking
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Confirm & Pay'),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'You won\'t be charged until the session is confirmed',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Text(text),
      ],
    );
  }
}
