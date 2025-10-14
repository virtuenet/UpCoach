"use strict";
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
class AITestResultsProcessor {
    results = [];
    summaryPath;
    constructor() {
        const outputDir = path.resolve(__dirname, '../../../../reports/ai-tests');
        fs.mkdirSync(outputDir, { recursive: true });
        this.summaryPath = path.join(outputDir, 'ai-test-summary.json');
    }
    processorCallback = (testResults) => {
        testResults.testResults.forEach((testResult) => {
            const aiResult = {
                testPath: testResult.name,
                success: testResult.status === 'passed',
                duration: testResult.duration || 0,
                aiServiceTested: this.extractAIServiceName(testResult.name),
                performanceMetrics: this.extractPerformanceMetrics(testResult)
            };
            this.results.push(aiResult);
        });
        fs.writeFileSync(this.summaryPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            passedTests: this.results.filter(r => r.success).length,
            failedTests: this.results.filter(r => !r.success).length,
            results: this.results
        }, null, 2));
        return testResults;
    };
    extractAIServiceName(testPath) {
        const serviceMatches = testPath.match(/\/(AI\w+)\.test\.ts/);
        return serviceMatches ? serviceMatches[1] : 'Unknown';
    }
    extractPerformanceMetrics(testResult) {
        return {
            memoryUsage: testResult.memoryUsed || 0,
            cpuUsage: 0,
            aiResponseTime: testResult.duration || 0
        };
    }
}
const processor = new AITestResultsProcessor();
module.exports = processor.processorCallback;
