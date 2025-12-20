/**
 * Mobile Model Registry
 *
 * Centralized registry for mobile-optimized ML models:
 * - Version management and distribution
 * - Device compatibility tracking
 * - OTA update coordination
 * - Download and caching management
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ModelFormat = 'tflite' | 'coreml' | 'onnx' | 'pytorch_mobile';
export type DevicePlatform = 'ios' | 'android' | 'web';
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cached';

export interface MobileModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  version: string;
  format: ModelFormat;
  supportedPlatforms: DevicePlatform[];
  minAppVersion: string;
  sizeBytes: number;
  downloadUrl: string;
  checksum: string;
  checksumAlgorithm: 'sha256' | 'md5';
  inputSpec: ModelInputSpec;
  outputSpec: ModelOutputSpec;
  capabilities: string[];
  requirements: ModelRequirements;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isRequired: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  deprecatedAt?: Date;
  deprecationReason?: string;
}

export interface ModelInputSpec {
  shape: number[];
  dtype: 'float32' | 'int32' | 'int8' | 'uint8';
  preprocessing?: PreprocessingStep[];
  normalization?: {
    mean: number[];
    std: number[];
  };
}

export interface ModelOutputSpec {
  shape: number[];
  dtype: 'float32' | 'int32';
  labels?: string[];
  postprocessing?: PostprocessingStep[];
}

export interface PreprocessingStep {
  type: 'resize' | 'normalize' | 'tokenize' | 'crop' | 'pad';
  params: Record<string, unknown>;
}

export interface PostprocessingStep {
  type: 'softmax' | 'argmax' | 'threshold' | 'decode';
  params: Record<string, unknown>;
}

export interface ModelRequirements {
  minRAMMB: number;
  minStorageMB: number;
  requiresGPU: boolean;
  requiresNNAPI?: boolean;
  requiresCoreML?: boolean;
  minIOSVersion?: string;
  minAndroidAPI?: number;
}

export interface ModelBundle {
  id: string;
  name: string;
  description: string;
  models: string[];
  totalSizeBytes: number;
  version: string;
  isActive: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  platform: DevicePlatform;
  osVersion: string;
  appVersion: string;
  availableStorageMB: number;
  availableRAMMB: number;
  hasGPU: boolean;
  hasNNAPI?: boolean;
  hasCoreML?: boolean;
}

export interface ModelDownloadRequest {
  modelId: string;
  version?: string;
  deviceInfo: DeviceInfo;
  priority?: number;
}

export interface ModelDownloadResponse {
  success: boolean;
  model?: MobileModel;
  downloadUrl?: string;
  alternativeVersion?: string;
  error?: string;
  compatibility: CompatibilityResult;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface UpdateCheckResult {
  hasUpdates: boolean;
  updates: ModelUpdate[];
  requiredUpdates: ModelUpdate[];
  optionalUpdates: ModelUpdate[];
  totalDownloadSize: number;
}

export interface ModelUpdate {
  modelId: string;
  currentVersion: string;
  newVersion: string;
  sizeBytes: number;
  isDelta: boolean;
  isRequired: boolean;
  releaseNotes?: string;
}

export interface RegistryStats {
  totalModels: number;
  activeModels: number;
  deprecatedModels: number;
  modelsByFormat: Record<ModelFormat, number>;
  modelsByPlatform: Record<DevicePlatform, number>;
  totalDownloads: number;
  uniqueDevices: number;
  avgModelSizeMB: number;
}

// ============================================================================
// Mobile Model Registry
// ============================================================================

export class MobileModelRegistry extends EventEmitter {
  private models: Map<string, MobileModel> = new Map();
  private bundles: Map<string, ModelBundle> = new Map();
  private deviceCache: Map<string, DeviceInfo> = new Map();
  private downloadHistory: Map<string, { modelId: string; timestamp: Date; status: DownloadStatus }[]> = new Map();
  private stats: RegistryStats;

  constructor() {
    super();
    this.stats = this.initializeStats();
  }

  private initializeStats(): RegistryStats {
    return {
      totalModels: 0,
      activeModels: 0,
      deprecatedModels: 0,
      modelsByFormat: {
        tflite: 0,
        coreml: 0,
        onnx: 0,
        pytorch_mobile: 0,
      },
      modelsByPlatform: {
        ios: 0,
        android: 0,
        web: 0,
      },
      totalDownloads: 0,
      uniqueDevices: 0,
      avgModelSizeMB: 0,
    };
  }

  // ============================================================================
  // Model Registration
  // ============================================================================

  registerModel(model: Omit<MobileModel, 'id' | 'createdAt' | 'updatedAt'>): MobileModel {
    const id = uuidv4();
    const now = new Date();

    const newModel: MobileModel = {
      ...model,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.models.set(id, newModel);
    this.updateStats();
    this.emit('modelRegistered', newModel);

    return newModel;
  }

  updateModel(id: string, updates: Partial<MobileModel>): MobileModel | null {
    const model = this.models.get(id);
    if (!model) {
      return null;
    }

    const updatedModel: MobileModel = {
      ...model,
      ...updates,
      id: model.id,
      createdAt: model.createdAt,
      updatedAt: new Date(),
    };

    this.models.set(id, updatedModel);
    this.updateStats();
    this.emit('modelUpdated', updatedModel);

    return updatedModel;
  }

  deprecateModel(id: string, reason: string): boolean {
    const model = this.models.get(id);
    if (!model) {
      return false;
    }

    model.deprecatedAt = new Date();
    model.deprecationReason = reason;
    model.isActive = false;
    model.updatedAt = new Date();

    this.updateStats();
    this.emit('modelDeprecated', { id, reason });

    return true;
  }

  deleteModel(id: string): boolean {
    const deleted = this.models.delete(id);
    if (deleted) {
      this.updateStats();
      this.emit('modelDeleted', { id });
    }
    return deleted;
  }

  // ============================================================================
  // Model Retrieval
  // ============================================================================

  getModel(id: string): MobileModel | undefined {
    return this.models.get(id);
  }

  getModelByName(name: string, version?: string): MobileModel | undefined {
    for (const model of this.models.values()) {
      if (model.name === name && (!version || model.version === version)) {
        return model;
      }
    }
    return undefined;
  }

  listModels(filters?: {
    category?: string;
    format?: ModelFormat;
    platform?: DevicePlatform;
    isActive?: boolean;
    isRequired?: boolean;
  }): MobileModel[] {
    let models = Array.from(this.models.values());

    if (filters) {
      if (filters.category) {
        models = models.filter(m => m.category === filters.category);
      }
      if (filters.format) {
        models = models.filter(m => m.format === filters.format);
      }
      if (filters.platform) {
        models = models.filter(m => m.supportedPlatforms.includes(filters.platform!));
      }
      if (filters.isActive !== undefined) {
        models = models.filter(m => m.isActive === filters.isActive);
      }
      if (filters.isRequired !== undefined) {
        models = models.filter(m => m.isRequired === filters.isRequired);
      }
    }

    return models.sort((a, b) => b.priority - a.priority);
  }

  getLatestVersion(modelName: string): MobileModel | undefined {
    const versions = Array.from(this.models.values())
      .filter(m => m.name === modelName && m.isActive)
      .sort((a, b) => this.compareVersions(b.version, a.version));

    return versions[0];
  }

  // ============================================================================
  // Model Bundles
  // ============================================================================

  createBundle(bundle: Omit<ModelBundle, 'id' | 'totalSizeBytes'>): ModelBundle {
    const id = uuidv4();
    let totalSize = 0;

    for (const modelId of bundle.models) {
      const model = this.models.get(modelId);
      if (model) {
        totalSize += model.sizeBytes;
      }
    }

    const newBundle: ModelBundle = {
      ...bundle,
      id,
      totalSizeBytes: totalSize,
    };

    this.bundles.set(id, newBundle);
    this.emit('bundleCreated', newBundle);

    return newBundle;
  }

  getBundle(id: string): ModelBundle | undefined {
    return this.bundles.get(id);
  }

  listBundles(activeOnly: boolean = true): ModelBundle[] {
    const bundles = Array.from(this.bundles.values());
    return activeOnly ? bundles.filter(b => b.isActive) : bundles;
  }

  getBundleModels(bundleId: string): MobileModel[] {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) {
      return [];
    }

    return bundle.models
      .map(id => this.models.get(id))
      .filter((m): m is MobileModel => m !== undefined);
  }

  // ============================================================================
  // Device Compatibility
  // ============================================================================

  checkCompatibility(modelId: string, deviceInfo: DeviceInfo): CompatibilityResult {
    const model = this.models.get(modelId);
    const result: CompatibilityResult = {
      isCompatible: true,
      issues: [],
      warnings: [],
      recommendations: [],
    };

    if (!model) {
      result.isCompatible = false;
      result.issues.push('Model not found');
      return result;
    }

    // Platform check
    if (!model.supportedPlatforms.includes(deviceInfo.platform)) {
      result.isCompatible = false;
      result.issues.push(`Model does not support ${deviceInfo.platform} platform`);
    }

    // App version check
    if (this.compareVersions(deviceInfo.appVersion, model.minAppVersion) < 0) {
      result.isCompatible = false;
      result.issues.push(`App version ${deviceInfo.appVersion} is below minimum ${model.minAppVersion}`);
    }

    // Storage check
    const requiredStorageMB = model.sizeBytes / (1024 * 1024) + model.requirements.minStorageMB;
    if (deviceInfo.availableStorageMB < requiredStorageMB) {
      result.isCompatible = false;
      result.issues.push(`Insufficient storage: need ${requiredStorageMB.toFixed(1)}MB, have ${deviceInfo.availableStorageMB.toFixed(1)}MB`);
    }

    // RAM check
    if (deviceInfo.availableRAMMB < model.requirements.minRAMMB) {
      result.warnings.push(`Low RAM: model requires ${model.requirements.minRAMMB}MB, device has ${deviceInfo.availableRAMMB}MB`);
    }

    // GPU requirement
    if (model.requirements.requiresGPU && !deviceInfo.hasGPU) {
      result.warnings.push('Model performs best with GPU acceleration, which is not available');
      result.recommendations.push('Consider using a lighter model variant for better performance');
    }

    // Platform-specific checks
    if (deviceInfo.platform === 'android' && model.requirements.requiresNNAPI && !deviceInfo.hasNNAPI) {
      result.warnings.push('NNAPI is not available; inference may be slower');
    }

    if (deviceInfo.platform === 'ios' && model.requirements.requiresCoreML && !deviceInfo.hasCoreML) {
      result.warnings.push('CoreML is not available; inference may be slower');
    }

    // Android API level check
    if (deviceInfo.platform === 'android' && model.requirements.minAndroidAPI) {
      const apiLevel = this.extractAndroidAPI(deviceInfo.osVersion);
      if (apiLevel && apiLevel < model.requirements.minAndroidAPI) {
        result.issues.push(`Android API ${apiLevel} is below minimum ${model.requirements.minAndroidAPI}`);
        result.isCompatible = false;
      }
    }

    // iOS version check
    if (deviceInfo.platform === 'ios' && model.requirements.minIOSVersion) {
      if (this.compareVersions(deviceInfo.osVersion, model.requirements.minIOSVersion) < 0) {
        result.issues.push(`iOS ${deviceInfo.osVersion} is below minimum ${model.requirements.minIOSVersion}`);
        result.isCompatible = false;
      }
    }

    // Deprecation warning
    if (model.deprecatedAt) {
      result.warnings.push(`This model is deprecated: ${model.deprecationReason}`);
      result.recommendations.push('Consider upgrading to the latest version');
    }

    return result;
  }

  findCompatibleModels(deviceInfo: DeviceInfo, category?: string): MobileModel[] {
    return this.listModels({ category, isActive: true })
      .filter(model => this.checkCompatibility(model.id, deviceInfo).isCompatible)
      .sort((a, b) => b.priority - a.priority);
  }

  // ============================================================================
  // Download Management
  // ============================================================================

  requestDownload(request: ModelDownloadRequest): ModelDownloadResponse {
    const model = request.version
      ? this.getModelByName(request.modelId, request.version)
      : this.getLatestVersion(request.modelId) || this.models.get(request.modelId);

    if (!model) {
      return {
        success: false,
        error: 'Model not found',
        compatibility: {
          isCompatible: false,
          issues: ['Model not found'],
          warnings: [],
          recommendations: [],
        },
      };
    }

    const compatibility = this.checkCompatibility(model.id, request.deviceInfo);

    if (!compatibility.isCompatible) {
      // Try to find alternative version
      const alternatives = this.findCompatibleModels(request.deviceInfo, model.category);
      const alternative = alternatives.find(m => m.name === model.name);

      return {
        success: false,
        error: 'Model is not compatible with this device',
        alternativeVersion: alternative?.version,
        compatibility,
      };
    }

    // Track device
    this.deviceCache.set(request.deviceInfo.deviceId, request.deviceInfo);

    // Record download
    this.recordDownload(request.deviceInfo.deviceId, model.id, 'pending');
    this.stats.totalDownloads++;

    this.emit('downloadRequested', { model, deviceInfo: request.deviceInfo });

    return {
      success: true,
      model,
      downloadUrl: model.downloadUrl,
      compatibility,
    };
  }

  recordDownload(deviceId: string, modelId: string, status: DownloadStatus): void {
    const history = this.downloadHistory.get(deviceId) || [];
    history.push({ modelId, timestamp: new Date(), status });
    this.downloadHistory.set(deviceId, history);

    if (status === 'completed') {
      this.emit('downloadCompleted', { deviceId, modelId });
    } else if (status === 'failed') {
      this.emit('downloadFailed', { deviceId, modelId });
    }
  }

  getDeviceDownloadHistory(deviceId: string): { modelId: string; timestamp: Date; status: DownloadStatus }[] {
    return this.downloadHistory.get(deviceId) || [];
  }

  // ============================================================================
  // Update Management
  // ============================================================================

  checkForUpdates(deviceId: string, installedModels: { modelId: string; version: string }[]): UpdateCheckResult {
    const updates: ModelUpdate[] = [];

    for (const installed of installedModels) {
      const model = this.models.get(installed.modelId);
      if (!model) continue;

      const latest = this.getLatestVersion(model.name);
      if (!latest) continue;

      if (this.compareVersions(latest.version, installed.version) > 0) {
        updates.push({
          modelId: installed.modelId,
          currentVersion: installed.version,
          newVersion: latest.version,
          sizeBytes: latest.sizeBytes,
          isDelta: false, // Delta updates would require more complex logic
          isRequired: latest.isRequired,
          releaseNotes: latest.metadata.releaseNotes as string | undefined,
        });
      }
    }

    const requiredUpdates = updates.filter(u => u.isRequired);
    const optionalUpdates = updates.filter(u => !u.isRequired);
    const totalSize = updates.reduce((sum, u) => sum + u.sizeBytes, 0);

    return {
      hasUpdates: updates.length > 0,
      updates,
      requiredUpdates,
      optionalUpdates,
      totalDownloadSize: totalSize,
    };
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  private updateStats(): void {
    const models = Array.from(this.models.values());

    this.stats.totalModels = models.length;
    this.stats.activeModels = models.filter(m => m.isActive).length;
    this.stats.deprecatedModels = models.filter(m => m.deprecatedAt).length;

    // Reset counts
    this.stats.modelsByFormat = { tflite: 0, coreml: 0, onnx: 0, pytorch_mobile: 0 };
    this.stats.modelsByPlatform = { ios: 0, android: 0, web: 0 };

    let totalSize = 0;

    for (const model of models) {
      this.stats.modelsByFormat[model.format]++;
      for (const platform of model.supportedPlatforms) {
        this.stats.modelsByPlatform[platform]++;
      }
      totalSize += model.sizeBytes;
    }

    this.stats.avgModelSizeMB = models.length > 0
      ? totalSize / models.length / (1024 * 1024)
      : 0;

    this.stats.uniqueDevices = this.deviceCache.size;
  }

  getStats(): RegistryStats {
    return { ...this.stats };
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;

      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }

    return 0;
  }

  private extractAndroidAPI(osVersion: string): number | null {
    // Try to extract API level from version string like "13" or "API 33"
    const match = osVersion.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  // ============================================================================
  // Import/Export
  // ============================================================================

  exportRegistry(): { models: MobileModel[]; bundles: ModelBundle[] } {
    return {
      models: Array.from(this.models.values()),
      bundles: Array.from(this.bundles.values()),
    };
  }

  importRegistry(data: { models: MobileModel[]; bundles: ModelBundle[] }): void {
    for (const model of data.models) {
      this.models.set(model.id, model);
    }
    for (const bundle of data.bundles) {
      this.bundles.set(bundle.id, bundle);
    }
    this.updateStats();
    this.emit('registryImported', { modelCount: data.models.length, bundleCount: data.bundles.length });
  }

  reset(): void {
    this.models.clear();
    this.bundles.clear();
    this.deviceCache.clear();
    this.downloadHistory.clear();
    this.stats = this.initializeStats();
    this.emit('reset');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const mobileModelRegistry = new MobileModelRegistry();
export default mobileModelRegistry;
