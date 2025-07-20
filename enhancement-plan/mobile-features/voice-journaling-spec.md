# Voice Journaling Feature Specification

## 🎯 Overview
Voice journaling allows users to record audio entries that are automatically transcribed and integrated into their personal coaching journey. This feature leverages AI transcription to make voice entries searchable and actionable.

## 📋 Core Features

### 1. Audio Recording
- **Real-time voice recording** with visual feedback
- **Background recording** capability for extended sessions
- **Audio quality optimization** and compression
- **Permission handling** for microphone access
- **Recording controls**: Start, pause, resume, stop
- **Maximum recording length**: 10 minutes per session

### 2. AI Transcription
- **Real-time transcription** as user speaks
- **Multiple language support** (English, Spanish, French, German)
- **Confidence scoring** for transcription accuracy
- **Manual correction** capabilities
- **Offline transcription fallback**

### 3. Voice Journal Management
- **Journal entry organization** by date and tags
- **Audio playback** with speed controls
- **Search functionality** across transcribed text
- **Export options** (audio + text)
- **Privacy controls** and encryption

### 4. Emotional Analysis
- **Sentiment analysis** of transcribed content
- **Mood tracking** integration
- **Emotional pattern recognition**
- **Coaching insights** based on voice analysis

## 🔧 Technical Implementation

### Audio Recording Architecture
```typescript
// VoiceRecordingService.ts
interface VoiceRecordingService {
  startRecording(): Promise<RecordingSession>;
  pauseRecording(): void;
  resumeRecording(): void;
  stopRecording(): Promise<AudioFile>;
  getRecordingStatus(): RecordingStatus;
}

interface RecordingSession {
  id: string;
  startTime: Date;
  duration: number;
  audioFormat: AudioFormat;
  quality: AudioQuality;
}

interface AudioFile {
  id: string;
  filePath: string;
  duration: number;
  size: number;
  format: AudioFormat;
  metadata: AudioMetadata;
}
```

### Transcription Service
```typescript
// TranscriptionService.ts
interface TranscriptionService {
  transcribeAudio(audioFile: AudioFile): Promise<TranscriptionResult>;
  transcribeRealTime(audioStream: AudioStream): Observable<PartialTranscription>;
  validateTranscription(result: TranscriptionResult): ValidationScore;
}

interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  language: string;
  segments: TranscriptionSegment[];
  processingTime: number;
}

interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
}
```

### Voice Journal Data Model
```typescript
// VoiceJournalEntry.ts
interface VoiceJournalEntry {
  id: string;
  userId: string;
  audioFileId: string;
  transcriptionId: string;
  title: string;
  description?: string;
  recordedAt: Date;
  duration: number;
  tags: string[];
  mood?: MoodRating;
  emotionalAnalysis?: EmotionalAnalysis;
  isPrivate: boolean;
  metadata: JournalMetadata;
}

interface EmotionalAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  emotions: EmotionScore[];
  stressLevel: number;
  energyLevel: number;
  confidence: number;
}

interface EmotionScore {
  emotion: string;
  intensity: number;
  confidence: number;
}
```

## 🎨 User Interface Design

### Recording Interface
```dart
// voice_recording_screen.dart
class VoiceRecordingScreen extends StatefulWidget {
  @override
  _VoiceRecordingScreenState createState() => _VoiceRecordingScreenState();
}

class _VoiceRecordingScreenState extends State<VoiceRecordingScreen>
    with TickerProviderStateMixin {
  
  late AnimationController _waveAnimationController;
  late AnimationController _pulseAnimationController;
  
  RecordingState _recordingState = RecordingState.stopped;
  Duration _recordingDuration = Duration.zero;
  String _transcriptionText = '';
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black87,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildWaveform(),
            _buildTranscriptionDisplay(),
            _buildRecordingControls(),
            _buildDurationDisplay(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildWaveform() {
    return Container(
      height: 200,
      child: AnimatedBuilder(
        animation: _waveAnimationController,
        builder: (context, child) {
          return CustomPaint(
            painter: WaveformPainter(
              animationValue: _waveAnimationController.value,
              isRecording: _recordingState == RecordingState.recording,
            ),
            size: Size.infinite,
          );
        },
      ),
    );
  }
  
  Widget _buildRecordingControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildControlButton(
          icon: Icons.delete,
          onPressed: _discardRecording,
          backgroundColor: Colors.red,
        ),
        _buildMainRecordButton(),
        _buildControlButton(
          icon: Icons.save,
          onPressed: _saveRecording,
          backgroundColor: Colors.green,
        ),
      ],
    );
  }
  
  Widget _buildMainRecordButton() {
    return GestureDetector(
      onTap: _toggleRecording,
      child: AnimatedBuilder(
        animation: _pulseAnimationController,
        builder: (context, child) {
          return Container(
            width: 80 + (_pulseAnimationController.value * 10),
            height: 80 + (_pulseAnimationController.value * 10),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _getRecordButtonColor(),
              boxShadow: [
                BoxShadow(
                  color: _getRecordButtonColor().withOpacity(0.3),
                  blurRadius: 15,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Icon(
              _getRecordButtonIcon(),
              color: Colors.white,
              size: 40,
            ),
          );
        },
      ),
    );
  }
}
```

