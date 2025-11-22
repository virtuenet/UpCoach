// A/B Testing Framework
import { event } from './analytics';

// Experiment configuration type
export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: {
    id: string;
    name: string;
    weight: number; // 0-100 percentage
  }[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  targetAudience?: {
    newUsers?: boolean;
    returningUsers?: boolean;
    location?: string[];
    device?: ('mobile' | 'tablet' | 'desktop')[];
  };
}

// Active experiments configuration
export const experiments: Record<string, Experiment> = {
  heroButtonColor: {
    id: 'hero-button-color',
    name: 'Hero CTA Button Color Test',
    description: 'Testing primary vs gradient button styles',
    status: 'running',
    variants: [
      { id: 'control', name: 'Solid Primary', weight: 50 },
      { id: 'variant-a', name: 'Gradient', weight: 50 },
    ],
  },
  pricingLayout: {
    id: 'pricing-layout',
    name: 'Pricing Cards Layout',
    description: 'Testing horizontal vs vertical pricing layout',
    status: 'running',
    variants: [
      { id: 'control', name: 'Horizontal', weight: 50 },
      { id: 'variant-a', name: 'Vertical Emphasized', weight: 50 },
    ],
  },
  leadMagnetCopy: {
    id: 'lead-magnet-copy',
    name: 'Lead Magnet Headlines',
    description: 'Testing different value propositions',
    status: 'running',
    variants: [
      { id: 'control', name: 'Productivity Guide', weight: 33 },
      { id: 'variant-a', name: 'Habit Tracker Template', weight: 33 },
      { id: 'variant-b', name: 'AI Coaching Secrets', weight: 34 },
    ],
  },
};

// Storage keys
const VARIANT_STORAGE_KEY = 'upcoach_experiments';
const USER_ID_KEY = 'upcoach_user_id';

// Get or create user ID
function getUserId(): string {
  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// Get stored variants
function getStoredVariants(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(VARIANT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Store variant assignment
function storeVariant(experimentId: string, variantId: string) {
  if (typeof window === 'undefined') return;

  const variants = getStoredVariants();
  variants[experimentId] = variantId;
  localStorage.setItem(VARIANT_STORAGE_KEY, JSON.stringify(variants));
}

// Assign user to variant based on weights
function assignVariant(experiment: Experiment): string {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return experiment.variants[0].id;
}

// Check if user matches target audience
function matchesTargetAudience(experiment: Experiment): boolean {
  if (!experiment.targetAudience) return true;

  const { newUsers, returningUsers, location, device } = experiment.targetAudience;

  // Check new/returning users
  if (newUsers !== undefined || returningUsers !== undefined) {
    const isNewUser = !document.cookie.includes('returning_user=true');
    if (newUsers && !isNewUser) return false;
    if (returningUsers && isNewUser) return false;
  }

  // Check device type
  if (device && device.length > 0) {
    const isMobile = /mobile/i.test(navigator.userAgent);
    const isTablet = /tablet|ipad/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
    if (!device.includes(deviceType)) return false;
  }

  return true;
}

// Get variant for experiment
export function getVariant(experimentId: string): string {
  const experiment = experiments[experimentId];
  if (!experiment || experiment.status !== 'running') {
    return 'control';
  }

  // Check target audience
  if (!matchesTargetAudience(experiment)) {
    return 'control';
  }

  // Check for existing assignment
  const storedVariants = getStoredVariants();
  if (storedVariants[experimentId]) {
    return storedVariants[experimentId];
  }

  // Assign new variant
  const variantId = assignVariant(experiment);
  storeVariant(experimentId, variantId);

  // Track assignment
  trackExperimentView(experimentId, variantId);

  return variantId;
}

// Track experiment view
export function trackExperimentView(experimentId: string, variantId: string) {
  event('experiment_view', {
    experiment_id: experimentId,
    variant_id: variantId,
    user_id: getUserId(),
  });
}

// Track experiment conversion
export function trackExperimentConversion(
  experimentId: string,
  conversionType: string,
  value?: number
) {
  const variantId = getStoredVariants()[experimentId] || 'control';

  event('experiment_conversion', {
    experiment_id: experimentId,
    variant_id: variantId,
    conversion_type: conversionType,
    value: value || 1,
    user_id: getUserId(),
  });
}

// React hook for experiments
export function useExperiment(experimentId: string): {
  variant: string;
  trackConversion: (type: string, value?: number) => void;
} {
  const variant = getVariant(experimentId);

  const trackConversion = (type: string, value?: number) => {
    trackExperimentConversion(experimentId, type, value);
  };

  return { variant, trackConversion };
}

// Get all active experiments for a user
export function getActiveExperiments(): Record<string, string> {
  const active: Record<string, string> = {};

  for (const [id, experiment] of Object.entries(experiments)) {
    if (experiment.status === 'running' && matchesTargetAudience(experiment)) {
      active[id] = getVariant(id);
    }
  }

  return active;
}

// Clear experiment data (for testing)
export function clearExperiments() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VARIANT_STORAGE_KEY);
}

// Mark user as returning
export function markReturningUser() {
  if (typeof window === 'undefined') return;
  document.cookie = 'returning_user=true; max-age=31536000; path=/'; // 1 year
}
