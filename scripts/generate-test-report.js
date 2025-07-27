#!/usr/bin/env node

/**
 * Test Report Generator
 * 
 * Generates a comprehensive HTML dashboard with test results,
 * coverage metrics, and performance trends.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestReportGenerator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      landingPage: {
        unit: { total: 0, passed: 0, failed: 0, skipped: 0 },
        scenarios: { total: 0, passed: 0, failed: 0, skipped: 0 },
        performance: { total: 0, passed: 0, failed: 0, skipped: 0 },
        coverage: { lines: 0, branches: 0, functions: 0, statements: 0 }
      },
      backend: {
        unit: { total: 0, passed: 0, failed: 0, skipped: 0 },
        integration: { total: 0, passed: 0, failed: 0, skipped: 0 },
        scenarios: { total: 0, passed: 0, failed: 0, skipped: 0 },
        performance: { total: 0, passed: 0, failed: 0, skipped: 0 },
        coverage: { lines: 0, branches: 0, functions: 0, statements: 0 }
      },
      performance: {
        landingPage: {},
        aiServices: {}
      }
    };
  }

  /**
   * Collect test results from all sources
   */
  async collectResults() {
    console.log('📊 Collecting test results...\n');

    // Landing Page Tests
    await this.runLandingPageTests();
    
    // Backend Tests
    await this.runBackendTests();
    
    // Performance Results
    this.collectPerformanceResults();
    
    // Coverage Reports
    this.collectCoverageReports();
  }

  /**
   * Run landing page tests and collect results
   */
  async runLandingPageTests() {
    console.log('🌐 Running Landing Page tests...');
    
    try {
      const testOutput = execSync(
        'cd landing-page && npm test -- --json --outputFile=test-results.json',
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const results = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../landing-page/test-results.json'), 'utf8')
      );
      
      // Parse test results
      this.parseJestResults(results, 'landingPage');
      
    } catch (error) {
      console.error('❌ Landing page tests failed:', error.message);
    }
  }

  /**
   * Run backend tests and collect results
   */
  async runBackendTests() {
    console.log('🤖 Running Backend tests...');
    
    try {
      const testOutput = execSync(
        'cd backend && npm test -- --json --outputFile=test-results.json',
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const results = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../backend/test-results.json'), 'utf8')
      );
      
      // Parse test results
      this.parseJestResults(results, 'backend');
      
    } catch (error) {
      console.error('❌ Backend tests failed:', error.message);
    }
  }

  /**
   * Parse Jest test results
   */
  parseJestResults(results, category) {
    const testResults = results.testResults || [];
    
    testResults.forEach(testFile => {
      const fileName = path.basename(testFile.name);
      let testType = 'unit';
      
      if (fileName.includes('scenario') || fileName.includes('Scenario')) {
        testType = 'scenarios';
      } else if (fileName.includes('integration') || fileName.includes('Integration')) {
        testType = 'integration';
      } else if (fileName.includes('performance') || fileName.includes('Performance')) {
        testType = 'performance';
      }
      
      this.results[category][testType].total += testFile.numTotalTests;
      this.results[category][testType].passed += testFile.numPassingTests;
      this.results[category][testType].failed += testFile.numFailingTests;
      this.results[category][testType].skipped += testFile.numPendingTests;
    });
  }

  /**
   * Collect performance test results
   */
  collectPerformanceResults() {
    console.log('⚡ Collecting performance results...');
    
    // Landing page performance
    const landingPerfPath = path.join(__dirname, '../landing-page/performance-results.json');
    if (fs.existsSync(landingPerfPath)) {
      this.results.performance.landingPage = JSON.parse(
        fs.readFileSync(landingPerfPath, 'utf8')
      );
    }
    
    // Backend performance
    const backendPerfPath = path.join(__dirname, '../backend/performance-results.json');
    if (fs.existsSync(backendPerfPath)) {
      this.results.performance.aiServices = JSON.parse(
        fs.readFileSync(backendPerfPath, 'utf8')
      );
    }
  }

  /**
   * Collect coverage reports
   */
  collectCoverageReports() {
    console.log('📈 Collecting coverage reports...');
    
    // Landing page coverage
    const landingCoveragePath = path.join(__dirname, '../landing-page/coverage/coverage-summary.json');
    if (fs.existsSync(landingCoveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(landingCoveragePath, 'utf8'));
      this.results.landingPage.coverage = {
        lines: coverage.total.lines.pct,
        branches: coverage.total.branches.pct,
        functions: coverage.total.functions.pct,
        statements: coverage.total.statements.pct
      };
    }
    
    // Backend coverage
    const backendCoveragePath = path.join(__dirname, '../backend/coverage/coverage-summary.json');
    if (fs.existsSync(backendCoveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(backendCoveragePath, 'utf8'));
      this.results.backend.coverage = {
        lines: coverage.total.lines.pct,
        branches: coverage.total.branches.pct,
        functions: coverage.total.functions.pct,
        statements: coverage.total.statements.pct
      };
    }
  }

  /**
   * Generate HTML dashboard
   */
  generateHTMLReport() {
    console.log('\n📝 Generating HTML report...');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UpCoach Test Report - ${new Date().toLocaleDateString()}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 0;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .timestamp {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .card h2 {
            font-size: 1.5rem;
            color: #4a5568;
        }
        
        .status-icon {
            font-size: 2rem;
        }
        
        .metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .metric {
            text-align: center;
            padding: 15px;
            background: #f7fafc;
            border-radius: 8px;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #4a5568;
        }
        
        .metric-label {
            font-size: 0.9rem;
            color: #718096;
            text-transform: uppercase;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .progress {
            height: 100%;
            background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
            transition: width 0.3s ease;
        }
        
        .coverage-section {
            margin-top: 40px;
        }
        
        .coverage-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .coverage-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .coverage-percentage {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .good { color: #48bb78; }
        .warning { color: #ed8936; }
        .danger { color: #e53e3e; }
        
        .performance-section {
            margin-top: 40px;
        }
        
        .perf-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .perf-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .perf-name {
            font-weight: 500;
            color: #4a5568;
        }
        
        .perf-value {
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .footer {
            text-align: center;
            margin-top: 60px;
            padding: 20px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
        }
        
        .test-details {
            background: #f7fafc;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .test-breakdown {
            display: flex;
            justify-content: space-around;
            margin-top: 10px;
        }
        
        .breakdown-item {
            text-align: center;
        }
        
        .breakdown-value {
            font-size: 1.5rem;
            font-weight: bold;
            display: block;
        }
        
        .breakdown-label {
            font-size: 0.85rem;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 UpCoach Test Report</h1>
            <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
        </header>
        
        <div class="summary-grid">
            ${this.generateTestSummaryCards()}
        </div>
        
        <div class="coverage-section">
            <h2 style="color: #4a5568; margin-bottom: 20px;">📊 Code Coverage</h2>
            <div class="coverage-grid">
                ${this.generateCoverageCards()}
            </div>
        </div>
        
        <div class="performance-section">
            <h2 style="color: #4a5568; margin-bottom: 20px;">⚡ Performance Metrics</h2>
            <div class="perf-grid">
                ${this.generatePerformanceCards()}
            </div>
        </div>
        
        <footer class="footer">
            <p>Test report generated automatically by UpCoach CI/CD pipeline</p>
            <p>For detailed results, check the console output or CI logs</p>
        </footer>
    </div>
    
    <script>
        // Animate progress bars on load
        window.addEventListener('load', () => {
            const progressBars = document.querySelectorAll('.progress');
            progressBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        });
    </script>
</body>
</html>`;

    const reportPath = path.join(__dirname, '../test-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`✅ HTML report generated: ${reportPath}`);
  }

  /**
   * Generate test summary cards HTML
   */
  generateTestSummaryCards() {
    const categories = [
      {
        title: 'Landing Page Tests',
        icon: '🌐',
        data: this.results.landingPage
      },
      {
        title: 'Backend Tests',
        icon: '🤖',
        data: this.results.backend
      }
    ];
    
    return categories.map(cat => {
      const total = cat.data.unit.total + cat.data.scenarios.total + 
                   (cat.data.integration?.total || 0) + cat.data.performance.total;
      const passed = cat.data.unit.passed + cat.data.scenarios.passed + 
                    (cat.data.integration?.passed || 0) + cat.data.performance.passed;
      const failed = cat.data.unit.failed + cat.data.scenarios.failed + 
                    (cat.data.integration?.failed || 0) + cat.data.performance.failed;
      const passRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
      
      const statusIcon = failed === 0 ? '✅' : '❌';
      
      return `
        <div class="card">
            <div class="card-header">
                <h2>${cat.icon} ${cat.title}</h2>
                <span class="status-icon">${statusIcon}</span>
            </div>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${total}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric">
                    <div class="metric-value ${failed === 0 ? 'good' : 'danger'}">${passRate}%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width: ${passRate}%"></div>
            </div>
            <div class="test-details">
                <div class="test-breakdown">
                    <div class="breakdown-item">
                        <span class="breakdown-value good">${passed}</span>
                        <span class="breakdown-label">Passed</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-value danger">${failed}</span>
                        <span class="breakdown-label">Failed</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-value warning">${cat.data.unit.skipped + cat.data.scenarios.skipped}</span>
                        <span class="breakdown-label">Skipped</span>
                    </div>
                </div>
            </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Generate coverage cards HTML
   */
  generateCoverageCards() {
    const coverageData = [
      { label: 'Lines', landing: this.results.landingPage.coverage.lines, backend: this.results.backend.coverage.lines },
      { label: 'Branches', landing: this.results.landingPage.coverage.branches, backend: this.results.backend.coverage.branches },
      { label: 'Functions', landing: this.results.landingPage.coverage.functions, backend: this.results.backend.coverage.functions },
      { label: 'Statements', landing: this.results.landingPage.coverage.statements, backend: this.results.backend.coverage.statements }
    ];
    
    return coverageData.map(item => {
      const avg = ((item.landing + item.backend) / 2).toFixed(1);
      const colorClass = avg >= 80 ? 'good' : avg >= 60 ? 'warning' : 'danger';
      
      return `
        <div class="coverage-item">
            <h3 style="color: #4a5568; margin-bottom: 10px;">${item.label}</h3>
            <div class="coverage-percentage ${colorClass}">${avg}%</div>
            <div style="font-size: 0.85rem; color: #718096;">
                Landing: ${item.landing.toFixed(1)}%<br>
                Backend: ${item.backend.toFixed(1)}%
            </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Generate performance cards HTML
   */
  generatePerformanceCards() {
    const perfMetrics = [];
    
    // Landing page metrics
    Object.entries(this.results.performance.landingPage).forEach(([key, value]) => {
      if (typeof value === 'number') {
        perfMetrics.push({
          name: `Landing/${key}`,
          value: value.toFixed(2) + 'ms',
          colorClass: this.getPerformanceColor(key, value, 'landing')
        });
      }
    });
    
    // AI service metrics
    Object.entries(this.results.performance.aiServices).forEach(([key, value]) => {
      if (typeof value === 'number') {
        perfMetrics.push({
          name: `AI/${key}`,
          value: value.toFixed(2) + 'ms',
          colorClass: this.getPerformanceColor(key, value, 'ai')
        });
      }
    });
    
    return perfMetrics.map(metric => `
      <div class="perf-item">
        <span class="perf-name">${metric.name}</span>
        <span class="perf-value ${metric.colorClass}">${metric.value}</span>
      </div>
    `).join('');
  }

  /**
   * Get color class based on performance
   */
  getPerformanceColor(metric, value, type) {
    const thresholds = {
      landing: {
        hero: 100,
        features: 150,
        pricing: 150,
        leadForm: 50
      },
      ai: {
        aiResponse: 2000,
        profileCreation: 500,
        recommendations: 1000
      }
    };
    
    const threshold = thresholds[type]?.[metric];
    if (!threshold) return '';
    
    const percentage = (value / threshold) * 100;
    if (percentage <= 80) return 'good';
    if (percentage <= 95) return 'warning';
    return 'danger';
  }

  /**
   * Generate JSON report for CI/CD
   */
  generateJSONReport() {
    const reportPath = path.join(__dirname, '../test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`✅ JSON report generated: ${reportPath}`);
  }

  /**
   * Generate markdown summary
   */
  generateMarkdownSummary() {
    const totalTests = 
      this.results.landingPage.unit.total + this.results.landingPage.scenarios.total +
      this.results.landingPage.performance.total + this.results.backend.unit.total +
      this.results.backend.scenarios.total + this.results.backend.performance.total +
      (this.results.backend.integration?.total || 0);
      
    const totalPassed = 
      this.results.landingPage.unit.passed + this.results.landingPage.scenarios.passed +
      this.results.landingPage.performance.passed + this.results.backend.unit.passed +
      this.results.backend.scenarios.passed + this.results.backend.performance.passed +
      (this.results.backend.integration?.passed || 0);
      
    const passRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
    
    const markdown = `# Test Report Summary

Generated: ${new Date().toLocaleString()}

## Overall Results
- **Total Tests**: ${totalTests}
- **Passed**: ${totalPassed}
- **Pass Rate**: ${passRate}%

## Coverage
- **Landing Page**: ${this.results.landingPage.coverage.lines.toFixed(1)}% lines covered
- **Backend**: ${this.results.backend.coverage.lines.toFixed(1)}% lines covered

## Performance Highlights
${this.generatePerformanceSummary()}

View full report: [test-report.html](test-report.html)
`;

    const summaryPath = path.join(__dirname, '../test-summary.md');
    fs.writeFileSync(summaryPath, markdown);
    console.log(`✅ Markdown summary generated: ${summaryPath}`);
  }

  /**
   * Generate performance summary for markdown
   */
  generatePerformanceSummary() {
    const highlights = [];
    
    if (this.results.performance.landingPage.hero) {
      highlights.push(`- Hero render: ${this.results.performance.landingPage.hero.toFixed(2)}ms`);
    }
    if (this.results.performance.landingPage.fullPageLoad) {
      highlights.push(`- Full page load: ${this.results.performance.landingPage.fullPageLoad.toFixed(2)}ms`);
    }
    if (this.results.performance.aiServices.aiResponse) {
      highlights.push(`- AI response: ${this.results.performance.aiServices.aiResponse.toFixed(2)}ms`);
    }
    
    return highlights.join('\n');
  }
}

// Main execution
async function main() {
  const generator = new TestReportGenerator();
  
  try {
    // Collect all test results
    await generator.collectResults();
    
    // Generate reports
    generator.generateHTMLReport();
    generator.generateJSONReport();
    generator.generateMarkdownSummary();
    
    console.log('\n✅ Test report generation complete!');
    console.log('📄 View the report: test-report.html');
    
  } catch (error) {
    console.error('❌ Error generating test report:', error);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  main();
}

module.exports = TestReportGenerator;