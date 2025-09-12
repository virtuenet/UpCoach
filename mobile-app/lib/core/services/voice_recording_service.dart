import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_waveforms/audio_waveforms.dart';

enum RecordingState {
  idle,
  recording,
  paused,
  stopped,
  playing,
}

enum AudioQuality {
  low,    // 16kHz, 16bit
  medium, // 44.1kHz, 16bit  
  high,   // 48kHz, 24bit
}

class VoiceRecordingService {
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();
  final PlayerController _waveformPlayer = PlayerController();
  final RecorderController _waveformRecorder = RecorderController();
  
  RecordingState _state = RecordingState.idle;
  StreamController<RecordingState>? _stateController;
  StreamController<Duration>? _durationController;
  StreamController<double>? _amplitudeController;
  
  Timer? _durationTimer;
  Timer? _amplitudeTimer;
  Duration _recordingDuration = Duration.zero;
  String? _currentRecordingPath;
  DateTime? _recordingStartTime;
  
  // Audio settings
  AudioQuality _audioQuality = AudioQuality.medium;
  bool _noiseReduction = true;
  bool _echoCancellation = true;
  
  RecordingState get state => _state;
  Duration get recordingDuration => _recordingDuration;
  Stream<RecordingState> get stateStream => _stateController?.stream ?? const Stream.empty();
  Stream<Duration> get durationStream => _durationController?.stream ?? const Stream.empty();
  Stream<double> get amplitudeStream => _amplitudeController?.stream ?? const Stream.empty();
  
  Future<void> initialize() async {
    _stateController = StreamController<RecordingState>.broadcast();
    _durationController = StreamController<Duration>.broadcast();
    _amplitudeController = StreamController<double>.broadcast();
    
    // Initialize waveform controllers
    await _waveformRecorder.checkPermission();
    _waveformPlayer.addListener(() {
      if (_waveformPlayer.playerState == PlayerState.stopped) {
        _setState(RecordingState.idle);
      }
    });
  }
  
  Future<void> dispose() async {
    await stopRecording();
    await stopPlayback();
    await _stateController?.close();
    await _durationController?.close();
    await _amplitudeController?.close();
    _durationTimer?.cancel();
    _amplitudeTimer?.cancel();
    await _recorder.dispose();
    await _player.dispose();
    _waveformPlayer.dispose();
    _waveformRecorder.dispose();
  }
  
  Future<bool> checkPermissions() async {
    final status = await Permission.microphone.status;
    if (status.isDenied || status.isPermanentlyDenied) {
      final result = await Permission.microphone.request();
      return result.isGranted;
    }
    return status.isGranted;
  }
  
  Future<bool> startRecording({
    AudioQuality quality = AudioQuality.medium,
    bool noiseReduction = true,
    bool echoCancellation = true,
  }) async {
    try {
      // Check permissions
      final hasPermission = await checkPermissions();
      if (!hasPermission) {
        debugPrint('Microphone permission denied');
        return false;
      }
      
      // Check if recording is supported
      if (!await _recorder.hasPermission()) {
        debugPrint('Recording not supported on this device');
        return false;
      }
      
      _audioQuality = quality;
      _noiseReduction = noiseReduction;
      _echoCancellation = echoCancellation;
      
      // Generate unique filename
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'voice_journal_$timestamp.m4a';
      _currentRecordingPath = path.join(directory.path, fileName);
      
      // Configure recording settings based on quality
      RecordConfig config;
      switch (quality) {
        case AudioQuality.low:
          config = const RecordConfig(
            encoder: AudioEncoder.aacLc,
            bitRate: 64000,
            sampleRate: 16000,
            numChannels: 1,
            autoGain: true,
            echoCancel: true,
            noiseSuppress: true,
          );
          break;
        case AudioQuality.medium:
          config = const RecordConfig(
            encoder: AudioEncoder.aacLc,
            bitRate: 128000,
            sampleRate: 44100,
            numChannels: 1,
            autoGain: true,
            echoCancel: true,
            noiseSuppress: true,
          );
          break;
        case AudioQuality.high:
          config = const RecordConfig(
            encoder: AudioEncoder.aacLc,
            bitRate: 256000,
            sampleRate: 48000,
            numChannels: 2,
            autoGain: false,
            echoCancel: true,
            noiseSuppress: true,
          );
          break;
      }
      
      // Start recording with waveform capture
      await _recorder.start(config, path: _currentRecordingPath!);
      await _waveformRecorder.record(path: _currentRecordingPath);
      
      _recordingStartTime = DateTime.now();
      _recordingDuration = Duration.zero;
      _setState(RecordingState.recording);
      
      // Start duration timer
      _durationTimer?.cancel();
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (_state == RecordingState.recording) {
          _recordingDuration = DateTime.now().difference(_recordingStartTime!);
          _durationController?.add(_recordingDuration);
        }
      });
      