### Journal Entry List
```dart
// voice_journal_list.dart
class VoiceJournalList extends StatefulWidget {
  @override
  _VoiceJournalListState createState() => _VoiceJournalListState();
}

class _VoiceJournalListState extends State<VoiceJournalList> {
  List<VoiceJournalEntry> _entries = [];
  String _searchQuery = '';
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Voice Journal'),
        actions: [
          IconButton(
            icon: Icon(Icons.search),
            onPressed: _showSearchDialog,
          ),
          IconButton(
            icon: Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilterChips(),
          Expanded(
            child: ListView.builder(
              itemCount: _filteredEntries.length,
              itemBuilder: (context, index) {
                return VoiceJournalEntryCard(
                  entry: _filteredEntries[index],
                  onTap: () => _openEntry(_filteredEntries[index]),
                  onPlay: () => _playEntry(_filteredEntries[index]),
                  onShare: () => _shareEntry(_filteredEntries[index]),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/voice-recording'),
        child: Icon(Icons.mic),
      ),
    );
  }
}

class VoiceJournalEntryCard extends StatelessWidget {
  final VoiceJournalEntry entry;
  final VoidCallback onTap;
  final VoidCallback onPlay;
  final VoidCallback onShare;
  
  const VoiceJournalEntryCard({
    required this.entry,
    required this.onTap,
    required this.onPlay,
    required this.onShare,
  });
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      entry.title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  _buildMoodIndicator(entry.mood),
                ],
              ),
              SizedBox(height: 8),
              Text(
                _getPreviewText(entry.transcription),
                style: Theme.of(context).textTheme.bodyMedium,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey),
                  SizedBox(width: 4),
                  Text(
                    _formatDuration(entry.duration),
                    style: TextStyle(color: Colors.grey),
                  ),
                  SizedBox(width: 16),
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                  SizedBox(width: 4),
                  Text(
                    _formatDate(entry.recordedAt),
                    style: TextStyle(color: Colors.grey),
                  ),
                  Spacer(),
                  IconButton(
                    icon: Icon(Icons.play_arrow),
                    onPressed: onPlay,
                  ),
                  IconButton(
                    icon: Icon(Icons.share),
                    onPressed: onShare,
                  ),
                ],
              ),
              if (entry.tags.isNotEmpty) ...[
                SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: entry.tags
                      .map((tag) => Chip(
                            label: Text(tag),
                            labelStyle: TextStyle(fontSize: 12),
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
```dart
// test/voice_journaling_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:upcoach/services/voice_recording_service.dart';
import 'package:upcoach/services/transcription_service.dart';

