import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/certification_models.dart';
import '../providers/certification_provider.dart';

/// Quiz Screen
/// Take certification quiz
class QuizScreen extends ConsumerStatefulWidget {
  final String programId;

  const QuizScreen({super.key, required this.programId});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(quizProvider.notifier).startQuiz(widget.programId);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {}); // Update time display
    });
  }

  @override
  Widget build(BuildContext context) {
    final quizAsync = ref.watch(quizProvider);

    return quizAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (err, stack) => Scaffold(
        appBar: AppBar(title: const Text('Quiz')),
        body: Center(child: Text('Error: $err')),
      ),
      data: (state) {
        if (state.result != null) {
          return _QuizResultScreen(result: state.result!, quiz: state.quiz);
        }

        if (state.quiz == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Start timer if not started
        if (_timer == null && state.endsAt != null) {
          _startTimer();
        }

        return _QuizContent(state: state);
      },
    );
  }
}

class _QuizContent extends ConsumerWidget {
  final QuizState state;

  const _QuizContent({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final question = state.currentQuestion;

    return Scaffold(
      appBar: AppBar(
        title: Text(state.quiz?.title ?? 'Quiz'),
        actions: [
          // Timer
          if (state.timeRemaining != null)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: _TimerDisplay(duration: state.timeRemaining!),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Progress bar
          LinearProgressIndicator(
            value: (state.currentQuestionIndex + 1) / state.questions.length,
            backgroundColor: Colors.grey[200],
          ),

          // Question counter
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Question ${state.currentQuestionIndex + 1} of ${state.questions.length}',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                Text(
                  '${state.answeredCount} answered',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),

          // Question content
          if (question != null)
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _QuestionWidget(
                  question: question,
                  selectedAnswer: state.answers[question.id],
                  onAnswer: (answer) {
                    ref.read(quizProvider.notifier).answerQuestion(
                      question.id,
                      answer,
                    );
                  },
                ),
              ),
            ),

          // Navigation
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (state.currentQuestionIndex > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () =>
                            ref.read(quizProvider.notifier).previousQuestion(),
                        child: const Text('Previous'),
                      ),
                    ),
                  if (state.currentQuestionIndex > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: state.isLastQuestion
                          ? () => _showSubmitDialog(context, ref)
                          : () => ref.read(quizProvider.notifier).nextQuestion(),
                      child: Text(state.isLastQuestion ? 'Submit Quiz' : 'Next'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),

      // Question navigator drawer
      drawer: _QuestionNavigator(state: state),
    );
  }

