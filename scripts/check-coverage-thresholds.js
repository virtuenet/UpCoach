#!/usr/bin/env node

/**
 * Coverage Threshold Checker
 * Validates test coverage across all platforms meets minimum requirements
 */

const fs = require('fs');
const path = require('path');
const lcovParse = require('lcov-parse');

// Coverage thresholds by platform
const THRESHOLDS = {
  backend: {
    lines: 95,
    branches: 90,
    functions: 95,
    statements: 95
  },
  frontend: {
    adminPanel: { lines: 90, branches: 85, functions: 90, statements: 90 },
    cmsPanel: { lines: 90, branches: 85, functions: 90, statements: 90 },
    landingPage: { lines: 95, branches: 90, functions: 95, statements: 95 }
  },
  mobile: {
    lines: 85,
    branches: 80,
    functions: 85,
    statements: 85
  }
};

class CoverageChecker {
  constructor() {
    this.failures = [];
    this.results = {};
  }

  async checkAllCoverage() {
    console.log('🔍 Checking coverage thresholds across all platforms...\n');

    // Check backend coverage
    await this.checkBackendCoverage();
    
    // Check frontend coverage
    await this.checkFrontendCoverage();
    
    // Check mobile coverage
    await this.checkMobileCoverage();

    // Generate report
    this.generateReport();

    // Exit with appropriate code
    if (this.failures.length > 0) {
      console.error(`\n❌ Coverage check failed with ${this.failures.length} violations`);
      this.writeFailuresFile();
      process.exit(1);
    } else {
      console.log('\n✅ All coverage thresholds met!');
      process.exit(0);
    }
  }

  async checkBackendCoverage() {
    const coveragePath = 'backend-coverage/coverage-summary.json';
    
    if (!fs.existsSync(coveragePath)) {
      this.failures.push('Backend coverage file not found');
      return;
    }

    try {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverageData.total;
      
      this.results.backend = {
        lines: total.lines.pct,
        branches: total.branches.pct,
        functions: total.functions.pct,
        statements: total.statements.pct
      };

      console.log('📊 Backend Coverage:');
      console.log(`  Lines: ${total.lines.pct}% (threshold: ${THRESHOLDS.backend.lines}%)`);
      console.log(`  Branches: ${total.branches.pct}% (threshold: ${THRESHOLDS.backend.branches}%)`);
      console.log(`  Functions: ${total.functions.pct}% (threshold: ${THRESHOLDS.backend.functions}%)`);
      console.log(`  Statements: ${total.statements.pct}% (threshold: ${THRESHOLDS.backend.statements}%)`);

      // Check thresholds
      Object.keys(THRESHOLDS.backend).forEach(metric => {
        if (total[metric].pct < THRESHOLDS.backend[metric]) {
          this.failures.push(
            `Backend ${metric} coverage ${total[metric].pct}% < ${THRESHOLDS.backend[metric]}%`
          );
        }
      });

      console.log(this.failures.filter(f => f.includes('Backend')).length === 0 ? '  ✅ Backend thresholds met' : '  ❌ Backend thresholds failed');
    } catch (error) {
      this.failures.push(`Failed to parse backend coverage: ${error.message}`);
    }

    console.log();
  }

  async checkFrontendCoverage() {
    const apps = ['admin-panel', 'cms-panel', 'landing-page'];
    
    for (const app of apps) {
      const coveragePath = `frontend-${app}-coverage/coverage-summary.json`;
      const appKey = app.replace('-', '').replace('panel', 'Panel').replace('page', 'Page');
      
      if (!fs.existsSync(coveragePath)) {
        this.failures.push(`${app} coverage file not found`);
        continue;
      }

      try {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const total = coverageData.total;
        
        this.results[app] = {
          lines: total.lines.pct,
          branches: total.branches.pct,
          functions: total.functions.pct,
          statements: total.statements.pct
        };

        console.log(`📊 ${app.toUpperCase()} Coverage:`);
        console.log(`  Lines: ${total.lines.pct}% (threshold: ${THRESHOLDS.frontend[appKey].lines}%)`);
        console.log(`  Branches: ${total.branches.pct}% (threshold: ${THRESHOLDS.frontend[appKey].branches}%)`);
        console.log(`  Functions: ${total.functions.pct}% (threshold: ${THRESHOLDS.frontend[appKey].functions}%)`);
        console.log(`  Statements: ${total.statements.pct}% (threshold: ${THRESHOLDS.frontend[appKey].statements}%)`);

        // Check thresholds
        Object.keys(THRESHOLDS.frontend[appKey]).forEach(metric => {
          if (total[metric].pct < THRESHOLDS.frontend[appKey][metric]) {
            this.failures.push(
              `${app} ${metric} coverage ${total[metric].pct}% < ${THRESHOLDS.frontend[appKey][metric]}%`
            );
          }
        });

        console.log(this.failures.filter(f => f.includes(app)).length === 0 ? `  ✅ ${app} thresholds met` : `  ❌ ${app} thresholds failed`);
      } catch (error) {
        this.failures.push(`Failed to parse ${app} coverage: ${error.message}`);
      }

      console.log();
    }
  }

