import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:upcoach_mobile/core/theme/app_colors.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:upcoach_mobile/shared/widgets/custom_app_bar.dart';
import 'package:upcoach_mobile/shared/widgets/loading_indicator.dart';
import '../../domain/services/ai_service.dart';
import '../../domain/models/ai_response.dart';
import 'package:upcoach_mobile/features/voice_journal/widgets/voice_recording_widget.dart';
import 'package:upcoach_mobile/core/services/voice_recording_service.dart';

final voiceAnalysisProvider = StateProvider<VoiceAnalysis?>((ref) => null);

class VoiceCoachScreen extends ConsumerStatefulWidget {
  const VoiceCoachScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<VoiceCoachScreen> createState() => _VoiceCoachScreenState();
}

class _VoiceCoachScreenState extends ConsumerState<VoiceCoachScreen> {
  bool _isAnalyzing = false;
  bool _isRecording = false;
  String? _audioFilePath;

  @override
  Widget build(BuildContext context) {
    final voiceAnalysis = ref.watch(voiceAnalysisProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(title: 'Voice Coach'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            _buildIntroCard(),
            const SizedBox(height: UIConstants.spacingLG),
            _buildRecordingSection(),
            if (_isAnalyzing) ...[
              const SizedBox(height: UIConstants.spacingLG),
              const Center(child: LoadingIndicator()),
              const SizedBox(height: UIConstants.spacingSM),
              Text(
                'Analyzing your voice...',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
            if (voiceAnalysis != null && !_isAnalyzing) ...[
              const SizedBox(height: UIConstants.spacingLG),
              _buildAnalysisResults(voiceAnalysis),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildIntroCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            Icon(
              Icons.mic_rounded,
              size: 48,
              color: AppColors.primary,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              'AI Voice Analysis',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'Record your voice to get insights about your emotional state, stress levels, and energy. Our AI coach will provide personalized feedback based on your voice patterns.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordingSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        child: Column(
          children: [
            Text(
              _isRecording ? 'Recording...' : 'Tap to Record',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            VoiceRecordingWidget(
              onRecordingComplete: (filePath) {
                setState(() {
                  _audioFilePath = filePath;
                });
                _analyzeVoice(File(filePath));
              },
              onRecordingStart: () {
                setState(() {
                  _isRecording = true;
                });
              },
              onRecordingStop: () {
                setState(() {
                  _isRecording = false;
                });
              },
            ),
            if (!_isRecording) ...[
              const SizedBox(height: UIConstants.spacingMD),
              Text(
                'Speak naturally for 10-30 seconds',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAnalysisResults(VoiceAnalysis analysis) {
    return Column(
      children: [
        _buildEmotionCard(analysis),
        const SizedBox(height: UIConstants.spacingMD),
        _buildMetricsCard(analysis),
        if (analysis.insights != null && analysis.insights!.isNotEmpty) ...[
          const SizedBox(height: UIConstants.spacingMD),
          _buildInsightsCard(analysis),
        ],
        const SizedBox(height: UIConstants.spacingMD),
        _buildCoachingCard(analysis),
      ],
    );
  }

  Widget _buildEmotionCard(VoiceAnalysis analysis) {
    final emotions = analysis.emotions.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.sentiment_satisfied, color: AppColors.primary),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  'Emotional Analysis',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            ...emotions.map((emotion) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        emotion.key.toUpperCase(),
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        '${(emotion.value * 100).toInt()}%',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.spacingXS),
                  LinearProgressIndicator(
                    value: emotion.value,
                    backgroundColor: AppColors.surface,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _getEmotionColor(emotion.key),
                    ),
                  ),
                ],
              ),
            )).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricsCard(VoiceAnalysis analysis) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          children: [
            _buildMetricRow(
              'Stress Level',
              analysis.stressLevel,
              Icons.warning,
              AppColors.warning,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            _buildMetricRow(
              'Energy Level',
              analysis.energyLevel,
              Icons.battery_charging_full,
              AppColors.success,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            _buildMetricRow(
              'Voice Clarity',
              analysis.clarity,
              Icons.record_voice_over,
              AppColors.info,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricRow(String label, double value, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(width: UIConstants.spacingMD),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: UIConstants.spacingXS),
              LinearProgressIndicator(
                value: value,
                backgroundColor: AppColors.surface,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ],
          ),
        ),
        const SizedBox(width: UIConstants.spacingMD),
        Text(
          '${(value * 100).toInt()}%',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildInsightsCard(VoiceAnalysis analysis) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lightbulb, color: AppColors.warning),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  'Voice Insights',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            ...analysis.insights!.map((insight) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle, size: 20, color: AppColors.success),
                  const SizedBox(width: UIConstants.spacingSM),
                  Expanded(
                    child: Text(
                      insight,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            )).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildCoachingCard(VoiceAnalysis analysis) {
    return Card(
      elevation: 2,
      color: AppColors.primary.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.psychology, color: AppColors.primary),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  'AI Coach Recommendations',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              _getCoachingAdvice(analysis),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            ElevatedButton.icon(
              onPressed: () => context.go('/ai-coach'),
              icon: const Icon(Icons.chat),
              label: const Text('Chat with AI Coach'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _analyzeVoice(File audioFile) async {
    setState(() {
      _isAnalyzing = true;
    });

    try {
      final aiService = ref.read(aiServiceProvider);
      final analysis = await aiService.analyzeVoice(audioFile);
      
      ref.read(voiceAnalysisProvider.notifier).state = analysis;
      
      // Get coaching advice
      final sessionId = analysis.sessionId;
      await aiService.getVoiceCoaching(sessionId);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to analyze voice: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      setState(() {
        _isAnalyzing = false;
      });
    }
  }

  Color _getEmotionColor(String emotion) {
    switch (emotion.toLowerCase()) {
      case 'happy':
      case 'joy':
        return AppColors.success;
      case 'sad':
      case 'angry':
        return AppColors.error;
      case 'calm':
      case 'neutral':
        return AppColors.info;
      case 'excited':
        return AppColors.warning;
      default:
        return AppColors.secondary;
    }
  }

  String _getCoachingAdvice(VoiceAnalysis analysis) {
    if (analysis.stressLevel > 0.7) {
      return "Your voice indicates elevated stress levels. Consider taking a few deep breaths and practicing relaxation techniques. Would you like to explore stress management strategies?";
    } else if (analysis.energyLevel < 0.3) {
      return "Your energy seems low right now. This might be a good time for rest or gentle activities. Let's discuss ways to boost your energy naturally.";
    } else if (analysis.emotions['happy'] != null && analysis.emotions['happy']! > 0.6) {
      return "You sound positive and energetic! This is a great time to tackle challenging goals or connect with others. How can we build on this positive momentum?";
    } else {
      return "Your voice patterns show a balanced emotional state. Let's explore how to maintain this equilibrium and work towards your goals effectively.";
    }
  }
}