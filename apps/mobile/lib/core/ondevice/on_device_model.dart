import 'dart:io' show File, Platform;
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';

/// Exception thrown when model integrity verification fails
class ModelIntegrityException implements Exception {
  final String message;
  const ModelIntegrityException(this.message);

  @override
  String toString() => 'ModelIntegrityException: $message';
}

/// Validates on-device model integrity before use
class OnDeviceModelValidator {
  /// Checks if a checksum is a placeholder value
  static bool isPlaceholderChecksum(String checksum) {
    return checksum.contains('placeholder') ||
        checksum.isEmpty ||
        !checksum.startsWith('sha256:') ||
        checksum.length < 70; // sha256: (7) + 64 hex chars = 71 minimum
  }

  /// Verifies model file integrity against expected checksum
  ///
  /// Returns true if verification passes.
  /// In debug mode, logs a warning for placeholder checksums and returns true.
  /// In release mode, throws [ModelIntegrityException] for placeholder checksums.
  static Future<bool> verifyModelIntegrity(
    File modelFile,
    String expectedChecksum,
  ) async {
    // Check if checksum is a placeholder
    if (isPlaceholderChecksum(expectedChecksum)) {
      if (kDebugMode) {
        debugPrint(
          'WARNING: Model checksum verification skipped - placeholder value detected. '
          'Ensure real checksums are added before production deployment.',
        );
        return true;
      } else {
        throw const ModelIntegrityException(
          'Invalid model checksum in production. '
          'Model files must have valid SHA256 checksums for security.',
        );
      }
    }

    // Verify file exists
    if (!await modelFile.exists()) {
      throw ModelIntegrityException(
        'Model file not found: ${modelFile.path}',
      );
    }

    // Calculate actual checksum
    final bytes = await modelFile.readAsBytes();
    final digest = sha256.convert(bytes);
    final actualChecksum = 'sha256:$digest';

    // Compare checksums
    if (actualChecksum != expectedChecksum) {
      throw ModelIntegrityException(
        'Model integrity check failed.\n'
        'Expected: $expectedChecksum\n'
        'Actual: $actualChecksum\n'
        'The model file may be corrupted or tampered with.',
      );
    }

    debugPrint('Model integrity verified: ${modelFile.path}');
    return true;
  }

  /// Validates all available models have proper checksums (for CI/CD)
  static List<String> validateModelChecksums(List<OnDeviceModel> models) {
    final issues = <String>[];

    for (final model in models) {
      if (isPlaceholderChecksum(model.checksum)) {
        issues.add('${model.id}: ONNX checksum is placeholder');
      }
      if (model.coremlChecksum != null &&
          isPlaceholderChecksum(model.coremlChecksum!)) {
        issues.add('${model.id}: CoreML checksum is placeholder');
      }
    }

    return issues;
  }
}

/// Represents an on-device LLM model configuration
class OnDeviceModel {
  const OnDeviceModel({
    required this.id,
    required this.name,
    required this.description,
    required this.backend,
    required this.downloadUrl,
    required this.sizeMB,
    required this.checksum,
    required this.capabilities,
    required this.maxContextLength,
    required this.minRamGB,
    this.coremlUrl,
    this.coremlChecksum,
    this.avgTokensPerSecond = 15,
    this.priority = 1,
  });

  /// Unique model identifier
  final String id;

  /// Human-readable model name
  final String name;

  /// Model description
  final String description;

  /// Inference backend (metal/nnapi/coreml/onnx)
  final String backend;

  /// Download URL for the model file
  final String downloadUrl;

  /// Model size in megabytes
  final int sizeMB;

  /// SHA256 checksum for integrity verification
  final String checksum;

  /// Optional CoreML model URL for iOS (better performance on Apple Silicon)
  final String? coremlUrl;

  /// Optional CoreML model checksum
  final String? coremlChecksum;

  /// List of model capabilities
  final List<String> capabilities;

  /// Maximum context length in tokens
  final int maxContextLength;

