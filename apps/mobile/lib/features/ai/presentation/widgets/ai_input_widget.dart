import 'package:flutter/material.dart';
import 'package:upcoach/core/theme/app_colors.dart';

class AIInputWidget extends StatefulWidget {
  final Function(String) onSendMessage;
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
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() {
        _hasText = _controller.text.trim().isNotEmpty;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_controller.text.trim().isEmpty || widget.isLoading) return;
    
    widget.onSendMessage(_controller.text);
    _controller.clear();
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
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.attach_file),
              onPressed: widget.isLoading ? null : () {
                // TODO: Implement file attachment
              },
              color: AppColors.textSecondary,
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
                  _hasText ? Icons.send : Icons.mic,
                  color: widget.isLoading 
                      ? AppColors.textSecondary 
                      : (_hasText ? AppColors.primary : AppColors.textSecondary),
                ),
                onPressed: widget.isLoading ? null : () {
                  if (_hasText) {
                    _sendMessage();
                  } else {
                    // TODO: Implement voice input
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}