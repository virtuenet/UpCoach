/**
 * Deployment Service
 *
 * API client for ML model deployment management
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// Types
// ============================================================================

export interface DeploymentStats {
  loadedModels: number;
  totalPredictions: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  errorRate: number;
}

export interface CanaryDeployment {
  id: string;
  modelId: string;
  baselineVersion: string;
  canaryVersion: string;
  status: 'canary' | 'partial' | 'full' | 'completed' | 'rolled_back';
  trafficPercentage: number;
  startedAt: string;
  metrics?: {
    successRate: number;
    avgLatencyMs: number;
    errorCount: number;
  };
}

export interface Experiment {
  id: string;
  name: string;
  modelId: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants?: { id: string; name: string; weight: number }[];
  totalSamples?: number;
  winner?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  models: ModelHealth[];
  dependencies: DependencyHealth[];
  summary: {
    totalModels: number;
    healthyModels: number;
    degradedModels: number;
    unhealthyModels: number;
    totalDependencies: number;
    healthyDependencies: number;
  };
}

export interface ModelHealth {
  modelId: string;
  version: string;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  checks: HealthCheckResult[];
  lastUpdated: string;
  uptime: number;
  metrics: {
    avgLatencyMs: number;
    successRate: number;
    errorRate: number;
    requestsPerSecond: number;
  };
}

export interface HealthCheckResult {
  checkId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latencyMs: number;
  message?: string;
  timestamp: string;
}

export interface DependencyHealth {
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latencyMs: number;
  lastChecked: string;
}

export interface AlertInfo {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  title: string;
  message: string;
  modelId: string;
  createdAt: string;
}

export interface HealingEvent {
  id: string;
  targetId: string;
  action: string;
  reason: string;
  result: 'success' | 'failure' | 'pending';
  startedAt: string;
  completedAt?: string;
}

export interface MobileModel {
  id: string;
  name: string;
  displayName: string;
  version: string;
  format: 'tflite' | 'coreml' | 'onnx' | 'pytorch_mobile';
  sizeBytes: number;
  isActive: boolean;
  supportedPlatforms: string[];
}

export interface QuantizationResult {
  id: string;
  originalModelId: string;
  quantizationType: string;
  targetPlatform: string;
  originalSizeBytes: number;
  quantizedSizeBytes: number;
  compressionRatio: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}/deployment${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }

  const data = await response.json();
  return data;
}

// ============================================================================
// Model Serving
// ============================================================================

export async function getModelStats(): Promise<DeploymentStats> {
  const response = await apiRequest<{ success: boolean; stats: DeploymentStats }>('/models/stats');
  return response.stats;
}

export async function loadModel(config: {
  modelId: string;
  version: string;
  path: string;
}): Promise<void> {
  await apiRequest('/models/load', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function unloadModel(modelId: string, version?: string): Promise<void> {
  await apiRequest('/models/unload', {
    method: 'POST',
    body: JSON.stringify({ modelId, version }),
  });
}

// ============================================================================
// Canary Deployments
// ============================================================================

export async function listCanaryDeployments(status?: string): Promise<CanaryDeployment[]> {
  const query = status ? `?status=${status}` : '';
  const response = await apiRequest<{ success: boolean; deployments: CanaryDeployment[] }>(`/canary${query}`);
  return response.deployments;
}

export async function startCanaryDeployment(config: {
  modelId: string;
  baselineVersion: string;
  canaryVersion: string;
}): Promise<CanaryDeployment> {
  const response = await apiRequest<{ success: boolean; deployment: CanaryDeployment }>('/canary/start', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return response.deployment;
}

export async function promoteCanary(deploymentId: string): Promise<void> {
  await apiRequest(`/canary/${deploymentId}/promote`, { method: 'POST' });
}

export async function rollbackCanary(deploymentId: string, reason: string): Promise<void> {
  await apiRequest(`/canary/${deploymentId}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ============================================================================
// Experiments (A/B Testing)
// ============================================================================

export async function listExperiments(status?: string): Promise<Experiment[]> {
  const query = status ? `?status=${status}` : '';
  const response = await apiRequest<{ success: boolean; experiments: Experiment[] }>(`/experiments${query}`);
  return response.experiments;
}

export async function createExperiment(config: {
  name: string;
  modelId: string;
  variants: { id: string; name: string; weight: number }[];
}): Promise<Experiment> {
  const response = await apiRequest<{ success: boolean; experiment: Experiment }>('/experiments', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return response.experiment;
}

export async function startExperiment(experimentId: string): Promise<void> {
  await apiRequest(`/experiments/${experimentId}/start`, { method: 'POST' });
}

export async function stopExperiment(experimentId: string): Promise<void> {
  await apiRequest(`/experiments/${experimentId}/stop`, { method: 'POST' });
}

export async function getExperimentResults(experimentId: string): Promise<{
  variants: { id: string; conversions: number; samples: number; conversionRate: number }[];
  winner?: string;
  significance?: number;
}> {
  const response = await apiRequest<{ success: boolean; results: unknown }>(`/experiments/${experimentId}/results`);
  return response.results as {
    variants: { id: string; conversions: number; samples: number; conversionRate: number }[];
    winner?: string;
    significance?: number;
  };
}

// ============================================================================
// Health Monitoring
// ============================================================================

export async function getAggregatedHealth(): Promise<HealthStatus> {
  const response = await apiRequest<{ success: boolean; health: HealthStatus }>('/health/aggregated');
  return response.health;
}

export async function getModelHealth(modelId: string): Promise<ModelHealth> {
  const response = await apiRequest<{ success: boolean; health: ModelHealth }>(`/health/models/${modelId}`);
  return response.health;
}

export async function getActiveAlerts(modelId?: string): Promise<AlertInfo[]> {
  const query = modelId ? `?modelId=${modelId}` : '';
  const response = await apiRequest<{ success: boolean; alerts: AlertInfo[] }>(`/monitoring/alerts${query}`);
  return response.alerts;
}

export async function acknowledgeAlert(alertId: string, userId: string): Promise<void> {
  await apiRequest(`/monitoring/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function getHealingEvents(targetId?: string): Promise<HealingEvent[]> {
  const query = targetId ? `?targetId=${targetId}` : '';
  const response = await apiRequest<{ success: boolean; events: HealingEvent[] }>(`/health/healing/events${query}`);
  return response.events;
}

// ============================================================================
// Mobile Models
// ============================================================================

export async function listMobileModels(filters?: {
  category?: string;
  format?: string;
  platform?: string;
  isActive?: boolean;
}): Promise<MobileModel[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }
  const query = params.toString() ? `?${params}` : '';
  const response = await apiRequest<{ success: boolean; models: MobileModel[] }>(`/mobile/models${query}`);
  return response.models;
}

export async function getMobileModel(modelId: string): Promise<MobileModel> {
  const response = await apiRequest<{ success: boolean; model: MobileModel }>(`/mobile/models/${modelId}`);
  return response.model;
}

// ============================================================================
// Quantization
// ============================================================================

export async function getQuantizationStats(): Promise<{
  totalQuantizations: number;
  successfulQuantizations: number;
  averageCompressionRatio: number;
  averageSpeedup: number;
}> {
  const response = await apiRequest<{ success: boolean; stats: unknown }>('/quantization/stats');
  return response.stats as {
    totalQuantizations: number;
    successfulQuantizations: number;
    averageCompressionRatio: number;
    averageSpeedup: number;
  };
}

export async function quantizeModel(config: {
  modelId: string;
  modelVersion: string;
  quantizationType: 'int8' | 'fp16' | 'dynamic' | 'qat';
  targetPlatform: 'tflite' | 'coreml' | 'onnx' | 'pytorch_mobile';
}): Promise<QuantizationResult> {
  const response = await apiRequest<{ success: boolean; result: QuantizationResult }>('/quantization/quantize', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return response.result;
}

// ============================================================================
// Export as service object
// ============================================================================

export const deploymentService = {
  // Model serving
  getModelStats,
  loadModel,
  unloadModel,

  // Canary deployments
  listCanaryDeployments,
  startCanaryDeployment,
  promoteCanary,
  rollbackCanary,

  // Experiments
  listExperiments,
  createExperiment,
  startExperiment,
  stopExperiment,
  getExperimentResults,

  // Health monitoring
  getAggregatedHealth,
  getModelHealth,
  getActiveAlerts,
  acknowledgeAlert,
  getHealingEvents,

  // Mobile models
  listMobileModels,
  getMobileModel,

  // Quantization
  getQuantizationStats,
  quantizeModel,
};

export default deploymentService;
