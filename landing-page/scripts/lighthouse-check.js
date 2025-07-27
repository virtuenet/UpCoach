const { execSync } = require('child_process');
const chalk = require('chalk');

// Function to run Lighthouse
function runLighthouse(url) {
  console.log(chalk.blue('🚀 Running Lighthouse performance audit...'));
  
  try {
    const result = execSync(
      `npx lighthouse ${url} --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo`,
      { encoding: 'utf-8' }
    );
    
    const report = require('../lighthouse-report.json');
    const scores = {
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      bestPractices: Math.round(report.categories['best-practices'].score * 100),
      seo: Math.round(report.categories.seo.score * 100),
    };
    
    console.log('\n📊 Lighthouse Scores:');
    console.log('═══════════════════════════════════');
    
    Object.entries(scores).forEach(([category, score]) => {
      const color = score >= 90 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
      const emoji = score >= 90 ? '✅' : score >= 50 ? '⚠️' : '❌';
      console.log(`${emoji} ${category.padEnd(15)}: ${color(score + '/100')}`);
    });
    
    console.log('═══════════════════════════════════\n');
    
    // Performance metrics
    if (report.audits) {
      console.log('⏱️  Performance Metrics:');
      console.log('───────────────────────────────────');
      
      const metrics = {
        'First Contentful Paint': report.audits['first-contentful-paint'],
        'Largest Contentful Paint': report.audits['largest-contentful-paint'],
        'Total Blocking Time': report.audits['total-blocking-time'],
        'Cumulative Layout Shift': report.audits['cumulative-layout-shift'],
        'Speed Index': report.audits['speed-index'],
      };
      
      Object.entries(metrics).forEach(([name, audit]) => {
        if (audit && audit.displayValue) {
          const score = Math.round(audit.score * 100);
          const color = score >= 90 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
          console.log(`${name.padEnd(25)}: ${color(audit.displayValue)}`);
        }
      });
    }
    
    return scores;
  } catch (error) {
    console.error(chalk.red('❌ Error running Lighthouse:'), error.message);
    return null;
  }
}

// Check if URL is provided
const url = process.argv[2] || 'http://localhost:3000';

console.log(chalk.cyan(`\n🔍 Auditing: ${url}\n`));
runLighthouse(url);