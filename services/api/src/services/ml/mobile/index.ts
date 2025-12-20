/**
 * Mobile ML Services Index
 *
 * Exports all mobile-related ML services including
 * model quantization and mobile model registry.
 */

// Model Quantizer
export {
  ModelQuantizer,
  modelQuantizer,
  type QuantizationType,
  type TargetPlatform,
  type OptimizationLevel,
  type ModelMetadata,
  type QuantizationConfig,
  type QuantizedModel,
  type BenchmarkResult,
  type OptimizationResult,
  type QuantizationStats,
} from './ModelQuantizer';

// Mobile Model Registry
export {
  MobileModelRegistry,
  mobileModelRegistry,
  type ModelFormat as MobileModelFormat,
  type DevicePlatform,
  type DownloadStatus,
  type MobileModel,
  type ModelBundle,
  type DeviceInfo,
  type ModelDownloadRequest,
  type ModelDownloadResponse,
  type UpdateCheckResult,
  type CompatibilityResult,
  type RegistryStats as MobileRegistryStats,
} from './MobileModelRegistry';
