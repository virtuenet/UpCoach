import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:audio_waveforms/audio_waveforms.dart';
import 'dart:async';
import '../providers/voice_journal_provider.dart';
import '../../../core/services/voice_recording_service.dart';

class VoiceJournalRecordingScreen extends ConsumerStatefulWidget {
  const VoiceJournalRecordingScreen({super.key});

  @override
  ConsumerState<VoiceJournalRecordingScreen> createState() =>
      _VoiceJournalRecordingScreenState();
}

class _VoiceJournalRecordingScreenState
    extends ConsumerState<VoiceJournalRecordingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  
  final TextEditingController _titleController = TextEditingController();
  final RecorderController _waveformController = RecorderController();
  
  bool _isRecording = false;
  bool _isPaused = false;
  Duration _recordingDuration = Duration.zero;
  Timer? _durationTimer;
  double _currentAmplitude = 0.0;
  AudioQuality _selectedQuality = AudioQuality.medium;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _initializeWaveform();
  }

  void _setupAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
  }

  Future<void> _initializeWaveform() async {
    await _waveformController.checkPermission();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _titleController.dispose();
    _waveformController.dispose();
    _durationTimer?.cancel();
    super.dispose();
  }

  Future<void> _startRecording() async {
    final voiceJournalNotifier = ref.read(voiceJournalProvider.notifier);
    final recordingService = ref.read(voiceRecordingServiceProvider);
    
    // Haptic feedback
    HapticFeedback.mediumImpact();
    
    final success = await voiceJournalNotifier.startRecording();
    
    if (success) {
      setState(() {
        _isRecording = true;
        _isPaused = false;
        _recordingDuration = Duration.zero;
      });
      
      _pulseController.repeat(reverse: true);
      _startDurationTimer();
      
      // Listen to amplitude changes
      recordingService.amplitudeStream.listen((amplitude) {
        if (mounted) {
          setState(() {
            _currentAmplitude = amplitude;
          });
        }
      });
    } else {
      _showErrorSnackBar('Failed to start recording. Please check microphone permissions.');
    }
  }

  void _startDurationTimer() {
    _durationTimer?.cancel();
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _isRecording && !_isPaused) {
        setState(() {
          _recordingDuration = Duration(seconds: timer.tick);
        });
      }
    });
  }

  Future<void> _pauseRecording() async {
    final voiceJournalNotifier = ref.read(voiceJournalProvider.notifier);
    
    HapticFeedback.lightImpact();
    
    if (_isPaused) {
      await voiceJournalNotifier.resumeRecording();
      setState(() {
        _isPaused = false;
      });
      _pulseController.repeat(reverse: true);
    } else {
      await voiceJournalNotifier.pauseRecording();
      setState(() {
        _isPaused = true;
      });
      _pulseController.stop();
    }
  }

  Future<void> _stopRecording() async {
    final voiceJournalNotifier = ref.read(voiceJournalProvider.notifier);
    
    HapticFeedback.heavyImpact();
    
    // Show title dialog
    final title = await _showTitleDialog();
    if (title == null) return;
    
    final entry = await voiceJournalNotifier.stopRecording(title: title);
    
    setState(() {
      _isRecording = false;
      _isPaused = false;
    });
    
    _pulseController.stop();
    _pulseController.reset();
    _durationTimer?.cancel();
    
    if (entry != null && mounted) {
      // Show success and navigate back
      _showSuccessDialog(entry.id);
    }
  }

  Future<void> _cancelRecording() async {
    final confirmed = await _showConfirmationDialog(
      'Cancel Recording',
      'Are you sure you want to cancel this recording? All audio will be lost.',
    );
    
    if (confirmed == true) {
      final voiceJournalNotifier = ref.read(voiceJournalProvider.notifier);
      await voiceJournalNotifier.cancelRecording();
      
      setState(() {
        _isRecording = false;
        _isPaused = false;
        _recordingDuration = Duration.zero;
      });
      
      _pulseController.stop();
      _pulseController.reset();
      _durationTimer?.cancel();
      
      if (mounted) {
        Navigator.of(context).pop();
      }
    }
  }

  Future<String?> _showTitleDialog() async {
    _titleController.clear();
    
    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Save Voice Journal'),
          content: TextField(
            controller: _titleController,
            autofocus: true,
            decoration: InputDecoration(
              hintText: 'Enter a title for this journal',
              labelText: 'Title',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            textCapitalization: TextCapitalization.sentences,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final title = _titleController.text.trim();
                Navigator.of(context).pop(
                  title.isEmpty ? 'Voice Journal ${DateTime.now().day}/${DateTime.now().month}' : title
                );
              },
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  Future<bool?> _showConfirmationDialog(String title, String message) async {
    return showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('No'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Yes'),
            ),
          ],
        );
      },
    );
  }

  void _showSuccessDialog(String entryId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green, size: 28),
              SizedBox(width: 12),
              Text('Saved Successfully'),
            ],
          ),
          content: const Text('Your voice journal has been saved. Would you like to transcribe it now?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
              },
              child: const Text('Later'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
                // Navigate to transcription
                ref.read(voiceJournalProvider.notifier).transcribeEntry(entryId);
              },
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Transcribe Now'),
            ),
          ],
        );
      },
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (duration.inHours > 0) {
      final hours = duration.inHours.toString().padLeft(2, '0');
      return '$hours:$minutes:$seconds';
    }
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final voiceJournalState = ref.watch(voiceJournalProvider);
    
    return WillPopScope(
      onWillPop: () async {
        if (_isRecording) {
          await _cancelRecording();
          return false;
        }
        return true;
      },
      child: Scaffold(
        backgroundColor: theme.colorScheme.background,
        appBar: AppBar(
          title: const Text('Voice Journal'),
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.transparent,
          actions: [
            if (!_isRecording)
              PopupMenuButton<AudioQuality>(
                icon: const Icon(Icons.settings),
                onSelected: (quality) {
                  setState(() {
                    _selectedQuality = quality;
                  });
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: AudioQuality.low,
                    child: Text('Low Quality (Smaller File)'),
                  ),
                  const PopupMenuItem(
                    value: AudioQuality.medium,
                    child: Text('Medium Quality (Balanced)'),
                  ),
                  const PopupMenuItem(
                    value: AudioQuality.high,
                    child: Text('High Quality (Larger File)'),
                  ),
                ],
              ),
          ],
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                const Spacer(),
                
                // Recording visualization
                if (_isRecording) ...[
                  // Waveform display
                  Container(
                    height: 100,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: AudioWaveforms(
                      size: Size(MediaQuery.of(context).size.width - 80, 100),
                      recorderController: _waveformController,
                      waveStyle: WaveStyle(
                        waveColor: theme.colorScheme.primary.withOpacity(0.8),
                        middleLineColor: theme.colorScheme.primary,
                        spacing: 8,
                        waveCap: StrokeCap.round,
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Duration display
                  Text(
                    _formatDuration(_recordingDuration),
                    style: theme.textTheme.displayMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontFeatures: [const FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Status text
                  Text(
                    _isPaused ? 'Paused' : 'Recording...',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: _isPaused ? Colors.orange : Colors.red,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  
                  // Amplitude indicator
                  const SizedBox(height: 20),
                  LinearProgressIndicator(
                    value: _currentAmplitude,
                    backgroundColor: theme.colorScheme.surfaceVariant,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _currentAmplitude > 0.7 ? Colors.red : theme.colorScheme.primary,
                    ),
                    minHeight: 4,
                  ),
                ] else ...[
                  // Pre-recording state
                  Icon(
                    Icons.mic_none_rounded,
                    size: 120,
                    color: theme.colorScheme.primary.withOpacity(0.3),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Tap to start recording',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Quality: ${_selectedQuality.name.toUpperCase()}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.5),
                    ),
                  ),
                ],
                
                const Spacer(),
                
                // Control buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Cancel button
                    if (_isRecording)
                      _buildControlButton(
                        icon: Icons.close,
                        color: Colors.red,
                        onPressed: _cancelRecording,
                        size: 56,
                      ),
                    
                    // Main record/stop button
                    AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _isRecording ? _pulseAnimation.value : 1.0,
                          child: _buildMainButton(),
                        );
                      },
                    ),
                    
                    // Pause/Resume button
                    if (_isRecording)
                      _buildControlButton(
                        icon: _isPaused ? Icons.play_arrow : Icons.pause,
                        color: theme.colorScheme.primary,
                        onPressed: _pauseRecording,
                        size: 56,
                      ),
                  ],
                ),
                
                const SizedBox(height: 40),
                
                // Tips
                if (!_isRecording)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.lightbulb_outline,
                          color: theme.colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Speak clearly and naturally. You can pause anytime.',
                            style: theme.textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMainButton() {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: _isRecording ? _stopRecording : _startRecording,
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: _isRecording ? Colors.red : theme.colorScheme.primary,
          boxShadow: [
            BoxShadow(
              color: (_isRecording ? Colors.red : theme.colorScheme.primary)
                  .withOpacity(0.3),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Icon(
          _isRecording ? Icons.stop : Icons.mic,
          color: Colors.white,
          size: 36,
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
    double size = 56,
  }) {
    return Material(
      color: color.withOpacity(0.1),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onPressed,
        customBorder: const CircleBorder(),
        child: Container(
          width: size,
          height: size,
          alignment: Alignment.center,
          child: Icon(
            icon,
            color: color,
            size: 28,
          ),
        ),
      ),
    );
  }
}