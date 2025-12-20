/**
 * Explanation Engine
 * Generates human-readable explanations for ML predictions and anomalies
 * Implements simplified SHAP/LIME concepts for feature attribution
 * @version 1.0.0
 */

import { logger } from '../../utils/logger';
import { AnomalyAlert, DetectionResult, AnomalyType } from './AnomalyDetectionService';

// ==================== Type Definitions ====================

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
  importance: number;
  description: string;
}

export interface Explanation {
  summary: string;
  confidence: number;
  keyFactors: FeatureContribution[];
  reasoning: string[];
  recommendations: string[];
  technicalDetails: {
    algorithm: string;
    score: number;
    threshold: number;
    dataPoints: number;
  };
  naturalLanguage: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  rank: number;
}

export interface ModelExplanation {
  modelType: string;
  features: FeatureImportance[];
  globalExplanation: string;
}

// ==================== Explanation Engine ====================

export class ExplanationEngine {
  private featureDescriptions: Map<string, string> = new Map();

  constructor() {
    this.initializeFeatureDescriptions();
  }

  /**
   * Initialize human-readable feature descriptions
   */
  private initializeFeatureDescriptions(): void {
    const descriptions: Record<string, string> = {
      session_no_show_rate: 'the percentage of scheduled coaching sessions that were missed',
      daily_engagement_score: 'how actively users interact with the app daily',
      payment_failure_rate: 'the percentage of payment transactions that failed',
      coach_average_rating: 'the average rating coaches receive from their clients',
      ai_response_latency: 'how long the AI takes to respond to user queries',
      goal_completion_rate: 'the percentage of goals that users successfully complete',
      daily_churn_count: 'the number of users who cancelled their subscription today',
      user_activity_score: 'a composite score of user engagement activities',
      login_frequency: 'how often users log into the application',
      message_count: 'the number of messages exchanged in coaching sessions',
      session_duration: 'the average length of coaching sessions',
      feature_usage: 'which app features are being used and how often',
    };

    for (const [feature, description] of Object.entries(descriptions)) {
      this.featureDescriptions.set(feature, description);
    }
  }

  /**
   * Generate a full explanation for an anomaly alert
   */
  public explainAnomaly(alert: AnomalyAlert, historicalContext?: number[]): Explanation {
    const keyFactors = this.calculateFeatureContributions(alert, historicalContext);
    const reasoning = this.generateReasoning(alert, keyFactors);
    const recommendations = this.generateDetailedRecommendations(alert, keyFactors);
    const naturalLanguage = this.generateNaturalLanguageExplanation(alert, keyFactors);

    return {
      summary: this.generateSummary(alert),
      confidence: alert.confidence,
      keyFactors,
      reasoning,
      recommendations,
      technicalDetails: {
        algorithm: alert.algorithm,
        score: typeof alert.context.score === 'number' ? alert.context.score : 0,
        threshold: this.getThresholdForType(alert.type),
        dataPoints: typeof alert.context.historyLength === 'number' ? alert.context.historyLength : 0,
      },
      naturalLanguage,
    };
  }

  /**
   * Generate a concise summary of the anomaly
   */
  private generateSummary(alert: AnomalyAlert): string {
    const severityDescriptor = {
      low: 'minor',
      medium: 'moderate',
      high: 'significant',
      critical: 'critical',
    };

    const typeDescriptor = this.getTypeDescriptor(alert.type);

    return `A ${severityDescriptor[alert.severity]} ${typeDescriptor} was detected. ` +
      `The ${this.featureDescriptions.get(alert.metric) || alert.metric} ` +
      `deviated ${Math.abs(alert.deviation).toFixed(1)} standard deviations from the expected range.`;
  }

