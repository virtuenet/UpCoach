#!/usr/bin/env node

/**
 * Badge Generator for Test Coverage and Status
 * 
 * Generates SVG badges for README files showing test status,
 * coverage percentages, and build status.
 */

const fs = require('fs');
const path = require('path');

class BadgeGenerator {
  constructor() {
    this.badges = [];
  }

  /**
   * Generate a badge SVG
   */
  generateBadge(label, value, color) {
    const labelWidth = label.length * 7 + 10;
    const valueWidth = value.toString().length * 7 + 10;
    const totalWidth = labelWidth + valueWidth;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth/2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth/2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth/2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth/2}" y="14">${value}</text>
  </g>
</svg>`;
  }

  /**
   * Get color based on percentage
   */
  getColorForPercentage(percentage) {
    if (percentage >= 80) return '#4c1';  // Green
    if (percentage >= 60) return '#dfb317'; // Yellow
    if (percentage >= 40) return '#fe7d37'; // Orange
    return '#e05d44'; // Red
  }

  /**
   * Get color for test status
   */
  getColorForStatus(passed, failed) {
    if (failed === 0) return '#4c1'; // Green
    if (failed <= 5) return '#dfb317'; // Yellow
    return '#e05d44'; // Red
  }

  /**
   * Generate coverage badges
   */
  generateCoverageBadges() {
    console.log('📊 Generating coverage badges...');

    // Try to load coverage data
    const coverageFiles = [
      {
        path: path.join(__dirname, '../landing-page/coverage/coverage-summary.json'),
        prefix: 'landing'
      },
      {
        path: path.join(__dirname, '../backend/coverage/coverage-summary.json'),
        prefix: 'backend'
      }
    ];

    coverageFiles.forEach(({ path: coveragePath, prefix }) => {
      if (fs.existsSync(coveragePath)) {
        try {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          const total = coverage.total;

          // Generate badges for each metric
          ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
            const percentage = Math.round(total[metric].pct);
            const color = this.getColorForPercentage(percentage);
            const badge = this.generateBadge(
              `${prefix} ${metric}`,
              `${percentage}%`,
              color
            );

            const badgePath = path.join(
              __dirname,
              `../badges/${prefix}-${metric}-coverage.svg`
            );
            this.saveBadge(badgePath, badge);
          });
        } catch (error) {
          console.error(`Error processing ${prefix} coverage:`, error.message);
        }
      }
    });
  }

  /**
   * Generate test status badges
   */
  generateTestBadges() {
    console.log('✅ Generating test status badges...');

    // Try to load test results
    const testFiles = [
      {
        path: path.join(__dirname, '../landing-page/test-results.json'),
        name: 'landing-tests'
      },
      {
        path: path.join(__dirname, '../backend/test-results.json'),
        name: 'backend-tests'
      }
    ];

    testFiles.forEach(({ path: testPath, name }) => {
      if (fs.existsSync(testPath)) {
        try {
          const results = JSON.parse(fs.readFileSync(testPath, 'utf8'));
          const passed = results.numPassedTests || 0;
          const failed = results.numFailedTests || 0;
          const total = results.numTotalTests || 0;

          const status = failed === 0 ? 'passing' : 'failing';
          const color = this.getColorForStatus(passed, failed);
          const badge = this.generateBadge(name, status, color);

          const badgePath = path.join(
            __dirname,
            `../badges/${name}-status.svg`
          );
          this.saveBadge(badgePath, badge);

          // Also generate a test count badge
          const countBadge = this.generateBadge(
            `${name} count`,
            `${passed}/${total}`,
            color
          );
          const countPath = path.join(
            __dirname,
            `../badges/${name}-count.svg`
          );
          this.saveBadge(countPath, countBadge);
        } catch (error) {
          console.error(`Error processing ${name}:`, error.message);
        }
      }
    });
  }

  /**
   * Generate build status badge
   */
  generateBuildBadge(status = 'passing') {
    console.log('🏗️  Generating build badge...');

    const color = status === 'passing' ? '#4c1' : '#e05d44';
    const badge = this.generateBadge('build', status, color);

    const badgePath = path.join(__dirname, '../badges/build-status.svg');
    this.saveBadge(badgePath, badge);
  }

  /**
   * Generate performance badges
   */
  generatePerformanceBadges() {
    console.log('⚡ Generating performance badges...');

    const perfFiles = [
      {
        path: path.join(__dirname, '../landing-page/performance-results.json'),
        metrics: {
          'hero-render': { key: 'hero', threshold: 100, unit: 'ms' },
          'page-load': { key: 'fullPageLoad', threshold: 3000, unit: 's', divisor: 1000 }
        }
      },
      {
        path: path.join(__dirname, '../backend/performance-results.json'),
        metrics: {
          'ai-response': { key: 'aiResponse', threshold: 2000, unit: 's', divisor: 1000 }
        }
      }
    ];

    perfFiles.forEach(({ path: perfPath, metrics }) => {
      if (fs.existsSync(perfPath)) {
        try {
          const results = JSON.parse(fs.readFileSync(perfPath, 'utf8'));

          Object.entries(metrics).forEach(([name, config]) => {
            const value = results[config.key];
            if (value !== undefined) {
              let displayValue = value;
              if (config.divisor) {
                displayValue = (value / config.divisor).toFixed(1);
              } else {
                displayValue = Math.round(value);
              }

              const percentage = (value / config.threshold) * 100;
              const color = this.getColorForPercentage(100 - percentage);
              const badge = this.generateBadge(
                name,
                `${displayValue}${config.unit}`,
                color
              );

              const badgePath = path.join(
                __dirname,
                `../badges/${name}-performance.svg`
              );
              this.saveBadge(badgePath, badge);
            }
          });
        } catch (error) {
          console.error('Error processing performance data:', error.message);
        }
      }
    });
  }

  /**
   * Save badge to file
   */
  saveBadge(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    this.badges.push(path.basename(filePath));
  }

  /**
   * Generate README with badges
   */
  generateBadgeMarkdown() {
    console.log('📝 Generating badge markdown...');

    const markdown = `# Test Status and Coverage Badges

## Build Status
![Build Status](./badges/build-status.svg)

## Test Status
![Landing Tests](./badges/landing-tests-status.svg)
![Landing Test Count](./badges/landing-tests-count.svg)
![Backend Tests](./badges/backend-tests-status.svg)
![Backend Test Count](./badges/backend-tests-count.svg)

## Coverage
### Landing Page
![Lines Coverage](./badges/landing-lines-coverage.svg)
![Branches Coverage](./badges/landing-branches-coverage.svg)
![Functions Coverage](./badges/landing-functions-coverage.svg)
![Statements Coverage](./badges/landing-statements-coverage.svg)

### Backend
![Lines Coverage](./badges/backend-lines-coverage.svg)
![Branches Coverage](./badges/backend-branches-coverage.svg)
![Functions Coverage](./badges/backend-functions-coverage.svg)
![Statements Coverage](./badges/backend-statements-coverage.svg)

## Performance
![Hero Render Time](./badges/hero-render-performance.svg)
![Page Load Time](./badges/page-load-performance.svg)
![AI Response Time](./badges/ai-response-performance.svg)

---

*Badges are automatically generated by the test suite*
`;

    const readmePath = path.join(__dirname, '../badges/README.md');
    fs.writeFileSync(readmePath, markdown);
  }

  /**
   * Generate badge URLs for CI/CD
   */
  generateBadgeUrls() {
    const baseUrl = process.env.BADGE_BASE_URL || 'https://github.com/USERNAME/REPO/raw/main';
    const urls = {};

    this.badges.forEach(badge => {
      const name = badge.replace('.svg', '').replace(/-/g, '_');
      urls[name] = `${baseUrl}/badges/${badge}`;
    });

    const urlsPath = path.join(__dirname, '../badges/urls.json');
    fs.writeFileSync(urlsPath, JSON.stringify(urls, null, 2));
  }
}

// Main execution
function main() {
  const generator = new BadgeGenerator();

  try {
    // Generate all badges
    generator.generateCoverageBadges();
    generator.generateTestBadges();
    generator.generateBuildBadge(process.env.BUILD_STATUS || 'passing');
    generator.generatePerformanceBadges();

    // Generate documentation
    generator.generateBadgeMarkdown();
    generator.generateBadgeUrls();

    console.log(`\n✅ Generated ${generator.badges.length} badges successfully!`);
    console.log('📁 Badges saved to: badges/');

  } catch (error) {
    console.error('❌ Error generating badges:', error);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  main();
}

module.exports = BadgeGenerator;