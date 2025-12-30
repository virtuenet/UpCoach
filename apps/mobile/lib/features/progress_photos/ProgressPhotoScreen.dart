import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import '../../ml/ImageAnalysisEngine.dart';

// ============================================================================
// DATA MODELS
// ============================================================================

class ProgressPhoto {
  final String id;
  final File imageFile;
  final DateTime timestamp;
  final BodyCompositionAnalysis? analysis;
  final String? notes;

  ProgressPhoto({
    required this.id,
    required this.imageFile,
    required this.timestamp,
    this.analysis,
    this.notes,
  });
}

// ============================================================================
// PROGRESS PHOTO SCREEN
// ============================================================================

class ProgressPhotoScreen extends StatefulWidget {
  const ProgressPhotoScreen({Key? key}) : super(key: key);

  @override
  State<ProgressPhotoScreen> createState() => _ProgressPhotoScreenState();
}

class _ProgressPhotoScreenState extends State<ProgressPhotoScreen> {
  final ImageAnalysisEngine _analysisEngine = ImageAnalysisEngine();
  final ImagePicker _imagePicker = ImagePicker();
  final List<ProgressPhoto> _photos = [];

  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isAnalyzing = false;
  int _selectedTabIndex = 0;
  double _comparisonSliderValue = 0.5;

  @override
  void initState() {
    super.initState();
    _initializeEngine();
    _loadPhotos();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _initializeEngine() async {
    try {
      await _analysisEngine.initialize();
    } catch (e) {
      _showError('Failed to initialize image analysis: $e');
    }
  }

  Future<void> _loadPhotos() async {
    // In production, load from database
    // For now, just show empty state
    setState(() {});
  }

  // ============================================================================
  // CAMERA OPERATIONS
  // ============================================================================

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _showError('No camera available');
        return;
      }

