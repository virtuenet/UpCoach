import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/ui_constants.dart';
import '../../../../core/services/voice_recording_service.dart';
import '../../../../core/services/speech_to_text_service.dart';

// File attachment model
class AttachedFile {
  final String path;
  final String name;
  final String type; // 'image', 'document', 'audio'
  final int sizeInBytes;

  AttachedFile({
    required this.path,
    required this.name,
    required this.type,
    required this.sizeInBytes,
  });

  String get sizeDisplay {
    if (sizeInBytes < 1024) return '$sizeInBytes B';
    if (sizeInBytes < 1024 * 1024) return '${(sizeInBytes / 1024).toStringAsFixed(1)} KB';
    return '${(sizeInBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class AIInputWidget extends ConsumerStatefulWidget {
  final Function(String, {List<AttachedFile>? attachments}) onSendMessage;
  final bool isLoading;

  const AIInputWidget({
    Key? key,
    required this.onSendMessage,
    required this.isLoading,
  }) : super(key: key);

  @override
  ConsumerState<AIInputWidget> createState() => _AIInputWidgetState();
}

class _AIInputWidgetState extends ConsumerState<AIInputWidget>
    with TickerProviderStateMixin {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _hasText = false;
  
  // File attachment state
  final List<AttachedFile> _attachedFiles = [];
  final ImagePicker _imagePicker = ImagePicker();
  
  // Voice recording state
  bool _isRecording = false;
  bool _isTranscribing = false;
  Duration _recordingDuration = Duration.zero;
  Timer? _recordingTimer;
  StreamSubscription<RecordingState>? _recordingStateSubscription;
  StreamSubscription<Duration>? _durationSubscription;
  StreamSubscription<TranscriptionResult>? _transcriptionSubscription;
  
  // Animation controllers
  late AnimationController _recordingAnimationController;
  late AnimationController _pulseAnimationController;
  late Animation<double> _recordingAnimation;
  late Animation<double> _pulseAnimation;
  
  // Services
  VoiceRecordingService? _voiceService;
  SpeechToTextService? _speechService;
  
  // Constants
  static const int _maxFileSize = 10 * 1024 * 1024; // 10MB
  static const int _maxAttachments = 5;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() {
        _hasText = _controller.text.trim().isNotEmpty;
      });
    });
    
    // Initialize animation controllers
    _recordingAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _pulseAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _recordingAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _recordingAnimationController,
      curve: Curves.easeInOut,
    ));
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseAnimationController,
      curve: Curves.easeInOut,
    ));
    
    // Initialize services
    _initializeServices();
  }
  
  Future<void> _initializeServices() async {
    _voiceService = ref.read(voiceRecordingServiceProvider);
    _speechService = ref.read(speechToTextServiceProvider);
    
    // Initialize speech to text
    await _speechService?.initialize();
    
    // Listen to recording state changes
    _recordingStateSubscription = _voiceService?.stateStream.listen((state) {
      if (mounted) {
        setState(() {
          _isRecording = state == RecordingState.recording;
        });
        
        if (_isRecording) {
          _recordingAnimationController.repeat();
          _pulseAnimationController.repeat(reverse: true);
        } else {
          _recordingAnimationController.stop();
          _pulseAnimationController.stop();
        }
      }
    });
    
    // Listen to recording duration
    _durationSubscription = _voiceService?.durationStream.listen((duration) {
      if (mounted) {
        setState(() {
          _recordingDuration = duration;
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _recordingAnimationController.dispose();
    _pulseAnimationController.dispose();
    _recordingStateSubscription?.cancel();
    _durationSubscription?.cancel();
    _transcriptionSubscription?.cancel();
    _recordingTimer?.cancel();
    super.dispose();
  }

  void _sendMessage() {
    if (_controller.text.trim().isEmpty && _attachedFiles.isEmpty || widget.isLoading) return;
    
    final message = _controller.text.trim();
    final attachments = List<AttachedFile>.from(_attachedFiles);
    
    widget.onSendMessage(
      message,
      attachments: attachments.isNotEmpty ? attachments : null,
    );
    
    _controller.clear();
    _attachedFiles.clear();
    _focusNode.requestFocus();
    setState(() {});
  }
  
  // File attachment methods
  Future<void> _attachFile() async {
    if (_attachedFiles.length >= _maxAttachments) {
      _showSnackBar('Maximum $_maxAttachments files can be attached');
      return;
    }
    
    await showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _buildAttachmentOptions(),
    );
  }
  
  Widget _buildAttachmentOptions() {
    return SafeArea(
      child: Semantics(
        container: true,
        label: 'File attachment options',
        hint: 'Choose a type of file to attach to your message',
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingMD),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Semantics(
                button: true,
                label: 'Take photo with camera',
                hint: 'Opens camera to take a new photo for attachment',
                child: ListTile(
                  leading: Icon(Icons.photo_camera, color: AppColors.primary),
                  title: const Text('Take Photo'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickImage(ImageSource.camera);
                  },
                ),
              ),
              Semantics(
                button: true,
                label: 'Choose photo from gallery',
                hint: 'Opens photo gallery to select an existing image',
                child: ListTile(
                  leading: Icon(Icons.photo_library, color: AppColors.primary),
                  title: const Text('Choose from Gallery'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickImage(ImageSource.gallery);
                  },
                ),
              ),
              Semantics(
                button: true,
                label: 'Choose document file',
                hint: 'Browse and select PDF, Word, or Excel documents',
                child: ListTile(
                  leading: Icon(Icons.insert_drive_file, color: AppColors.primary),
                  title: const Text('Choose Document'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickDocument();
                  },
                ),
              ),
              Semantics(
                button: true,
                label: 'Choose audio file',
                hint: 'Select MP3, M4A, or WAV audio files',
                child: ListTile(
                  leading: Icon(Icons.audio_file, color: AppColors.primary),
                  title: const Text('Choose Audio File'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickAudio();
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Future<void> _pickImage(ImageSource source) async {
    try {
      // Check permissions
      PermissionStatus permission;
      if (source == ImageSource.camera) {
        permission = await Permission.camera.request();
      } else {
        permission = await Permission.photos.request();
      }
      
      if (permission != PermissionStatus.granted) {
        _showSnackBar('Permission denied');
        return;
      }
      
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      
      if (pickedFile != null) {
        await _addAttachment(pickedFile.path, 'image');
      }
    } catch (e) {
      _showSnackBar('Failed to pick image: $e');
    }
  }
  
  Future<void> _pickDocument() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls'],
        allowMultiple: false,
      );
      
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.path != null) {
          await _addAttachment(file.path!, 'document');
        }
      }
    } catch (e) {
      _showSnackBar('Failed to pick document: $e');
    }
  }
  
  Future<void> _pickAudio() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['mp3', 'm4a', 'wav', 'aac'],
        allowMultiple: false,
      );
      
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.path != null) {
          await _addAttachment(file.path!, 'audio');
        }
      }
    } catch (e) {
      _showSnackBar('Failed to pick audio: $e');
    }
  }
  
  Future<void> _addAttachment(String path, String type) async {
    final file = File(path);
    if (!await file.exists()) {
      _showSnackBar('File not found');
      return;
    }
    
    final sizeInBytes = await file.length();
    if (sizeInBytes > _maxFileSize) {
      _showSnackBar('File size exceeds 10MB limit');
      return;
    }
    
    final fileName = path.split('/').last;
    final attachment = AttachedFile(
      path: path,
      name: fileName,
      type: type,
      sizeInBytes: sizeInBytes,
    );
    
    setState(() {
      _attachedFiles.add(attachment);
    });
  }
  
  void _removeAttachment(int index) {
    setState(() {
      _attachedFiles.removeAt(index);
    });
  }
  
  // Voice input methods
  Future<void> _toggleVoiceInput() async {
    if (_isRecording) {
      await _stopVoiceInput();
    } else {
      await _startVoiceInput();
    }
  }
  
  Future<void> _startVoiceInput() async {
    try {
      // Check microphone permission
      final permission = await Permission.microphone.request();
      if (permission != PermissionStatus.granted) {
        _showSnackBar('Microphone permission denied');
        return;
      }
      
      // Start recording
      final success = await _voiceService?.startRecording(
        quality: AudioQuality.medium,
        noiseReduction: true,
        echoCancellation: true,
      );
      
      if (success == true) {
        // Start real-time transcription if available
        await _startRealTimeTranscription();
        
        // Haptic feedback
        HapticFeedback.mediumImpact();
      } else {
        _showSnackBar('Failed to start recording');
      }
    } catch (e) {
      _showSnackBar('Error: $e');
    }
  }
  
  Future<void> _startRealTimeTranscription() async {
    // Cancel any existing subscription
    await _transcriptionSubscription?.cancel();
    
    // Start speech-to-text for real-time transcription
    final started = await _speechService?.startListening(
      localeId: 'en_US',
      pauseFor: const Duration(seconds: 2),
    );
    
    if (started == true) {
      _transcriptionSubscription = _speechService?.transcriptionStream.listen(
        (result) {
          if (mounted && result.text.isNotEmpty) {
            setState(() {
              _controller.text = result.text;
              _controller.selection = TextSelection.fromPosition(
                TextPosition(offset: _controller.text.length),
              );
            });
          }
        },
      );
    }
  }
  
  Future<void> _stopVoiceInput() async {
    try {
      // Stop recording
      final audioPath = await _voiceService?.stopRecording();
      
      // Stop real-time transcription
      await _speechService?.stopListening();
      await _transcriptionSubscription?.cancel();
      
      // If we have a recording but no transcription, transcribe the audio file
      if (audioPath != null && _controller.text.trim().isEmpty) {
        setState(() {
          _isTranscribing = true;
        });
        
        final result = await _speechService?.transcribeAudioFile(audioPath);
        
        if (result != null && result.text.isNotEmpty) {
          setState(() {
            _controller.text = result.text;
            _controller.selection = TextSelection.fromPosition(
              TextPosition(offset: _controller.text.length),
            );
          });
        }
        
        setState(() {
          _isTranscribing = false;
        });
        
        // Optionally delete the temporary audio file
        await _voiceService?.deleteRecording(audioPath);
      }
      
      // Reset recording state
      setState(() {
        _recordingDuration = Duration.zero;
      });
      
      // Haptic feedback
      HapticFeedback.lightImpact();
    } catch (e) {
      _showSnackBar('Error stopping recording: $e');
    }
  }
  
  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
  
  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: 'AI Coach input area',
      hint: 'Send messages to your AI coach with text, voice, or file attachments',
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Show attached files if any
              if (_attachedFiles.isNotEmpty) _buildAttachmentsPreview(),
              
              // Show recording indicator
              if (_isRecording) _buildRecordingIndicator(),
              
              // Main input area
              Semantics(
                container: true,
                label: 'Message composition area',
                child: Container(
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Attachment button with accessibility
                      AnimatedScale(
                        scale: _isRecording ? 0.0 : 1.0,
                        duration: const Duration(milliseconds: 200),
                        child: Semantics(
                          label: 'Attach files',
                          hint: _attachedFiles.isNotEmpty 
                              ? 'You have ${_attachedFiles.length} file${_attachedFiles.length == 1 ? '' : 's'} attached. Tap to add more files'
                              : 'Tap to attach images, documents, or audio files to your message',
                          button: true,
                          enabled: !widget.isLoading && !_isRecording,
                          child: IconButton(
                            icon: Stack(
                              children: [
                                const Icon(Icons.attach_file),
                                if (_attachedFiles.isNotEmpty)
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            tooltip: _attachedFiles.isNotEmpty 
                                ? '${_attachedFiles.length} file${_attachedFiles.length == 1 ? '' : 's'} attached'
                                : 'Attach files',
                            onPressed: widget.isLoading || _isRecording ? null : _attachFile,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      
                      // Text input field with accessibility
                      Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          child: Semantics(
                            textField: true,
                            label: 'Message input',
                            hint: _isRecording
                                ? 'Voice recording is active, your speech is being captured'
                                : _isTranscribing
                                    ? 'Converting your voice to text, please wait'
                                    : 'Type your message or question for the AI coach',
                            multiline: true,
                            child: TextField(
                              controller: _controller,
                              focusNode: _focusNode,
                              enabled: !widget.isLoading && !_isRecording,
                              maxLines: null,
                              maxLength: null,
                              textInputAction: TextInputAction.send,
                              onSubmitted: (_) => _sendMessage(),
                              decoration: InputDecoration(
                                labelText: 'Message',
                                hintText: _isRecording
                                    ? 'Listening...'
                                    : _isTranscribing
                                        ? 'Transcribing...'
                                        : 'Ask your AI coach...',
                                hintStyle: TextStyle(color: AppColors.textSecondary),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(24),
                                  borderSide: BorderSide.none,
                                ),
                                filled: true,
                                fillColor: AppColors.background,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ),
                                suffixIcon: _isTranscribing
                                    ? Semantics(
                                        label: 'Transcribing audio',
                                        child: Container(
                                          width: 20,
                                          height: 20,
                                          padding: const EdgeInsets.all(12),
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                            ),
                          ),
                        ),
                      ),
                      
                      const SizedBox(width: UIConstants.spacingSM),
                      
                      // Send/Voice button
                      _buildActionButton(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildActionButton() {
    final hasContent = _hasText || _attachedFiles.isNotEmpty;
    
    if (_isRecording) {
      // Stop recording button
      return AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _pulseAnimation.value,
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.error.withValues(alpha: 0.3),
                    blurRadius: 8,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: IconButton(
                icon: const Icon(Icons.stop, color: Colors.white),
                onPressed: _stopVoiceInput,
              ),
            ),
          );
        },
      );
    }
    
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      transitionBuilder: (child, animation) {
        return ScaleTransition(
          scale: animation,
          child: child,
        );
      },
      child: IconButton(
        key: ValueKey(hasContent),
        icon: Icon(
          hasContent ? Icons.send : Icons.mic,
          color: widget.isLoading
              ? AppColors.textSecondary
              : (hasContent ? AppColors.primary : AppColors.textSecondary),
        ),
        onPressed: widget.isLoading
            ? null
            : () {
                if (hasContent) {
                  _sendMessage();
                } else {
                  _toggleVoiceInput();
                }
              },
      ),
    );
  }
  
  Widget _buildAttachmentsPreview() {
    return Semantics(
      container: true,
      label: 'Attached files',
      hint: '${_attachedFiles.length} file${_attachedFiles.length == 1 ? '' : 's'} attached. Swipe to browse attachments',
      child: Container(
        height: 80,
        padding: const EdgeInsets.symmetric(
          horizontal: UIConstants.spacingMD,
          vertical: UIConstants.spacingSM,
        ),
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: _attachedFiles.length,
          semanticChildCount: _attachedFiles.length,
          itemBuilder: (context, index) {
            final attachment = _attachedFiles[index];
            return Semantics(
              container: true,
              label: '${attachment.type} file: ${attachment.name}',
              hint: 'Size: ${attachment.sizeDisplay}. Double tap to remove attachment',
              child: Container(
                width: 70,
                margin: const EdgeInsets.only(right: UIConstants.spacingSM),
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          width: 1,
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Semantics(
                              label: '${attachment.type} icon',
                              image: true,
                              child: Icon(
                                _getFileIcon(attachment.type),
                                color: AppColors.primary,
                                size: 24,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Semantics(
                              label: 'File size',
                              child: Text(
                                attachment.sizeDisplay,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      top: -4,
                      right: -4,
                      child: Semantics(
                        button: true,
                        label: 'Remove ${attachment.name}',
                        hint: 'Tap to remove this attachment',
                        child: GestureDetector(
                          onTap: () => _removeAttachment(index),
                          child: Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              color: AppColors.error,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
  
  Widget _buildRecordingIndicator() {
    return Semantics(
      container: true,
      liveRegion: true,
      label: 'Voice recording in progress',
      value: 'Recording for ${_formatDuration(_recordingDuration)}',
      hint: 'Voice input is being recorded. Speak your message now',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: UIConstants.spacingMD,
          vertical: UIConstants.spacingSM,
        ),
        color: AppColors.error.withValues(alpha: 0.1),
        child: Row(
          children: [
            Semantics(
              label: 'Recording indicator',
              child: AnimatedBuilder(
                animation: _recordingAnimation,
                builder: (context, child) {
                  return Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: _recordingAnimation.value),
                      shape: BoxShape.circle,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: UIConstants.spacingSM),
            Semantics(
              label: 'Recording status',
              child: Text(
                'Recording',
                style: TextStyle(
                  color: AppColors.error,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(width: UIConstants.spacingSM),
            Semantics(
              label: 'Recording duration',
              value: _formatDuration(_recordingDuration),
              child: Text(
                _formatDuration(_recordingDuration),
                style: TextStyle(
                  color: AppColors.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const Spacer(),
            // Voice waveform visualization with accessibility
            Expanded(
              flex: 2,
              child: Semantics(
                label: 'Voice waveform visualization',
                hint: 'Visual representation of audio levels during recording',
                image: true,
                child: Container(
                  height: 30,
                  child: CustomPaint(
                    painter: WaveformPainter(
                      animation: _recordingAnimation,
                      color: AppColors.error,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  IconData _getFileIcon(String type) {
    switch (type) {
      case 'image':
        return Icons.image;
      case 'document':
        return Icons.description;
      case 'audio':
        return Icons.audiotrack;
      default:
        return Icons.insert_drive_file;
    }
  }
}

// Waveform painter for voice recording visualization
class WaveformPainter extends CustomPainter {
  final Animation<double> animation;
  final Color color;
  
  WaveformPainter({
    required this.animation,
    required this.color,
  }) : super(repaint: animation);
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;
    
    final waveCount = 15;
    final waveWidth = size.width / waveCount;
    final random = [0.3, 0.5, 0.8, 0.4, 0.6, 0.9, 0.2, 0.7, 0.5, 0.3, 0.8, 0.4, 0.6, 0.5, 0.7];
    
    for (int i = 0; i < waveCount; i++) {
      final waveHeight = size.height * random[i] * animation.value;
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(
          i * waveWidth + waveWidth * 0.2,
          (size.height - waveHeight) / 2,
          waveWidth * 0.6,
          waveHeight,
        ),
        const Radius.circular(2),
      );
      canvas.drawRRect(rect, paint);
    }
  }
  
  @override
  bool shouldRepaint(WaveformPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}