import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_waveforms/audio_waveforms.dart' as waveforms;
import 'package:ffmpeg_kit_flutter/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter/return_code.dart';
import 'package:ffmpeg_kit_flutter/ffprobe_kit.dart';

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
  final waveforms.PlayerController _waveformPlayer = waveforms.PlayerController();
  final waveforms.RecorderController _waveformRecorder = waveforms.RecorderController();
  
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
      if (_waveformPlayer.playerState == waveforms.PlayerState.stopped) {
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
      if (_waveformPlayer.playerState == waveforms.PlayerState.playing) {
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
      if (_waveformPlayer.playerState == waveforms.PlayerState.playing) {
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
  
  Future<String?> trimAudio(String audioPath, Duration start, Duration end) async {
    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(directory.path, 'trimmed_$timestamp.m4a');

      final startSeconds = start.inMilliseconds / 1000.0;
      final duration = (end - start).inMilliseconds / 1000.0;

      final command = '-i "$audioPath" -ss $startSeconds -t $duration -c copy "$outputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Audio trimmed successfully: $outputPath');
        return outputPath;
      } else {
        debugPrint('Failed to trim audio: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error trimming audio: $e');
      return null;
    }
  }
  
  Future<String?> mergeAudioFiles(List<String> audioPaths, String? outputPath) async {
    if (audioPaths.isEmpty) return null;

    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final finalOutputPath = outputPath ?? path.join(directory.path, 'merged_$timestamp.m4a');

      // Create concat file for ffmpeg
      final concatFilePath = path.join(directory.path, 'concat_$timestamp.txt');
      final concatFile = File(concatFilePath);

      final concatContent = audioPaths.map((p) => "file '$p'").join('\n');
      await concatFile.writeAsString(concatContent);

      final command = '-f concat -safe 0 -i "$concatFilePath" -c copy "$finalOutputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      // Clean up concat file
      if (await concatFile.exists()) {
        await concatFile.delete();
      }

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Audio files merged successfully: $finalOutputPath');
        return finalOutputPath;
      } else {
        debugPrint('Failed to merge audio files: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error merging audio files: $e');
      return null;
    }
  }
  
  Future<String?> applyNoiseReduction(String audioPath) async {
    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(directory.path, 'denoised_$timestamp.m4a');

      // Apply high-pass filter and noise gate for basic noise reduction
      final command = '-i "$audioPath" -af "highpass=f=80,gate=threshold=-50dB:ratio=2:attack=3:release=1000" "$outputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Noise reduction applied successfully: $outputPath');
        return outputPath;
      } else {
        debugPrint('Failed to apply noise reduction: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error applying noise reduction: $e');
      return null;
    }
  }
  
  Future<String?> normalizeVolume(String audioPath) async {
    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(directory.path, 'normalized_$timestamp.m4a');

      // Apply audio normalization and dynamic range compression
      final command = '-i "$audioPath" -af "dynaudnorm=p=0.95:s=10,volume=0.8" "$outputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Volume normalized successfully: $outputPath');
        return outputPath;
      } else {
        debugPrint('Failed to normalize volume: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error normalizing volume: $e');
      return null;
    }
  }
  
  Future<String?> exportAsFormat(String audioPath, String format) async {
    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'exported_$timestamp.$format';
      final outputPath = path.join(directory.path, fileName);

      String command;

      switch (format.toLowerCase()) {
        case 'mp3':
          command = '-i "$audioPath" -codec:a libmp3lame -b:a 128k "$outputPath"';
          break;
        case 'wav':
          command = '-i "$audioPath" -codec:a pcm_s16le "$outputPath"';
          break;
        case 'flac':
          command = '-i "$audioPath" -codec:a flac "$outputPath"';
          break;
        case 'ogg':
          command = '-i "$audioPath" -codec:a libvorbis -q:a 4 "$outputPath"';
          break;
        case 'm4a':
        case 'aac':
          command = '-i "$audioPath" -codec:a aac -b:a 128k "$outputPath"';
          break;
        default:
          debugPrint('Unsupported format: $format');
          return null;
      }

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Audio exported as $format successfully: $outputPath');
        return outputPath;
      } else {
        debugPrint('Failed to export audio as $format: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error exporting audio as $format: $e');
      return null;
    }
  }

  /// Compresses audio file to reduce size while maintaining quality
  Future<String?> compressAudio(String audioPath, {int bitrate = 64}) async {
    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(directory.path, 'compressed_$timestamp.m4a');

      final command = '-i "$audioPath" -codec:a aac -b:a ${bitrate}k "$outputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Audio compressed successfully: $outputPath');
        return outputPath;
      } else {
        debugPrint('Failed to compress audio: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error compressing audio: $e');
      return null;
    }
  }

  /// Enhances audio quality with EQ and filters
  Future<String?> enhanceAudio(String audioPath) async {
    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(directory.path, 'enhanced_$timestamp.m4a');

      // Apply audio enhancement: EQ, compressor, and limiter
      final command = '-i "$audioPath" -af "equalizer=f=300:width_type=h:width=100:g=2,equalizer=f=3000:width_type=h:width=1000:g=3,compand=attacks=0.3:decays=0.8:points=-80/-900|-45/-45|-27/-25|0/-7:soft-knee=6:gain=5:volume=0.95,alimiter=level=0.95" "$outputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Audio enhanced successfully: $outputPath');
        return outputPath;
      } else {
        debugPrint('Failed to enhance audio: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error enhancing audio: $e');
      return null;
    }
  }

  /// Gets detailed audio information using FFprobe
  Future<Map<String, dynamic>> getDetailedAudioInfo(String audioPath) async {
    try {
      final session = await FFprobeKit.getMediaInformation(audioPath);
      final information = session.getMediaInformation();

      if (information == null) {
        return {};
      }

      final streams = information.getStreams();
      if (streams.isEmpty) {
        return {};
      }

      final audioStream = streams.first;
      final format = information.getFormat();

      return {
        'duration': format?.getDuration() ?? '0',
        'bitrate': format?.getBitrate() ?? '0',
        'size': format?.getSize() ?? '0',
        'format_name': format?.getFormatName() ?? 'unknown',
        'codec_name': audioStream.getAllProperties()['codec_name'] ?? 'unknown',
        'sample_rate': audioStream.getAllProperties()['sample_rate'] ?? '0',
        'channels': audioStream.getAllProperties()['channels'] ?? '0',
        'channel_layout': audioStream.getAllProperties()['channel_layout'] ?? 'unknown',
      };
    } catch (e) {
      debugPrint('Error getting detailed audio info: $e');
      return {};
    }
  }

  /// Applies fade in and fade out effects
  Future<String?> applyFadeEffects(String audioPath, {Duration fadeIn = const Duration(seconds: 1), Duration fadeOut = const Duration(seconds: 1)}) async {
    try {
      final directory = await _getRecordingDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(directory.path, 'faded_$timestamp.m4a');

      final fadeInSec = fadeIn.inMilliseconds / 1000.0;
      final fadeOutSec = fadeOut.inMilliseconds / 1000.0;

      final command = '-i "$audioPath" -af "afade=t=in:ss=0:d=$fadeInSec,afade=t=out:st=0:d=$fadeOutSec" "$outputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('Fade effects applied successfully: $outputPath');
        return outputPath;
      } else {
        debugPrint('Failed to apply fade effects: ${await session.getFailStackTrace()}');
        return null;
      }
    } catch (e) {
      debugPrint('Error applying fade effects: $e');
      return null;
    }
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