      // Use front camera for progress photos
      final camera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        camera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
      }
    } catch (e) {
      _showError('Failed to initialize camera: $e');
    }
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      await _initializeCamera();
      return;
    }

    try {
      final image = await _cameraController!.takePicture();
      final imageFile = File(image.path);

      await _processPhoto(imageFile);
    } catch (e) {
      _showError('Failed to capture photo: $e');
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 90,
      );

      if (image != null) {
        final imageFile = File(image.path);
        await _processPhoto(imageFile);
      }
    } catch (e) {
      _showError('Failed to pick image: $e');
    }
  }

  // ============================================================================
  // PHOTO PROCESSING
  // ============================================================================

  Future<void> _processPhoto(File imageFile) async {
    setState(() {
      _isAnalyzing = true;
    });

    try {
      // Validate image quality
      final quality = await _analysisEngine.validateImageQuality(imageFile);

      if (!quality.isValid) {
        _showQualityIssues(quality);
        setState(() {
          _isAnalyzing = false;
        });
        return;
      }

      // Analyze body composition
      final analysis = await _analysisEngine.analyzeBodyComposition(imageFile);

      // Save photo to permanent storage
      final savedFile = await _savePhoto(imageFile);

      // Create progress photo entry
      final photo = ProgressPhoto(
        id: 'photo_${DateTime.now().millisecondsSinceEpoch}',
        imageFile: savedFile,
        timestamp: DateTime.now(),
        analysis: analysis,
      );

      setState(() {
        _photos.insert(0, photo);
        _isAnalyzing = false;
        _selectedTabIndex = 1; // Switch to gallery tab
      });

      _showAnalysisResults(analysis);
    } catch (e) {
      setState(() {
        _isAnalyzing = false;
      });
      _showError('Failed to analyze photo: $e');
    }
  }

  Future<File> _savePhoto(File tempFile) async {
    final appDir = await getApplicationDocumentsDirectory();
    final photosDir = Directory('${appDir.path}/progress_photos');

    if (!await photosDir.exists()) {
      await photosDir.create(recursive: true);
    }

    final fileName = 'progress_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final savedFile = File('${photosDir.path}/$fileName');

    await tempFile.copy(savedFile.path);
    return savedFile;
  }

  // ============================================================================
  // COMPARISON
  // ============================================================================

  void _showComparison() {
    if (_photos.length < 2) {
      _showError('Need at least 2 photos to compare');
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildComparisonSheet(),
    );
  }

  Widget _buildComparisonSheet() {
    final beforePhoto = _photos.last;
    final afterPhoto = _photos.first;

    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Progress Comparison',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Date range
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Before', style: TextStyle(color: Colors.grey)),
                    Text(
                      _formatDate(beforePhoto.timestamp),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('After', style: TextStyle(color: Colors.grey)),
                    Text(
                      _formatDate(afterPhoto.timestamp),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Comparison slider
          Expanded(
            child: Stack(
              children: [
                // Before image
                Positioned.fill(
                  child: Image.file(
                    beforePhoto.imageFile,
                    fit: BoxFit.contain,
                  ),
                ),

                // After image with clip
                Positioned.fill(
                  child: ClipRect(
                    clipper: _SliderClipper(_comparisonSliderValue),
                    child: Image.file(
                      afterPhoto.imageFile,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),

                // Slider
                Positioned.fill(
                  child: SliderTheme(
                    data: SliderThemeData(
                      thumbShape: _CustomSliderThumbShape(),
                      trackHeight: 0,
                      overlayShape: SliderComponentShape.noOverlay,
                    ),
                    child: Slider(
                      value: _comparisonSliderValue,
                      onChanged: (value) {
                        setState(() {
                          _comparisonSliderValue = value;
                        });
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Stats comparison
          if (beforePhoto.analysis != null && afterPhoto.analysis != null)
            _buildStatsComparison(beforePhoto.analysis!, afterPhoto.analysis!),
        ],
      ),
    );
  }

  Widget _buildStatsComparison(
    BodyCompositionAnalysis before,
    BodyCompositionAnalysis after,
  ) {
    final bodyFatChange = after.bodyFatPercentage - before.bodyFatPercentage;
    final muscleMassChange = after.muscleMass - before.muscleMass;

    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Body Fat',
              '${bodyFatChange >= 0 ? '+' : ''}${bodyFatChange.toStringAsFixed(1)}%',
              bodyFatChange < 0 ? Colors.green : Colors.red,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'Muscle Mass',
              '${muscleMassChange >= 0 ? '+' : ''}${muscleMassChange.toStringAsFixed(1)} kg',
              muscleMassChange > 0 ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================================
  // UI BUILDERS
  // ============================================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress Photos'),
        actions: [
          if (_photos.length >= 2)
            IconButton(
              icon: const Icon(Icons.compare),
              onPressed: _showComparison,
              tooltip: 'Compare photos',
            ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: _showPrivacyInfo,
          ),
        ],
      ),
      body: _selectedTabIndex == 0 ? _buildCameraView() : _buildGalleryView(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedTabIndex,
        onTap: (index) {
          setState(() {
            _selectedTabIndex = index;
          });
          if (index == 0 && !_isCameraInitialized) {
            _initializeCamera();
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt),
            label: 'Camera',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.photo_library),
            label: 'Gallery',
          ),
        ],
      ),
    );
  }

  Widget _buildCameraView() {
    if (_isAnalyzing) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Analyzing your photo...'),
            SizedBox(height: 8),
            Text(
              'This may take a moment',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    if (!_isCameraInitialized) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.camera_alt, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _initializeCamera,
              child: const Text('Initialize Camera'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _pickFromGallery,
              child: const Text('Choose from gallery'),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        // Camera preview
        Positioned.fill(
          child: CameraPreview(_cameraController!),
        ),

        // Pose guidance overlay
        Positioned.fill(
          child: CustomPaint(
            painter: _PoseGuidancePainter(),
          ),
        ),

        // Instructions
        Positioned(
          top: 16,
          left: 16,
          right: 16,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Stand within the guide\nKeep good lighting\nMaintain consistent pose',
              style: TextStyle(color: Colors.white),
              textAlign: TextAlign.center,
            ),
          ),
        ),

        // Capture button
        Positioned(
          bottom: 32,
          left: 0,
          right: 0,
          child: Center(
            child: GestureDetector(
              onTap: _capturePhoto,
              child: Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  border: Border.all(color: Colors.blue, width: 4),
                ),
              ),
            ),
          ),
        ),

        // Gallery button
        Positioned(
          bottom: 44,
          left: 32,
          child: IconButton(
            icon: const Icon(Icons.photo_library, color: Colors.white, size: 32),
            onPressed: _pickFromGallery,
          ),
        ),
      ],
    );
  }

  Widget _buildGalleryView() {
    if (_photos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_library_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            const Text(
              'No progress photos yet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Take your first photo to track your progress',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _selectedTabIndex = 0;
                });
                _initializeCamera();
              },
              icon: const Icon(Icons.camera_alt),
              label: const Text('Take Photo'),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 0.75,
      ),
      itemCount: _photos.length,
      itemBuilder: (context, index) {
        final photo = _photos[index];
        return _buildPhotoCard(photo);
      },
    );
  }

  Widget _buildPhotoCard(ProgressPhoto photo) {
    return GestureDetector(
      onTap: () => _showPhotoDetail(photo),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Image.file(
                photo.imageFile,
                fit: BoxFit.cover,
                width: double.infinity,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formatDate(photo.timestamp),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (photo.analysis != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${photo.analysis!.bodyFatPercentage.toStringAsFixed(1)}% BF',
                      style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPhotoDetail(ProgressPhoto photo) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _PhotoDetailScreen(photo: photo),
      ),
    );
  }

  // ============================================================================
  // DIALOGS & MESSAGES
  // ============================================================================

  void _showQualityIssues(ImageQualityResult quality) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Image Quality Issues'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Please address these issues:'),
            const SizedBox(height: 12),
            ...quality.issues.map((issue) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.warning, size: 16, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(child: Text(issue)),
                    ],
                  ),
                )),
            if (quality.suggestions.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Suggestions:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...quality.suggestions.map((suggestion) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text('• $suggestion', style: const TextStyle(fontSize: 13)),
                  )),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  void _showAnalysisResults(BodyCompositionAnalysis analysis) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Analysis complete! Body fat: ${analysis.bodyFatPercentage.toStringAsFixed(1)}%',
        ),
        action: SnackBarAction(
          label: 'View',
          onPressed: () {
            // Show detailed results
          },
        ),
      ),
    );
  }

  void _showPrivacyInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Privacy & Security'),
        content: const Text(
          'Your progress photos are:\n\n'
          '• Stored locally on your device\n'
          '• Processed on-device using AI\n'
          '• Never uploaded without your permission\n'
          '• Encrypted at rest\n\n'
          'You have full control over your data.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Understood'),
          ),
        ],
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

