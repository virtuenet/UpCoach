import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:upcoach_mobile/core/theme/app_colors.dart';
import '../../../../shared/constants/ui_constants.dart';

// AttachmentFile model for file attachments
class AttachmentFile {
  final String name;
  final String path;
  final int sizeInBytes;
  final AttachmentType type;

  AttachmentFile({
    required this.name,
    required this.path,
    required this.sizeInBytes,
    required this.type,
  });
}

enum AttachmentType { image, document, audio, video, other }

class AIInputWidget extends StatefulWidget {
  final Function(String, {List<AttachmentFile>? attachments}) onSendMessage;
  final bool isLoading;

  const AIInputWidget({
    Key? key,
    required this.onSendMessage,
    required this.isLoading,
  }) : super(key: key);

  @override
  State<AIInputWidget> createState() => _AIInputWidgetState();
}

class _AIInputWidgetState extends State<AIInputWidget> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  final SpeechToText _speechToText = SpeechToText();

  bool _hasText = false;
  bool _isListening = false;
  bool _speechAvailable = false;
  List<AttachmentFile> _attachments = [];

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() {
        _hasText = _controller.text.trim().isNotEmpty;
      });
    });
    _initializeSpeech();
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _initializeSpeech() async {
    try {
      final available = await _speechToText.initialize();
      setState(() {
        _speechAvailable = available;
      });
    } catch (e) {
      // Speech recognition not available
      setState(() {
        _speechAvailable = false;
      });
    }
  }

  Future<void> _toggleListening() async {
    if (!_speechAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Speech recognition not available')),
      );
      return;
    }

    if (_isListening) {
      await _speechToText.stop();
      setState(() {
        _isListening = false;
      });
    } else {
      // Request microphone permission
      final permission = await Permission.microphone.request();
      if (permission.isGranted) {
        setState(() {
          _isListening = true;
        });

        await _speechToText.listen(
          onResult: (result) {
            setState(() {
              _controller.text = result.recognizedWords;
            });
          },
          listenFor: const Duration(seconds: 30),
          pauseFor: const Duration(seconds: 3),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permission required for voice input')),
        );
      }
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.any,
      );

      if (result != null && result.files.isNotEmpty) {
        final newAttachments = result.files.map((file) {
          return AttachmentFile(
            name: file.name,
            path: file.path!,
            sizeInBytes: file.size,
            type: _getAttachmentType(file.extension ?? ''),
          );
        }).toList();

        setState(() {
          _attachments.addAll(newAttachments);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking files: $e')),
      );
    }
  }

  AttachmentType _getAttachmentType(String extension) {
    final ext = extension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].contains(ext)) {
      return AttachmentType.image;
    } else if (['mp3', 'wav', 'aac', 'm4a'].contains(ext)) {
      return AttachmentType.audio;
    } else if (['mp4', 'avi', 'mov', 'wmv'].contains(ext)) {
      return AttachmentType.video;
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].contains(ext)) {
      return AttachmentType.document;
    } else {
      return AttachmentType.other;
    }
  }

  void _removeAttachment(int index) {
    setState(() {
      _attachments.removeAt(index);
    });
  }

  void _sendMessage() {
    if (_controller.text.trim().isEmpty || widget.isLoading) return;

    widget.onSendMessage(
      _controller.text,
      attachments: _attachments.isNotEmpty ? _attachments : null,
    );

    _controller.clear();
    setState(() {
      _attachments.clear();
    });
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Attachments display
            if (_attachments.isNotEmpty)
              Container(
                height: 80,
                margin: const EdgeInsets.only(bottom: 8),
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _attachments.length,
                  itemBuilder: (context, index) {
                    final attachment = _attachments[index];
                    return Container(
                      width: 80,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Stack(
                        children: [
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _getAttachmentIcon(attachment.type),
                                  color: AppColors.primary,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  attachment.name.length > 8
                                      ? '${attachment.name.substring(0, 8)}...'
                                      : attachment.name,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppColors.textSecondary,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                          Positioned(
                            top: 2,
                            right: 2,
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
                                  size: 12,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.attach_file),
                  onPressed: widget.isLoading ? null : _pickFile,
                  color: _attachments.isNotEmpty ? AppColors.primary : AppColors.textSecondary,
                ),
                Expanded(
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                enabled: !widget.isLoading,
                maxLines: null,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
                decoration: InputDecoration(
                  hintText: 'Ask your AI coach...',
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
                ),
              ),
            ),
            const SizedBox(width: UIConstants.spacingSM),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              child: IconButton(
                icon: Icon(
                  _hasText
                      ? Icons.send
                      : (_isListening ? Icons.mic_off : Icons.mic),
                  color: widget.isLoading
                      ? AppColors.textSecondary
                      : (_hasText || _isListening ? AppColors.primary : AppColors.textSecondary),
                ),
                onPressed: widget.isLoading ? null : () {
                  if (_hasText) {
                    _sendMessage();
                  } else {
                    _toggleListening();
                  }
                },
              ),
            ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getAttachmentIcon(AttachmentType type) {
    switch (type) {
      case AttachmentType.image:
        return Icons.image;
      case AttachmentType.document:
        return Icons.description;
      case AttachmentType.audio:
        return Icons.audiotrack;
      case AttachmentType.video:
        return Icons.videocam;
      case AttachmentType.other:
      default:
        return Icons.attach_file;
    }
  }
}