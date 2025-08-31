import 'dart:async';
import 'dart:io';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum RecordingState {
  idle,
  recording,
  paused,
  stopped,
}

class VoiceRecordingService {
  AudioRecorder? _recorder;
  AudioPlayer? _player;
  
  RecordingState _state = RecordingState.idle;
  String? _currentRecordingPath;
  Duration _recordingDuration = Duration.zero;
  Timer? _timer;
  
  final StreamController<RecordingState> _stateController = StreamController<RecordingState>.broadcast();
  final StreamController<Duration> _durationController = StreamController<Duration>.broadcast();
  final StreamController<double> _amplitudeController = StreamController<double>.broadcast();
  
  // Getters
  RecordingState get state => _state;
  String? get currentRecordingPath => _currentRecordingPath;
  Duration get recordingDuration => _recordingDuration;
  
  // Streams
  Stream<RecordingState> get stateStream => _stateController.stream;
  Stream<Duration> get durationStream => _durationController.stream;
  Stream<double> get amplitudeStream => _amplitudeController.stream;
  
  // Initialize the service
  Future<void> initialize() async {
    _recorder = AudioRecorder();
    _player = AudioPlayer();
  }
  
  // Request microphone permission
  Future<bool> requestPermission() async {
    final permission = await Permission.microphone.request();
    return permission == PermissionStatus.granted;
  }
  
  // Check if microphone permission is granted
  Future<bool> hasPermission() async {
    final permission = await Permission.microphone.status;
    return permission == PermissionStatus.granted;
  }
  
  // Start recording
  Future<bool> startRecording() async {
    if (_state != RecordingState.idle) return false;
    
    if (!await hasPermission()) {
      if (!await requestPermission()) {
        return false;
      }
    }
    
    try {
      // Generate unique filename
      final appDir = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      _currentRecordingPath = '${appDir.path}/voice_journal_$timestamp.aac';
      
      await _recorder!.start(
        RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
        ),
        path: _currentRecordingPath!,
      );
      
      _setState(RecordingState.recording);
      _startTimer();
      _startAmplitudeMonitoring();
      
      return true;
    } catch (e) {
      print('Error starting recording: $e');
      return false;
    }
  }
  
  // Pause recording
  Future<void> pauseRecording() async {
    if (_state == RecordingState.recording) {
      await _recorder!.pause();
      _setState(RecordingState.paused);
      _stopTimer();
    }
  }
  
  // Resume recording
  Future<void> resumeRecording() async {
    if (_state == RecordingState.paused) {
      await _recorder!.resume();
      _setState(RecordingState.recording);
      _startTimer();
    }
  }
  
  // Stop recording
  Future<String?> stopRecording() async {
    if (_state == RecordingState.recording || _state == RecordingState.paused) {
      final recordedPath = await _recorder!.stop();
      _setState(RecordingState.stopped);
      _stopTimer();
      
      final path = recordedPath ?? _currentRecordingPath;
      _currentRecordingPath = null;
      _recordingDuration = Duration.zero;
      
      return path;
    }
    return null;
  }
  
  // Cancel recording
  Future<void> cancelRecording() async {
    if (_state == RecordingState.recording || _state == RecordingState.paused) {
      await _recorder!.stop();
      
      // Delete the file
      if (_currentRecordingPath != null) {
        final file = File(_currentRecordingPath!);
        if (await file.exists()) {
          await file.delete();
        }
      }
      
      _setState(RecordingState.idle);
      _stopTimer();
      _currentRecordingPath = null;
      _recordingDuration = Duration.zero;
    }
  }
  
  // Play recorded audio
  Future<void> playRecording(String filePath) async {
    try {
      await _player!.play(DeviceFileSource(filePath));
    } catch (e) {
      print('Error playing recording: $e');
    }
  }
  
  // Stop playback
  Future<void> stopPlayback() async {
    await _player!.stop();
  }
  
  // Get recording file size
  Future<int> getRecordingSize(String filePath) async {
    final file = File(filePath);
    if (await file.exists()) {
      return await file.length();
    }
    return 0;
  }
  
  // Get recording duration from file
  Future<Duration> getRecordingDuration(String filePath) async {
    // This would require additional audio processing libraries
    // For now, return the recorded duration
    return _recordingDuration;
  }
  
  // Delete recording file
  Future<bool> deleteRecording(String filePath) async {
    try {
      final file = File(filePath);
      if (await file.exists()) {
        await file.delete();
        return true;
      }
      return false;
    } catch (e) {
      print('Error deleting recording: $e');
      return false;
    }
  }
  
  // Private methods
  void _setState(RecordingState newState) {
    _state = newState;
    _stateController.add(_state);
  }
  
  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _recordingDuration = Duration(seconds: timer.tick);
      _durationController.add(_recordingDuration);
    });
  }
  
  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }
  
  void _startAmplitudeMonitoring() {
    Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (_state != RecordingState.recording) {
        timer.cancel();
        return;
      }
      
      // Get amplitude from recorder
      // This is a simplified implementation
      final amplitude = 0.5; // Placeholder
      _amplitudeController.add(amplitude);
    });
  }
  
  // Clean up resources
  Future<void> dispose() async {
    await _recorder?.dispose();
    await _player?.dispose();
    await _stateController.close();
    await _durationController.close();
    await _amplitudeController.close();
    _timer?.cancel();
  }
}

// Provider for VoiceRecordingService
final voiceRecordingServiceProvider = Provider<VoiceRecordingService>((ref) {
  final service = VoiceRecordingService();
  ref.onDispose(() => service.dispose());
  return service;
}); 