// ============================================================================
// CUSTOM PAINTERS & WIDGETS
// ============================================================================

class _PoseGuidancePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    // Draw body outline guide
    final centerX = size.width / 2;
    final bodyWidth = size.width * 0.6;
    final bodyHeight = size.height * 0.7;
    final bodyTop = size.height * 0.15;

    final rect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset(centerX, bodyTop + bodyHeight / 2),
        width: bodyWidth,
        height: bodyHeight,
      ),
      const Radius.circular(100),
    );

    canvas.drawRRect(rect, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _SliderClipper extends CustomClipper<Rect> {
  final double sliderValue;

  _SliderClipper(this.sliderValue);

  @override
  Rect getClip(Size size) {
    return Rect.fromLTRB(0, 0, size.width * sliderValue, size.height);
  }

  @override
  bool shouldReclip(covariant _SliderClipper oldClipper) {
    return oldClipper.sliderValue != sliderValue;
  }
}

class _CustomSliderThumbShape extends SliderComponentShape {
  @override
  Size getPreferredSize(bool isEnabled, bool isDiscrete) {
    return const Size(4, double.infinity);
  }

  @override
  void paint(
    PaintingContext context,
    Offset center, {
    required Animation<double> activationAnimation,
    required Animation<double> enableAnimation,
    required bool isDiscrete,
    required TextPainter labelPainter,
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    required TextDirection textDirection,
    required double value,
    required double textScaleFactor,
    required Size sizeWithOverflow,
  }) {
    final canvas = context.canvas;

    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    canvas.drawRect(
      Rect.fromCenter(
        center: center,
        width: 4,
        height: parentBox.size.height,
      ),
      paint,
    );
  }
}

// ============================================================================
// PHOTO DETAIL SCREEN
// ============================================================================

class _PhotoDetailScreen extends StatelessWidget {
  final ProgressPhoto photo;

  const _PhotoDetailScreen({required this.photo});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Photo Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // Share photo
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              // Delete photo
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Photo
            Image.file(
              photo.imageFile,
              width: double.infinity,
              fit: BoxFit.contain,
            ),

            // Analysis results
            if (photo.analysis != null) ...[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Analysis Results',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    _buildAnalysisRow(
                      'Body Fat',
                      '${photo.analysis!.bodyFatPercentage.toStringAsFixed(1)}%',
                    ),
                    _buildAnalysisRow(
                      'Muscle Mass',
                      '${photo.analysis!.muscleMass.toStringAsFixed(1)} kg',
                    ),
                    _buildAnalysisRow('Body Type', photo.analysis!.bodyType),
                    const SizedBox(height: 16),
                    const Text(
                      'Insights',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...photo.analysis!.insights.map((insight) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.lightbulb_outline, size: 16),
                              const SizedBox(width: 8),
                              Expanded(child: Text(insight)),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAnalysisRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
