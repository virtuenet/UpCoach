import api from './api';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  variants: ExperimentVariant[];
  trafficAllocation: number;
  startDate: string;
  endDate?: string;
  targetMetric: string;
  successCriteria: SuccessCriteria;
  segmentation?: SegmentationRules;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  allocation: number;
  configuration: Record<string, any>;
  isControl: boolean;
}

export interface SuccessCriteria {
  primaryMetric: string;
  minimumDetectableEffect: number;
  confidenceLevel: number;
  statisticalPower: number;
  minimumSampleSize: number;
}

export interface SegmentationRules {
  includeRules: SegmentRule[];
  excludeRules: SegmentRule[];
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface ExperimentAnalytics {
  experimentId: string;
  experimentName: string;
  status: string;
  startDate: string;
  endDate?: string;
  variants: VariantAnalytics[];
  statisticalSignificance?: StatisticalSignificance;
  recommendations: string[];
}

export interface VariantAnalytics {
  variantId: string;
  variantName: string;
  isControl: boolean;
  allocation: number;
  totalUsers: number;
  conversionRate: number;
  conversions: number;
  metrics: Record<string, any>;
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number;
  effect: number;
  recommendedAction: 'continue' | 'stop' | 'extend' | 'inconclusive';
}

export interface CreateExperimentRequest {
  name: string;
  description: string;
  variants: Omit<ExperimentVariant, 'id'>[];
  trafficAllocation?: number;
  startDate: string;
  endDate?: string;
  targetMetric: string;
  successCriteria: SuccessCriteria;
  segmentation?: SegmentationRules;
}

export interface ExperimentListResponse {
  experiments: Experiment[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalRecords: number;
  };
}

export interface ExperimentFilters {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

class ExperimentsService {
  private baseUrl = '/api/experiments';

  async createExperiment(experiment: CreateExperimentRequest): Promise<Experiment> {
    const response = await api.post(this.baseUrl, experiment);
    return response.data.data;
  }

  async getExperiments(filters: ExperimentFilters = {}): Promise<ExperimentListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}?${params}`);
    return response.data.data;
  }

  async getExperiment(id: string): Promise<Experiment> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  async updateExperiment(id: string, updates: Partial<CreateExperimentRequest>): Promise<Experiment> {
    const response = await api.put(`${this.baseUrl}/${id}`, updates);
    return response.data.data;
  }

  async startExperiment(id: string): Promise<Experiment> {
    const response = await api.post(`${this.baseUrl}/${id}/start`);
    return response.data.data;
  }

  async stopExperiment(id: string): Promise<Experiment> {
    const response = await api.post(`${this.baseUrl}/${id}/stop`);
    return response.data.data;
  }

  async deleteExperiment(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getAnalytics(id: string): Promise<ExperimentAnalytics> {
    const response = await api.get(`${this.baseUrl}/${id}/analytics`);
    return response.data.data;
  }

  async duplicateExperiment(id: string, newName: string): Promise<Experiment> {
    const original = await this.getExperiment(id);
    
    const duplicateRequest: CreateExperimentRequest = {
      name: newName,
      description: `Copy of: ${original.description}`,
      variants: original.variants.map(variant => ({
        name: variant.name,
        description: variant.description,
        allocation: variant.allocation,
        configuration: variant.configuration,
        isControl: variant.isControl,
      })),
      trafficAllocation: original.trafficAllocation,
      startDate: new Date().toISOString(),
      targetMetric: original.targetMetric,
      successCriteria: original.successCriteria,
      segmentation: original.segmentation,
    };

    return this.createExperiment(duplicateRequest);
  }

  // Helper methods for UI
  getStatusColor(status: string): string {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'active':
        return 'green';
      case 'paused':
        return 'yellow';
      case 'completed':
        return 'blue';
      case 'archived':
        return 'gray';
      default:
        return 'gray';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'draft':
        return '📝';
      case 'active':
        return '🟢';
      case 'paused':
        return '⏸️';
      case 'completed':
        return '✅';
      case 'archived':
        return '📦';
      default:
        return '❓';
    }
  }

  formatDuration(startDate: string, endDate?: string): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes}m`;
    }
  }

  calculateSampleSizeNeeded(
    baselineConversion: number,
    minimumDetectableEffect: number,
    confidenceLevel: number = 95,
    statisticalPower: number = 80
  ): number {
    // Simplified sample size calculation for A/B testing
    // For more accurate calculations, consider using a dedicated statistics library
    
    const alpha = (100 - confidenceLevel) / 100;
    const beta = (100 - statisticalPower) / 100;
    
    const p1 = baselineConversion;
    const p2 = p1 * (1 + minimumDetectableEffect / 100);
    
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(1 - beta);
    
    const pooledP = (p1 + p2) / 2;
    const denominator = Math.pow(p2 - p1, 2);
    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    
    return Math.ceil(numerator / denominator);
  }

  private getZScore(probability: number): number {
    // Approximate inverse normal CDF for common confidence levels
    if (probability >= 0.975) return 1.96; // 95% confidence
    if (probability >= 0.95) return 1.645; // 90% confidence
    if (probability >= 0.995) return 2.576; // 99% confidence
    return 1.96; // Default to 95%
  }

  validateExperiment(experiment: CreateExperimentRequest): string[] {
    const errors: string[] = [];

    // Basic validation
    if (!experiment.name.trim()) {
      errors.push('Experiment name is required');
    }

    if (!experiment.description.trim()) {
      errors.push('Description is required');
    }

    if (experiment.variants.length < 2) {
      errors.push('At least 2 variants are required');
    }

    // Variant validation
    const totalAllocation = experiment.variants.reduce((sum, variant) => sum + variant.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      errors.push('Variant allocations must sum to 100%');
    }

    const controlVariants = experiment.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      errors.push('Exactly one variant must be marked as control');
    }

    // Date validation
    if (experiment.endDate && new Date(experiment.endDate) <= new Date(experiment.startDate)) {
      errors.push('End date must be after start date');
    }

    // Success criteria validation
    if (experiment.successCriteria.confidenceLevel < 80 || experiment.successCriteria.confidenceLevel > 99) {
      errors.push('Confidence level must be between 80% and 99%');
    }

    if (experiment.successCriteria.minimumDetectableEffect <= 0) {
      errors.push('Minimum detectable effect must be greater than 0');
    }

    return errors;
  }
}

export default new ExperimentsService(); 