  /// Minimum device RAM required in GB
  final double minRamGB;

  /// Average tokens generated per second
  final int avgTokensPerSecond;

  /// Selection priority (lower = higher priority)
  final int priority;

  /// Check if this model supports a given capability
  bool hasCapability(String capability) {
    return capabilities.contains(capability.toLowerCase());
  }

  /// Check if device has sufficient resources
  bool isCompatibleWithDevice({required double deviceRamGB}) {
    return deviceRamGB >= minRamGB;
  }

  /// Verify the integrity of a downloaded model file
  ///
  /// Uses [OnDeviceModelValidator.verifyModelIntegrity] to check
  /// the file's SHA256 hash against the expected checksum.
  Future<bool> verifyFile(File modelFile) async {
    final expectedChecksum = Platform.isIOS && coremlChecksum != null
        ? coremlChecksum!
        : checksum;
    return OnDeviceModelValidator.verifyModelIntegrity(modelFile, expectedChecksum);
  }

  /// Check if this model has placeholder checksums (not production-ready)
  bool get hasPlaceholderChecksum =>
      OnDeviceModelValidator.isPlaceholderChecksum(checksum) ||
      (coremlChecksum != null &&
          OnDeviceModelValidator.isPlaceholderChecksum(coremlChecksum!));
}

/// Model capability types
class ModelCapability {
  static const String conversational = 'conversational';
  static const String coaching = 'coaching';
  static const String goalSetting = 'goal_setting';
  static const String habitTips = 'habit_tips';
  static const String affirmations = 'affirmations';
  static const String quickResponses = 'quick_responses';
  static const String complexReasoning = 'complex_reasoning';
  static const String detailedAnalysis = 'detailed_analysis';
}

// =============================================================================
// Available Models
// =============================================================================
//
// SECURITY: Model checksums below are placeholders for development.
//
// Before production deployment:
// 1. Generate real SHA256 checksums for each model file:
//      macOS/Linux: shasum -a 256 model-file.onnx
//      Windows:     certutil -hashfile model-file.onnx SHA256
//
// 2. Update both ONNX and CoreML checksums for each model.
//
// 3. Run validation check:
//      final issues = OnDeviceModelValidator.validateModelChecksums(availableModels);
//      assert(issues.isEmpty, 'Model checksums missing: $issues');
//
// IMPORTANT: In release builds, [OnDeviceModelValidator.verifyModelIntegrity]
// will REJECT models with placeholder checksums to prevent using unverified files.
//
// Model files should be hosted at https://models.upcoach.com/edge/
// =============================================================================

/// TinyLlama 1.1B - Default balanced model for coaching conversations
const tinyLlama1BModel = OnDeviceModel(
  id: 'tinyllama-1.1b',
  name: 'TinyLlama 1.1B',
  description: 'Balanced model for on-device coaching conversations',
  backend: 'onnx',
  downloadUrl: 'https://models.upcoach.com/edge/tinyllama-1.1b-q4.onnx',
  sizeMB: 580,
  checksum: 'sha256:placeholder-update-with-real-hash',
  // CoreML version for iOS - better performance on Apple Silicon
  coremlUrl: 'https://models.upcoach.com/edge/tinyllama-1.1b-q4.mlmodelc.zip',
  coremlChecksum: 'sha256:placeholder-update-with-real-coreml-hash',
  capabilities: [
    ModelCapability.conversational,
    ModelCapability.coaching,
    ModelCapability.goalSetting,
    ModelCapability.habitTips,
  ],
  maxContextLength: 2048,
  minRamGB: 3.0,
  avgTokensPerSecond: 15,
  priority: 1,
);

