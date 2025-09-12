#!/usr/bin/env node
/**
 * Comprehensive Test Execution Script for A+ Testing Standards
 * Orchestrates all test types and provides real-time feedback
 * Can be run locally or in CI/CD pipeline
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class ComprehensiveTestRunner {
  constructor(options = {}) {
    this.options = {
      parallel: options.parallel || false,
      coverage: options.coverage !== false,
      performance: options.performance || false,
      security: options.security || false,
      e2e: options.e2e || false,
      visual: options.visual || false,
      verbose: options.verbose || false,
      failFast: options.failFast || false,
      outputDir: options.outputDir || './test-results',
      ...options,
    };

    this.results = {
      backend: { status: 'pending', coverage: 0, duration: 0 },
      frontend: { status: 'pending', coverage: 0, duration: 0 },
      mobile: { status: 'pending', coverage: 0, duration: 0 },
      contracts: { status: 'pending', coverage: 0, duration: 0 },
      performance: { status: 'pending', metrics: {}, duration: 0 },
      security: { status: 'pending', vulnerabilities: 0, duration: 0 },
      e2e: { status: 'pending', tests: 0, duration: 0 },
      visual: { status: 'pending', regressions: 0, duration: 0 },
    };

    this.startTime = Date.now();
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async run() {
    console.log(chalk.bold.blue('🚀 Starting Comprehensive A+ Testing Suite'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.cyan('Target: A+ Rating (95%+ Coverage, <200ms Performance, Zero Critical Vulnerabilities)'));
    console.log(chalk.gray('═'.repeat(60)));

    try {
      // Setup test environment
      await this.setupEnvironment();

      // Run test suites based on configuration
      const testSuites = this.getTestSuites();
      
      if (this.options.parallel) {
        await this.runTestSuitesParallel(testSuites);
      } else {
        await this.runTestSuitesSequential(testSuites);
      }

      // Generate comprehensive report
      await this.generateReport();

      // Assess quality gates
      const qualityGateResult = await this.assessQualityGates();

      // Display final results
      this.displayFinalResults(qualityGateResult);

      // Exit with appropriate code
      process.exit(qualityGateResult.passed ? 0 : 1);

    } catch (error) {
      console.error(chalk.red('💥 Test suite failed:'), error.message);
      process.exit(1);
    }
  }

  getTestSuites() {
    const suites = [
      { name: 'backend', command: 'npm run test:backend:comprehensive', required: true },
      { name: 'frontend', command: 'npm run test:frontend:comprehensive', required: true },
      { name: 'mobile', command: 'npm run test:mobile:comprehensive', required: true },
      { name: 'contracts', command: 'npm run test:contracts', required: true },
    ];

    if (this.options.performance) {
      suites.push({ name: 'performance', command: 'npm run test:performance', required: false });
    }

    if (this.options.security) {
      suites.push({ name: 'security', command: 'npm run test:security', required: false });
    }

    if (this.options.e2e) {
      suites.push({ name: 'e2e', command: 'npm run test:e2e', required: false });
    }

    if (this.options.visual) {
      suites.push({ name: 'visual', command: 'npm run test:visual', required: false });
    }

    return suites;
  }

  async setupEnvironment() {
    console.log(chalk.yellow('📋 Setting up test environment...'));
    
    // Create output directories
    await this.ensureDirectoryExists(this.options.outputDir);
    await this.ensureDirectoryExists(path.join(this.options.outputDir, 'coverage'));
    await this.ensureDirectoryExists(path.join(this.options.outputDir, 'reports'));

    // Start test databases if needed
    if (this.options.e2e || this.options.performance) {
      await this.startTestServices();
    }

    console.log(chalk.green('✅ Test environment ready'));
  }

  async runTestSuitesParallel(testSuites) {
    console.log(chalk.yellow('🏃‍♂️ Running test suites in parallel...'));
    
    const promises = testSuites.map(suite => this.runTestSuite(suite));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const suite = testSuites[index];
      if (result.status === 'rejected') {
        console.error(chalk.red(`❌ ${suite.name} tests failed:`), result.reason);
        this.results[suite.name].status = 'failed';
      }
    });
  }

  async runTestSuitesSequential(testSuites) {
    console.log(chalk.yellow('🚶‍♂️ Running test suites sequentially...'));
    
    for (const suite of testSuites) {
      try {
        await this.runTestSuite(suite);
        
        if (this.options.failFast && this.results[suite.name].status === 'failed') {
          throw new Error(`Test suite ${suite.name} failed and fail-fast is enabled`);
        }
      } catch (error) {
        console.error(chalk.red(`❌ ${suite.name} tests failed:`), error.message);
        this.results[suite.name].status = 'failed';
        
        if (this.options.failFast) {
          throw error;
        }
      }
    }
  }

  async runTestSuite(suite) {
    const startTime = Date.now();
    console.log(chalk.blue(`\n🧪 Running ${suite.name} tests...`));
    
    try {
      this.results[suite.name].status = 'running';
      
      const result = await this.executeCommand(suite.command);
      const duration = Date.now() - startTime;
      
      // Parse test results
      const testMetrics = await this.parseTestResults(suite.name, result);
      
      this.results[suite.name] = {
        ...this.results[suite.name],
        status: 'passed',
        duration,
        ...testMetrics,
      };
      
      this.totalTests += testMetrics.totalTests || 0;
      this.passedTests += testMetrics.passedTests || 0;
      this.failedTests += testMetrics.failedTests || 0;
      
      console.log(chalk.green(`✅ ${suite.name} tests passed`), 
        chalk.gray(`(${this.formatDuration(duration)})`));
        
      if (testMetrics.coverage) {
        console.log(chalk.cyan(`   📊 Coverage: ${testMetrics.coverage}%`));
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results[suite.name] = {
        ...this.results[suite.name],
        status: 'failed',
        duration,
        error: error.message,
      };
      
      console.log(chalk.red(`❌ ${suite.name} tests failed`), 
        chalk.gray(`(${this.formatDuration(duration)})`));
      
      if (this.options.verbose) {
        console.log(chalk.red(error.message));
      }
      
      throw error;
    }
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      const process = spawn('sh', ['-c', command], {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let stdout = '';
      let stderr = '';

      if (!this.options.verbose) {
        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Command execution failed: ${error.message}`));
      });
    });
  }

  async parseTestResults(suiteName, result) {
    try {
      // Parse Jest/test output to extract metrics
      const output = result.stdout + result.stderr;
      
      let metrics = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        coverage: 0,
      };

      // Parse test counts
      const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (testMatch) {
        metrics.passedTests = parseInt(testMatch[1]);
        metrics.totalTests = parseInt(testMatch[2]);
        metrics.failedTests = metrics.totalTests - metrics.passedTests;
      }

      // Parse coverage
      const coverageMatch = output.match(/All files[^\n]*\|\s*(\d+(?:\.\d+)?)/);
      if (coverageMatch) {
        metrics.coverage = parseFloat(coverageMatch[1]);
      }

      // Suite-specific parsing
      switch (suiteName) {
        case 'performance':
          metrics = { ...metrics, ...this.parsePerformanceMetrics(output) };
          break;
        case 'security':
          metrics = { ...metrics, ...this.parseSecurityMetrics(output) };
          break;
        case 'e2e':
          metrics = { ...metrics, ...this.parseE2EMetrics(output) };
          break;
        case 'visual':
          metrics = { ...metrics, ...this.parseVisualMetrics(output) };
          break;
      }

      return metrics;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not parse ${suiteName} test results:`, error.message));
      return { totalTests: 0, passedTests: 0, failedTests: 0, coverage: 0 };
    }
  }

  parsePerformanceMetrics(output) {
    const responseTimeMatch = output.match(/Average Response Time:\s*(\d+(?:\.\d+)?)ms/);
    const throughputMatch = output.match(/Throughput:\s*(\d+(?:\.\d+)?)\s*RPS/);
    const errorRateMatch = output.match(/Error Rate:\s*(\d+(?:\.\d+)?)%/);

    return {
      averageResponseTime: responseTimeMatch ? parseFloat(responseTimeMatch[1]) : 0,
      throughput: throughputMatch ? parseFloat(throughputMatch[1]) : 0,
      errorRate: errorRateMatch ? parseFloat(errorRateMatch[1]) / 100 : 0,
    };
  }

  parseSecurityMetrics(output) {
    const vulnerabilitiesMatch = output.match(/(\d+)\s+vulnerabilities\s+found/);
    const criticalMatch = output.match(/(\d+)\s+critical/);
    const highMatch = output.match(/(\d+)\s+high/);

    return {
      totalVulnerabilities: vulnerabilitiesMatch ? parseInt(vulnerabilitiesMatch[1]) : 0,
      criticalVulnerabilities: criticalMatch ? parseInt(criticalMatch[1]) : 0,
      highVulnerabilities: highMatch ? parseInt(highMatch[1]) : 0,
    };
  }

  parseE2EMetrics(output) {
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);

    return {
      e2eTests: passedMatch ? parseInt(passedMatch[1]) : 0,
      e2eFailures: failedMatch ? parseInt(failedMatch[1]) : 0,
    };
  }

  parseVisualMetrics(output) {
    const regressionsMatch = output.match(/(\d+)\s+visual\s+regressions?/);

    return {
      visualRegressions: regressionsMatch ? parseInt(regressionsMatch[1]) : 0,
    };
  }

  async assessQualityGates() {
    console.log(chalk.yellow('\n🎯 Assessing quality gates...'));

    const gates = {
      backendCoverage: { threshold: 95, actual: this.results.backend.coverage, passed: false },
      frontendCoverage: { threshold: 90, actual: this.results.frontend.coverage, passed: false },
      mobileCoverage: { threshold: 85, actual: this.results.mobile.coverage, passed: false },
      contractCoverage: { threshold: 100, actual: this.results.contracts.coverage, passed: false },
      responseTime: { threshold: 200, actual: this.results.performance.averageResponseTime, passed: false },
      throughput: { threshold: 100, actual: this.results.performance.throughput, passed: false },
      errorRate: { threshold: 0.05, actual: this.results.performance.errorRate, passed: false },
      criticalVulnerabilities: { threshold: 0, actual: this.results.security.criticalVulnerabilities, passed: false },
      highVulnerabilities: { threshold: 0, actual: this.results.security.highVulnerabilities, passed: false },
    };

    let allPassed = true;

    // Assess each gate
    gates.backendCoverage.passed = gates.backendCoverage.actual >= gates.backendCoverage.threshold;
    gates.frontendCoverage.passed = gates.frontendCoverage.actual >= gates.frontendCoverage.threshold;
    gates.mobileCoverage.passed = gates.mobileCoverage.actual >= gates.mobileCoverage.threshold;
    gates.contractCoverage.passed = gates.contractCoverage.actual >= gates.contractCoverage.threshold;
    
    if (this.options.performance) {
      gates.responseTime.passed = gates.responseTime.actual <= gates.responseTime.threshold;
      gates.throughput.passed = gates.throughput.actual >= gates.throughput.threshold;
      gates.errorRate.passed = gates.errorRate.actual <= gates.errorRate.threshold;
    } else {
      gates.responseTime.passed = true;
      gates.throughput.passed = true;
      gates.errorRate.passed = true;
    }

    if (this.options.security) {
      gates.criticalVulnerabilities.passed = gates.criticalVulnerabilities.actual <= gates.criticalVulnerabilities.threshold;
      gates.highVulnerabilities.passed = gates.highVulnerabilities.actual <= gates.highVulnerabilities.threshold;
    } else {
      gates.criticalVulnerabilities.passed = true;
      gates.highVulnerabilities.passed = true;
    }

    // Check if all gates passed
    allPassed = Object.values(gates).every(gate => gate.passed);

    // Display gate results
    console.log(chalk.gray('─'.repeat(60)));
    Object.entries(gates).forEach(([name, gate]) => {
      const status = gate.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      const comparison = name.includes('Coverage') || name.includes('throughput') 
        ? `${gate.actual}% >= ${gate.threshold}%`
        : name.includes('Time')
        ? `${gate.actual}ms <= ${gate.threshold}ms`
        : name.includes('Rate')
        ? `${(gate.actual * 100).toFixed(2)}% <= ${gate.threshold * 100}%`
        : `${gate.actual} <= ${gate.threshold}`;
      
      console.log(`${status} ${name}: ${comparison}`);
    });

    return { passed: allPassed, gates };
  }

  async generateReport() {
    console.log(chalk.yellow('\n📊 Generating comprehensive test report...'));

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalTests: this.totalTests,
        passedTests: this.passedTests,
        failedTests: this.failedTests,
        successRate: this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(2) : 0,
      },
      coverage: {
        backend: this.results.backend.coverage,
        frontend: this.results.frontend.coverage,
        mobile: this.results.mobile.coverage,
        contracts: this.results.contracts.coverage,
        overall: this.calculateOverallCoverage(),
      },
      performance: {
        responseTime: this.results.performance.averageResponseTime || 'N/A',
        throughput: this.results.performance.throughput || 'N/A',
        errorRate: this.results.performance.errorRate || 'N/A',
      },
      security: {
        totalVulnerabilities: this.results.security.totalVulnerabilities || 0,
        criticalVulnerabilities: this.results.security.criticalVulnerabilities || 0,
        highVulnerabilities: this.results.security.highVulnerabilities || 0,
      },
      results: this.results,
    };

    // Write JSON report
    const jsonPath = path.join(this.options.outputDir, 'comprehensive-test-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(this.options.outputDir, 'comprehensive-test-report.md');
    await fs.writeFile(markdownPath, markdownReport);

    console.log(chalk.green(`✅ Reports generated:`));
    console.log(chalk.cyan(`   📄 JSON: ${jsonPath}`));
    console.log(chalk.cyan(`   📝 Markdown: ${markdownPath}`));
  }

  generateMarkdownReport(report) {
    const rating = this.calculateOverallRating(report);
    
    return `# Comprehensive Test Report

## Overall Rating: ${rating}

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Duration:** ${this.formatDuration(report.duration)}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.totalTests} |
| Passed Tests | ${report.summary.passedTests} |
| Failed Tests | ${report.summary.failedTests} |
| Success Rate | ${report.summary.successRate}% |

## Coverage Report

| Platform | Coverage | Target | Status |
|----------|----------|--------|--------|
| Backend API | ${report.coverage.backend}% | ≥95% | ${report.coverage.backend >= 95 ? '✅' : '❌'} |
| Frontend | ${report.coverage.frontend}% | ≥90% | ${report.coverage.frontend >= 90 ? '✅' : '❌'} |
| Mobile App | ${report.coverage.mobile}% | ≥85% | ${report.coverage.mobile >= 85 ? '✅' : '❌'} |
| Contracts | ${report.coverage.contracts}% | 100% | ${report.coverage.contracts >= 100 ? '✅' : '❌'} |
| **Overall** | **${report.coverage.overall}%** | **≥90%** | **${report.coverage.overall >= 90 ? '✅' : '❌'}** |

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Response Time | ${report.performance.responseTime}ms | ≤200ms | ${report.performance.responseTime <= 200 ? '✅' : '❌'} |
| Throughput | ${report.performance.throughput} RPS | ≥100 RPS | ${report.performance.throughput >= 100 ? '✅' : '❌'} |
| Error Rate | ${(report.performance.errorRate * 100).toFixed(2)}% | ≤5% | ${report.performance.errorRate <= 0.05 ? '✅' : '❌'} |

## Security Assessment

| Metric | Count | Target | Status |
|--------|-------|--------|--------|
| Total Vulnerabilities | ${report.security.totalVulnerabilities} | - | - |
| Critical | ${report.security.criticalVulnerabilities} | 0 | ${report.security.criticalVulnerabilities === 0 ? '✅' : '❌'} |
| High | ${report.security.highVulnerabilities} | 0 | ${report.security.highVulnerabilities === 0 ? '✅' : '❌'} |

## Test Suite Results

${Object.entries(report.results).map(([suite, result]) => `
### ${suite.charAt(0).toUpperCase() + suite.slice(1)}
- **Status:** ${result.status}
- **Duration:** ${this.formatDuration(result.duration)}
- **Coverage:** ${result.coverage}%
${result.error ? `- **Error:** ${result.error}` : ''}
`).join('')}

---
*Generated by UpCoach Comprehensive Test Suite*`;
  }

  calculateOverallCoverage() {
    const coverages = [
      this.results.backend.coverage || 0,
      this.results.frontend.coverage || 0,
      this.results.mobile.coverage || 0,
      this.results.contracts.coverage || 0,
    ].filter(c => c > 0);

    return coverages.length > 0 
      ? (coverages.reduce((sum, c) => sum + c, 0) / coverages.length).toFixed(2)
      : 0;
  }

  calculateOverallRating(report) {
    const coverage = parseFloat(report.coverage.overall);
    const hasSecurityIssues = report.security.criticalVulnerabilities > 0 || report.security.highVulnerabilities > 0;
    const performanceGood = report.performance.responseTime <= 200 && report.performance.errorRate <= 0.05;

    if (coverage >= 95 && !hasSecurityIssues && performanceGood) {
      return 'A+ 🏆';
    } else if (coverage >= 90 && !hasSecurityIssues) {
      return 'A 🥇';
    } else if (coverage >= 85) {
      return 'B+ 🥈';
    } else if (coverage >= 80) {
      return 'B 🥉';
    } else if (coverage >= 70) {
      return 'C+ ⚠️';
    } else if (coverage >= 60) {
      return 'C ⚠️';
    } else {
      return 'D ❌';
    }
  }

  displayFinalResults(qualityGateResult) {
    const totalDuration = Date.now() - this.startTime;
    
    console.log(chalk.gray('\n' + '═'.repeat(60)));
    console.log(chalk.bold.cyan('📊 COMPREHENSIVE TEST RESULTS'));
    console.log(chalk.gray('═'.repeat(60)));
    
    console.log(chalk.white(`Total Duration: ${this.formatDuration(totalDuration)}`));
    console.log(chalk.white(`Total Tests: ${this.totalTests}`));
    console.log(chalk.green(`Passed: ${this.passedTests}`));
    console.log(chalk.red(`Failed: ${this.failedTests}`));
    console.log(chalk.white(`Success Rate: ${this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(2) : 0}%`));
    
    console.log(chalk.gray('\n' + '─'.repeat(40)));
    console.log(chalk.bold.yellow('COVERAGE SUMMARY'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.white(`Backend: ${this.results.backend.coverage}%`));
    console.log(chalk.white(`Frontend: ${this.results.frontend.coverage}%`));
    console.log(chalk.white(`Mobile: ${this.results.mobile.coverage}%`));
    console.log(chalk.white(`Contracts: ${this.results.contracts.coverage}%`));
    console.log(chalk.cyan(`Overall: ${this.calculateOverallCoverage()}%`));
    
    if (this.options.performance) {
      console.log(chalk.gray('\n' + '─'.repeat(40)));
      console.log(chalk.bold.yellow('PERFORMANCE SUMMARY'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white(`Response Time: ${this.results.performance.averageResponseTime}ms`));
      console.log(chalk.white(`Throughput: ${this.results.performance.throughput} RPS`));
      console.log(chalk.white(`Error Rate: ${(this.results.performance.errorRate * 100).toFixed(2)}%`));
    }
    
    if (this.options.security) {
      console.log(chalk.gray('\n' + '─'.repeat(40)));
      console.log(chalk.bold.yellow('SECURITY SUMMARY'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white(`Total Vulnerabilities: ${this.results.security.totalVulnerabilities}`));
      console.log(chalk.white(`Critical: ${this.results.security.criticalVulnerabilities}`));
      console.log(chalk.white(`High: ${this.results.security.highVulnerabilities}`));
    }
    
    console.log(chalk.gray('\n' + '═'.repeat(60)));
    
    if (qualityGateResult.passed) {
      console.log(chalk.bold.green('🎉 QUALITY GATES PASSED - A+ RATING ACHIEVED!'));
      console.log(chalk.green('✅ Ready for production deployment'));
    } else {
      console.log(chalk.bold.red('❌ QUALITY GATES FAILED'));
      console.log(chalk.red('🚫 Not ready for production deployment'));
      console.log(chalk.yellow('📋 Review failed gates and improve test coverage'));
    }
    
    console.log(chalk.gray('═'.repeat(60)));
  }

  async ensureDirectoryExists(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async startTestServices() {
    console.log(chalk.yellow('🐳 Starting test services...'));
    // This would start Docker containers for integration tests
    // Implementation depends on your Docker setup
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--parallel':
        options.parallel = true;
        break;
      case '--no-coverage':
        options.coverage = false;
        break;
      case '--performance':
        options.performance = true;
        break;
      case '--security':
        options.security = true;
        break;
      case '--e2e':
        options.e2e = true;
        break;
      case '--visual':
        options.visual = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      case '--all':
        options.performance = true;
        options.security = true;
        options.e2e = true;
        options.visual = true;
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--help':
        console.log(`
UpCoach Comprehensive Test Runner

Usage: node run-comprehensive-tests.js [options]

Options:
  --parallel          Run test suites in parallel
  --no-coverage       Skip coverage collection
  --performance       Include performance tests
  --security          Include security tests  
  --e2e               Include end-to-end tests
  --visual            Include visual regression tests
  --all               Include all optional test types
  --verbose           Show detailed output
  --fail-fast         Stop on first failure
  --output <dir>      Output directory for reports
  --help              Show this help message

Examples:
  node run-comprehensive-tests.js --all --parallel
  node run-comprehensive-tests.js --security --performance --verbose
  node run-comprehensive-tests.js --e2e --output ./custom-results
        `);
        process.exit(0);
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const runner = new ComprehensiveTestRunner(options);
  runner.run().catch(console.error);
}

module.exports = ComprehensiveTestRunner;