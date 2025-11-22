#!/usr/bin/env node

// run-clerk-tests.js
// Script to run Clerk authentication tests

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 UpCoach Clerk Authentication Test Runner\n');

// Check if the landing page server is running
async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run specific Playwright tests
function runPlaywrightTests(testFile = 'clerk-auth.spec.js', options = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      'playwright',
      'test',
      path.join('tests/e2e/specs', testFile),
      '--config=tests/e2e/playwright.config.js',
      '--browser=chromium',
      '--headed',
      ...Object.entries(options).map(([key, value]) => `--${key}=${value}`),
    ];

    console.log(`Running: npx ${args.join(' ')}\n`);

    const child = spawn('npx', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    child.on('close', code => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    child.on('error', error => {
      reject(error);
    });
  });
}

// Main execution
async function main() {
  console.log('📋 Pre-flight checks:');

  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('⚠️  Landing page server is not running on http://localhost:3000');
    console.log('💡 To start the server, run: cd landing-page && npm run dev\n');
    console.log('🔍 Running tests without server (some tests may fail)...\n');
  } else {
    console.log('✅ Landing page server is running on http://localhost:3000\n');
  }

  const testFile = process.argv[2] || 'clerk-auth.spec.js';

  try {
    console.log(`🚀 Running Clerk authentication tests from ${testFile}...\n`);
    await runPlaywrightTests(testFile, {
      timeout: 10000,
      workers: 1,
    });
    console.log('\n✅ All Clerk authentication tests passed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    console.log('\n📝 Test troubleshooting:');
    console.log('1. Ensure the landing page server is running: cd landing-page && npm run dev');
    console.log('2. Check that Clerk environment variables are set in landing-page/.env.local');
    console.log('3. Verify Playwright browsers are installed: npx playwright install');
    console.log('4. For detailed output, run: npx playwright test --debug');
    process.exit(1);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node tests/run-clerk-tests.js [test-file]');
  console.log('');
  console.log('Options:');
  console.log('  test-file    Specific test file to run (default: clerk-auth.spec.js)');
  console.log('  --help, -h   Show this help message');
  console.log('');
  console.log('Examples:');
  console.log(
    '  node tests/run-clerk-tests.js                          # Run all Clerk auth tests'
  );
  console.log(
    '  node tests/run-clerk-tests.js clerk-auth-utils-demo.spec.js  # Run utils demo tests'
  );
  console.log('');
  console.log('Prerequisites:');
  console.log('  1. Landing page server running: cd landing-page && npm run dev');
  console.log('  2. Environment variables set in landing-page/.env.local');
  console.log('  3. Playwright installed: npm install -D @playwright/test playwright');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { runPlaywrightTests, checkServerRunning };