/// SmolLM 360M - Ultra-lightweight for instant responses
const smolLM360MModel = OnDeviceModel(
  id: 'smollm-360m',
  name: 'SmolLM 360M',
  description: 'Ultra-lightweight model for instant responses',
  backend: 'onnx',
  downloadUrl: 'https://models.upcoach.com/edge/smollm-360m-q8.onnx',
  sizeMB: 180,
  checksum: 'sha256:placeholder-update-with-real-hash',
  capabilities: [
    ModelCapability.quickResponses,
    ModelCapability.affirmations,
    ModelCapability.habitTips,
  ],
  maxContextLength: 1024,
  minRamGB: 2.0,
  avgTokensPerSecond: 35,
  priority: 3,
);

/// Phi-2 2.7B - Advanced model for complex reasoning
const phi2Model = OnDeviceModel(
  id: 'phi2-2.7b',
  name: 'Phi-2 2.7B',
  description: 'Advanced model for complex reasoning and detailed analysis',
  backend: 'onnx',
  downloadUrl: 'https://models.upcoach.com/edge/phi2-2.7b-q4.onnx',
  sizeMB: 1400,
  checksum: 'sha256:placeholder-update-with-real-hash',
  capabilities: [
    ModelCapability.conversational,
    ModelCapability.complexReasoning,
    ModelCapability.detailedAnalysis,
    ModelCapability.goalSetting,
  ],
  maxContextLength: 2048,
  minRamGB: 6.0,
  avgTokensPerSecond: 8,
  priority: 2,
);

/// Gemma 2B - Google's efficient model (alternative)
const gemma2BModel = OnDeviceModel(
  id: 'gemma-2b',
  name: 'Gemma 2B',
  description: "Google's efficient language model for balanced performance",
  backend: 'onnx',
  downloadUrl: 'https://models.upcoach.com/edge/gemma-2b-q4.onnx',
  sizeMB: 1100,
  checksum: 'sha256:placeholder-update-with-real-hash',
  capabilities: [
    ModelCapability.conversational,
    ModelCapability.coaching,
  ],
  maxContextLength: 2048,
  minRamGB: 4.0,
  avgTokensPerSecond: 12,
  priority: 2,
);

/// All available models
const availableModels = [
  tinyLlama1BModel,
  smolLM360MModel,
  phi2Model,
  gemma2BModel,
];

/// Default model selection based on device capabilities
OnDeviceModel get defaultOnDeviceModel {
  // On iOS, prefer TinyLlama as it works well with CoreML fallback
  // On Android, also prefer TinyLlama as the balanced option
  return tinyLlama1BModel;
}

/// Select the best model based on device RAM
OnDeviceModel selectModelForDevice({required double deviceRamGB}) {
  if (deviceRamGB >= 6.0) {
    // High-end device: can run Phi-2
    return phi2Model;
  } else if (deviceRamGB >= 4.0) {
    // Mid-range device: Gemma or TinyLlama
    return gemma2BModel;
  } else if (deviceRamGB >= 3.0) {
    // Standard device: TinyLlama
    return tinyLlama1BModel;
  } else {
    // Low-memory device: SmolLM
    return smolLM360MModel;
  }
}

/// Select model based on use case
OnDeviceModel selectModelForUseCase(String useCase) {
  switch (useCase.toLowerCase()) {
    case 'affirmation':
    case 'reminder':
    case 'quick_tip':
      return smolLM360MModel;

    case 'goal_analysis':
    case 'progress_review':
    case 'complex':
      return phi2Model;

    case 'coaching':
    case 'habit':
    case 'motivation':
    default:
      return tinyLlama1BModel;
  }
}

/// Get platform-specific model URL
String getPlatformModelUrl(OnDeviceModel model) {
  if (Platform.isIOS && model.coremlUrl != null) {
    // iOS uses CoreML format for better performance on Apple Silicon
    return model.coremlUrl!;
  } else if (Platform.isAndroid) {
    // Android uses ONNX or TFLite
    return model.downloadUrl;
  }
  // Fall back to ONNX for all platforms
  return model.downloadUrl;
}

/// Get platform-specific model checksum
String getPlatformModelChecksum(OnDeviceModel model) {
  if (Platform.isIOS && model.coremlChecksum != null) {
    return model.coremlChecksum!;
  }
  return model.checksum;
}
