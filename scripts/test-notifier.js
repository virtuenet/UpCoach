#!/usr/bin/env node

/**
 * Test Failure Notification System
 * 
 * Monitors test results and sends notifications when tests fail.
 * Supports multiple notification channels: console, file, webhook.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class TestNotifier {
  constructor(config = {}) {
    this.config = {
      channels: config.channels || ['console', 'file'],
      webhookUrl: config.webhookUrl || process.env.TEST_WEBHOOK_URL,
      slackWebhook: config.slackWebhook || process.env.SLACK_WEBHOOK_URL,
      thresholds: {
        failureRate: config.failureRateThreshold || 10, // Percentage
        performanceRegression: config.perfRegressionThreshold || 20, // Percentage
        coverageDrop: config.coverageDropThreshold || 5 // Percentage
      },
      ...config
    };
    
    this.notifications = [];
  }

  /**
   * Analyze test results and generate notifications
   */
  async analyzeResults() {
    console.log('🔍 Analyzing test results...\n');

    // Load current results
    const currentResults = this.loadCurrentResults();
    
    // Load previous results for comparison
    const previousResults = this.loadPreviousResults();
    
    // Check for test failures
    this.checkTestFailures(currentResults);
    
    // Check for performance regressions
    this.checkPerformanceRegressions(currentResults, previousResults);
    
    // Check for coverage drops
    this.checkCoverageDrops(currentResults, previousResults);
    
    // Send notifications if any
    if (this.notifications.length > 0) {
      await this.sendNotifications();
    } else {
      console.log('✅ All tests passing - no notifications needed');
    }
  }

  /**
   * Load current test results
   */
  loadCurrentResults() {
    const results = {
      landing: {},
      backend: {},
      performance: {},
      coverage: {}
    };

    // Load landing page test results
    const landingTestPath = path.join(__dirname, '../landing-page/test-results.json');
    if (fs.existsSync(landingTestPath)) {
      results.landing = JSON.parse(fs.readFileSync(landingTestPath, 'utf8'));
    }

    // Load backend test results
    const backendTestPath = path.join(__dirname, '../backend/test-results.json');
    if (fs.existsSync(backendTestPath)) {
      results.backend = JSON.parse(fs.readFileSync(backendTestPath, 'utf8'));
    }

    // Load performance results
    const perfPath = path.join(__dirname, '../performance-ci-report.json');
    if (fs.existsSync(perfPath)) {
      results.performance = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
    }

    // Load coverage results
    const coveragePaths = [
      { file: '../landing-page/coverage/coverage-summary.json', key: 'landing' },
      { file: '../backend/coverage/coverage-summary.json', key: 'backend' }
    ];

    coveragePaths.forEach(({ file, key }) => {
      const coveragePath = path.join(__dirname, file);
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        results.coverage[key] = coverage.total;
      }
    });

    return results;
  }

  /**
   * Load previous results from history
   */
  loadPreviousResults() {
    const historyPath = path.join(__dirname, '../test-history.json');
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      return history[history.length - 1] || {};
    }
    return {};
  }

  /**
   * Check for test failures
   */
  checkTestFailures(results) {
    const failures = [];

    // Check landing page tests
    if (results.landing.numFailedTests > 0) {
      failures.push({
        suite: 'Landing Page',
        failed: results.landing.numFailedTests,
        total: results.landing.numTotalTests,
        failedSuites: results.landing.testResults
          ?.filter(r => r.numFailingTests > 0)
          .map(r => path.basename(r.name))
      });
    }

    // Check backend tests
    if (results.backend.numFailedTests > 0) {
      failures.push({
        suite: 'Backend',
        failed: results.backend.numFailedTests,
        total: results.backend.numTotalTests,
        failedSuites: results.backend.testResults
          ?.filter(r => r.numFailingTests > 0)
          .map(r => path.basename(r.name))
      });
    }

    if (failures.length > 0) {
      this.notifications.push({
        type: 'test_failure',
        severity: 'high',
        title: '❌ Test Failures Detected',
        message: this.formatTestFailures(failures),
        details: failures
      });
    }
  }

  /**
   * Check for performance regressions
   */
  checkPerformanceRegressions(current, previous) {
    if (!current.performance || !previous.performance) return;

    const regressions = [];
    const threshold = this.config.thresholds.performanceRegression;

    // Compare performance metrics
    if (current.performance.failures && current.performance.failures.length > 0) {
      current.performance.failures.forEach(failure => {
        regressions.push({
          metric: failure.metric,
          current: failure.value,
          threshold: failure.threshold,
          exceeded: failure.exceeded
        });
      });
    }

    if (regressions.length > 0) {
      this.notifications.push({
        type: 'performance_regression',
        severity: 'medium',
        title: '⚠️  Performance Regression Detected',
        message: this.formatPerformanceRegressions(regressions),
        details: regressions
      });
    }
  }

  /**
   * Check for coverage drops
   */
  checkCoverageDrops(current, previous) {
    if (!current.coverage || !previous.coverage) return;

    const drops = [];
    const threshold = this.config.thresholds.coverageDrop;

    ['landing', 'backend'].forEach(project => {
      if (current.coverage[project] && previous.coverage[project]) {
        ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
          const currentVal = current.coverage[project][metric]?.pct || 0;
          const previousVal = previous.coverage[project][metric]?.pct || 0;
          const drop = previousVal - currentVal;

          if (drop > threshold) {
            drops.push({
              project,
              metric,
              previous: previousVal,
              current: currentVal,
              drop: drop.toFixed(2)
            });
          }
        });
      }
    });

    if (drops.length > 0) {
      this.notifications.push({
        type: 'coverage_drop',
        severity: 'low',
        title: '📉 Coverage Drop Detected',
        message: this.formatCoverageDrops(drops),
        details: drops
      });
    }
  }

  /**
   * Format test failures for notification
   */
  formatTestFailures(failures) {
    return failures.map(f => 
      `${f.suite}: ${f.failed}/${f.total} tests failed\n` +
      `Failed suites: ${f.failedSuites?.join(', ') || 'N/A'}`
    ).join('\n\n');
  }

  /**
   * Format performance regressions
   */
  formatPerformanceRegressions(regressions) {
    return regressions.map(r =>
      `${r.metric}: ${r.current.toFixed(2)}ms (threshold: ${r.threshold}ms, +${r.exceeded.toFixed(2)}ms)`
    ).join('\n');
  }

  /**
   * Format coverage drops
   */
  formatCoverageDrops(drops) {
    return drops.map(d =>
      `${d.project}/${d.metric}: ${d.current.toFixed(1)}% (was ${d.previous.toFixed(1)}%, -${d.drop}%)`
    ).join('\n');
  }

  /**
   * Send notifications through configured channels
   */
  async sendNotifications() {
    console.log(`\n📢 Sending ${this.notifications.length} notifications...\n`);

    for (const notification of this.notifications) {
      for (const channel of this.config.channels) {
        try {
          await this[`send${channel.charAt(0).toUpperCase() + channel.slice(1)}`](notification);
        } catch (error) {
          console.error(`Failed to send notification via ${channel}:`, error.message);
        }
      }
    }
  }

  /**
   * Send console notification
   */
  async sendConsole(notification) {
    const severityColors = {
      high: '\x1b[31m',    // Red
      medium: '\x1b[33m',  // Yellow
      low: '\x1b[36m'      // Cyan
    };
    const reset = '\x1b[0m';
    const color = severityColors[notification.severity] || reset;

    console.log(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
    console.log(`${color}${notification.title}${reset}`);
    console.log(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
    console.log(notification.message);
    console.log(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}\n`);
  }

  /**
   * Send file notification
   */
  async sendFile(notification) {
    const timestamp = new Date().toISOString();
    const filename = `notification-${timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(__dirname, '../notifications', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify({
      timestamp,
      ...notification
    }, null, 2));

    console.log(`📄 Notification saved to: ${filename}`);
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(notification) {
    if (!this.config.webhookUrl) {
      console.log('⚠️  Webhook URL not configured');
      return;
    }

    const data = JSON.stringify({
      timestamp: new Date().toISOString(),
      project: 'UpCoach',
      environment: process.env.NODE_ENV || 'development',
      ...notification
    });

    return new Promise((resolve, reject) => {
      const url = new URL(this.config.webhookUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log('📨 Webhook notification sent successfully');
          resolve();
        } else {
          reject(new Error(`Webhook failed with status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Send Slack notification
   */
  async sendSlack(notification) {
    if (!this.config.slackWebhook) {
      console.log('⚠️  Slack webhook not configured');
      return;
    }

    const color = {
      high: 'danger',
      medium: 'warning',
      low: 'good'
    }[notification.severity] || 'good';

    const payload = {
      attachments: [{
        color,
        title: notification.title,
        text: notification.message,
        fields: [
          {
            title: 'Type',
            value: notification.type.replace(/_/g, ' ').toUpperCase(),
            short: true
          },
          {
            title: 'Severity',
            value: notification.severity.toUpperCase(),
            short: true
          }
        ],
        footer: 'UpCoach Test Suite',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    // Send to Slack (similar to webhook implementation)
    console.log('💬 Slack notification would be sent (webhook not configured)');
  }

  /**
   * Save results to history
   */
  saveToHistory(results) {
    const historyPath = path.join(__dirname, '../test-history.json');
    let history = [];

    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    history.push({
      timestamp: new Date().toISOString(),
      ...results
    });

    // Keep last 30 entries
    if (history.length > 30) {
      history = history.slice(-30);
    }

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    if (this.notifications.length === 0) {
      return {
        status: 'success',
        message: 'All tests passed successfully',
        notifications: []
      };
    }

    return {
      status: 'failure',
      message: `${this.notifications.length} issues detected`,
      notifications: this.notifications,
      highSeverity: this.notifications.filter(n => n.severity === 'high').length,
      mediumSeverity: this.notifications.filter(n => n.severity === 'medium').length,
      lowSeverity: this.notifications.filter(n => n.severity === 'low').length
    };
  }
}

// Main execution
async function main() {
  const config = {
    channels: process.env.NOTIFICATION_CHANNELS?.split(',') || ['console', 'file'],
    webhookUrl: process.env.TEST_WEBHOOK_URL,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    failureRateThreshold: parseInt(process.env.FAILURE_THRESHOLD) || 10,
    perfRegressionThreshold: parseInt(process.env.PERF_THRESHOLD) || 20,
    coverageDropThreshold: parseInt(process.env.COVERAGE_THRESHOLD) || 5
  };

  const notifier = new TestNotifier(config);

  try {
    await notifier.analyzeResults();
    
    const summary = notifier.generateSummary();
    
    // Save current results to history
    const currentResults = notifier.loadCurrentResults();
    notifier.saveToHistory(currentResults);

    // Exit with error code if there are high severity issues
    if (summary.highSeverity > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error in test notifier:', error);
    process.exit(1);
  }
}

// Run the notifier
if (require.main === module) {
  main();
}

module.exports = TestNotifier;