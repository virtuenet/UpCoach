import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/theme/app_colors.dart';
import '../../../shared/constants/app_text_styles.dart';
import '../../../core/services/feedback_service.dart';

class FeedbackScreen extends ConsumerStatefulWidget {
  const FeedbackScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  
  String _selectedType = 'Bug Report';
  String _selectedPriority = 'Medium';
  final List<File> _attachments = [];
  bool _isSubmitting = false;

  final List<String> _feedbackTypes = [
    'Bug Report',
    'Feature Request',
    'General Feedback',
    'Performance Issue',
    'UI/UX Feedback',
    'Other',
  ];

  final List<String> _priorities = ['Low', 'Medium', 'High', 'Critical'];

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    if (_attachments.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 3 attachments allowed')),
      );
      return;
    }

    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: source,
      maxWidth: 1080,
      maxHeight: 1080,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        _attachments.add(File(image.path));
      });
    }
  }

  void _removeAttachment(int index) {
    setState(() {
      _attachments.removeAt(index);
    });
  }

  Future<void> _submitFeedback() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final feedbackService = ref.read(feedbackServiceProvider);
      
      await feedbackService.submitFeedback(
        type: _selectedType,
        priority: _selectedPriority,
        subject: _subjectController.text,
        message: _messageController.text,
        attachments: _attachments,
      );

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Text('Thank You!'),
            content: const Text(
              'Your feedback has been submitted successfully. We\'ll review it and get back to you if needed.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit feedback: $e')),
        );
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Feedback'),
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          children: [
            // Feedback Type
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
              ),
              child: Padding(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Feedback Type',
                      style: AppTextStyles.h4,
                    ),
                    const SizedBox(height: UIConstants.spacingMD),
                    DropdownButtonFormField<String>(
                      value: _selectedType,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      items: _feedbackTypes.map((type) {
                        return DropdownMenuItem(
                          value: type,
                          child: Row(
                            children: [
                              Icon(
                                _getTypeIcon(type),
                                size: 20,
                                color: AppColors.textSecondary,
                              ),
                              const SizedBox(width: UIConstants.spacingSM),
                              Text(type),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() => _selectedType = value!);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            // Priority (only for bug reports)
            if (_selectedType == 'Bug Report' || _selectedType == 'Performance Issue')
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Priority',
                        style: AppTextStyles.h4,
                      ),
                      const SizedBox(height: UIConstants.spacingMD),
                      Wrap(
                        spacing: 8,
                        children: _priorities.map((priority) {
                          final isSelected = _selectedPriority == priority;
                          return ChoiceChip(
                            label: Text(priority),
                            selected: isSelected,
                            onSelected: (_) {
                              setState(() => _selectedPriority = priority);
                            },
                            selectedColor: _getPriorityColor(priority),
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : null,
                              fontWeight: isSelected ? FontWeight.bold : null,
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),

            if (_selectedType == 'Bug Report' || _selectedType == 'Performance Issue')
              const SizedBox(height: UIConstants.spacingMD),

            // Subject & Message
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
              ),
              child: Padding(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Details',
                      style: AppTextStyles.h4,
                    ),
                    const SizedBox(height: UIConstants.spacingMD),
                    TextFormField(
                      controller: _subjectController,
                      decoration: const InputDecoration(
                        labelText: 'Subject',
                        hintText: 'Brief description of your feedback',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a subject';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: UIConstants.spacingMD),
                    TextFormField(
                      controller: _messageController,
                      decoration: const InputDecoration(
                        labelText: 'Message',
                        hintText: 'Provide detailed information...',
                        alignLabelWithHint: true,
                      ),
                      maxLines: 6,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your feedback message';
                        }
                        if (value.length < 20) {
                          return 'Please provide more details (minimum 20 characters)';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            // Attachments
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(UIConstants.radiusLG),
              ),
              child: Padding(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Attachments',
                          style: AppTextStyles.h4,
                        ),
                        Text(
                          '${_attachments.length}/3',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: UIConstants.spacingSM),
                    Text(
                      'Add screenshots or images to help explain your feedback',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: UIConstants.spacingMD),
                    if (_attachments.isNotEmpty) ...[
                      SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _attachments.length,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                                    child: Image.file(
                                      _attachments[index],
                                      width: 100,
                                      height: 100,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: CircleAvatar(
                                      radius: 12,
                                      backgroundColor: Colors.black54,
                                      child: IconButton(
                                        icon: const Icon(
                                          Icons.close,
                                          size: 12,
                                          color: Colors.white,
                                        ),
                                        padding: EdgeInsets.zero,
                                        onPressed: () => _removeAttachment(index),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: UIConstants.spacingMD),
                    ],
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.camera),
                            icon: const Icon(Icons.camera_alt),
                            label: const Text('Camera'),
                          ),
                        ),
                        const SizedBox(width: UIConstants.spacingMD),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library),
                            label: const Text('Gallery'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),

            // Device Info (for bug reports)
            if (_selectedType == 'Bug Report' || _selectedType == 'Performance Issue')
              Card(
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
                          Icon(
                            Icons.info_outline,
                            size: 20,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: UIConstants.spacingSM),
                          Text(
                            'Device Information',
                            style: AppTextStyles.h4,
                          ),
                        ],
                      ),
                      const SizedBox(height: UIConstants.spacingSM),
                      Text(
                        'The following information will be included to help diagnose the issue:',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: UIConstants.spacingMD),
                      _buildInfoRow('Device', '${Platform.operatingSystem} ${Platform.operatingSystemVersion}'),
                      _buildInfoRow('App Version', '1.0.0'),
                      _buildInfoRow('Build Number', '100'),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: UIConstants.spacingLG),

            // Submit Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitFeedback,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                ),
              ),
              child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Submit Feedback',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
            ),
            const SizedBox(height: UIConstants.spacingXL),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'Bug Report':
        return Icons.bug_report;
      case 'Feature Request':
        return Icons.lightbulb;
      case 'Performance Issue':
        return Icons.speed;
      case 'UI/UX Feedback':
        return Icons.design_services;
      case 'General Feedback':
        return Icons.feedback;
      default:
        return Icons.help_outline;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'Critical':
        return Colors.red;
      case 'High':
        return Colors.orange;
      case 'Medium':
        return AppColors.primary;
      case 'Low':
        return Colors.grey;
      default:
        return AppColors.primary;
    }
  }
}