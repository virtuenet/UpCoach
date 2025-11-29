import 'dart:io';
import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/constants/ui_constants.dart';
import '../providers/profile_provider.dart';

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
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(profileProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      await ref.read(profileProvider.notifier).updateProfile(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        bio: _bioController.text.trim(),
      );

      if (mounted) {
        context.pop();
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
        });
      }
    }
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
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 60,
                    backgroundImage: user.avatarUrl != null
                        ? NetworkImage(user.avatarUrl!)
                        : null,
                    backgroundColor: AppTheme.primaryColor,
                    child: user.avatarUrl == null
                        ? Text(
                            user.name.isNotEmpty
                                ? user.name[0].toUpperCase()
                                : user.email[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 40,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
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
                        onPressed: () {
                          _showImageOptions();
                        },
                      ),
                    ),
                  ),
                ],
              ),
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
                context.pop();
                _pickImageFromCamera();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                context.pop();
                _pickImageFromGallery();
              },
            ),
            if (ref.read(profileProvider).user?.avatarUrl != null)
              ListTile(
                leading: const Icon(Icons.delete, color: AppTheme.errorColor),
                title: const Text(
                  'Remove Photo',
                  style: TextStyle(color: AppTheme.errorColor),
                ),
                onTap: () {
                  context.pop();
                  _removePhoto();
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImageFromCamera() async {
    try {
      // Request camera permission
      final permission = await Permission.camera.request();
      if (!permission.isGranted) {
        _showSnackBar('Camera permission is required to take photos');
        return;
      }

      final XFile? image = await ImagePicker().pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (image != null) {
        await _processSelectedImage(image);
      }
    } catch (e) {
      _showSnackBar('Failed to take photo: $e');
    }
  }

  Future<void> _pickImageFromGallery() async {
    try {
      // Request photo library permission
      final permission = await Permission.photos.request();
      if (!permission.isGranted) {
        _showSnackBar('Photo library permission is required to select images');
        return;
      }

      final XFile? image = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (image != null) {
        await _processSelectedImage(image);
      }
    } catch (e) {
      _showSnackBar('Failed to select image: $e');
    }
  }

  Future<void> _processSelectedImage(XFile image) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final uploadUrl = await _uploadProfileImage(File(image.path));

      // Update user profile with new avatar URL
      await ref.read(profileProvider.notifier).updateProfile(
        avatarUrl: uploadUrl,
      );

      _showSnackBar('Profile photo updated successfully');
    } catch (e) {
      _showSnackBar('Failed to update profile photo: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _removePhoto() async {
    try {
      await ref.read(profileProvider.notifier).updateProfile(
        avatarUrl: null,
      );
      _showSnackBar('Profile photo removed successfully');
    } catch (e) {
      _showSnackBar('Failed to remove profile photo: $e');
    }
  }

  // Upload retry mechanism with exponential backoff
  Future<String> _uploadProfileImage(File imageFile) async {
    const maxRetries = 3;
    const baseDelay = Duration(seconds: 1);

    for (int attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Simulate network status check
        if (await _checkNetworkConnection()) {
          // Upload the image file with timeout
          final uploadUrl = await _performUpload(imageFile).timeout(
            const Duration(seconds: 30),
            onTimeout: () => throw Exception('Upload timeout'),
          );

          if (uploadUrl.isNotEmpty) {
            return uploadUrl;
          }
        }

        throw Exception('Network unavailable or upload failed');
      } catch (e) {
        if (attempt == maxRetries - 1) {
          // Final attempt failed, add to background queue
          await _addToUploadQueue(imageFile);
          throw Exception('Upload failed after $maxRetries attempts. Added to retry queue.');
        }

        // Exponential backoff delay
        final delay = Duration(
          milliseconds: baseDelay.inMilliseconds * (1 << attempt)
        );
        await Future.delayed(delay);

        if (mounted) {
          _showSnackBar('Upload attempt ${attempt + 1} failed, retrying...');
        }
      }
    }

    throw Exception('Upload failed');
  }

  Future<bool> _checkNetworkConnection() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  Future<String> _performUpload(File imageFile) async {
    // Compress image if needed
    final compressedFile = await _compressImage(imageFile);

    // Read auth tokens and user id
    const secureStorage = FlutterSecureStorage();
    final accessToken = await secureStorage.read(key: 'access_token');
    final userId = await secureStorage.read(key: 'user_id');

    if (accessToken == null || userId == null) {
      throw Exception('User not authenticated');
    }

    final uri = Uri.parse('${AppConstants.apiUrl}/users/$userId/avatar');

    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $accessToken';
    request.files.add(await http.MultipartFile.fromPath(
      'avatar',
      compressedFile.path,
      filename: compressedFile.path.split('/').last,
    ));

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final Map<String, dynamic> jsonBody = json.decode(response.body) as Map<String, dynamic>;
      final data = jsonBody['data'] as Map<String, dynamic>?;
      final avatarUrl = data != null ? (data['avatarUrl'] as String?) : null;
      if (avatarUrl == null || avatarUrl.isEmpty) {
        throw Exception('Invalid upload response');
      }
      return avatarUrl;
    }

    throw Exception('Upload failed with status ${response.statusCode}');
  }

  Future<File> _compressImage(File imageFile) async {
    try {
      // Compress image to reduce file size and improve upload performance
      final bytes = await imageFile.readAsBytes();
      final originalSize = bytes.length;

      // If image is already small enough, return original
      if (originalSize <= 500 * 1024) { // 500KB
        return imageFile;
      }

      // Calculate compression quality based on original size
      int quality = 85;
      if (originalSize > 2 * 1024 * 1024) { // > 2MB
        quality = 60;
      } else if (originalSize > 1 * 1024 * 1024) { // > 1MB
        quality = 70;
      }

      // Create compressed file path
      final directory = imageFile.parent;
      final fileName = imageFile.path.split('/').last;
      final compressedPath = '${directory.path}/compressed_$fileName';

      // Simple compression by resizing and adjusting quality
      // Note: For production, consider using flutter_image_compress package
      final compressedBytes = await _resizeAndCompressBytes(bytes, quality);

      final compressedFile = File(compressedPath);
      await compressedFile.writeAsBytes(compressedBytes);

      return compressedFile;
    } catch (e) {
      // If compression fails, return original file
      return imageFile;
    }
  }

  Future<List<int>> _resizeAndCompressBytes(List<int> bytes, int quality) async {
    // Basic compression implementation
    // In production, use packages like flutter_image_compress for better compression
    try {
      // For now, return original bytes
      // This is where you'd integrate with flutter_image_compress:
      // return await FlutterImageCompress.compressWithList(bytes, quality: quality);
      return bytes;
    } catch (e) {
      return bytes;
    }
  }

  Future<void> _addToUploadQueue(File imageFile) async {
    try {
      // Store failed upload in local queue for background retry
      final queueData = {
        'filePath': imageFile.path,
        'uploadType': 'profile_image',
        'userId': ref.read(profileProvider).user?.id,
        'createdAt': DateTime.now().toIso8601String(),
        'retryCount': 0,
      };

      // Save to local storage for background processing
      await _saveUploadToQueue(queueData);

      if (mounted) {
        _showSnackBar('Upload failed. Will retry in background when connection improves.');
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar('Failed to queue upload for retry');
      }
    }
  }

  Future<void> _saveUploadToQueue(Map<String, dynamic> queueData) async {
    try {
      // Use SharedPreferences to store upload queue
      final prefs = await SharedPreferences.getInstance();

      // Get existing queue
      final queueJson = prefs.getString('upload_queue') ?? '[]';
      final List<dynamic> queue = json.decode(queueJson);

      // Add new item to queue
      queue.add(queueData);

      // Save updated queue
      await prefs.setString('upload_queue', json.encode(queue));

      // Schedule background processing
      _scheduleBackgroundUpload();
    } catch (e) {
      print('Error saving to upload queue: $e');
    }
  }

  // Background upload processor (call this periodically or on network state change)
  Future<void> _processUploadQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueJson = prefs.getString('upload_queue') ?? '[]';
      final List<dynamic> queue = json.decode(queueJson);

      if (queue.isEmpty) return;

      // Check network connectivity
      if (!await _checkNetworkConnection()) {
        return; // No network, try again later
      }

      final List<dynamic> updatedQueue = [];
      const maxRetryCount = 5;

      for (final item in queue) {
        final Map<String, dynamic> uploadItem = Map<String, dynamic>.from(item);
        final filePath = uploadItem['filePath'] as String;
        final retryCount = uploadItem['retryCount'] as int;

        if (retryCount >= maxRetryCount) {
          // Remove items that have exceeded max retry attempts
          continue;
        }

        try {
          final file = File(filePath);
          if (!await file.exists()) {
            // File no longer exists, remove from queue
            continue;
          }

          // Attempt to upload
          final uploadUrl = await _performUpload(file).timeout(
            const Duration(seconds: 30),
            onTimeout: () => throw Exception('Upload timeout'),
          );

          if (uploadUrl.isNotEmpty) {
            // Upload successful, update profile
            await ref.read(profileProvider.notifier).updateProfile(
              avatarUrl: uploadUrl,
            );

            // Remove successful upload from queue
            continue;
          }
        } catch (e) {
          // Upload failed, increment retry count and keep in queue
          uploadItem['retryCount'] = retryCount + 1;
          uploadItem['lastRetryAt'] = DateTime.now().toIso8601String();
          updatedQueue.add(uploadItem);
        }
      }

      // Save updated queue
      await prefs.setString('upload_queue', json.encode(updatedQueue));

      // Schedule next processing if queue is not empty
      if (updatedQueue.isNotEmpty) {
        _scheduleBackgroundUpload();
      }
    } catch (e) {
      print('Error processing upload queue: $e');
    }
  }

  void _scheduleBackgroundUpload() {
    // Schedule background processing after 30 seconds
    Timer(const Duration(seconds: 30), () {
      _processUploadQueue();
    });
  }

  void _showSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }
} 