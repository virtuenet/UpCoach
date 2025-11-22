#!/usr/bin/env node

/**
 * Performance Test Results Analyzer
 *
 * This script analyzes performance test results from both landing page
 * and AI services tests to track metrics and identify regressions.
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  landingPage: {
    hero: 100,
    features: 150,
    pricing: 150,
    leadForm: 50,
    firstPaint: 200,
    fullPageLoad: 3000,
  },
  aiServices: {
    aiResponse: 2000,
    profileCreation: 500,
    recommendations: 1000,
    predictions: 800,
    insights: 1500,
    batchOperations: 5000,
  },
};

// Warning thresholds (percentage of limit)
const WARNING_THRESHOLD = 0.8; // 80% of threshold
const CRITICAL_THRESHOLD = 0.95; // 95% of threshold

class PerformanceAnalyzer {
  constructor() {
    this.results = {
      landingPage: {},
      aiServices: {},
      summary: {
        totalTests: 0,
        passed: 0,
        warnings: 0,
        critical: 0,
        failed: 0,
      },
    };
  }

  /**
   * Load and parse performance results
   */
  loadResults() {
    try {
      // Try to load landing page results
      const landingPagePath = path.join(__dirname, '../landing-page/performance-results.json');
      if (fs.existsSync(landingPagePath)) {
        this.results.landingPage = JSON.parse(fs.readFileSync(landingPagePath, 'utf8'));
      }

      // Try to load AI services results
      const aiServicesPath = path.join(__dirname, '../backend/performance-results.json');
      if (fs.existsSync(aiServicesPath)) {
        this.results.aiServices = JSON.parse(fs.readFileSync(aiServicesPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading results:', error.message);
    }
  }

  /**
   * Analyze a single metric
   */
  analyzeMetric(name, value, threshold) {
    const percentage = (value / threshold) * 100;
    let status = 'PASS';
    let symbol = '✅';

    if (value > threshold) {
      status = 'FAIL';
      symbol = '❌';
      this.results.summary.failed++;
    } else if (percentage >= CRITICAL_THRESHOLD * 100) {
      status = 'CRITICAL';
      symbol = '🔴';
      this.results.summary.critical++;
    } else if (percentage >= WARNING_THRESHOLD * 100) {
      status = 'WARNING';
      symbol = '🟡';
      this.results.summary.warnings++;
    } else {
      this.results.summary.passed++;
    }

    this.results.summary.totalTests++;

    return {
      name,
      value,
      threshold,
      percentage: percentage.toFixed(1),
      status,
      symbol,
    };
  }

  /**
   * Analyze all results
   */
  analyze() {
    console.log('\n📊 Performance Test Analysis Report');
    console.log('=====================================\n');

    // Analyze Landing Page metrics
    if (Object.keys(this.results.landingPage).length > 0) {
      console.log('🌐 Landing Page Performance');
      console.log('---------------------------');

      const landingMetrics = [];
      for (const [metric, value] of Object.entries(this.results.landingPage)) {
        if (THRESHOLDS.landingPage[metric]) {
          const analysis = this.analyzeMetric(metric, value, THRESHOLDS.landingPage[metric]);
          landingMetrics.push(analysis);
        }
      }

      this.displayMetricsTable(landingMetrics);
    }

    // Analyze AI Services metrics
    if (Object.keys(this.results.aiServices).length > 0) {
      console.log('\n🤖 AI Services Performance');
      console.log('---------------------------');

      const aiMetrics = [];
      for (const [metric, value] of Object.entries(this.results.aiServices)) {
        if (THRESHOLDS.aiServices[metric]) {
          const analysis = this.analyzeMetric(metric, value, THRESHOLDS.aiServices[metric]);
          aiMetrics.push(analysis);
        }
      }

      this.displayMetricsTable(aiMetrics);
    }

    // Display summary
    this.displaySummary();

    // Generate recommendations
    this.generateRecommendations();
  }

  /**
   * Display metrics in a formatted table
   */
  displayMetricsTable(metrics) {
    const maxNameLength = Math.max(...metrics.map(m => m.name.length));

    metrics.forEach(metric => {
      const name = metric.name.padEnd(maxNameLength);
      const value = metric.value.toFixed(2).padStart(8);
      const threshold = metric.threshold.toString().padStart(8);
      const percentage = metric.percentage.padStart(6);

      console.log(
        `${metric.symbol} ${name} | ${value}ms / ${threshold}ms (${percentage}%) | ${metric.status}`
      );
    });
  }

  /**
   * Display overall summary
   */
  displaySummary() {
    const { summary } = this.results;

    console.log('\n📈 Summary');
    console.log('----------');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(
      `✅ Passed: ${summary.passed} (${((summary.passed / summary.totalTests) * 100).toFixed(1)}%)`
    );
    console.log(`🟡 Warnings: ${summary.warnings}`);
    console.log(`🔴 Critical: ${summary.critical}`);
    console.log(`❌ Failed: ${summary.failed}`);

    // Overall health score
    const healthScore = ((summary.passed + summary.warnings * 0.5) / summary.totalTests) * 100;
    console.log(`\n🏥 Overall Health Score: ${healthScore.toFixed(1)}%`);

    if (healthScore >= 90) {
      console.log('   Status: Excellent! 🎉');
    } else if (healthScore >= 70) {
      console.log('   Status: Good, but needs attention 👀');
    } else if (healthScore >= 50) {
      console.log('   Status: Poor, immediate action required ⚠️');
    } else {
      console.log('   Status: Critical, major issues detected 🚨');
    }
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    console.log('\n💡 Recommendations');
    console.log('------------------');

    const recommendations = [];

    // Check landing page specific issues
    if (this.results.landingPage.hero > THRESHOLDS.landingPage.hero * WARNING_THRESHOLD) {
      recommendations.push({
        component: 'Hero Section',
        issue: 'Slow render time',
        suggestions: [
          'Optimize image sizes and formats (use WebP/AVIF)',
          'Implement lazy loading for below-fold content',
          'Review and minimize CSS/JS in critical path',
          'Consider static generation for faster initial load',
        ],
      });
    }

    if (
      this.results.landingPage.fullPageLoad >
      THRESHOLDS.landingPage.fullPageLoad * WARNING_THRESHOLD
    ) {
      recommendations.push({
        component: 'Full Page',
        issue: 'High total load time',
        suggestions: [
          'Enable compression (gzip/brotli)',
          'Implement code splitting',
          'Use CDN for static assets',
          'Review third-party scripts impact',
        ],
      });
    }

    // Check AI services specific issues
    if (this.results.aiServices.aiResponse > THRESHOLDS.aiServices.aiResponse * WARNING_THRESHOLD) {
      recommendations.push({
        component: 'AI Response',
        issue: 'Slow AI response generation',
        suggestions: [
          'Implement response caching for common queries',
          'Consider using faster AI models for simple tasks',
          'Add streaming responses for better perceived performance',
          'Optimize prompt templates to reduce token usage',
        ],
      });
    }

    if (
      this.results.aiServices.batchOperations >
      THRESHOLDS.aiServices.batchOperations * WARNING_THRESHOLD
    ) {
      recommendations.push({
        component: 'Batch Operations',
        issue: 'Slow batch processing',
        suggestions: [
          'Implement parallel processing',
          'Use database bulk operations',
          'Add background job processing',
          'Consider pagination for large datasets',
        ],
      });
    }

    // Display recommendations
    if (recommendations.length === 0) {
      console.log('✨ No specific recommendations - performance is optimal!');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.component} - ${rec.issue}`);
        rec.suggestions.forEach(suggestion => {
          console.log(`   • ${suggestion}`);
        });
      });
    }
  }

  /**
   * Compare with previous results
   */
  compareWithPrevious() {
    const historyPath = path.join(__dirname, '../performance-history.json');

    try {
      if (fs.existsSync(historyPath)) {
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        const lastRun = history[history.length - 1];

        console.log('\n📊 Comparison with Previous Run');
        console.log('--------------------------------');
        console.log(`Last run: ${new Date(lastRun.timestamp).toLocaleString()}`);

        // Compare metrics
        const changes = [];

        // Compare landing page metrics
        for (const [metric, currentValue] of Object.entries(this.results.landingPage)) {
          if (lastRun.landingPage[metric]) {
            const previousValue = lastRun.landingPage[metric];
            const change = ((currentValue - previousValue) / previousValue) * 100;
            changes.push({
              metric: `Landing/${metric}`,
              previous: previousValue,
              current: currentValue,
              change,
            });
          }
        }

        // Compare AI services metrics
        for (const [metric, currentValue] of Object.entries(this.results.aiServices)) {
          if (lastRun.aiServices[metric]) {
            const previousValue = lastRun.aiServices[metric];
            const change = ((currentValue - previousValue) / previousValue) * 100;
            changes.push({
              metric: `AI/${metric}`,
              previous: previousValue,
              current: currentValue,
              change,
            });
          }
        }

        // Display changes
        changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        console.log('\nTop Changes:');
        changes.slice(0, 5).forEach(change => {
          const symbol = change.change > 0 ? '📈' : '📉';
          const changeStr =
            change.change > 0 ? `+${change.change.toFixed(1)}%` : `${change.change.toFixed(1)}%`;
          console.log(
            `${symbol} ${change.metric}: ${change.previous.toFixed(2)}ms → ${change.current.toFixed(2)}ms (${changeStr})`
          );
        });
      }
    } catch (error) {
      console.log('\nNo previous results found for comparison.');
    }
  }

  /**
   * Save results to history
   */
  saveToHistory() {
    const historyPath = path.join(__dirname, '../performance-history.json');
    let history = [];

    try {
      if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      }
    } catch (error) {
      // Start fresh if history is corrupted
    }

    // Add current results
    history.push({
      timestamp: new Date().toISOString(),
      landingPage: this.results.landingPage,
      aiServices: this.results.aiServices,
      summary: this.results.summary,
    });

    // Keep only last 30 runs
    if (history.length > 30) {
      history = history.slice(-30);
    }

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log('\n✅ Results saved to history');
  }

  /**
   * Generate CI-friendly output
   */
  generateCIOutput() {
    const ciPath = path.join(__dirname, '../performance-ci-report.json');

    const ciReport = {
      timestamp: new Date().toISOString(),
      passed: this.results.summary.failed === 0,
      summary: this.results.summary,
      failures: [],
    };

    // Collect failures
    for (const [metric, value] of Object.entries(this.results.landingPage)) {
      if (THRESHOLDS.landingPage[metric] && value > THRESHOLDS.landingPage[metric]) {
        ciReport.failures.push({
          type: 'landingPage',
          metric,
          value,
          threshold: THRESHOLDS.landingPage[metric],
          exceeded: value - THRESHOLDS.landingPage[metric],
        });
      }
    }

    for (const [metric, value] of Object.entries(this.results.aiServices)) {
      if (THRESHOLDS.aiServices[metric] && value > THRESHOLDS.aiServices[metric]) {
        ciReport.failures.push({
          type: 'aiServices',
          metric,
          value,
          threshold: THRESHOLDS.aiServices[metric],
          exceeded: value - THRESHOLDS.aiServices[metric],
        });
      }
    }

    fs.writeFileSync(ciPath, JSON.stringify(ciReport, null, 2));

    // Exit with error code if tests failed
    if (!ciReport.passed) {
      console.error('\n❌ Performance tests failed!');
      process.exit(1);
    }
  }
}

// Main execution
function main() {
  const analyzer = new PerformanceAnalyzer();

  // Load results
  analyzer.loadResults();

  // Analyze
  analyzer.analyze();

  // Compare with previous
  analyzer.compareWithPrevious();

  // Save to history
  analyzer.saveToHistory();

  // Generate CI output if in CI environment
  if (process.env.CI) {
    analyzer.generateCIOutput();
  }
}

// Run the analyzer
main();