      // Start amplitude monitoring
      _amplitudeTimer?.cancel();
      _amplitudeTimer = Timer.periodic(const Duration(milliseconds: 100), (_) async {
        if (_state == RecordingState.recording) {
          final amplitude = await _recorder.getAmplitude();
          _amplitudeController?.add(amplitude.current);
        }
      });
      
      return true;
    } catch (e) {
      debugPrint('Failed to start recording: $e');
      _setState(RecordingState.idle);
      return false;
    }
  }
  
  Future<String?> stopRecording() async {
    if (_state != RecordingState.recording && _state != RecordingState.paused) {
      return null;
    }
    
    try {
      final recordingPath = await _recorder.stop();
      await _waveformRecorder.stop();
      
      _durationTimer?.cancel();
      _amplitudeTimer?.cancel();
      _setState(RecordingState.stopped);
      
      // Generate waveform data
      if (recordingPath != null) {
        await _generateWaveformData(recordingPath);
      }
      
      return recordingPath;
    } catch (e) {
      debugPrint('Failed to stop recording: $e');
      return null;
    }
  }
  
  Future<void> pauseRecording() async {
    if (_state != RecordingState.recording) return;
    
    try {
      await _recorder.pause();
      await _waveformRecorder.pause();
      _durationTimer?.cancel();
      _amplitudeTimer?.cancel();
      _setState(RecordingState.paused);
    } catch (e) {
      debugPrint('Failed to pause recording: $e');
    }
  }
  
  Future<void> resumeRecording() async {
    if (_state != RecordingState.paused) return;
    
    try {
      await _recorder.resume();
      await _waveformRecorder.record();
      _setState(RecordingState.recording);
      
      // Resume timers
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (_state == RecordingState.recording) {
          _recordingDuration = DateTime.now().difference(_recordingStartTime!);
          _durationController?.add(_recordingDuration);
        }
      });
      
      _amplitudeTimer = Timer.periodic(const Duration(milliseconds: 100), (_) async {
        if (_state == RecordingState.recording) {
          final amplitude = await _recorder.getAmplitude();
          _amplitudeController?.add(amplitude.current);
        }
      });
    } catch (e) {
      debugPrint('Failed to resume recording: $e');
    }
  }
  
  Future<void> cancelRecording() async {
    if (_state != RecordingState.recording && _state != RecordingState.paused) {
      return;
    }
    
    try {
      final recordingPath = await _recorder.stop();
      await _waveformRecorder.stop();
      
      // Delete the cancelled recording file
      if (recordingPath != null) {
        final file = File(recordingPath);
        if (await file.exists()) {
          await file.delete();
        }
      }
      
      _durationTimer?.cancel();
      _amplitudeTimer?.cancel();
      _recordingDuration = Duration.zero;
      _currentRecordingPath = null;
      _setState(RecordingState.idle);
    } catch (e) {
      debugPrint('Failed to cancel recording: $e');
    }
  }
  
  Future<void> playRecording(String audioPath, {double speed = 1.0}) async {
    try {
      await stopPlayback(); // Stop any existing playback
      
      final file = File(audioPath);
      if (!await file.exists()) {
        debugPrint('Audio file not found: $audioPath');
        return;
      }
      
      await _player.setFilePath(audioPath);
      await _player.setSpeed(speed);
      _setState(RecordingState.playing);
      
      // Listen for playback completion
      _player.playerStateStream.listen((state) {
        if (state.processingState == ProcessingState.completed) {
          _setState(RecordingState.idle);
        }
      });
      
      await _player.play();
    } catch (e) {
      debugPrint('Failed to play recording: $e');
      _setState(RecordingState.idle);
    }
  }
  
  Future<void> playWithWaveform(String audioPath, {double speed = 1.0}) async {
    try {
      await _waveformPlayer.preparePlayer(
        path: audioPath,
        shouldExtractWaveform: true,
        noOfSamples: 100,
        volume: 1.0,
      );
      
      _waveformPlayer.setRate(speed);
      await _waveformPlayer.startPlayer();
      _setState(RecordingState.playing);
    } catch (e) {
      debugPrint('Failed to play with waveform: $e');
    }
  }
  
  Future<void> stopPlayback() async {
    try {
      if (_player.playing) {
        await _player.stop();
      }
      if (_waveformPlayer.playerState == PlayerState.playing) {
        await _waveformPlayer.stopPlayer();
      }
      _setState(RecordingState.idle);
    } catch (e) {
      debugPrint('Failed to stop playback: $e');
    }
  }
  
  Future<void> pausePlayback() async {
    try {
      if (_player.playing) {
        await _player.pause();
      }
      if (_waveformPlayer.playerState == PlayerState.playing) {
        await _waveformPlayer.pausePlayer();
      }
      _setState(RecordingState.paused);
    } catch (e) {
      debugPrint('Failed to pause playback: $e');
    }
  }
  
  Future<void> seekTo(Duration position) async {
    try {
      await _player.seek(position);
    } catch (e) {
      debugPrint('Failed to seek: $e');
    }
  }
  
  Future<void> setPlaybackSpeed(double speed) async {
    try {
      await _player.setSpeed(speed);
      _waveformPlayer.setRate(speed);
    } catch (e) {
      debugPrint('Failed to set playback speed: $e');
    }
  }
  
  Future<bool> deleteRecording(String audioPath) async {
    try {
      final file = File(audioPath);
      if (await file.exists()) {
        await file.delete();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to delete recording: $e');
      return false;
    }
  }
  
  Future<Map<String, dynamic>> getAudioInfo(String audioPath) async {
    try {
      final file = File(audioPath);
      if (!await file.exists()) {
        return {};
      }
      
      final fileSize = await file.length();
      final duration = await _player.setFilePath(audioPath);
      
      return {
        'path': audioPath,
        'sizeBytes': fileSize,
        'sizeMB': (fileSize / (1024 * 1024)).toStringAsFixed(2),
        'durationSeconds': duration?.inSeconds ?? 0,
        'durationFormatted': _formatDuration(duration ?? Duration.zero),
      };
    } catch (e) {
      debugPrint('Failed to get audio info: $e');
      return {};
    }
  }
  
  Future<List<double>> _generateWaveformData(String audioPath) async {
    try {
      final waveform = <double>[];
      await _waveformPlayer.preparePlayer(
        path: audioPath,
        shouldExtractWaveform: true,
        noOfSamples: 100,
      );
      
      final extractedData = _waveformPlayer.waveformData;
      waveform.addAll(extractedData);
      
      return waveform;
    } catch (e) {
      debugPrint('Failed to generate waveform: $e');
      return [];
    }
  }
  
  Future<Directory> _getRecordingDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final recordingDir = Directory(path.join(appDir.path, 'voice_journals'));
    
    if (!await recordingDir.exists()) {
      await recordingDir.create(recursive: true);
    }
    
    return recordingDir;
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
  
  void _setState(RecordingState newState) {
    _state = newState;
    _stateController?.add(newState);
  }
  
  // Advanced audio processing methods
  
  Future<void> trimAudio(String audioPath, Duration start, Duration end) async {
    // Implementation would use ffmpeg or similar library
    // For now, this is a placeholder
    debugPrint('Trimming audio from $start to $end');
  }
  
  Future<void> mergeAudioFiles(List<String> audioPaths, String outputPath) async {
    // Implementation would use ffmpeg or similar library
    debugPrint('Merging ${audioPaths.length} audio files');
  }
  
  Future<void> applyNoiseReduction(String audioPath) async {
    // Implementation would use audio processing library
    debugPrint('Applying noise reduction to $audioPath');
  }
  
  Future<void> normalizeVolume(String audioPath) async {
    // Implementation would use audio processing library
    debugPrint('Normalizing volume for $audioPath');
  }
  
  Future<String?> exportAsFormat(String audioPath, String format) async {
    // Implementation would convert audio to different formats (mp3, wav, etc.)
    debugPrint('Exporting audio as $format');
    return null;
  }
}

// Provider
final voiceRecordingServiceProvider = Provider<VoiceRecordingService>((ref) {
  final service = VoiceRecordingService();
  service.initialize();
  
  ref.onDispose(() {
    service.dispose();
  });
  
  return service;
});