void main() {
  group('VoiceRecordingService', () {
    late VoiceRecordingService service;
    late MockAudioRecorder mockRecorder;
    
    setUp(() {
      mockRecorder = MockAudioRecorder();
      service = VoiceRecordingService(recorder: mockRecorder);
    });
    
    test('should start recording successfully', () async {
      when(mockRecorder.startRecording()).thenAnswer((_) async => true);
      
      final session = await service.startRecording();
      
      expect(session.id, isNotEmpty);
      expect(session.startTime, isNotNull);
      verify(mockRecorder.startRecording()).called(1);
    });
    
    test('should handle recording permission denied', () async {
      when(mockRecorder.startRecording())
          .thenThrow(PermissionDeniedException());
      
      expect(
        () => service.startRecording(),
        throwsA(isA<PermissionDeniedException>()),
      );
    });
    
    test('should stop recording and return audio file', () async {
      when(mockRecorder.stopRecording())
          .thenAnswer((_) async => 'path/to/audio.wav');
      
      final audioFile = await service.stopRecording();
      
      expect(audioFile.filePath, equals('path/to/audio.wav'));
      expect(audioFile.duration, greaterThan(0));
    });
  });
  
  group('TranscriptionService', () {
    late TranscriptionService service;
    late MockTranscriptionAPI mockAPI;
    
    setUp(() {
      mockAPI = MockTranscriptionAPI();
      service = TranscriptionService(api: mockAPI);
    });
    
    test('should transcribe audio successfully', () async {
      final audioFile = AudioFile(
        id: 'test-id',
        filePath: 'test.wav',
        duration: 30,
        size: 1024,
        format: AudioFormat.wav,
      );
      
      when(mockAPI.transcribe(any)).thenAnswer((_) async => TranscriptionResult(
        id: 'transcription-id',
        text: 'Hello world',
        confidence: 0.95,
        language: 'en',
        segments: [],
        processingTime: 1000,
      ));
      
      final result = await service.transcribeAudio(audioFile);
      
      expect(result.text, equals('Hello world'));
      expect(result.confidence, equals(0.95));
    });
    
    test('should handle transcription API errors', () async {
      when(mockAPI.transcribe(any))
          .thenThrow(TranscriptionException('API Error'));
      
      expect(
        () => service.transcribeAudio(AudioFile.empty()),
        throwsA(isA<TranscriptionException>()),
      );
    });
  });
}
```

### Integration Tests
```dart
// integration_test/voice_journaling_flow_test.dart
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:upcoach/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Voice Journaling Flow', () {
    testWidgets('complete voice journaling workflow', (tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      // Login first
      await tester.enterText(find.byKey(Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(Key('password_field')), 'password');
      await tester.tap(find.byKey(Key('login_button')));
      await tester.pumpAndSettle();
      
      // Navigate to voice journaling
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();
      
      // Grant microphone permission
      await tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        const MethodChannel('flutter/platform_permissions'),
        (call) async {
          if (call.method == 'requestPermissions') {
            return {'microphone': 'granted'};
          }
          return null;
        },
      );
      
      // Start recording
      await tester.tap(find.byKey(Key('record_button')));
      await tester.pump(Duration(seconds: 1));
      
      // Verify recording state
      expect(find.byKey(Key('recording_indicator')), findsOneWidget);
      
      // Stop recording
      await tester.tap(find.byKey(Key('stop_button')));
      await tester.pumpAndSettle();
      
      // Verify audio player appears
      expect(find.byKey(Key('audio_player')), findsOneWidget);
      
      // Add title and save
      await tester.enterText(find.byKey(Key('title_field')), 'Test Journal Entry');
      await tester.tap(find.byKey(Key('save_button')));
      await tester.pumpAndSettle();
      
      // Verify entry appears in journal list
      await tester.tap(find.byKey(Key('journal_list_button')));
      await tester.pumpAndSettle();
      
      expect(find.text('Test Journal Entry'), findsOneWidget);
    });
    
    testWidgets('search voice journal entries', (tester) async {
      // Setup: Create some test entries
      
      // Navigate to journal list
      await tester.tap(find.byKey(Key('journal_list_button')));
      await tester.pumpAndSettle();
      
      // Open search
      await tester.tap(find.byIcon(Icons.search));
      await tester.pumpAndSettle();
      
      // Enter search query
      await tester.enterText(find.byKey(Key('search_field')), 'exercise');
      await tester.pump(Duration(milliseconds: 500));
      
      // Verify filtered results
      expect(find.textContaining('exercise'), findsWidgets);
    });
  });
}
```

## 📊 Performance Requirements

### Audio Recording Performance
- **Recording latency**: <100ms to start
- **Audio quality**: 44.1kHz sample rate, 16-bit depth
- **Compression**: Reduce file size by 60% without quality loss
- **Memory usage**: <50MB during recording
- **Battery impact**: <5% per 30-minute session

### Transcription Performance
- **Real-time transcription**: <2s delay for live transcription
- **Batch transcription**: <30s for 5-minute audio
- **Accuracy**: >95% for clear speech in English
- **Offline fallback**: Basic transcription when internet unavailable

### Storage Requirements
- **Audio compression**: Opus codec for optimal size/quality
- **Local storage**: Up to 1GB for offline audio files
- **Cloud sync**: Automatic upload with progress tracking
- **Retention policy**: 1 year of audio history

## 🔒 Privacy & Security

### Data Protection
- **End-to-end encryption** for audio files
- **Local processing** for sensitive transcriptions
- **User consent** for cloud transcription services
- **Data deletion** capabilities for users
- **GDPR compliance** for European users

### Permission Management
```dart
// permissions_service.dart
class PermissionsService {
  Future<bool> requestMicrophonePermission() async {
    final status = await Permission.microphone.status;
    
    if (status.isGranted) {
      return true;
    }
    
    if (status.isDenied) {
      final result = await Permission.microphone.request();
      return result.isGranted;
    }
    
    if (status.isPermanentlyDenied) {
      await _showPermissionDialog();
      return false;
    }
    
    return false;
  }
  
  Future<void> _showPermissionDialog() async {
    // Show dialog explaining why microphone access is needed
    // Provide option to open app settings
  }
}
```

## 🌍 Accessibility Features

### Audio Accessibility
- **Visual feedback** for recording status
- **Vibration feedback** for recording start/stop
- **Voice commands** for hands-free operation
- **Text-to-speech** for transcribed content
- **High contrast** UI themes

### Screen Reader Support
```dart
// Accessibility semantics
Semantics(
  button: true,
  label: 'Start voice recording',
  hint: 'Double tap to begin recording your journal entry',
  child: RecordButton(),
)

Semantics(
  liveRegion: true,
  label: 'Recording duration: ${formatDuration(duration)}',
  child: DurationDisplay(),
)
```

## 🚀 Future Enhancements

### Advanced Features
- **Speaker identification** for multi-person conversations
- **Noise cancellation** for clearer recordings
- **Voice shortcuts** for quick entries
- **AI coaching** based on voice analysis
- **Mood detection** from voice patterns

### Integration Possibilities
- **Calendar integration** for scheduled reflections
- **Fitness app sync** for workout voice notes
- **Social sharing** with privacy controls
- **Export to other journaling apps**
- **Podcast creation** from journal entries

This voice journaling feature will provide users with a natural, accessible way to capture their thoughts and integrate voice-based content into their personal development journey. 