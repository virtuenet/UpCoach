"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridDecisionEngine = exports.HybridDecisionEngine = void 0;
const logger_1 = require("../../utils/logger");
class HybridDecisionEngine {
    providerStats = new Map();
    loadBalancer = new Map();
    constructor() {
        this.initializeProviderStats();
        logger_1.logger.info('HybridDecisionEngine initialized');
    }
    async routeRequest(messages, options = {}, context) {
        try {
            const startTime = Date.now();
            const complexity = this.analyzeRequestComplexity(messages, context);
            const providers = this.getAvailableProviders();
            const recommendations = await this.scoreProviders(providers, complexity, options, context);
            const bestProvider = recommendations[0];
            const fallbackOptions = recommendations.slice(1, 4).map((rec, index) => ({
                provider: rec.provider,
                model: rec.model,
                priority: index + 1
            }));
            const decision = {
                provider: bestProvider.provider,
                model: bestProvider.model,
                confidence: bestProvider.score,
                reasoning: bestProvider.reasoning,
                estimatedLatency: bestProvider.estimatedLatency,
                estimatedCost: bestProvider.estimatedCost,
                fallbackOptions
            };
            this.updateLoadBalancer(bestProvider.provider);
            const decisionTime = Date.now() - startTime;
            logger_1.logger.info(`Routing decision made in ${decisionTime}ms: ${bestProvider.provider}/${bestProvider.model}`);
            return decision;
        }
        catch (error) {
            logger_1.logger.error('Error in request routing:', error);
            throw error;
        }
    }
    analyzeRequestComplexity(messages, context) {
        let complexityScore = 0;
        const factors = [];
        if (messages.length > 10) {
            complexityScore += 2;
            factors.push('Long conversation history');
        }
        else if (messages.length > 5) {
            complexityScore += 1;
            factors.push('Moderate conversation length');
        }
        const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
        if (totalLength > 5000) {
            complexityScore += 2;
            factors.push('Long content');
        }
        else if (totalLength > 2000) {
            complexityScore += 1;
            factors.push('Moderate content length');
        }
        if (context.domain === 'psychology' || context.domain === 'coaching') {
            complexityScore += 1;
            factors.push('Specialized domain knowledge required');
        }
        if (context.requestType === 'analysis' || context.requestType === 'recommendation') {
            complexityScore += 1;
            factors.push('Complex reasoning required');
        }
        let category;
        if (complexityScore <= 2) {
            category = 'simple';
        }
        else if (complexityScore <= 4) {
            category = 'moderate';
        }
        else {
            category = 'complex';
        }
        return { score: complexityScore, factors, category };
    }
    getAvailableProviders() {
        return [
            {
                provider: 'openai',
                models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                capabilities: ['text', 'analysis', 'conversation', 'reasoning']
            },
            {
                provider: 'anthropic',
                models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                capabilities: ['text', 'analysis', 'conversation', 'reasoning', 'safety']
            },
            {
                provider: 'local',
                models: ['llama-2-7b', 'llama-2-13b'],
                capabilities: ['text', 'conversation', 'privacy']
            }
        ];
    }
    async scoreProviders(providers, complexity, options, context) {
        const recommendations = [];
        for (const provider of providers) {
            for (const model of provider.models) {
                const score = await this.calculateProviderScore(provider.provider, model, complexity, options, context);
                const stats = this.providerStats.get(provider.provider) || {
                    averageLatency: 1000,
                    successRate: 0.95,
                    averageCost: 0.01,
                    lastUsed: new Date()
                };
                recommendations.push({
                    provider: provider.provider,
                    model,
                    score: score.total,
                    reasoning: score.reasoning,
                    estimatedLatency: stats.averageLatency,
                    estimatedCost: stats.averageCost
                });
            }
        }
        return recommendations.sort((a, b) => b.score - a.score);
    }
    async calculateProviderScore(provider, model, complexity, options, context) {
        let score = 0;
        const reasons = [];
        const modelScores = {
            'gpt-4': { quality: 9, speed: 6, cost: 3 },
            'gpt-4-turbo': { quality: 9, speed: 8, cost: 4 },
            'gpt-3.5-turbo': { quality: 7, speed: 9, cost: 8 },
            'claude-3-opus': { quality: 10, speed: 5, cost: 2 },
            'claude-3-sonnet': { quality: 8, speed: 7, cost: 6 },
            'claude-3-haiku': { quality: 6, speed: 9, cost: 9 },
            'llama-2-7b': { quality: 5, speed: 8, cost: 10 },
            'llama-2-13b': { quality: 6, speed: 6, cost: 10 }
        };
        const modelScore = modelScores[model] || { quality: 5, speed: 5, cost: 5 };
        const qualityWeight = complexity.category === 'complex' ? 0.5 : 0.3;
        const speedWeight = context.priority === 'high' ? 0.4 : 0.3;
        const costWeight = 0.2;
        score += modelScore.quality * qualityWeight;
        score += modelScore.speed * speedWeight;
        score += modelScore.cost * costWeight;
        if (provider === 'anthropic' && context.domain === 'psychology') {
            score += 1;
            reasons.push('Anthropic bonus for psychology domain');
        }
        if (provider === 'local' && context.requestType === 'privacy-sensitive') {
            score += 2;
            reasons.push('Local model bonus for privacy');
        }
        const loadFactor = this.loadBalancer.get(provider) || 0;
        if (loadFactor > 5) {
            score -= 1;
            reasons.push('Load balancing penalty');
        }
        if (options.preferredProvider === provider) {
            score += 1;
            reasons.push('User preferred provider');
        }
        const reasoning = reasons.length > 0 ? reasons.join(', ') : 'Standard scoring';
        return { total: Math.max(0, Math.min(10, score)), reasoning };
    }
    updateLoadBalancer(provider) {
        const current = this.loadBalancer.get(provider) || 0;
        this.loadBalancer.set(provider, current + 1);
        if (current > 10) {
            this.loadBalancer.clear();
        }
    }
    initializeProviderStats() {
        const defaultStats = {
            averageLatency: 1000,
            successRate: 0.95,
            averageCost: 0.01,
            lastUsed: new Date()
        };
        this.providerStats.set('openai', { ...defaultStats, averageLatency: 800 });
        this.providerStats.set('anthropic', { ...defaultStats, averageLatency: 1200 });
        this.providerStats.set('local', { ...defaultStats, averageLatency: 500, averageCost: 0 });
    }
    async updateProviderStats(provider, latency, success, cost) {
        try {
            const current = this.providerStats.get(provider) || {
                averageLatency: latency,
                successRate: success ? 1 : 0,
                averageCost: cost,
                lastUsed: new Date()
            };
            const alpha = 0.1;
            current.averageLatency = (1 - alpha) * current.averageLatency + alpha * latency;
            current.successRate = (1 - alpha) * current.successRate + alpha * (success ? 1 : 0);
            current.averageCost = (1 - alpha) * current.averageCost + alpha * cost;
            current.lastUsed = new Date();
            this.providerStats.set(provider, current);
            logger_1.logger.debug(`Updated stats for ${provider}:`, current);
        }
        catch (error) {
            logger_1.logger.error('Error updating provider stats:', error);
        }
    }
    async getProviderHealth() {
        const health = {};
        for (const [provider, stats] of this.providerStats.entries()) {
            let status;
            if (stats.successRate > 0.95 && stats.averageLatency < 2000) {
                status = 'healthy';
            }
            else if (stats.successRate > 0.85 && stats.averageLatency < 5000) {
                status = 'degraded';
            }
            else {
                status = 'unhealthy';
            }
            health[provider] = {
                status,
                latency: stats.averageLatency,
                successRate: stats.successRate,
                lastUsed: stats.lastUsed
            };
        }
        return health;
    }
}
exports.HybridDecisionEngine = HybridDecisionEngine;
exports.hybridDecisionEngine = new HybridDecisionEngine();
