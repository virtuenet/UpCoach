"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABTestingService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Experiment_1 = require("../../models/experiments/Experiment");
const ExperimentAssignment_1 = require("../../models/experiments/ExperimentAssignment");
const ExperimentEvent_1 = require("../../models/experiments/ExperimentEvent");
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
class ABTestingService {
    static HASH_SEED = 'upcoach-ab-testing';
    static async getVariantAssignment(experimentId, userId, context) {
        logger_1.logger.warn('ABTestingService temporarily disabled - ExperimentAssignment model unavailable');
        return null;
    }
    static async getAssignment(experimentId, userId) {
        logger_1.logger.warn('ABTestingService temporarily disabled - ExperimentAssignment model unavailable');
        return null;
    }
    static async getActiveExperimentsForUser(userId) {
        logger_1.logger.warn('ABTestingService temporarily disabled - ExperimentAssignment model unavailable');
        return [];
    }
    async getVariant(userId, experimentId, context) {
        try {
            const existingAssignment = await ExperimentAssignment_1.ExperimentAssignment.getAssignment(experimentId, userId);
            if (existingAssignment && !existingAssignment.isExcluded) {
                const experiment = await Experiment_1.Experiment.findByPk(experimentId);
                if (!experiment)
                    return null;
                const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
                if (!variant)
                    return null;
                return {
                    experimentId,
                    experimentName: experiment.name,
                    variantId: variant.id,
                    variantName: variant.name,
                    configuration: variant.configuration,
                    isControl: variant.isControl,
                    assignedAt: existingAssignment.assignedAt,
                };
            }
            const experiment = await Experiment_1.Experiment.findByPk(experimentId);
            if (!experiment || !experiment.isActive()) {
                return null;
            }
            const user = await User_1.User.findByPk(userId);
            if (!user)
                return null;
            if (!this.meetsSegmentationCriteria(user, experiment.segmentation)) {
                await ExperimentAssignment_1.ExperimentAssignment.excludeUser(experimentId, userId, 'segmentation_criteria');
                return null;
            }
            const userHash = this.generateUserHash(userId, experimentId);
            const trafficHash = userHash % 100;
            if (trafficHash >= experiment.trafficAllocation) {
                await ExperimentAssignment_1.ExperimentAssignment.excludeUser(experimentId, userId, 'traffic_allocation');
                return null;
            }
            const variantHash = userHash % 100;
            const variant = experiment.getVariantByAllocation(variantHash);
            if (!variant) {
                await ExperimentAssignment_1.ExperimentAssignment.excludeUser(experimentId, userId, 'allocationerror');
                return null;
            }
            await ExperimentAssignment_1.ExperimentAssignment.createAssignment(experimentId, userId, variant.id, context);
            await ExperimentEvent_1.ExperimentEvent.trackEvent(experimentId, userId, variant.id, 'experiment_assignment', undefined, { context });
            return {
                experimentId,
                experimentName: experiment.name,
                variantId: variant.id,
                variantName: variant.name,
                configuration: variant.configuration,
                isControl: variant.isControl,
                assignedAt: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting variant assignment:', error);
            return null;
        }
    }
    async trackConversion(userId, experimentId, eventType, eventValue, properties) {
        try {
            const assignment = await ExperimentAssignment_1.ExperimentAssignment.getAssignment(experimentId, userId);
            if (!assignment || assignment.isExcluded) {
                return false;
            }
            await ExperimentEvent_1.ExperimentEvent.trackEvent(experimentId, userId, assignment.variantId, eventType, eventValue, properties);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error tracking conversion:', error);
            return false;
        }
    }
    async getExperimentAnalytics(experimentId) {
        try {
            const experiment = await Experiment_1.Experiment.findByPk(experimentId);
            if (!experiment)
                return null;
            const variantAnalytics = [];
            for (const variant of experiment.variants) {
                const assignments = await ExperimentAssignment_1.ExperimentAssignment.findAll({
                    where: {
                        experimentId,
                        variantId: variant.id,
                        isExcluded: false,
                    },
                });
                const totalUsers = assignments.length;
                const conversionMetrics = await ExperimentEvent_1.ExperimentEvent.getConversionRate(experimentId, variant.id, experiment.successCriteria.primaryMetric, experiment.startDate, experiment.endDate);
                variantAnalytics.push({
                    variantId: variant.id,
                    variantName: variant.name,
                    isControl: variant.isControl,
                    allocation: variant.allocation,
                    totalUsers,
                    conversionRate: conversionMetrics.conversionRate,
                    conversions: conversionMetrics.conversions,
                    metrics: {
                        primaryMetric: conversionMetrics,
                    },
                });
            }
            const statisticalSignificance = await this.calculateStatisticalSignificance(experiment, variantAnalytics);
            const recommendations = this.generateRecommendations(experiment, variantAnalytics, statisticalSignificance);
            return {
                experimentId,
                experimentName: experiment.name,
                status: experiment.status,
                startDate: experiment.startDate,
                endDate: experiment.endDate,
                variants: variantAnalytics,
                statisticalSignificance,
                recommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting experiment analytics:', error);
            return null;
        }
    }
    generateUserHash(userId, experimentId) {
        const input = `${userId}-${experimentId}-${ABTestingService.HASH_SEED}`;
        const hash = crypto_1.default.createHash('sha256').update(input).digest('hex');
        return parseInt(hash.substring(0, 8), 16);
    }
    meetsSegmentationCriteria(user, segmentation) {
        if (!segmentation)
            return true;
        if (segmentation.includeRules && segmentation.includeRules.length > 0) {
            const meetsIncludeRules = segmentation.includeRules.every((rule) => this.evaluateSegmentRule(user, rule));
            if (!meetsIncludeRules)
                return false;
        }
        if (segmentation.excludeRules && segmentation.excludeRules.length > 0) {
            const meetsExcludeRules = segmentation.excludeRules.some((rule) => this.evaluateSegmentRule(user, rule));
            if (meetsExcludeRules)
                return false;
        }
        return true;
    }
    evaluateSegmentRule(user, rule) {
        const userValue = this.getNestedProperty(user, rule.field);
        switch (rule.operator) {
            case 'equals':
                return userValue === rule.value;
            case 'not_equals':
                return userValue !== rule.value;
            case 'contains':
                return typeof userValue === 'string' && userValue.includes(rule.value);
            case 'greater_than':
                return Number(userValue) > Number(rule.value);
            case 'less_than':
                return Number(userValue) < Number(rule.value);
            case 'in':
                return Array.isArray(rule.value) && rule.value.includes(userValue);
            case 'not_in':
                return Array.isArray(rule.value) && !rule.value.includes(userValue);
            default:
                return false;
        }
    }
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    async calculateStatisticalSignificance(experiment, variants) {
        const controlVariant = variants.find(v => v.isControl);
        const testVariants = variants.filter(v => !v.isControl);
        if (!controlVariant || testVariants.length === 0) {
            return {
                isSignificant: false,
                confidenceLevel: 0,
                pValue: 1,
                effect: 0,
                recommendedAction: 'inconclusive',
            };
        }
        const bestTestVariant = testVariants.reduce((best, current) => current.conversionRate > best.conversionRate ? current : best);
        const p1 = controlVariant.conversionRate;
        const n1 = controlVariant.totalUsers;
        const p2 = bestTestVariant.conversionRate;
        const n2 = bestTestVariant.totalUsers;
        if (n1 < experiment.successCriteria.minimumSampleSize ||
            n2 < experiment.successCriteria.minimumSampleSize) {
            return {
                isSignificant: false,
                confidenceLevel: 0,
                pValue: 1,
                effect: ((p2 - p1) / p1) * 100,
                recommendedAction: 'continue',
            };
        }
        const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
        const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
        const zScore = (p2 - p1) / se;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
        const confidenceLevel = experiment.successCriteria.confidenceLevel;
        const alpha = (100 - confidenceLevel) / 100;
        const isSignificant = pValue < alpha;
        const effect = ((p2 - p1) / p1) * 100;
        const meetsMinimumEffect = Math.abs(effect) >= experiment.successCriteria.minimumDetectableEffect;
        let recommendedAction = 'continue';
        if (isSignificant && meetsMinimumEffect) {
            recommendedAction = 'stop';
        }
        else if (!isSignificant && effect > 0) {
            recommendedAction = 'extend';
        }
        else if (effect < 0 && pValue < 0.1) {
            recommendedAction = 'stop';
        }
        return {
            isSignificant,
            confidenceLevel: (1 - pValue) * 100,
            pValue,
            effect,
            recommendedAction,
        };
    }
    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }
    erf(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }
    generateRecommendations(experiment, variants, significance) {
        const recommendations = [];
        if (significance.recommendedAction === 'stop') {
            if (significance.effect > 0) {
                const winningVariant = variants.find(v => !v.isControl &&
                    v.conversionRate ===
                        Math.max(...variants.filter(v => !v.isControl).map(v => v.conversionRate)));
                recommendations.push(`Experiment shows significant improvement. Implement ${winningVariant?.variantName} variant.`);
            }
            else {
                recommendations.push('Experiment shows significant decrease. Stick with control variant.');
            }
        }
        else if (significance.recommendedAction === 'extend') {
            recommendations.push('Results are promising but not yet significant. Consider extending the experiment.');
        }
        else if (significance.recommendedAction === 'continue') {
            recommendations.push('Continue running the experiment to gather more data.');
        }
        else {
            recommendations.push('Results are inconclusive. Consider redesigning the experiment.');
        }
        const minSampleSize = experiment.successCriteria.minimumSampleSize;
        const maxUsers = Math.max(...variants.map(v => v.totalUsers));
        if (maxUsers < minSampleSize) {
            const remaining = minSampleSize - maxUsers;
            recommendations.push(`Need ${remaining} more users per variant to reach minimum sample size.`);
        }
        return recommendations;
    }
}
exports.ABTestingService = ABTestingService;
exports.default = ABTestingService;
//# sourceMappingURL=ABTestingService.js.map