  async checkMobileCoverage() {
    const coveragePath = 'mobile-coverage/lcov.info';
    
    if (!fs.existsSync(coveragePath)) {
      this.failures.push('Mobile coverage file not found');
      return;
    }

    try {
      const lcovData = await this.parseLcov(coveragePath);
      const total = this.calculateTotalCoverage(lcovData);
      
      this.results.mobile = total;

      console.log('📊 Mobile App Coverage:');
      console.log(`  Lines: ${total.lines.toFixed(1)}% (threshold: ${THRESHOLDS.mobile.lines}%)`);
      console.log(`  Branches: ${total.branches.toFixed(1)}% (threshold: ${THRESHOLDS.mobile.branches}%)`);
      console.log(`  Functions: ${total.functions.toFixed(1)}% (threshold: ${THRESHOLDS.mobile.functions}%)`);

      // Check thresholds
      if (total.lines < THRESHOLDS.mobile.lines) {
        this.failures.push(`Mobile lines coverage ${total.lines.toFixed(1)}% < ${THRESHOLDS.mobile.lines}%`);
      }
      if (total.branches < THRESHOLDS.mobile.branches) {
        this.failures.push(`Mobile branches coverage ${total.branches.toFixed(1)}% < ${THRESHOLDS.mobile.branches}%`);
      }
      if (total.functions < THRESHOLDS.mobile.functions) {
        this.failures.push(`Mobile functions coverage ${total.functions.toFixed(1)}% < ${THRESHOLDS.mobile.functions}%`);
      }

      console.log(this.failures.filter(f => f.includes('Mobile')).length === 0 ? '  ✅ Mobile thresholds met' : '  ❌ Mobile thresholds failed');
    } catch (error) {
      this.failures.push(`Failed to parse mobile coverage: ${error.message}`);
    }

    console.log();
  }

  async parseLcov(filePath) {
    return new Promise((resolve, reject) => {
      lcovParse(filePath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  calculateTotalCoverage(lcovData) {
    let totalLines = 0;
    let coveredLines = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;

    lcovData.forEach(file => {
      // Lines coverage
      if (file.lines && file.lines.details) {
        totalLines += file.lines.found || 0;
        coveredLines += file.lines.hit || 0;
      }

      // Branches coverage
      if (file.branches && file.branches.details) {
        totalBranches += file.branches.found || 0;
        coveredBranches += file.branches.hit || 0;
      }

      // Functions coverage
      if (file.functions && file.functions.details) {
        totalFunctions += file.functions.found || 0;
        coveredFunctions += file.functions.hit || 0;
      }
    });

    return {
      lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
    };
  }

  generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      thresholds: THRESHOLDS,
      results: this.results,
      failures: this.failures,
      status: this.failures.length === 0 ? 'PASSED' : 'FAILED'
    };

    // Write detailed report
    fs.writeFileSync('coverage-report.json', JSON.stringify(reportData, null, 2));

    // Write summary report
    const summary = this.generateSummaryReport(reportData);
    fs.writeFileSync('coverage-summary.md', summary);
  }

  generateSummaryReport(data) {
    let summary = '# Coverage Report Summary\n\n';
    summary += `**Status:** ${data.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}\n`;
    summary += `**Generated:** ${new Date(data.timestamp).toLocaleString()}\n\n`;

    // Overall results table
    summary += '## Coverage Results\n\n';
    summary += '| Platform | Lines | Branches | Functions | Status |\n';
    summary += '|----------|-------|----------|-----------|--------|\n';

    if (data.results.backend) {
      const status = this.failures.filter(f => f.includes('Backend')).length === 0 ? '✅' : '❌';
      summary += `| Backend API | ${data.results.backend.lines.toFixed(1)}% | ${data.results.backend.branches.toFixed(1)}% | ${data.results.backend.functions.toFixed(1)}% | ${status} |\n`;
    }

    Object.keys(data.results).forEach(key => {
      if (key.includes('-')) {
        const status = this.failures.filter(f => f.includes(key)).length === 0 ? '✅' : '❌';
        const result = data.results[key];
        summary += `| ${key} | ${result.lines.toFixed(1)}% | ${result.branches.toFixed(1)}% | ${result.functions.toFixed(1)}% | ${status} |\n`;
      }
    });

    if (data.results.mobile) {
      const status = this.failures.filter(f => f.includes('Mobile')).length === 0 ? '✅' : '❌';
      summary += `| Mobile App | ${data.results.mobile.lines.toFixed(1)}% | ${data.results.mobile.branches.toFixed(1)}% | ${data.results.mobile.functions.toFixed(1)}% | ${status} |\n`;
    }

    // Failures section
    if (data.failures.length > 0) {
      summary += '\n## Failures\n\n';
      data.failures.forEach(failure => {
        summary += `- ❌ ${failure}\n`;
      });
    }

    // Recommendations
    if (data.failures.length > 0) {
      summary += '\n## Recommendations\n\n';
      summary += '1. Focus on increasing test coverage for failing platforms\n';
      summary += '2. Review uncovered code paths and add appropriate tests\n';
      summary += '3. Consider breaking down complex functions for better testability\n';
      summary += '4. Ensure critical business logic has comprehensive test coverage\n';
    }

    return summary;
  }

  writeFailuresFile() {
    fs.writeFileSync('quality-gate-failures.txt', this.failures.join('\n'));
  }
}

// Run the coverage check
const checker = new CoverageChecker();
checker.checkAllCoverage().catch(error => {
  console.error('Coverage check failed:', error);
  process.exit(1);
});