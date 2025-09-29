#!/usr/bin/env node

/**
 * Quality Gates Enforcement Script
 * Ensures 90%+ code coverage and other quality metrics
 */

const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const COVERAGE_THRESHOLD = 90;
const REQUIRED_COVERAGE_FILES = [
  'services/api/coverage/coverage-summary.json',
  'apps/admin-panel/coverage/coverage-summary.json',
  'apps/cms-panel/coverage/coverage-summary.json',
  'apps/landing-page/coverage/coverage-summary.json',
];

class QualityGateChecker {
  constructor() {
    this.results = {
      passed: true,
      gates: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    this.thresholds = {
      coverage: {
        backend: { min: 95, warning: 90 },
        frontend: { min: 90, warning: 85 },
        mobile: { min: 85, warning: 80 }
      },
      performance: {
        apiResponseTime: { max: 200, warning: 150 },
        pageLoadTime: { max: 3000, warning: 2000 },
        errorRate: { max: 0.01, warning: 0.005 }
      },
      security: {
        criticalVulnerabilities: { max: 0 },
        highVulnerabilities: { max: 0, warning: 1 },
        mediumVulnerabilities: { max: 5, warning: 3 }
      },
      quality: {
        duplicatedLines: { max: 3, warning: 2 },
        cognitiveComplexity: { max: 15, warning: 10 },
        maintainabilityRating: { min: 'A' }
      }
    };
  }

  async checkAllGates() {
    console.log('🚀 Starting Quality Gate Assessment...\n');

    try {
      await this.checkCodeCoverage();
      await this.checkPerformanceMetrics();
      await this.checkSecurityVulnerabilities();
      await this.checkCodeQuality();
      await this.checkTestResults();
      await this.checkBuildStatus();

      this.generateReport();
      this.printSummary();

      return this.results;
    } catch (error) {
      console.error('❌ Quality gate assessment failed:', error.message);
      this.results.passed = false;
      return this.results;
    }
  }

  async checkCodeCoverage() {
    console.log('📊 Checking Code Coverage...');

    try {
      // Backend Coverage
      const backendCoverage = this.readCoverageReport('services/api/coverage/coverage-summary.json');
      this.evaluateGate(
        'Backend Code Coverage',
        backendCoverage?.total?.lines?.pct || 0,
        this.thresholds.coverage.backend,
        '%'
      );

      // Frontend Coverage (Admin Panel)
      const adminCoverage = this.readCoverageReport('apps/admin-panel/coverage/coverage-summary.json');
      this.evaluateGate(
        'Admin Panel Code Coverage',
        adminCoverage?.total?.lines?.pct || 0,
        this.thresholds.coverage.frontend,
        '%'
      );

      // Frontend Coverage (CMS Panel)
      const cmsCoverage = this.readCoverageReport('apps/cms-panel/coverage/coverage-summary.json');
      this.evaluateGate(
        'CMS Panel Code Coverage',
        cmsCoverage?.total?.lines?.pct || 0,
        this.thresholds.coverage.frontend,
        '%'
      );

      // Mobile Coverage
      const mobileCoverage = this.readFlutterCoverage('mobile-app/coverage/lcov.info');
      this.evaluateGate(
        'Mobile App Code Coverage',
        mobileCoverage,
        this.thresholds.coverage.mobile,
        '%'
      );

    } catch (error) {
      this.addFailedGate('Code Coverage Check', `Failed to read coverage reports: ${error.message}`);
    }
  }

  async checkPerformanceMetrics() {
    console.log('⚡ Checking Performance Metrics...');

    try {
      // API Performance
      const performanceReport = this.readPerformanceReport('tests/performance/results/performance-results.json');

      if (performanceReport) {
        const apiResponseTime = performanceReport.metrics?.api_response_time?.values?.['p(95)'] || 0;
        this.evaluateGate(
          'API Response Time (95th percentile)',
          apiResponseTime,
          this.thresholds.performance.apiResponseTime,
          'ms',
          true // reverse comparison (lower is better)
        );

        const errorRate = performanceReport.metrics?.errors?.values?.rate || 0;
        this.evaluateGate(
          'Error Rate',
          errorRate * 100,
          { max: this.thresholds.performance.errorRate.max * 100, warning: this.thresholds.performance.errorRate.warning * 100 },
          '%',
          true
        );
      } else {
        this.addWarningGate('Performance Metrics', 'Performance test results not found');
      }

      // Web Performance (Lighthouse)
      const lighthouseReport = this.readLighthouseReport('test-results/lighthouse/lighthouse-report.json');
      if (lighthouseReport) {
        const performanceScore = lighthouseReport.categories?.performance?.score * 100 || 0;
        this.evaluateGate(
          'Lighthouse Performance Score',
          performanceScore,
          { min: 90, warning: 80 },
          '/100'
        );
      }

    } catch (error) {
      this.addFailedGate('Performance Check', `Failed to read performance reports: ${error.message}`);
    }
  }

  async checkSecurityVulnerabilities() {
    console.log('🔒 Checking Security Vulnerabilities...');

    try {
      // Security scan results
      const securityReport = this.readSecurityReport('tests/security/security-report.json');

      if (securityReport) {
        const criticalVulns = securityReport.summary?.highSeverity || 0;
        const highVulns = securityReport.summary?.mediumSeverity || 0;
        const mediumVulns = securityReport.summary?.lowSeverity || 0;

        this.evaluateGate(
          'Critical Security Vulnerabilities',
          criticalVulns,
          this.thresholds.security.criticalVulnerabilities,
          '',
          true
        );

        this.evaluateGate(
          'High Security Vulnerabilities',
          highVulns,
          this.thresholds.security.highVulnerabilities,
          '',
          true
        );

        this.evaluateGate(
          'Medium Security Vulnerabilities',
          mediumVulns,
          this.thresholds.security.mediumVulnerabilities,
          '',
          true
        );
      } else {
        this.addWarningGate('Security Scan', 'Security scan results not found');
      }

      // Dependency vulnerabilities
      const auditReport = this.readAuditReport('security-reports/npm-audit.json');
      if (auditReport) {
        const highVulns = auditReport.metadata?.vulnerabilities?.high || 0;
        const criticalVulns = auditReport.metadata?.vulnerabilities?.critical || 0;

        this.evaluateGate(
          'Dependency Vulnerabilities (Critical)',
          criticalVulns,
          { max: 0 },
          '',
          true
        );

        this.evaluateGate(
          'Dependency Vulnerabilities (High)',
          highVulns,
          { max: 0, warning: 2 },
          '',
          true
        );
      }

    } catch (error) {
      this.addFailedGate('Security Check', `Failed to read security reports: ${error.message}`);
    }
  }

  async checkCodeQuality() {
    console.log('🧹 Checking Code Quality...');

    try {
      // SonarQube results (if available)
      const sonarReport = this.readSonarReport('test-results/sonar/sonar-report.json');
      if (sonarReport) {
        const duplicatedLines = sonarReport.component?.measures?.find(m => m.metric === 'duplicated_lines_density')?.value || 0;
        this.evaluateGate(
          'Code Duplication',
          duplicatedLines,
          this.thresholds.quality.duplicatedLines,
          '%',
          true
        );

        const maintainabilityRating = sonarReport.component?.measures?.find(m => m.metric === 'sqale_rating')?.value || 'A';
        this.evaluateGate(
          'Maintainability Rating',
          maintainabilityRating,
          this.thresholds.quality.maintainabilityRating,
          ''
        );
      }

      // ESLint results
      const eslintReport = this.readESLintReport('test-results/eslint/eslint-report.json');
      if (eslintReport) {
        const totalErrors = eslintReport.reduce((sum, file) => sum + file.errorCount, 0);
        const totalWarnings = eslintReport.reduce((sum, file) => sum + file.warningCount, 0);

        this.evaluateGate(
          'ESLint Errors',
          totalErrors,
          { max: 0 },
          '',
          true
        );

        this.evaluateGate(
          'ESLint Warnings',
          totalWarnings,
          { max: 10, warning: 5 },
          '',
          true
        );
      }

    } catch (error) {
      this.addFailedGate('Code Quality Check', `Failed to read code quality reports: ${error.message}`);
    }
  }

  async checkTestResults() {
    console.log('🧪 Checking Test Results...');

    try {
      // Backend test results
      const backendTests = this.readTestResults('services/api/test-results.xml');
      if (backendTests) {
        this.evaluateGate(
          'Backend Test Success Rate',
          backendTests.successRate,
          { min: 100, warning: 99 },
          '%'
        );
      }

      // Frontend test results
      const frontendTests = this.readTestResults('apps/admin-panel/test-results.xml');
      if (frontendTests) {
        this.evaluateGate(
          'Frontend Test Success Rate',
          frontendTests.successRate,
          { min: 100, warning: 99 },
          '%'
        );
      }

      // Mobile test results
      const mobileTests = this.readFlutterTestResults('mobile-app/test/reports/test-results.xml');
      if (mobileTests) {
        this.evaluateGate(
          'Mobile Test Success Rate',
          mobileTests.successRate,
          { min: 100, warning: 99 },
          '%'
        );
      }

      // E2E test results
      const e2eTests = this.readE2ETestResults('tests/e2e/test-results/results.json');
      if (e2eTests) {
        this.evaluateGate(
          'E2E Test Success Rate',
          e2eTests.successRate,
          { min: 95, warning: 90 },
          '%'
        );
      }

    } catch (error) {
      this.addFailedGate('Test Results Check', `Failed to read test results: ${error.message}`);
    }
  }

  async checkBuildStatus() {
    console.log('🔨 Checking Build Status...');

    try {
      // Check if builds succeeded
      const buildStatuses = [
        this.checkBuildOutput('services/api/dist/index.js'),
        this.checkBuildOutput('apps/admin-panel/dist/index.html'),
        this.checkBuildOutput('apps/cms-panel/dist/index.html'),
        this.checkBuildOutput('mobile-app/build/app/outputs/flutter-apk/app-release.apk')
      ];

      const successfulBuilds = buildStatuses.filter(status => status).length;
      const totalBuilds = buildStatuses.length;

      this.evaluateGate(
        'Build Success Rate',
        (successfulBuilds / totalBuilds) * 100,
        { min: 100, warning: 75 },
        '%'
      );

    } catch (error) {
      this.addFailedGate('Build Status Check', `Failed to check build status: ${error.message}`);
    }
  }

  evaluateGate(name, value, threshold, unit = '', reverse = false) {
    const gate = {
      name,
      value,
      threshold,
      unit,
      status: 'PASSED',
      message: ''
    };

    try {
      if (reverse) {
        // For metrics where lower is better (response time, error rate, etc.)
        if (threshold.max !== undefined && value > threshold.max) {
          gate.status = 'FAILED';
          gate.message = `${value}${unit} exceeds maximum threshold of ${threshold.max}${unit}`;
        } else if (threshold.warning !== undefined && value > threshold.warning) {
          gate.status = 'WARNING';
          gate.message = `${value}${unit} exceeds warning threshold of ${threshold.warning}${unit}`;
        } else {
          gate.message = `${value}${unit} is within acceptable limits`;
        }
      } else {
        // For metrics where higher is better (coverage, performance scores, etc.)
        if (threshold.min !== undefined && value < threshold.min) {
          gate.status = 'FAILED';
          gate.message = `${value}${unit} is below minimum threshold of ${threshold.min}${unit}`;
        } else if (threshold.warning !== undefined && value < threshold.warning) {
          gate.status = 'WARNING';
          gate.message = `${value}${unit} is below warning threshold of ${threshold.warning}${unit}`;
        } else {
          gate.message = `${value}${unit} meets requirements`;
        }
      }
    } catch (error) {
      gate.status = 'ERROR';
      gate.message = `Error evaluating gate: ${error.message}`;
    }

    this.addGate(gate);

    const statusIcon = gate.status === 'PASSED' ? '✅' : gate.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${statusIcon} ${name}: ${gate.message}`);
  }

  addGate(gate) {
    this.results.gates.push(gate);
    this.results.summary.total++;

    if (gate.status === 'PASSED') {
      this.results.summary.passed++;
    } else if (gate.status === 'FAILED' || gate.status === 'ERROR') {
      this.results.summary.failed++;
      this.results.passed = false;
    }
  }

  addFailedGate(name, message) {
    this.addGate({
      name,
      value: 'N/A',
      threshold: {},
      unit: '',
      status: 'FAILED',
      message
    });
  }

  addWarningGate(name, message) {
    this.addGate({
      name,
      value: 'N/A',
      threshold: {},
      unit: '',
      status: 'WARNING',
      message
    });
  }

  // File reading methods
  readCoverageReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read coverage report: ${filePath}`);
    }
    return null;
  }

  readFlutterCoverage(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const lcovData = fs.readFileSync(filePath, 'utf8');
        const lines = lcovData.split('\n');
        let totalLines = 0;
        let coveredLines = 0;

        lines.forEach(line => {
          if (line.startsWith('LF:')) {
            totalLines += parseInt(line.split(':')[1]);
          } else if (line.startsWith('LH:')) {
            coveredLines += parseInt(line.split(':')[1]);
          }
        });

        return totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
      }
    } catch (error) {
      console.warn(`Could not read Flutter coverage: ${filePath}`);
    }
    return 0;
  }

  readPerformanceReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read performance report: ${filePath}`);
    }
    return null;
  }

  readSecurityReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read security report: ${filePath}`);
    }
    return null;
  }

  readAuditReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read audit report: ${filePath}`);
    }
    return null;
  }

  readSonarReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read SonarQube report: ${filePath}`);
    }
    return null;
  }

  readESLintReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read ESLint report: ${filePath}`);
    }
    return null;
  }

  readLighthouseReport(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Could not read Lighthouse report: ${filePath}`);
    }
    return null;
  }

  readTestResults(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        // Parse JUnit XML format
        const xml = fs.readFileSync(filePath, 'utf8');
        const testsuiteMatch = xml.match(/testsuite.*tests="(\d+)".*failures="(\d+)".*errors="(\d+)"/);

        if (testsuiteMatch) {
          const total = parseInt(testsuiteMatch[1]);
          const failures = parseInt(testsuiteMatch[2]);
          const errors = parseInt(testsuiteMatch[3]);
          const passed = total - failures - errors;

          return {
            total,
            passed,
            failed: failures + errors,
            successRate: total > 0 ? (passed / total) * 100 : 0
          };
        }
      }
    } catch (error) {
      console.warn(`Could not read test results: ${filePath}`);
    }
    return null;
  }

  readFlutterTestResults(filePath) {
    return this.readTestResults(filePath);
  }

  readE2ETestResults(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const total = results.stats?.suites || 0;
        const passed = results.stats?.passes || 0;
        const failed = results.stats?.failures || 0;

        return {
          total,
          passed,
          failed,
          successRate: total > 0 ? (passed / total) * 100 : 0
        };
      }
    } catch (error) {
      console.warn(`Could not read E2E test results: ${filePath}`);
    }
    return null;
  }

  checkBuildOutput(filePath) {
    return fs.existsSync(filePath);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      passed: this.results.passed,
      summary: this.results.summary,
      gates: this.results.gates,
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    const reportPath = 'test-results/quality-gates-report.json';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report);

    // Generate markdown report for PR comments
    this.generateMarkdownReport(report);
  }

  generateRecommendations() {
    const recommendations = [];
    const failedGates = this.results.gates.filter(gate => gate.status === 'FAILED');
    const warningGates = this.results.gates.filter(gate => gate.status === 'WARNING');

    if (failedGates.length > 0) {
      recommendations.push('🔴 **Critical Issues to Address:**');
      failedGates.forEach(gate => {
        recommendations.push(`- ${gate.name}: ${gate.message}`);
      });
    }

    if (warningGates.length > 0) {
      recommendations.push('🟡 **Warnings to Review:**');
      warningGates.forEach(gate => {
        recommendations.push(`- ${gate.name}: ${gate.message}`);
      });
    }

    // Add general recommendations based on failed gates
    if (failedGates.some(gate => gate.name.includes('Coverage'))) {
      recommendations.push('📈 **Coverage Improvement:**');
      recommendations.push('- Add unit tests for uncovered code paths');
      recommendations.push('- Focus on business logic and error handling');
      recommendations.push('- Consider integration tests for complex workflows');
    }

    if (failedGates.some(gate => gate.name.includes('Performance'))) {
      recommendations.push('⚡ **Performance Optimization:**');
      recommendations.push('- Profile and optimize slow API endpoints');
      recommendations.push('- Implement caching strategies');
      recommendations.push('- Optimize database queries');
      recommendations.push('- Consider CDN for static assets');
    }

    if (failedGates.some(gate => gate.name.includes('Security'))) {
      recommendations.push('🔒 **Security Hardening:**');
      recommendations.push('- Address all critical and high vulnerabilities');
      recommendations.push('- Update dependencies to latest secure versions');
      recommendations.push('- Implement security headers');
      recommendations.push('- Review and test authentication flows');
    }

    return recommendations;
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Quality Gates Report - UpCoach</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-card.passed { border-left: 4px solid #28a745; }
        .metric-card.failed { border-left: 4px solid #dc3545; }
        .metric-card.warning { border-left: 4px solid #ffc107; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .metric-label { color: #666; }
        .gates-table { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 15px; text-align: left; font-weight: 600; }
        td { padding: 15px; border-bottom: 1px solid #dee2e6; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .recommendations { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 20px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; color: white; }
        .badge.passed { background: #28a745; }
        .badge.failed { background: #dc3545; }
        .badge.warning { background: #ffc107; color: #212529; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Quality Gates Report</h1>
            <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Overall Status:</strong>
                <span class="badge ${report.passed ? 'passed' : 'failed'}">
                    ${report.passed ? '✅ PASSED' : '❌ FAILED'}
                </span>
            </p>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${report.summary.total}</div>
                <div class="metric-label">Total Gates</div>
            </div>
            <div class="metric-card passed">
                <div class="metric-value">${report.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card failed">
                <div class="metric-value">${report.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round((report.summary.passed / report.summary.total) * 100)}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>

        <div class="gates-table">
            <table>
                <thead>
                    <tr>
                        <th>Quality Gate</th>
                        <th>Value</th>
                        <th>Threshold</th>
                        <th>Status</th>
                        <th>Message</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.gates.map(gate => `
                        <tr>
                            <td>${gate.name}</td>
                            <td>${gate.value}${gate.unit}</td>
                            <td>${JSON.stringify(gate.threshold)}</td>
                            <td><span class="status-${gate.status.toLowerCase()}">${gate.status}</span></td>
                            <td>${gate.message}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>📋 Recommendations</h2>
            ${report.recommendations.map(rec => `<p>${rec}</p>`).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;

    fs.writeFileSync('test-results/quality-gates-report.html', html);
  }

  generateMarkdownReport(report) {
    const markdown = `
# 🚀 Quality Gates Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Overall Status:** ${report.passed ? '✅ PASSED' : '❌ FAILED'}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Gates | ${report.summary.total} |
| Passed | ${report.summary.passed} |
| Failed | ${report.summary.failed} |
| Success Rate | ${Math.round((report.summary.passed / report.summary.total) * 100)}% |

## 🎯 Quality Gate Results

| Quality Gate | Value | Status | Message |
|-------------|-------|--------|---------|
${report.gates.map(gate =>
  `| ${gate.name} | ${gate.value}${gate.unit} | ${gate.status === 'PASSED' ? '✅' : gate.status === 'WARNING' ? '⚠️' : '❌'} ${gate.status} | ${gate.message} |`
).join('\n')}

${report.recommendations.length > 0 ? `
## 📋 Recommendations

${report.recommendations.map(rec => rec).join('\n')}
` : ''}

---
*Quality Gates Assessment completed successfully*
    `;

    fs.writeFileSync('quality-report.md', markdown);
  }

  printSummary() {
    console.log('\n📋 Quality Gates Summary:');
    console.log(`  📊 Total Gates: ${this.results.summary.total}`);
    console.log(`  ✅ Passed: ${this.results.summary.passed}`);
    console.log(`  ❌ Failed: ${this.results.summary.failed}`);
    console.log(`  📈 Success Rate: ${Math.round((this.results.summary.passed / this.results.summary.total) * 100)}%`);

    if (this.results.passed) {
      console.log('\n🎉 All quality gates passed! Deployment approved.');
    } else {
      console.log('\n🚫 Quality gates failed! Deployment blocked.');
      console.log('\nFailed Gates:');
      this.results.gates
        .filter(gate => gate.status === 'FAILED' || gate.status === 'ERROR')
        .forEach(gate => console.log(`  ❌ ${gate.name}: ${gate.message}`));
    }

    // Create quality gate status file for CI/CD
    if (this.results.passed) {
      fs.writeFileSync('quality-gates-passed', '');
    } else {
      fs.writeFileSync('quality-gate-failed', '');
    }

    const summaryText = this.results.gates
      .map(gate => `${gate.name}: ${gate.status} - ${gate.message}`)
      .join('\n');
    fs.writeFileSync('quality-gate-results.txt', summaryText);
  }
}

// CLI execution
if (require.main === module) {
  const checker = new QualityGateChecker();

  checker.checkAllGates().then(results => {
    const exitCode = results.passed ? 0 : 1;
    process.exit(exitCode);
  }).catch(error => {
    console.error('Quality gate check failed:', error);
    process.exit(1);
  });
}

module.exports = QualityGateChecker;