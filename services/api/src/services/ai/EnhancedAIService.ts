/**
 * Enhanced AI Service - Export wrapper for existing AIServiceEnhanced
 * This provides compatibility with the AIController imports
 */

import { AIServiceEnhanced, aiServiceEnhanced } from './AIServiceEnhanced';

// Export the class and instance for compatibility
export { AIServiceEnhanced };
export const enhancedAIService = aiServiceEnhanced;

// Default export for backward compatibility
export default enhancedAIService;