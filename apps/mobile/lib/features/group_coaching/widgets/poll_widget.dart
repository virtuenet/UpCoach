import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/group_session_models.dart';

/// Poll Widget
/// Displays an interactive poll in the live session chat
class PollWidget extends StatelessWidget {
  final ChatMessage pollMessage;
  final String currentUserId;
  final Function(String optionId) onVote;
  final bool isCoach;

  const PollWidget({
    super.key,
    required this.pollMessage,
    required this.currentUserId,
    required this.onVote,
    this.isCoach = false,
  });

  PollData? get poll => pollMessage.pollData;

  bool get hasVoted {
    if (poll == null) return false;
    return poll!.options.any((opt) =>
        opt.voterIds?.contains(currentUserId) ?? false);
  }

  int get totalVotes {
    if (poll == null) return 0;
    return poll!.options.fold(0, (sum, opt) => sum + opt.votes);
  }

  String? get userVotedOptionId {
    if (poll == null) return null;
    for (final option in poll!.options) {
      if (option.voterIds?.contains(currentUserId) ?? false) {
        return option.id;
      }
    }
    return null;
  }

  bool get isPollEnded {
    if (poll?.endsAt == null) return false;
    return DateTime.now().isAfter(poll!.endsAt!);
  }

  @override
  Widget build(BuildContext context) {
    if (poll == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
          border: Border.all(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Poll header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.poll,
                    size: 20,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Poll',
                          style: TextStyle(
                            fontSize: 11,
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          poll!.question,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isPollEnded)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Ended',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                ],
              ),
            ),

            // Poll options
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: poll!.options.map((option) {
                  final percentage = totalVotes > 0
                      ? (option.votes / totalVotes * 100)
                      : 0.0;
                  final isSelected = userVotedOptionId == option.id;
                  final showResults = hasVoted || isPollEnded;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _PollOption(
                      option: option,
                      percentage: percentage,
                      isSelected: isSelected,
                      showResults: showResults,
                      canVote: !hasVoted && !isPollEnded,
                      allowMultiple: poll!.allowMultiple,
                      onVote: () => onVote(option.id),
                    ),
                  );
                }).toList(),
              ),
            ),

            // Poll footer
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.how_to_vote, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        '$totalVotes ${totalVotes == 1 ? 'vote' : 'votes'}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  if (poll!.endsAt != null && !isPollEnded)
                    Row(
                      children: [
                        Icon(Icons.timer, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          'Ends ${DateFormat('h:mm a').format(poll!.endsAt!)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  if (poll!.allowMultiple)
                    Row(
                      children: [
                        Icon(Icons.check_box_outlined, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          'Multiple choice',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Individual poll option
class _PollOption extends StatelessWidget {
  final PollOption option;
  final double percentage;
  final bool isSelected;
  final bool showResults;
  final bool canVote;
  final bool allowMultiple;
  final VoidCallback onVote;

  const _PollOption({
    required this.option,
    required this.percentage,
    required this.isSelected,
    required this.showResults,
    required this.canVote,
    required this.allowMultiple,
    required this.onVote,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: canVote ? onVote : null,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.1)
              : Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? Theme.of(context).colorScheme.primary
                : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Stack(
          children: [
            // Progress bar (shown after voting)
            if (showResults)
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 500),
                      curve: Curves.easeOut,
                      width: MediaQuery.of(context).size.width *
                          0.7 *
                          (percentage / 100),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.2)
                            : Colors.grey[200],
                      ),
                    ),
                  ),
                ),
              ),

            // Option content
            Row(
              children: [
                // Selection indicator
                if (!showResults)
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: allowMultiple ? BoxShape.rectangle : BoxShape.circle,
                      borderRadius: allowMultiple ? BorderRadius.circular(4) : null,
                      border: Border.all(
                        color: isSelected
                            ? Theme.of(context).colorScheme.primary
                            : Colors.grey[400]!,
                        width: 2,
                      ),
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Colors.transparent,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                        : null,
                  )
                else if (isSelected)
                  Icon(
                    Icons.check_circle,
                    size: 20,
                    color: Theme.of(context).colorScheme.primary,
                  )
                else
                  const SizedBox(width: 20),

                const SizedBox(width: 12),

                // Option text
                Expanded(
                  child: Text(
                    option.text,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Colors.black87,
                    ),
                  ),
                ),

                // Percentage (shown after voting)
                if (showResults)
                  Text(
                    '${percentage.toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Create Poll Dialog
/// Used by coaches to create new polls
class CreatePollDialog extends StatefulWidget {
  final Function(String question, List<String> options, bool allowMultiple, int? durationMinutes) onCreate;

  const CreatePollDialog({
    super.key,
    required this.onCreate,
  });

  @override
  State<CreatePollDialog> createState() => _CreatePollDialogState();
}

class _CreatePollDialogState extends State<CreatePollDialog> {
  final _questionController = TextEditingController();
  final List<TextEditingController> _optionControllers = [
    TextEditingController(),
    TextEditingController(),
  ];
  bool _allowMultiple = false;
  int? _durationMinutes;

  @override
  void dispose() {
    _questionController.dispose();
    for (final controller in _optionControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    if (_optionControllers.length < 6) {
      setState(() {
        _optionControllers.add(TextEditingController());
      });
    }
  }

  void _removeOption(int index) {
    if (_optionControllers.length > 2) {
      setState(() {
        _optionControllers[index].dispose();
        _optionControllers.removeAt(index);
      });
    }
  }

  bool get _isValid {
    if (_questionController.text.trim().isEmpty) return false;
    final filledOptions = _optionControllers
        .where((c) => c.text.trim().isNotEmpty)
        .length;
    return filledOptions >= 2;
  }

  void _create() {
    if (!_isValid) return;

    final options = _optionControllers
        .map((c) => c.text.trim())
        .where((t) => t.isNotEmpty)
        .toList();

    widget.onCreate(
      _questionController.text.trim(),
      options,
      _allowMultiple,
      _durationMinutes,
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.poll,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Create Poll',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Question
              TextField(
                controller: _questionController,
                decoration: InputDecoration(
                  labelText: 'Question',
                  hintText: 'What would you like to ask?',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                maxLines: 2,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),

              // Options
              const Text(
                'Options',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              ...List.generate(_optionControllers.length, (index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _optionControllers[index],
                          decoration: InputDecoration(
                            hintText: 'Option ${index + 1}',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 12,
                            ),
                          ),
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                      if (_optionControllers.length > 2)
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline),
                          color: Colors.red,
                          onPressed: () => _removeOption(index),
                        ),
                    ],
                  ),
                );
              }),

              if (_optionControllers.length < 6)
                TextButton.icon(
                  onPressed: _addOption,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Option'),
                ),
              const SizedBox(height: 16),

              // Settings
              SwitchListTile(
                value: _allowMultiple,
                onChanged: (value) => setState(() => _allowMultiple = value),
                title: const Text('Allow multiple selections'),
                contentPadding: EdgeInsets.zero,
              ),

              DropdownButtonFormField<int?>(
                value: _durationMinutes,
                decoration: InputDecoration(
                  labelText: 'Duration (optional)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                items: const [
                  DropdownMenuItem(value: null, child: Text('No time limit')),
                  DropdownMenuItem(value: 1, child: Text('1 minute')),
                  DropdownMenuItem(value: 5, child: Text('5 minutes')),
                  DropdownMenuItem(value: 10, child: Text('10 minutes')),
                  DropdownMenuItem(value: 15, child: Text('15 minutes')),
                  DropdownMenuItem(value: 30, child: Text('30 minutes')),
                ],
                onChanged: (value) => setState(() => _durationMinutes = value),
              ),
              const SizedBox(height: 24),

              // Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _isValid ? _create : null,
                    child: const Text('Create Poll'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