  /**
   * Get human-readable descriptor for anomaly type
   */
  private getTypeDescriptor(type: AnomalyType): string {
    const descriptors: Record<AnomalyType, string> = {
      session_no_show_spike: 'spike in session no-shows',
      engagement_drop: 'drop in user engagement',
      payment_failure_rate: 'increase in payment failures',
      coach_rating_anomaly: 'unusual change in coach ratings',
      ai_response_quality_drop: 'degradation in AI response quality',
      goal_completion_anomaly: 'unusual goal completion pattern',
      churn_spike: 'spike in user churn',
      unusual_activity: 'unusual user activity pattern',
      metric_deviation: 'metric deviation',
    };

    return descriptors[type] || 'anomaly';
  }

  /**
   * Calculate feature contributions using permutation importance
   */
  private calculateFeatureContributions(
    alert: AnomalyAlert,
    historicalContext?: number[]
  ): FeatureContribution[] {
    const contributions: FeatureContribution[] = [];

    // Primary feature: the anomalous metric itself
    contributions.push({
      feature: alert.metric,
      value: alert.value,
      contribution: Math.abs(alert.deviation),
      direction: alert.deviation > 0 ? 'positive' : 'negative',
      importance: 1.0,
      description: this.featureDescriptions.get(alert.metric) || `The value of ${alert.metric}`,
    });

    // Time-based contribution
    const hour = alert.timestamp.getHours();
    const isOffPeak = hour < 6 || hour > 22;
    contributions.push({
      feature: 'time_of_day',
      value: hour,
      contribution: isOffPeak ? 0.3 : 0.1,
      direction: isOffPeak ? 'positive' : 'neutral',
      importance: 0.2,
      description: `The anomaly occurred at ${hour}:00, ${isOffPeak ? 'during off-peak hours' : 'during normal hours'}`,
    });

    // Historical trend contribution
    if (historicalContext && historicalContext.length >= 7) {
      const recentTrend = this.calculateTrend(historicalContext.slice(-7));
      contributions.push({
        feature: 'recent_trend',
        value: recentTrend,
        contribution: Math.abs(recentTrend) * 0.5,
        direction: recentTrend > 0.1 ? 'positive' : recentTrend < -0.1 ? 'negative' : 'neutral',
        importance: 0.3,
        description: `Recent 7-day trend shows ${recentTrend > 0 ? 'an increase' : 'a decrease'} of ${Math.abs(recentTrend * 100).toFixed(1)}%`,
      });
    }

    // Volatility contribution
    if (historicalContext && historicalContext.length >= 14) {
      const volatility = this.calculateVolatility(historicalContext.slice(-14));
      const isHighVolatility = volatility > 0.3;
      contributions.push({
        feature: 'volatility',
        value: volatility,
        contribution: isHighVolatility ? 0.4 : 0.1,
        direction: isHighVolatility ? 'positive' : 'neutral',
        importance: 0.25,
        description: `The metric shows ${isHighVolatility ? 'high' : 'normal'} volatility over the past 14 days`,
      });
    }

    // Sort by importance
    return contributions.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Calculate simple linear trend
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    return slope / (yMean || 1); // Normalized slope
  }

