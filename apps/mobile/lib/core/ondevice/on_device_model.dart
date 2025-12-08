import 'dart:io' show Platform;

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

/// TinyLlama 1.1B - Default balanced model for coaching conversations
const tinyLlama1BModel = OnDeviceModel(
  id: 'tinyllama-1.1b',
  name: 'TinyLlama 1.1B',
  description: 'Balanced model for on-device coaching conversations',
  backend: 'onnx',
  downloadUrl: 'https://models.upcoach.com/edge/tinyllama-1.1b-q4.onnx',
  sizeMB: 580,
  checksum: 'sha256:placeholder-update-with-real-hash',
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
  if (Platform.isIOS) {
    // iOS can use CoreML format if available
    // TODO: Check if CoreML version exists and return coremlUrl:
    // final coremlUrl = model.downloadUrl.replaceAll('.onnx', '.mlmodelc.zip');
    return model.downloadUrl; // Fall back to ONNX for now
  } else if (Platform.isAndroid) {
    // Android uses ONNX or TFLite
    return model.downloadUrl;
  }
  return model.downloadUrl;
}
