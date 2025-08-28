import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:audio_waveforms/audio_waveforms.dart'; // Removed unused import
import '../../../core/theme/app_theme.dart';
import '../providers/voice_journal_provider.dart';
import '../../../core/services/voice_recording_service.dart';

class VoiceRecordingWidget extends ConsumerStatefulWidget {
  const VoiceRecordingWidget({super.key});

  @override
  ConsumerState<VoiceRecordingWidget> createState() => _VoiceRecordingWidgetState();
}

class _VoiceRecordingWidgetState extends ConsumerState<VoiceRecordingWidget>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _scaleController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scaleAnimation;
  
  final TextEditingController _titleController = TextEditingController();
  bool _isRecording = false;
  Duration _recordingDuration = Duration.zero;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scaleController.dispose();
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final voiceJournalState = ref.watch(voiceJournalProvider);
    final voiceRecordingService = ref.watch(voiceRecordingServiceProvider);
    
    _isRecording = voiceJournalState.isRecording;
    
    // Listen to recording state changes
    ref.listen(voiceRecordingServiceProvider, (previous, next) {
      next.stateStream.listen((state) {
        if (state == RecordingState.recording) {
          _pulseController.repeat(reverse: true);
        } else {
          _pulseController.stop();
        }
      });
      
      next.durationStream.listen((duration) {
        setState(() {
          _recordingDuration = duration;
        });
      });
    });

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          // Title Input
          Container(
            margin: const EdgeInsets.only(bottom: 32),
            child: TextField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: 'Journal Entry Title (Optional)',
                hintText: 'What\'s on your mind?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                ),
                prefixIcon: const Icon(Icons.title),
              ),
              maxLength: 100,
            ),
          ),

          // Recording Duration Display
          if (_isRecording)
            Container(
              margin: const EdgeInsets.only(bottom: 24),
              child: Text(
                _formatDuration(_recordingDuration),
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),

          // Waveform Visualization (Placeholder)
          Container(
            height: 100,
            margin: const EdgeInsets.only(bottom: 32),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(UIConstants.radiusLG),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: _isRecording
                ? const Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.graphic_eq, color: AppTheme.primaryColor),
                        SizedBox(width: UIConstants.spacingSM),
                        Text(
                          'Recording audio waveform...',
                          style: TextStyle(color: AppTheme.primaryColor),
                        ),
                      ],
                    ),
                  )
                : const Center(
                    child: Text(
                      'Waveform will appear here during recording',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
          ),

          // Recording Controls
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Main Record Button
                GestureDetector(
                  onTapDown: (_) => _scaleController.forward(),
                  onTapUp: (_) => _scaleController.reverse(),
                  onTapCancel: () => _scaleController.reverse(),
                  onTap: _isRecording ? null : _startRecording,
                  child: AnimatedBuilder(
                    animation: _isRecording ? _pulseAnimation : _scaleAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _isRecording ? _pulseAnimation.value : _scaleAnimation.value,
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isRecording ? Colors.red : AppTheme.primaryColor,
                            boxShadow: [
                              BoxShadow(
                                color: (_isRecording ? Colors.red : AppTheme.primaryColor)
                                    .withOpacity(0.3),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Icon(
                            _isRecording ? Icons.stop : Icons.mic,
                            size: 60,
                            color: Colors.white,
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: UIConstants.spacingLG),

                // Recording Status Text
                Text(
                  _isRecording ? 'Recording...' : 'Tap to start recording',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey,
                  ),
                ),

                const SizedBox(height: UIConstants.spacingXL),

                // Action Buttons (shown when recording)
                if (_isRecording) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Cancel Button
                      ElevatedButton.icon(
                        onPressed: _cancelRecording,
                        icon: const Icon(Icons.close),
                        label: const Text('Cancel'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey.shade600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),

                      // Pause/Resume Button
                      ElevatedButton.icon(
                        onPressed: _togglePauseResume,
                        icon: Icon(voiceRecordingService.state == RecordingState.paused
                            ? Icons.play_arrow
                            : Icons.pause),
                        label: Text(voiceRecordingService.state == RecordingState.paused
                            ? 'Resume'
                            : 'Pause'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.secondaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),

                      // Save Button
                      ElevatedButton.icon(
                        onPressed: _stopAndSaveRecording,
                        icon: const Icon(Icons.save),
                        label: const Text('Save'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // Tips Section
          if (!_isRecording)
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                border: Border.all(
                  color: AppTheme.primaryColor.withOpacity(0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb_outline,
                        color: AppTheme.primaryColor,
                        size: 20,
                      ),
                      const SizedBox(width: UIConstants.spacingSM),
                      Text(
                        'Recording Tips',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  const Text(
                    '• Find a quiet space for better audio quality\n'
                    '• Speak clearly and at a normal pace\n'
                    '• Your recording will be automatically transcribed\n'
                    '• You can pause and resume anytime during recording',
                    style: TextStyle(fontSize: 14),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _startRecording() async {
    final success = await ref.read(voiceJournalProvider.notifier).startRecording();
    if (!success) {
      _showErrorSnackBar('Failed to start recording. Please check microphone permissions.');
    }
  }

  Future<void> _stopAndSaveRecording() async {
    final entry = await ref.read(voiceJournalProvider.notifier).stopRecording(
      title: _titleController.text.trim(),
    );
    
    if (entry != null) {
      _titleController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Voice journal "${entry.title}" saved successfully!'),
          backgroundColor: Colors.green,
          action: SnackBarAction(
            label: 'Transcribe',
            textColor: Colors.white,
            onPressed: () {
              ref.read(voiceJournalProvider.notifier).transcribeEntry(entry.id);
            },
          ),
        ),
      );
    } else {
      _showErrorSnackBar('Failed to save recording.');
    }
  }

  Future<void> _cancelRecording() async {
    await ref.read(voiceJournalProvider.notifier).cancelRecording();
    _titleController.clear();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Recording cancelled'),
        backgroundColor: Colors.orange,
      ),
    );
  }

  Future<void> _togglePauseResume() async {
    final voiceRecordingService = ref.read(voiceRecordingServiceProvider);
    if (voiceRecordingService.state == RecordingState.paused) {
      await ref.read(voiceJournalProvider.notifier).resumeRecording();
    } else {
      await ref.read(voiceJournalProvider.notifier).pauseRecording();
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes);
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }
} 