  /**
   * Calculate coefficient of variation (volatility)
   */
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance) / Math.abs(mean);
  }

  /**
   * Generate reasoning steps
   */
  private generateReasoning(alert: AnomalyAlert, factors: FeatureContribution[]): string[] {
    const reasoning: string[] = [];

    // Step 1: Observation
    reasoning.push(
      `The ${alert.metric} metric recorded a value of ${alert.value.toFixed(2)}, ` +
      `which is outside the expected range of ${alert.expectedRange.lower.toFixed(2)} to ${alert.expectedRange.upper.toFixed(2)}.`
    );

    // Step 2: Detection method
    reasoning.push(
      `The ${alert.algorithm} algorithm detected this as an anomaly ` +
      `with a confidence level of ${alert.confidence.toFixed(0)}%.`
    );

    // Step 3: Contributing factors
    const significantFactors = factors.filter(f => f.contribution > 0.2);
    if (significantFactors.length > 0) {
      reasoning.push(
        `Key contributing factors include: ${significantFactors.map(f => f.description).join('; ')}.`
      );
    }

    // Step 4: Severity justification
    const severityExplanation = {
      low: 'While notable, this deviation is within acceptable tolerance and may not require immediate action.',
      medium: 'This deviation warrants attention and should be monitored closely.',
      high: 'This is a significant deviation that requires investigation.',
      critical: 'This is a critical deviation that requires immediate attention and action.',
    };
    reasoning.push(severityExplanation[alert.severity]);

    return reasoning;
  }

  /**
   * Generate detailed recommendations
   */
  private generateDetailedRecommendations(
    alert: AnomalyAlert,
    factors: FeatureContribution[]
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendation from alert
    if (alert.recommendation) {
      recommendations.push(alert.recommendation);
    }

    // Severity-based recommendations
    if (alert.severity === 'critical' || alert.severity === 'high') {
      recommendations.push('Set up real-time monitoring for this metric to catch future anomalies early.');
      recommendations.push('Review recent changes that might have impacted this metric.');
    }

    // Type-specific recommendations
    const typeRecommendations = this.getTypeSpecificRecommendations(alert.type);
    recommendations.push(...typeRecommendations);

    // Factor-based recommendations
    for (const factor of factors) {
      if (factor.feature === 'volatility' && factor.contribution > 0.3) {
        recommendations.push('Consider implementing smoothing or aggregation to reduce noise in this metric.');
      }
      if (factor.feature === 'recent_trend' && Math.abs(factor.value) > 0.2) {
        recommendations.push('Investigate the root cause of the recent trend before it escalates.');
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Get type-specific recommendations
   */
  private getTypeSpecificRecommendations(type: AnomalyType): string[] {
    const recommendations: Record<AnomalyType, string[]> = {
      session_no_show_spike: [
        'Review the reminder notification system to ensure clients are being properly notified.',
        'Analyze no-show patterns by time of day and day of week.',
        'Consider implementing a confirmation system 24 hours before sessions.',
      ],
      engagement_drop: [
        'Analyze user journey to identify friction points.',
        'Review recent app changes or updates that might affect user experience.',
        'Consider implementing re-engagement notifications for inactive users.',
      ],
      payment_failure_rate: [
        'Check payment gateway status and error codes.',
        'Review if card expiration dates are approaching for many users.',
        'Ensure retry mechanisms are working correctly.',
      ],
      coach_rating_anomaly: [
        'Review individual coach performance and recent feedback.',
        'Check if any specific coach is driving the anomaly.',
        'Analyze correlation with session types or topics.',
      ],
      ai_response_quality_drop: [
        'Monitor API rate limits and quotas.',
        'Check for changes in prompt engineering or model configuration.',
        'Review server load and response times.',
      ],
      goal_completion_anomaly: [
        'Analyze goal difficulty settings and user progress.',
        'Review if goal templates are appropriately calibrated.',
        'Check for seasonal patterns in goal completion.',
      ],
      churn_spike: [
        'Implement immediate outreach to recently churned users.',
        'Review pricing and value proposition.',
        'Analyze exit survey responses for common themes.',
      ],
      unusual_activity: [
        'Review user activity logs for potential abuse or fraud.',
        'Check for automated or bot-like behavior patterns.',
        'Verify account security measures are functioning.',
      ],
      metric_deviation: [
        'Investigate data collection processes for errors.',
        'Review system health and infrastructure status.',
        'Compare with related metrics to identify correlations.',
      ],
    };

    return recommendations[type] || [];
  }

  /**
   * Generate natural language explanation
   */
  private generateNaturalLanguageExplanation(
    alert: AnomalyAlert,
    factors: FeatureContribution[]
  ): string {
    const metricDescription = this.featureDescriptions.get(alert.metric) || alert.metric;
    const typeDescription = this.getTypeDescriptor(alert.type);

    let explanation = `We detected a ${alert.severity} anomaly in ${metricDescription}. `;

    // Value context
    if (alert.deviation > 0) {
      explanation += `The current value of ${alert.value.toFixed(2)} is significantly higher than expected. `;
    } else {
      explanation += `The current value of ${alert.value.toFixed(2)} is significantly lower than expected. `;
    }

    // Main contributing factor
    const mainFactor = factors[0];
    if (mainFactor) {
      explanation += `The primary driver of this anomaly is ${mainFactor.description}. `;
    }

    // Confidence and action
    if (alert.confidence >= 80) {
      explanation += `We are highly confident (${alert.confidence.toFixed(0)}%) this represents a genuine ${typeDescription}. `;
    } else {
      explanation += `While there is some uncertainty (${alert.confidence.toFixed(0)}% confidence), this warrants investigation. `;
    }

    // Closing with severity-based urgency
    if (alert.severity === 'critical') {
      explanation += 'Immediate action is recommended.';
    } else if (alert.severity === 'high') {
      explanation += 'We recommend addressing this soon.';
    } else if (alert.severity === 'medium') {
      explanation += 'This should be monitored and addressed when possible.';
    } else {
      explanation += 'This is informational and may resolve on its own.';
    }

    return explanation;
  }

  /**
   * Get threshold for anomaly type
   */
  private getThresholdForType(type: AnomalyType): number {
    const thresholds: Record<AnomalyType, number> = {
      session_no_show_spike: 2.5,
      engagement_drop: 2.0,
      payment_failure_rate: 3.0,
      coach_rating_anomaly: 2.0,
      ai_response_quality_drop: 3.0,
      goal_completion_anomaly: 2.0,
      churn_spike: 2.5,
      unusual_activity: 0.6,
      metric_deviation: 3.0,
    };

    return thresholds[type] || 3.0;
  }

  /**
   * Explain a detection result
   */
  public explainDetectionResult(
    result: DetectionResult,
    context?: { metricDescription?: string; historicalData?: number[] }
  ): Explanation {
    const metricDescription = context?.metricDescription ||
      this.featureDescriptions.get(result.metric) ||
      result.metric;

    const keyFactors: FeatureContribution[] = [
      {
        feature: result.metric,
        value: result.score,
        contribution: result.score,
        direction: result.isAnomaly ? 'positive' : 'neutral',
        importance: 1.0,
        description: metricDescription,
      },
    ];

    const summary = result.isAnomaly
      ? `An anomaly was detected in ${metricDescription} using the ${result.algorithm} algorithm.`
      : `No anomaly detected in ${metricDescription}.`;

    return {
      summary,
      confidence: result.isAnomaly ? (result.score >= 3 ? 90 : 70) : 95,
      keyFactors,
      reasoning: [
        `The ${result.algorithm} algorithm analyzed the metric and returned a score of ${result.score.toFixed(2)}.`,
        result.isAnomaly
          ? `This score exceeds the threshold, indicating an anomaly with ${result.severity} severity.`
          : 'This score is within normal bounds.',
      ],
      recommendations: result.isAnomaly
        ? ['Investigate the root cause of this anomaly.', 'Monitor the metric for continued deviation.']
        : ['Continue monitoring as usual.'],
      technicalDetails: {
        algorithm: result.algorithm,
        score: result.score,
        threshold: 3.0,
        dataPoints: context?.historicalData?.length || 0,
      },
      naturalLanguage: summary,
    };
  }

  /**
   * Register a custom feature description
   */
  public registerFeatureDescription(feature: string, description: string): void {
    this.featureDescriptions.set(feature, description);
  }

  /**
   * Get all registered feature descriptions
   */
  public getFeatureDescriptions(): Map<string, string> {
    return new Map(this.featureDescriptions);
  }
}

// Export singleton instance
export const explanationEngine = new ExplanationEngine();

// Export factory function
export const createExplanationEngine = (): ExplanationEngine => {
  return new ExplanationEngine();
};