  void _showSubmitDialog(BuildContext context, WidgetRef ref) {
    final unansweredCount = state.questions.length - state.answeredCount;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit Quiz'),
        content: unansweredCount > 0
            ? Text(
                'You have $unansweredCount unanswered questions. Are you sure you want to submit?')
            : const Text('Are you sure you want to submit your quiz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Continue Quiz'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ref.read(quizProvider.notifier).submitQuiz();
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}

/// Timer display widget
class _TimerDisplay extends StatelessWidget {
  final Duration duration;

  const _TimerDisplay({required this.duration});

  @override
  Widget build(BuildContext context) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    final isLow = duration.inMinutes < 5;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isLow ? Colors.red.withValues(alpha: 0.1) : Colors.grey[200],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.timer,
            size: 16,
            color: isLow ? Colors.red : Colors.grey[700],
          ),
          const SizedBox(width: 4),
          Text(
            '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isLow ? Colors.red : Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }
}

/// Question widget
class _QuestionWidget extends StatelessWidget {
  final QuizQuestion question;
  final dynamic selectedAnswer;
  final Function(dynamic) onAnswer;

  const _QuestionWidget({
    required this.question,
    required this.selectedAnswer,
    required this.onAnswer,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category and points
        Row(
          children: [
            if (question.category != null)
              Chip(
                label: Text(
                  question.category!,
                  style: const TextStyle(fontSize: 11),
                ),
                padding: EdgeInsets.zero,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${question.points} pts',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Question text
        Text(
          question.question,
          style: Theme.of(context).textTheme.titleLarge,
        ),

        if (question.description != null) ...[
          const SizedBox(height: 8),
          Text(
            question.description!,
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],

        // Image if present
        if (question.imageUrl != null) ...[
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              question.imageUrl!,
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 200,
                color: Colors.grey[200],
                child: const Icon(Icons.image, size: 48),
              ),
            ),
          ),
        ],

        const SizedBox(height: 24),

        // Answer options
        _buildAnswerWidget(context),
      ],
    );
  }

  Widget _buildAnswerWidget(BuildContext context) {
    switch (question.type) {
      case QuestionType.multipleChoice:
      case QuestionType.trueFalse:
      case QuestionType.scenario:
        return _MultipleChoiceWidget(
          options: question.options ?? [],
          selectedId: selectedAnswer as String?,
          onSelect: (id) => onAnswer(id),
        );

      case QuestionType.multipleSelect:
        return _MultipleSelectWidget(
          options: question.options ?? [],
          selectedIds: (selectedAnswer as List<String>?) ?? [],
          onSelect: (ids) => onAnswer(ids),
        );

      case QuestionType.shortAnswer:
        return _ShortAnswerWidget(
          value: selectedAnswer as String?,
          onChanged: onAnswer,
        );
    }
  }
}

/// Multiple choice widget
class _MultipleChoiceWidget extends StatelessWidget {
  final List<QuestionOption> options;
  final String? selectedId;
  final Function(String) onSelect;

  const _MultipleChoiceWidget({
    required this.options,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: options.map((option) {
        final isSelected = selectedId == option.id;

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            onTap: () => onSelect(option.id),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(16),
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
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
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
                        ? const Icon(Icons.check, size: 16, color: Colors.white)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      option.text,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// Multiple select widget
class _MultipleSelectWidget extends StatelessWidget {
  final List<QuestionOption> options;
  final List<String> selectedIds;
  final Function(List<String>) onSelect;

  const _MultipleSelectWidget({
    required this.options,
    required this.selectedIds,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select all that apply',
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 13,
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 12),
        ...options.map((option) {
          final isSelected = selectedIds.contains(option.id);

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: InkWell(
              onTap: () {
                final newIds = List<String>.from(selectedIds);
                if (isSelected) {
                  newIds.remove(option.id);
                } else {
                  newIds.add(option.id);
                }
                onSelect(newIds);
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(16),
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
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
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
                          ? const Icon(Icons.check, size: 16, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text(option.text)),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }
}

/// Short answer widget
class _ShortAnswerWidget extends StatelessWidget {
  final String? value;
  final Function(String) onChanged;

  const _ShortAnswerWidget({
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: TextEditingController(text: value),
      decoration: const InputDecoration(
        hintText: 'Type your answer here...',
        border: OutlineInputBorder(),
      ),
      maxLines: 3,
      onChanged: onChanged,
    );
  }
}

/// Question navigator drawer
class _QuestionNavigator extends ConsumerWidget {
  final QuizState state;

  const _QuestionNavigator({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Questions',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                ),
                itemCount: state.questions.length,
                itemBuilder: (context, index) {
                  final question = state.questions[index];
                  final isAnswered = state.answers.containsKey(question.id);
                  final isCurrent = index == state.currentQuestionIndex;

                  return InkWell(
                    onTap: () {
                      ref.read(quizProvider.notifier).goToQuestion(index);
                      Navigator.of(context).pop();
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? Theme.of(context).colorScheme.primary
                            : isAnswered
                                ? Colors.green
                                : Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            color: isCurrent || isAnswered
                                ? Colors.white
                                : Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _LegendItem(color: Colors.green, label: 'Answered'),
                  const SizedBox(width: 16),
                  _LegendItem(
                    color: Theme.of(context).colorScheme.primary,
                    label: 'Current',
                  ),
                  const SizedBox(width: 16),
                  _LegendItem(color: Colors.grey[300]!, label: 'Not answered'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }
}

/// Quiz result screen
class _QuizResultScreen extends ConsumerWidget {
  final QuizResult result;
  final CertificationQuiz? quiz;

  const _QuizResultScreen({
    required this.result,
    this.quiz,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Result icon
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: result.passed
                        ? Colors.green.withValues(alpha: 0.1)
                        : Colors.red.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    result.passed ? Icons.check_circle : Icons.cancel,
                    size: 80,
                    color: result.passed ? Colors.green : Colors.red,
                  ),
                ),
                const SizedBox(height: 24),

                // Result text
                Text(
                  result.passed ? 'Congratulations!' : 'Not Quite There',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  result.passed
                      ? 'You passed the certification quiz!'
                      : 'Keep practicing and try again.',
                  style: TextStyle(color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Score card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${result.percentage}%',
                        style: Theme.of(context).textTheme.displayMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: result.passed ? Colors.green : Colors.red,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${result.score} / ${result.totalPoints} points',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _ResultStat(
                            value: '${result.questionResults.where((q) => q.isCorrect).length}',
                            label: 'Correct',
                            color: Colors.green,
                          ),
                          _ResultStat(
                            value: '${result.questionResults.where((q) => !q.isCorrect).length}',
                            label: 'Incorrect',
                            color: Colors.red,
                          ),
                          _ResultStat(
                            value: _formatTime(result.timeSpentSeconds),
                            label: 'Time',
                            color: Colors.blue,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Actions
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      ref.read(quizProvider.notifier).reset();
                      Navigator.of(context).pop();
                    },
                    child: const Text('Done'),
                  ),
                ),
                if (!result.passed) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        // Would need to get programId from quiz
                        ref.read(quizProvider.notifier).reset();
                        // ref.read(quizProvider.notifier).startQuiz(programId);
                      },
                      child: const Text('Try Again'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes}m ${secs}s';
  }
}

class _ResultStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const _ResultStat({
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}
