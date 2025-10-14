"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABTestingFramework = void 0;
const tslib_1 = require("tslib");
const events_1 = require("events");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
class ABTestingFramework extends events_1.EventEmitter {
    logger;
    db;
    redis;
    activeTests;
    testScheduler;
    constructor(logger, db, redis) {
        super();
        this.logger = logger;
        this.db = db;
        this.redis = redis;
        this.activeTests = new Map();
        this.loadActiveTests();
    }
    async loadActiveTests() {
        try {
            const query = `
        SELECT * FROM ab_tests
        WHERE status IN ('running', 'paused')
      `;
            const result = await this.db.query(query);
            for (const row of result.rows) {
                const test = await this.hydrateTest(row);
                this.activeTests.set(test.testId, test);
            }
            this.logger.info(`Loaded ${this.activeTests.size} active A/B tests`);
        }
        catch (error) {
            this.logger.error('Failed to load active tests', error);
        }
    }
    async createTest(testConfig) {
        try {
            const testId = this.generateTestId();
            const test = {
                testId,
                name: testConfig.name,
                description: testConfig.description,
                type: testConfig.type,
                status: 'draft',
                startDate: testConfig.startDate || new Date(),
                endDate: testConfig.endDate,
                variants: testConfig.variants || [],
                metrics: testConfig.metrics || [],
                configuration: testConfig.configuration || this.getDefaultConfiguration(),
                createdBy: testConfig.createdBy,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.validateTest(test);
            await this.persistTest(test);
            this.logger.info(`Created A/B test: ${testId}`);
            this.emit('test:created', test);
            return test;
        }
        catch (error) {
            this.logger.error('Failed to create A/B test', error);
            throw error;
        }
    }
    async startTest(testId) {
        try {
            const test = await this.getTest(testId);
            if (test.status !== 'draft' && test.status !== 'paused') {
                throw new Error(`Test ${testId} cannot be started from status ${test.status}`);
            }
            await this.validateTestRequirements(test);
            test.status = 'running';
            test.startDate = new Date();
            await this.updateTest(test);
            this.activeTests.set(testId, test);
            await this.initializeTestTracking(test);
            this.logger.info(`Started A/B test: ${testId}`);
            this.emit('test:started', test);
        }
        catch (error) {
            this.logger.error(`Failed to start test ${testId}`, error);
            throw error;
        }
    }
    async stopTest(testId, reason) {
        try {
            const test = this.activeTests.get(testId);
            if (!test || test.status !== 'running') {
                throw new Error(`Test ${testId} is not running`);
            }
            const results = await this.calculateTestResults(test);
            test.status = 'completed';
            test.endDate = new Date();
            test.results = results;
            await this.updateTest(test);
            this.activeTests.delete(testId);
            this.logger.info(`Stopped A/B test: ${testId}`, { reason, results });
            this.emit('test:stopped', { test, results, reason });
            return results;
        }
        catch (error) {
            this.logger.error(`Failed to stop test ${testId}`, error);
            throw error;
        }
    }
    async pauseTest(testId) {
        try {
            const test = this.activeTests.get(testId);
            if (!test || test.status !== 'running') {
                throw new Error(`Test ${testId} is not running`);
            }
            test.status = 'paused';
            await this.updateTest(test);
            this.logger.info(`Paused A/B test: ${testId}`);
            this.emit('test:paused', test);
        }
        catch (error) {
            this.logger.error(`Failed to pause test ${testId}`, error);
            throw error;
        }
    }
    async trackConversion(testId, variantId, userId, value, metadata) {
        try {
            const test = this.activeTests.get(testId);
            if (!test || test.status !== 'running') {
                this.logger.debug(`Test ${testId} not active, skipping conversion`);
                return;
            }
            const assignedVariant = await this.getUserVariant(testId, userId);
            if (assignedVariant && assignedVariant !== variantId) {
                this.logger.warn(`User ${userId} assigned to different variant`);
                return;
            }
            await this.recordConversion(testId, variantId, userId, value, metadata);
            if (test.configuration.earlyStoppingRules?.enabled) {
                await this.checkEarlyStoppingConditions(test);
            }
            this.emit('conversion:tracked', {
                testId,
                variantId,
                userId,
                value,
                metadata
            });
        }
        catch (error) {
            this.logger.error('Failed to track conversion', error);
        }
    }
    async assignUserToVariant(testId, userId, context) {
        try {
            const test = this.activeTests.get(testId);
            if (!test || test.status !== 'running') {
                return null;
            }
            let variantId = await this.getUserVariant(testId, userId);
            if (!variantId) {
                variantId = this.selectVariant(test, userId);
                await this.assignVariant(testId, userId, variantId, context);
            }
            return variantId;
        }
        catch (error) {
            this.logger.error('Failed to assign user to variant', error);
            return null;
        }
    }
    async calculateTestResults(test) {
        try {
            const variantResults = new Map();
            const controlVariant = test.variants.find(v => v.isControl);
            if (!controlVariant) {
                throw new Error('No control variant found');
            }
            for (const variant of test.variants) {
                const data = await this.fetchVariantData(test.testId, variant.variantId);
                const result = this.calculateVariantMetrics(data, test.metrics);
                variantResults.set(variant.variantId, result);
            }
            const analysis = this.performStatisticalAnalysis(variantResults, controlVariant.variantId, test.configuration);
            let segments;
            if (test.configuration.segmentation?.enabled) {
                segments = await this.calculateSegmentResults(test, variantResults);
            }
            return {
                winner: analysis.winner,
                confidence: analysis.confidence,
                pValue: analysis.pValue,
                effectSize: analysis.effectSize,
                variantResults,
                segments,
                recommendation: this.generateRecommendation(analysis, test)
            };
        }
        catch (error) {
            this.logger.error('Failed to calculate test results', error);
            throw error;
        }
    }
    performStatisticalAnalysis(variantResults, controlId, config) {
        const control = variantResults.get(controlId);
        let winner;
        let maxImprovement = 0;
        let confidence = 0;
        let overallPValue = 1;
        for (const [variantId, variant] of variantResults) {
            if (variantId === controlId)
                continue;
            const comparison = this.compareVariants(control, variant, config);
            if (comparison.significant && comparison.improvement > maxImprovement) {
                winner = variantId;
                maxImprovement = comparison.improvement;
                confidence = comparison.confidence;
                overallPValue = comparison.pValue;
            }
        }
        if (config.multipleTestingCorrection && variantResults.size > 2) {
            overallPValue = this.bonferroniCorrection(overallPValue, variantResults.size - 1);
        }
        return {
            winner,
            confidence,
            pValue: overallPValue,
            effectSize: this.calculateEffectSize(control, variantResults.get(winner) || control)
        };
    }
    compareVariants(control, treatment, config) {
        if (config.statisticalMethod === 'bayesian') {
            return this.bayesianComparison(control, treatment, config);
        }
        else {
            return this.frequentistComparison(control, treatment, config);
        }
    }
    frequentistComparison(control, treatment, config) {
        const controlRate = control.conversionRate || 0;
        const treatmentRate = treatment.conversionRate || 0;
        const controlN = control.sampleSize;
        const treatmentN = treatment.sampleSize;
        const pooledRate = (controlRate * controlN + treatmentRate * treatmentN) /
            (controlN + treatmentN);
        const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlN + 1 / treatmentN));
        const z = (treatmentRate - controlRate) / se;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
        const improvement = ((treatmentRate - controlRate) / controlRate) * 100;
        const significant = pValue < (1 - (config.successCriteria?.confidenceLevel || 0.95));
        return {
            improvement,
            pValue,
            zScore: z,
            significant,
            confidence: 1 - pValue
        };
    }
    bayesianComparison(control, treatment, config) {
        const controlAlpha = (control.conversionRate || 0) * control.sampleSize + 1;
        const controlBeta = (1 - (control.conversionRate || 0)) * control.sampleSize + 1;
        const treatmentAlpha = (treatment.conversionRate || 0) * treatment.sampleSize + 1;
        const treatmentBeta = (1 - (treatment.conversionRate || 0)) * treatment.sampleSize + 1;
        const simulations = 10000;
        let wins = 0;
        for (let i = 0; i < simulations; i++) {
            const controlSample = this.betaRandom(controlAlpha, controlBeta);
            const treatmentSample = this.betaRandom(treatmentAlpha, treatmentBeta);
            if (treatmentSample > controlSample)
                wins++;
        }
        const probabilityOfImprovement = wins / simulations;
        const improvement = ((treatment.conversionRate || 0) - (control.conversionRate || 0)) /
            (control.conversionRate || 1) * 100;
        return {
            improvement,
            probabilityOfImprovement,
            significant: probabilityOfImprovement > (config.successCriteria?.confidenceLevel || 0.95),
            confidence: probabilityOfImprovement
        };
    }
    calculateEffectSize(control, treatment) {
        const controlMean = control.averageValue || control.conversionRate || 0;
        const treatmentMean = treatment.averageValue || treatment.conversionRate || 0;
        const controlVar = this.calculateVariance(control);
        const treatmentVar = this.calculateVariance(treatment);
        const pooledSD = Math.sqrt(((control.sampleSize - 1) * controlVar + (treatment.sampleSize - 1) * treatmentVar) /
            (control.sampleSize + treatment.sampleSize - 2));
        return (treatmentMean - controlMean) / pooledSD;
    }
    async checkEarlyStoppingConditions(test) {
        if (!test.configuration.earlyStoppingRules?.enabled)
            return;
        const results = await this.calculateTestResults(test);
        if (results.confidence < test.configuration.earlyStoppingRules.futilityBoundary) {
            await this.stopTest(test.testId, 'Futility boundary reached');
            return;
        }
        if (results.confidence > test.configuration.earlyStoppingRules.efficacyBoundary) {
            await this.stopTest(test.testId, 'Efficacy boundary reached');
            return;
        }
        const duration = (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (duration >= test.configuration.maximumDuration) {
            await this.stopTest(test.testId, 'Maximum duration reached');
        }
    }
    generateTestId() {
        return `test_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
    }
    getDefaultConfiguration() {
        return {
            minimumSampleSize: 1000,
            minimumDuration: 7,
            maximumDuration: 30,
            statisticalMethod: 'frequentist',
            multipleTestingCorrection: true,
            segmentation: {
                enabled: false,
                dimensions: []
            },
            earlyStoppingRules: {
                enabled: true,
                checkInterval: 24,
                futilityBoundary: 0.1,
                efficacyBoundary: 0.99
            }
        };
    }
    validateTest(test) {
        if (test.variants.length < 2) {
            throw new Error('Test must have at least 2 variants');
        }
        const hasControl = test.variants.some(v => v.isControl);
        if (!hasControl) {
            throw new Error('Test must have exactly one control variant');
        }
        const totalAllocation = test.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
        if (Math.abs(totalAllocation - 100) > 0.01) {
            throw new Error('Traffic allocation must sum to 100%');
        }
        if (test.metrics.length === 0) {
            throw new Error('Test must have at least one metric');
        }
        const primaryMetrics = test.metrics.filter(m => m.type === 'primary');
        if (primaryMetrics.length !== 1) {
            throw new Error('Test must have exactly one primary metric');
        }
    }
    async validateTestRequirements(test) {
        const estimatedTraffic = await this.estimateTraffic(test);
        const requiredSampleSize = test.configuration.minimumSampleSize * test.variants.length;
        if (estimatedTraffic < requiredSampleSize) {
            throw new Error(`Insufficient traffic. Need ${requiredSampleSize}, estimated ${estimatedTraffic}`);
        }
    }
    async estimateTraffic(test) {
        const query = `
      SELECT AVG(daily_traffic) as avg_traffic
      FROM traffic_stats
      WHERE type = $1
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    `;
        const result = await this.db.query(query, [test.type]);
        return result.rows[0]?.avg_traffic || 0;
    }
    selectVariant(test, userId) {
        const hash = crypto_1.default.createHash('md5')
            .update(`${test.testId}:${userId}`)
            .digest('hex');
        const bucket = parseInt(hash.substring(0, 8), 16) % 100;
        let cumulative = 0;
        for (const variant of test.variants) {
            cumulative += variant.trafficAllocation;
            if (bucket < cumulative) {
                return variant.variantId;
            }
        }
        return test.variants[test.variants.length - 1].variantId;
    }
    async getUserVariant(testId, userId) {
        const key = `abtest:${testId}:user:${userId}`;
        return await this.redis.get(key);
    }
    async assignVariant(testId, userId, variantId, context) {
        const key = `abtest:${testId}:user:${userId}`;
        await this.redis.setex(key, 86400 * 30, variantId);
        await this.db.query(`
      INSERT INTO ab_test_assignments
      (test_id, user_id, variant_id, assigned_at, context)
      VALUES ($1, $2, $3, NOW(), $4)
    `, [testId, userId, variantId, JSON.stringify(context)]);
    }
    async recordConversion(testId, variantId, userId, value, metadata) {
        await this.db.query(`
      INSERT INTO ab_test_conversions
      (test_id, variant_id, user_id, value, metadata, converted_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [testId, variantId, userId, value, JSON.stringify(metadata)]);
        const key = `abtest:${testId}:variant:${variantId}:conversions`;
        await this.redis.incr(key);
    }
    async fetchVariantData(testId, variantId) {
        const query = `
      SELECT
        COUNT(DISTINCT a.user_id) as sample_size,
        COUNT(DISTINCT c.user_id) as conversions,
        AVG(c.value) as avg_value,
        STDDEV(c.value) as std_value
      FROM ab_test_assignments a
      LEFT JOIN ab_test_conversions c
        ON a.test_id = c.test_id
        AND a.user_id = c.user_id
        AND a.variant_id = c.variant_id
      WHERE a.test_id = $1 AND a.variant_id = $2
    `;
        const result = await this.db.query(query, [testId, variantId]);
        return result.rows[0];
    }
    calculateVariantMetrics(data, metrics) {
        const conversionRate = data.conversions / data.sample_size;
        const se = Math.sqrt(conversionRate * (1 - conversionRate) / data.sample_size);
        return {
            variantId: data.variant_id,
            sampleSize: data.sample_size,
            metrics: new Map(),
            conversionRate,
            averageValue: data.avg_value,
            confidenceInterval: {
                lower: conversionRate - 1.96 * se,
                upper: conversionRate + 1.96 * se
            }
        };
    }
    async calculateSegmentResults(test, overallResults) {
        const segments = new Map();
        if (!test.configuration.segmentation?.dimensions) {
            return segments;
        }
        for (const dimension of test.configuration.segmentation.dimensions) {
            const segmentData = await this.fetchSegmentData(test.testId, dimension);
            for (const [segmentValue, data] of segmentData) {
                const variantResults = new Map();
                for (const variant of test.variants) {
                    const result = this.calculateVariantMetrics(data[variant.variantId], test.metrics);
                    variantResults.set(variant.variantId, result);
                }
                segments.set(`${dimension}:${segmentValue}`, {
                    segmentName: `${dimension}:${segmentValue}`,
                    segmentCriteria: { [dimension]: segmentValue },
                    variantResults
                });
            }
        }
        return segments;
    }
    async fetchSegmentData(testId, dimension) {
        const query = `
      SELECT
        a.variant_id,
        a.context->>'${dimension}' as segment_value,
        COUNT(DISTINCT a.user_id) as sample_size,
        COUNT(DISTINCT c.user_id) as conversions,
        AVG(c.value) as avg_value
      FROM ab_test_assignments a
      LEFT JOIN ab_test_conversions c
        ON a.test_id = c.test_id
        AND a.user_id = c.user_id
        AND a.variant_id = c.variant_id
      WHERE a.test_id = $1
      GROUP BY a.variant_id, segment_value
    `;
        const result = await this.db.query(query, [testId]);
        const segmentMap = new Map();
        for (const row of result.rows) {
            if (!segmentMap.has(row.segment_value)) {
                segmentMap.set(row.segment_value, {});
            }
            segmentMap.get(row.segment_value)[row.variant_id] = row;
        }
        return segmentMap;
    }
    generateRecommendation(analysis, test) {
        if (!analysis.winner) {
            return 'No significant difference found between variants. Consider running the test longer or increasing sample size.';
        }
        const winner = test.variants.find(v => v.variantId === analysis.winner);
        const improvement = Math.round(analysis.effectSize * 100);
        return `Variant "${winner?.name}" is the winner with ${analysis.confidence * 100}% confidence. ` +
            `Expected improvement: ${improvement}%. ` +
            `Recommend implementing this variant for all users.`;
    }
    normalCDF(z) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        z = Math.abs(z) / Math.sqrt(2.0);
        const t = 1.0 / (1.0 + p * z);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
        return 0.5 * (1.0 + sign * y);
    }
    betaRandom(alpha, beta) {
        const gammaAlpha = this.gammaRandom(alpha, 1);
        const gammaBeta = this.gammaRandom(beta, 1);
        return gammaAlpha / (gammaAlpha + gammaBeta);
    }
    gammaRandom(shape, scale) {
        if (shape < 1) {
            return this.gammaRandom(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
        }
        const d = shape - 1 / 3;
        const c = 1 / Math.sqrt(9 * d);
        while (true) {
            let x, v;
            do {
                x = this.normalRandom();
                v = 1 + c * x;
            } while (v <= 0);
            v = v * v * v;
            const u = Math.random();
            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v * scale;
            }
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v * scale;
            }
        }
    }
    normalRandom() {
        const u = 1 - Math.random();
        const v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    bonferroniCorrection(pValue, numComparisons) {
        return Math.min(pValue * numComparisons, 1);
    }
    calculateVariance(result) {
        const mean = result.averageValue || result.conversionRate || 0;
        if (result.conversionRate !== undefined) {
            return result.conversionRate * (1 - result.conversionRate);
        }
        return mean * 0.5;
    }
    async hydrateTest(row) {
        return {
            testId: row.test_id,
            name: row.name,
            description: row.description,
            type: row.type,
            status: row.status,
            startDate: row.start_date,
            endDate: row.end_date,
            variants: JSON.parse(row.variants),
            metrics: JSON.parse(row.metrics),
            configuration: JSON.parse(row.configuration),
            results: row.results ? JSON.parse(row.results) : undefined,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    async persistTest(test) {
        await this.db.query(`
      INSERT INTO ab_tests (
        test_id, name, description, type, status,
        start_date, end_date, variants, metrics,
        configuration, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
            test.testId,
            test.name,
            test.description,
            test.type,
            test.status,
            test.startDate,
            test.endDate,
            JSON.stringify(test.variants),
            JSON.stringify(test.metrics),
            JSON.stringify(test.configuration),
            test.createdBy,
            test.createdAt,
            test.updatedAt
        ]);
    }
    async updateTest(test) {
        test.updatedAt = new Date();
        await this.db.query(`
      UPDATE ab_tests SET
        status = $2,
        start_date = $3,
        end_date = $4,
        variants = $5,
        results = $6,
        updated_at = $7
      WHERE test_id = $1
    `, [
            test.testId,
            test.status,
            test.startDate,
            test.endDate,
            JSON.stringify(test.variants),
            test.results ? JSON.stringify(test.results) : null,
            test.updatedAt
        ]);
    }
    async initializeTestTracking(test) {
        for (const variant of test.variants) {
            const keys = [
                `abtest:${test.testId}:variant:${variant.variantId}:views`,
                `abtest:${test.testId}:variant:${variant.variantId}:conversions`
            ];
            for (const key of keys) {
                await this.redis.set(key, 0);
            }
        }
    }
    async getTest(testId) {
        const result = await this.db.query('SELECT * FROM ab_tests WHERE test_id = $1', [testId]);
        if (result.rows.length === 0) {
            throw new Error(`Test ${testId} not found`);
        }
        return this.hydrateTest(result.rows[0]);
    }
    startScheduler() {
        this.testScheduler = setInterval(async () => {
            for (const test of this.activeTests.values()) {
                if (test.configuration.earlyStoppingRules?.enabled) {
                    await this.checkEarlyStoppingConditions(test);
                }
                const duration = (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24);
                if (duration >= test.configuration.maximumDuration) {
                    await this.stopTest(test.testId, 'Maximum duration reached');
                }
            }
        }, 3600000);
    }
    stopScheduler() {
        if (this.testScheduler) {
            clearInterval(this.testScheduler);
            this.testScheduler = undefined;
        }
    }
    async cleanup() {
        this.stopScheduler();
        this.activeTests.clear();
        this.removeAllListeners();
        this.logger.info('A/B testing framework cleaned up');
    }
}
exports.ABTestingFramework = ABTestingFramework;
