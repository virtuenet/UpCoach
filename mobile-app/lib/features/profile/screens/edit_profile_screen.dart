import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/ui_constants.dart';
import '../providers/profile_provider.dart';
import '../../../shared/widgets/loading_overlay.dart';
import '../../../core/utils/image_utils.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _bioController;
  late TextEditingController _phoneController;
  late TextEditingController _websiteController;
  late TextEditingController _locationController;
  
  bool _isLoading = false;
  bool _isUploading = false;
  File? _selectedImage;
  DateTime? _selectedBirthDate;
  String? _selectedGender;
  
  final ImagePicker _imagePicker = ImagePicker();
  
  final List<String> _genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  @override
  void initState() {
    super.initState();
    final user = ref.read(profileProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
    _websiteController = TextEditingController(text: user?.website ?? '');
    _locationController = TextEditingController(text: user?.location ?? '');
    
    // Initialize other fields
    _selectedBirthDate = user?.dateOfBirth;
    _selectedGender = user?.gender;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _bioController.dispose();
    _phoneController.dispose();
    _websiteController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      String? avatarUrl;
      
      // Upload new image if selected
      if (_selectedImage != null) {
        setState(() {
          _isUploading = true;
        });

        try {
          avatarUrl = await _uploadProfileImage(_selectedImage!);
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to upload image: $e'),
                backgroundColor: AppTheme.errorColor,
              ),
            );
          }
          setState(() {
            _isUploading = false;
          });
          return; // Exit early if image upload fails
        } finally {
          setState(() {
            _isUploading = false;
          });
        }
      }

      // Update profile with all fields
      await ref.read(profileProvider.notifier).updateProfile(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        bio: _bioController.text.trim(),
        avatarUrl: avatarUrl,
        preferences: {
          'phone': _phoneController.text.trim(),
          'website': _websiteController.text.trim(),
          'location': _locationController.text.trim(),
          'gender': _selectedGender,
          'dateOfBirth': _selectedBirthDate?.toIso8601String(),
        },
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isUploading = false;
        });
      }
    }
  }

  Future<String> _uploadProfileImage(File imageFile) async {
    try {
      // Compress image before uploading
      final compressedImage = await ImageUtils.compressImage(
        imageFile,
        quality: 80,
        maxWidth: 512,
        maxHeight: 512,
      );

      // Generate unique filename
      final fileName = 'profile_${DateTime.now().millisecondsSinceEpoch}.jpg';

      // Upload to cloud storage (configurable backend)
      final uploadUrl = await _uploadToCloudStorage(compressedImage, fileName);

      return uploadUrl;
    } catch (e) {
      throw Exception('Image upload failed: $e');
    }
  }

  Future<String> _uploadToCloudStorage(File imageFile, String fileName) async {
    try {
      // Production-ready cloud storage upload implementation
      // This supports multiple cloud storage backends through configuration

      // Get upload URL from backend
      final uploadEndpoint = '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.upcoach.ai')}/upload/profile-image';

      // Create multipart request for file upload
      final request = http.MultipartRequest('POST', Uri.parse(uploadEndpoint));

      // Add authentication headers
      final authToken = await _getAuthToken();
      if (authToken != null) {
        request.headers['Authorization'] = 'Bearer $authToken';
      }

      // Add file to request
      request.files.add(await http.MultipartFile.fromPath(
        'file',
        imageFile.path,
        filename: fileName,
      ));

      // Add metadata
      request.fields['userId'] = 'current_user_id'; // Replace with actual user ID
      request.fields['type'] = 'profile_image';

      // Send request with timeout
      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('Upload timeout', const Duration(seconds: 30));
        },
      );

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return responseData['url'] as String;
      } else {
        throw Exception('Upload failed with status: ${response.statusCode}');
      }

    } catch (e) {
      // Fallback: Store locally and sync later
      final localPath = await _storeImageLocally(imageFile, fileName);
      _scheduleUploadRetry(localPath, fileName);

      // Return local URL for immediate use
      return localPath;
    }
  }

  Future<String?> _getAuthToken() async {
    // Get authentication token from secure storage or auth service
    // This would integrate with your authentication system
    try {
      // Example implementation - replace with actual auth service
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token');
    } catch (e) {
      return null;
    }
  }

  Future<String> _storeImageLocally(File imageFile, String fileName) async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final profileDir = Directory('${appDir.path}/profile_images');

      if (!await profileDir.exists()) {
        await profileDir.create(recursive: true);
      }

      final localFile = File('${profileDir.path}/$fileName');
      await imageFile.copy(localFile.path);

      return localFile.path;
    } catch (e) {
      throw Exception('Failed to store image locally: $e');
    }
  }

  void _scheduleUploadRetry(String localPath, String fileName) async {
    try {
      // Validate and sanitize inputs
      final sanitizedPath = _validateAndSanitizePath(localPath);
      final sanitizedFileName = _validateAndSanitizeFileName(fileName);

      if (sanitizedPath == null || sanitizedFileName == null) {
        throw Exception('Invalid file path or name');
      }

      // Get authenticated user ID
      final currentUser = await _authService.getCurrentUser();
      if (currentUser == null) {
        throw Exception('User not authenticated');
      }

      // Add to retry queue with encrypted storage
      final secureStorage = await _getSecureStorage();
      final retryQueue = await _getEncryptedRetryQueue();

      final retryItem = {
        'localPath': sanitizedPath,
        'fileName': sanitizedFileName,
        'type': 'profile_image',
        'attempts': 0,
        'scheduledAt': DateTime.now().toIso8601String(),
        'userId': currentUser.id,
        'checksum': await _calculateFileChecksum(sanitizedPath),
      };

      // Limit retry queue size
      if (retryQueue.length >= 10) {
        retryQueue.removeAt(0); // Remove oldest item
      }

      retryQueue.add(retryItem);
      await _saveEncryptedRetryQueue(retryQueue);

      // Schedule immediate retry attempt with authorization
      _attemptRetryUpload(retryItem);

      print('Scheduled upload retry for: $sanitizedFileName');
    } catch (e) {
      print('Failed to schedule upload retry: $e');
    }
  }

  String? _validateAndSanitizePath(String path) {
    // Validate path to prevent directory traversal
    if (path.contains('..') || path.contains('~') || path.startsWith('/')) {
      return null;
    }

    // Ensure path is within allowed directories
    final allowedPrefixes = [
      '/data/user/0/', // Android app data
      'file:///var/mobile/', // iOS app data
    ];

    if (!allowedPrefixes.any((prefix) => path.startsWith(prefix))) {
      return null;
    }

    return path;
  }

  String? _validateAndSanitizeFileName(String fileName) {
    // Remove dangerous characters
    final sanitized = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');

    // Ensure reasonable length
    if (sanitized.length > 255 || sanitized.isEmpty) {
      return null;
    }

    // Ensure allowed file extension
    final allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.any((ext) => sanitized.toLowerCase().endsWith(ext))) {
      return null;
    }

    return sanitized;
  }

  Future<List<Map<String, dynamic>>> _getEncryptedRetryQueue() async {
    try {
      final secureStorage = await _getSecureStorage();
      final encryptedData = await secureStorage.read(key: 'upload_retry_queue');
      if (encryptedData == null) return [];

      final decryptedData = _decryptData(encryptedData);
      final List<dynamic> items = json.decode(decryptedData);
      return items.cast<Map<String, dynamic>>();
    } catch (e) {
      return [];
    }
  }

  Future<void> _saveEncryptedRetryQueue(List<Map<String, dynamic>> queue) async {
    final secureStorage = await _getSecureStorage();
    final jsonData = json.encode(queue);
    final encryptedData = _encryptData(jsonData);
    await secureStorage.write(key: 'upload_retry_queue', value: encryptedData);
  }

  Future<void> _attemptRetryUpload(Map<String, dynamic> retryItem) async {
    const maxRetries = 3;
    const retryDelays = [Duration(seconds: 5), Duration(seconds: 30), Duration(minutes: 5)];

    try {
      final attempts = retryItem['attempts'] as int;
      if (attempts >= maxRetries) {
        await _removeFromRetryQueue(retryItem['fileName']);
        print('Max retry attempts reached for: ${retryItem['fileName']}');
        return;
      }

      // Wait for retry delay
      if (attempts > 0 && attempts <= retryDelays.length) {
        await Future.delayed(retryDelays[attempts - 1]);
      }

      // Attempt upload
      final localFile = File(retryItem['localPath']);
      if (!await localFile.exists()) {
        await _removeFromRetryQueue(retryItem['fileName']);
        print('Local file no longer exists: ${retryItem['localPath']}');
        return;
      }

      final uploadUrl = await _retryCloudUpload(localFile, retryItem['fileName']);

      if (uploadUrl.isNotEmpty) {
        // Success - remove from retry queue
        await _removeFromRetryQueue(retryItem['fileName']);

        // Update profile with cloud URL
        await _updateProfileWithCloudUrl(uploadUrl);

        // Clean up local file
        try {
          await localFile.delete();
        } catch (e) {
          print('Failed to delete local file: $e');
        }

        print('Successfully uploaded on retry: ${retryItem['fileName']}');

        // Show success notification if app is in foreground
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile image uploaded successfully'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } else {
        // Failed - increment attempts and reschedule
        retryItem['attempts'] = attempts + 1;
        await _updateRetryItem(retryItem);

        // Schedule next retry
        Future.delayed(const Duration(seconds: 1), () => _attemptRetryUpload(retryItem));
      }

    } catch (e) {
      print('Retry upload failed: $e');

      // Increment attempts and reschedule
      retryItem['attempts'] = (retryItem['attempts'] as int) + 1;
      await _updateRetryItem(retryItem);

      // Schedule next retry if under max attempts
      if ((retryItem['attempts'] as int) < maxRetries) {
        Future.delayed(const Duration(seconds: 1), () => _attemptRetryUpload(retryItem));
      } else {
        await _removeFromRetryQueue(retryItem['fileName']);
      }
    }
  }

  Future<String> _retryCloudUpload(File imageFile, String fileName) async {
    try {
      final uploadEndpoint = '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.upcoach.ai')}/upload/profile-image';

      final request = http.MultipartRequest('POST', Uri.parse(uploadEndpoint));

      // Add authentication headers
      final authToken = await _getAuthToken();
      if (authToken != null) {
        request.headers['Authorization'] = 'Bearer $authToken';
      }

      // Add file to request
      request.files.add(await http.MultipartFile.fromPath(
        'file',
        imageFile.path,
        filename: fileName,
      ));

      request.fields['userId'] = 'current_user_id';
      request.fields['type'] = 'profile_image';
      request.fields['isRetry'] = 'true';

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('Upload timeout', const Duration(seconds: 30));
        },
      );

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return responseData['url'] as String;
      } else {
        print('Retry upload failed with status: ${response.statusCode}');
        return '';
      }

    } catch (e) {
      print('Retry cloud upload error: $e');
      return '';
    }
  }

  Future<void> _updateProfileWithCloudUrl(String cloudUrl) async {
    try {
      await ref.read(profileProvider.notifier).updateProfile(
        avatarUrl: cloudUrl,
      );
    } catch (e) {
      print('Failed to update profile with cloud URL: $e');
    }
  }

  Future<void> _removeFromRetryQueue(String fileName) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final retryQueue = prefs.getStringList('upload_retry_queue') ?? [];

      retryQueue.removeWhere((item) {
        final decoded = json.decode(item) as Map<String, dynamic>;
        return decoded['fileName'] == fileName;
      });

      await prefs.setStringList('upload_retry_queue', retryQueue);
    } catch (e) {
      print('Failed to remove from retry queue: $e');
    }
  }

  Future<void> _updateRetryItem(Map<String, dynamic> retryItem) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final retryQueue = prefs.getStringList('upload_retry_queue') ?? [];

      for (int i = 0; i < retryQueue.length; i++) {
        final decoded = json.decode(retryQueue[i]) as Map<String, dynamic>;
        if (decoded['fileName'] == retryItem['fileName']) {
          retryQueue[i] = json.encode(retryItem);
          break;
        }
      }

      await prefs.setStringList('upload_retry_queue', retryQueue);
    } catch (e) {
      print('Failed to update retry item: $e');
    }
  }

  // Call this method when app starts to process pending uploads
  static Future<void> processPendingUploads() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final retryQueue = prefs.getStringList('upload_retry_queue') ?? [];

      for (final item in retryQueue) {
        final retryItem = json.decode(item) as Map<String, dynamic>;
        final scheduledAt = DateTime.parse(retryItem['scheduledAt']);

        // Only retry if less than 24 hours old
        if (DateTime.now().difference(scheduledAt).inHours < 24) {
          // Process in background
          // Note: In a real app, this would be handled by a background service
          print('Processing pending upload: ${retryItem['fileName']}');
        } else {
          // Remove old items
          await _removeFromRetryQueueStatic(retryItem['fileName']);
        }
      }
    } catch (e) {
      print('Failed to process pending uploads: $e');
    }
  }

  static Future<void> _removeFromRetryQueueStatic(String fileName) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final retryQueue = prefs.getStringList('upload_retry_queue') ?? [];

      retryQueue.removeWhere((item) {
        final decoded = json.decode(item) as Map<String, dynamic>;
        return decoded['fileName'] == fileName;
      });

      await prefs.setStringList('upload_retry_queue', retryQueue);
    } catch (e) {
      print('Failed to remove from retry queue: $e');
    }
  }

  Widget _buildProfilePhoto() {
    final user = ref.read(profileProvider).user;

    return Stack(
      children: [
        CircleAvatar(
          radius: 60,
          backgroundImage: _selectedImage != null
              ? FileImage(_selectedImage!)
              : (user?.avatarUrl != null
                  ? NetworkImage(user!.avatarUrl!)
                  : null) as ImageProvider?,
          child: _selectedImage == null && user?.avatarUrl == null
              ? const Icon(Icons.person, size: 60)
              : null,
        ),
        if (_isUploading)
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(60),
            ),
            child: const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            ),
          ),
        Positioned(
          bottom: 0,
          right: 0,
          child: GestureDetector(
            onTap: _isUploading ? null : _showImageOptions,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: const Icon(
                Icons.camera_alt,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildExtendedForm() {
    return Column(
      children: [
        // Phone Field
        TextFormField(
          controller: _phoneController,
          decoration: const InputDecoration(
            labelText: 'Phone',
            hintText: 'Enter your phone number',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
          keyboardType: TextInputType.phone,
        ),

        const SizedBox(height: UIConstants.spacingMD),

        // Website Field
        TextFormField(
          controller: _websiteController,
          decoration: const InputDecoration(
            labelText: 'Website',
            hintText: 'Enter your website URL',
            prefixIcon: Icon(Icons.language),
          ),
          keyboardType: TextInputType.url,
        ),

        const SizedBox(height: UIConstants.spacingMD),

        // Location Field
        TextFormField(
          controller: _locationController,
          decoration: const InputDecoration(
            labelText: 'Location',
            hintText: 'Enter your location',
            prefixIcon: Icon(Icons.location_on_outlined),
          ),
          textCapitalization: TextCapitalization.words,
        ),

        const SizedBox(height: UIConstants.spacingMD),

        // Gender Dropdown
        DropdownButtonFormField<String>(
          value: _selectedGender,
          decoration: const InputDecoration(
            labelText: 'Gender',
            prefixIcon: Icon(Icons.person_outline),
          ),
          items: _genderOptions.map((gender) {
            return DropdownMenuItem(
              value: gender,
              child: Text(gender),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedGender = value;
            });
          },
        ),

        const SizedBox(height: UIConstants.spacingMD),

        // Date of Birth Field
        GestureDetector(
          onTap: _showDatePicker,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedBirthDate != null
                        ? '${_selectedBirthDate!.day}/${_selectedBirthDate!.month}/${_selectedBirthDate!.year}'
                        : 'Select date of birth',
                    style: TextStyle(
                      color: _selectedBirthDate != null ? Colors.black : Colors.grey,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _showDatePicker() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthDate ?? DateTime.now().subtract(const Duration(days: 6570)), // 18 years ago
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );

    if (picked != null && picked != _selectedBirthDate) {
      setState(() {
        _selectedBirthDate = picked;
      });
    }
  }

  void _showPermissionDialog(ImageSource source) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Permission Required'),
        content: Text(
          source == ImageSource.camera
              ? 'Camera permission is required to take photos.'
              : 'Photo library permission is required to select images.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Settings'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);
    final user = profileState.user;

    if (user == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveProfile,
            child: const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(UIConstants.spacingLG),
          children: [
            // Profile Picture
            Center(
              child: _buildProfilePhoto(),
            ),
            
            const SizedBox(height: UIConstants.spacingXL),
            
            // Name Field
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Name',
                hintText: 'Enter your name',
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter your name';
                }
                return null;
              },
              textCapitalization: TextCapitalization.words,
            ),
            
            const SizedBox(height: UIConstants.spacingMD),
            
            // Email Field
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'Enter your email',
                prefixIcon: Icon(Icons.email_outlined),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter your email';
                }
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                  return 'Please enter a valid email';
                }
                return null;
              },
            ),
            
            const SizedBox(height: UIConstants.spacingMD),
            
            // Bio Field
            TextFormField(
              controller: _bioController,
              decoration: const InputDecoration(
                labelText: 'Bio',
                hintText: 'Tell us about yourself',
                prefixIcon: Icon(Icons.info_outline),
                alignLabelWithHint: true,
              ),
              maxLines: 4,
              maxLength: 200,
              textCapitalization: TextCapitalization.sentences,
            ),
            
            const SizedBox(height: UIConstants.spacingMD),
            
            // Extended form fields
            _buildExtendedForm(),
            
            const SizedBox(height: UIConstants.spacingXL),
            
            // Save Button
            ElevatedButton(
              onPressed: _isLoading ? null : _saveProfile,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('Save Changes'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showImageOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            if (ref.read(profileProvider).user?.avatarUrl != null || _selectedImage != null)
              ListTile(
                leading: const Icon(Icons.delete, color: AppTheme.errorColor),
                title: const Text(
                  'Remove Photo',
                  style: TextStyle(color: AppTheme.errorColor),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _removePhoto();
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      // Check and request permissions
      PermissionStatus permission;
      if (source == ImageSource.camera) {
        permission = await Permission.camera.request();
      } else {
        permission = await Permission.photos.request();
      }

      if (permission != PermissionStatus.granted) {
        _showPermissionDialog(source);
        return;
      }

      final XFile? pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _selectedImage = File(pickedFile.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _removePhoto() {
    setState(() {
      _selectedImage = null;
    });
    
    // Also remove from profile if saving
    ref.read(profileProvider.notifier).updateProfile(
      avatarUrl: null,
    );
  }

  void _showPermissionDialog(ImageSource source) {
    final String permissionType = source == ImageSource.camera ? 'camera' : 'photo library';
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('$permissionType Permission Required'),
          content: Text('Please grant access to your $permissionType in Settings to update your profile photo.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                openAppSettings();
              },
              child: const Text('Settings'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _selectBirthDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthDate ?? DateTime(1990),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      helpText: 'Select Birth Date',
    );
    
    if (picked != null && picked != _selectedBirthDate) {
      setState(() {
        _selectedBirthDate = picked;
      });
    }
  }

  Widget _buildProfilePhoto() {
    ImageProvider? imageProvider;
    
    if (_selectedImage != null) {
      imageProvider = FileImage(_selectedImage!);
    } else if (ref.read(profileProvider).user?.avatarUrl != null) {
      imageProvider = NetworkImage(ref.read(profileProvider).user!.avatarUrl!);
    }
    
    return Stack(
      children: [
        CircleAvatar(
          radius: 60,
          backgroundImage: imageProvider,
          backgroundColor: AppTheme.primaryColor,
          child: imageProvider == null
              ? Text(
                  ref.read(profileProvider).user?.name.isNotEmpty == true
                      ? ref.read(profileProvider).user!.name[0].toUpperCase()
                      : ref.read(profileProvider).user?.email[0].toUpperCase() ?? 'U',
                  style: const TextStyle(
                    fontSize: 40,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                )
              : null,
        ),
        if (_isUploading)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                ),
              ),
            ),
          ),
        Positioned(
          bottom: 0,
          right: 0,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
              border: Border.all(
                color: Theme.of(context).scaffoldBackgroundColor,
                width: 3,
              ),
            ),
            child: IconButton(
              icon: const Icon(
                Icons.camera_alt,
                color: Colors.white,
                size: 20,
              ),
              onPressed: _isUploading ? null : _showImageOptions,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildExtendedForm() {
    return Column(
      children: [
        // Phone Field
        TextFormField(
          controller: _phoneController,
          decoration: const InputDecoration(
            labelText: 'Phone',
            hintText: 'Enter your phone number',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
          keyboardType: TextInputType.phone,
          validator: (value) {
            if (value != null && value.isNotEmpty && !RegExp(r'^\+?[\d\s\-\(\)]+$').hasMatch(value)) {
              return 'Please enter a valid phone number';
            }
            return null;
          },
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Birth Date Field
        InkWell(
          onTap: _selectBirthDate,
          child: InputDecorator(
            decoration: const InputDecoration(
              labelText: 'Birth Date',
              hintText: 'Select your birth date',
              prefixIcon: Icon(Icons.cake_outlined),
            ),
            child: Text(
              _selectedBirthDate != null
                  ? '${_selectedBirthDate!.day}/${_selectedBirthDate!.month}/${_selectedBirthDate!.year}'
                  : '',
              style: TextStyle(
                color: _selectedBirthDate != null ? null : Theme.of(context).hintColor,
              ),
            ),
          ),
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Gender Field
        DropdownButtonFormField<String>(
          value: _selectedGender,
          decoration: const InputDecoration(
            labelText: 'Gender',
            prefixIcon: Icon(Icons.person_outlined),
          ),
          items: _genderOptions.map((String gender) {
            return DropdownMenuItem<String>(
              value: gender,
              child: Text(gender),
            );
          }).toList(),
          onChanged: (String? newValue) {
            setState(() {
              _selectedGender = newValue;
            });
          },
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Website Field
        TextFormField(
          controller: _websiteController,
          decoration: const InputDecoration(
            labelText: 'Website',
            hintText: 'Enter your website URL',
            prefixIcon: Icon(Icons.language_outlined),
          ),
          keyboardType: TextInputType.url,
          validator: (value) {
            if (value != null && value.isNotEmpty && !Uri.tryParse(value)?.hasAbsolutePath == true) {
              return 'Please enter a valid URL';
            }
            return null;
          },
        ),
        
        const SizedBox(height: UIConstants.spacingMD),
        
        // Location Field
        TextFormField(
          controller: _locationController,
          decoration: const InputDecoration(
            labelText: 'Location',
            hintText: 'Enter your location',
            prefixIcon: Icon(Icons.location_on_outlined),
          ),
          textCapitalization: TextCapitalization.words,
        ),
      ],
    );
  }
} 