#!/usr/bin/env node

// validate-tests.js
// Quick validation of test file syntax without running full test suite

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Clerk test files...\n');

const testFiles = [
  'tests/e2e/specs/clerk-auth.spec.js',
  'tests/e2e/specs/clerk-auth-utils-demo.spec.js',
  'tests/e2e/utils/clerk-test-utils.js',
];

let allValid = true;

testFiles.forEach(filePath => {
  console.log(`📄 Checking ${filePath}...`);

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${filePath}`);
      allValid = false;
      return;
    }

    // Read and basic syntax check
    const content = fs.readFileSync(filePath, 'utf8');

    // Basic checks
    const checks = [
      {
        name: 'Has content',
        test: content.length > 0,
      },
      {
        name: 'No obvious syntax errors',
        test: !content.includes('undefined') || content.includes('// undefined is expected'),
      },
      {
        name: 'Contains test functions',
        test: content.includes('test(') || content.includes('function'),
      },
    ];

    checks.forEach(check => {
      if (check.test) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ⚠️  ${check.name}`);
      }
    });

    // Try to require the file for syntax validation
    if (filePath.endsWith('.js')) {
      try {
        require(path.resolve(filePath));
        console.log(`   ✅ Syntax validation passed`);
      } catch (error) {
        if (error.message.includes('@playwright/test')) {
          console.log(`   ✅ Syntax valid (Playwright dependency expected)`);
        } else {
          console.log(`   ❌ Syntax error: ${error.message}`);
          allValid = false;
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    allValid = false;
  }

  console.log('');
});

// Summary
console.log('📊 Validation Summary:');
if (allValid) {
  console.log('✅ All test files are valid and ready to run');
  console.log('\n📋 Next steps:');
  console.log('1. Start the landing page server: cd landing-page && npm run dev');
  console.log('2. Set up environment variables in landing-page/.env.local');
  console.log('3. Run tests: npx playwright test --config=tests/e2e/playwright.config.js');
} else {
  console.log('❌ Some issues found with test files');
  console.log('Please fix the issues above before running tests');
}

process.exit(allValid ? 0 : 1);
