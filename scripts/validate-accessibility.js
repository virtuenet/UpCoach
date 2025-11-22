#!/usr/bin/env node

/**
 * WCAG 2.2 AA Compliance Validation Script
 * Runs comprehensive accessibility validation across the UpCoach platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 UpCoach Platform WCAG 2.2 AA Compliance Validation\n');

const results = {
  flutter: { status: 'pending', issues: [] },
  adminpanel: { status: 'pending', issues: [] },
  cmspanel: { status: 'pending', issues: [] },
  landingpage: { status: 'pending', issues: [] },
  backend: { status: 'pending', issues: [] },
};

function runCommand(command, cwd = process.cwd()) {
  try {
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

function validateFlutterAccessibility() {
  console.log('📱 Validating Flutter Mobile App Accessibility...');
  
  const mobileAppPath = path.join(__dirname, '../mobile-app');
  
  // Check if accessibility test files exist
  const testFiles = [
    'test/accessibility/ai_input_accessibility_test.dart',
    'test/accessibility/navigation_accessibility_test.dart',
    'test/accessibility/forms_accessibility_test.dart'
  ];
  
  let testFilesExist = 0;
  testFiles.forEach(file => {
    if (fs.existsSync(path.join(mobileAppPath, file))) {
      testFilesExist++;
    }
  });
  
  if (testFilesExist === 0) {
    results.flutter.issues.push('No accessibility test files found');
  }
  
  // Check for semantic widgets usage in key files
  const keyFiles = [
    'lib/features/ai/presentation/widgets/ai_input_widget.dart',
    'lib/shared/widgets/main_navigation.dart',
    'lib/features/auth/screens/login_screen.dart'
  ];
  
  keyFiles.forEach(file => {
    const filePath = path.join(mobileAppPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes('Semantics(')) {
        results.flutter.issues.push(`${file} missing Semantics widgets`);
      }
      if (!content.includes('aria-label') && !content.includes('label:')) {
        results.flutter.issues.push(`${file} missing accessibility labels`);
      }
    } else {
      results.flutter.issues.push(`${file} not found`);
    }
  });
  
  // Run Flutter analyzer for accessibility issues
  const analyzeResult = runCommand('flutter analyze', mobileAppPath);
  if (!analyzeResult.success) {
    results.flutter.issues.push(`Flutter analyze failed: ${analyzeResult.error}`);
  }
  
  results.flutter.status = results.flutter.issues.length === 0 ? 'passed' : 'failed';
  console.log(`   ${results.flutter.status === 'passed' ? '✅' : '❌'} Flutter: ${results.flutter.issues.length} issues found`);
}

function validateReactAccessibility(appName, appPath) {
  console.log(`⚛️  Validating ${appName} Accessibility...`);
  
  const fullPath = path.join(__dirname, '..', appPath);
  
  // Check if accessibility configuration exists
  const configFiles = [
    '.eslintrc.a11y.js',
    'jest.a11y.config.js',
    'src/tests/setupA11y.ts'
  ];
  
  const appKey = appName.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  if (!results[appKey]) {
    results[appKey] = { status: 'pending', issues: [] };
  }
  
  configFiles.forEach(file => {
    if (!fs.existsSync(path.join(fullPath, file))) {
      results[appKey].issues.push(`${file} not found`);
    }
  });
  
  // Check for accessibility dependencies
  const packageJsonPath = path.join(fullPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const requiredDeps = [
      'axe-core',
      'jest-axe',
      'eslint-plugin-jsx-a11y'
    ];
    
    const appKey = appName.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
    if (!results[appKey]) {
      results[appKey] = { status: 'pending', issues: [] };
    }
    
    requiredDeps.forEach(dep => {
      if (!packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]) {
        results[appKey].issues.push(`Missing dependency: ${dep}`);
      }
    });
  }
  
  // Check key component files for accessibility patterns
  const componentFiles = fs.readdirSync(path.join(fullPath, 'src'), { recursive: true })
    .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
    .slice(0, 5); // Check first 5 component files
  
  componentFiles.forEach(file => {
    const filePath = path.join(fullPath, 'src', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for accessibility patterns
      const hasAriaLabel = content.includes('aria-label');
      const hasRole = content.includes('role=');
      const hasSemanticHTML = /(<main|<nav|<section|<article|<aside|<header|<footer)/.test(content);
      
      if (!hasAriaLabel && !hasRole && !hasSemanticHTML) {
        results[appKey].issues.push(`${file} lacks accessibility attributes`);
      }
    }
  });
  
  // Run accessibility linting
  const lintResult = runCommand('npm run lint:a11y', fullPath);
  if (!lintResult.success) {
    results[appKey].issues.push(`Accessibility linting failed`);
  }
  
  // Run accessibility tests
  const testResult = runCommand('npm run test:a11y -- --passWithNoTests', fullPath);
  if (!testResult.success) {
    results[appKey].issues.push(`Accessibility tests failed`);
  }
  
  results[appKey].status = results[appKey].issues.length === 0 ? 'passed' : 'failed';
  console.log(`   ${results[appKey].status === 'passed' ? '✅' : '❌'} ${appName}: ${results[appKey].issues.length} issues found`);
}

function validateBackendAccessibility() {
  console.log('🔧 Validating Backend API Accessibility...');
  
  const backendPath = path.join(__dirname, '../services/api');
  
  // Check for accessible error response types
  const typeFiles = [
    'src/types/api-responses.ts',
    'src/middleware/errorHandler.ts'
  ];
  
  typeFiles.forEach(file => {
    const filePath = path.join(backendPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes('accessibleError')) {
        results.backend.issues.push(`${file} missing accessible error responses`);
      }
      if (!content.includes('semanticType')) {
        results.backend.issues.push(`${file} missing semantic error categorization`);
      }
    } else {
      results.backend.issues.push(`${file} not found`);
    }
  });
  
  // Check API documentation for accessibility info
  const docsPath = path.join(__dirname, '../docs');
  const accessibilityDoc = path.join(docsPath, 'ACCESSIBILITY_COMPLIANCE_GUIDE.md');
  
  if (!fs.existsSync(accessibilityDoc)) {
    results.backend.issues.push('Accessibility documentation missing');
  }
  
  results.backend.status = results.backend.issues.length === 0 ? 'passed' : 'failed';
  console.log(`   ${results.backend.status === 'passed' ? '✅' : '❌'} Backend: ${results.backend.issues.length} issues found`);
}

function generateReport() {
  console.log('\n📊 WCAG 2.2 AA Compliance Report');
  console.log('================================\n');
  
  let totalIssues = 0;
  let passedComponents = 0;
  
  Object.entries(results).forEach(([component, result]) => {
    const status = result.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
    console.log(`${component.toUpperCase()}: ${status}`);
    
    if (result.issues.length > 0) {
      console.log('  Issues:');
      result.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    }
    
    totalIssues += result.issues.length;
    if (result.status === 'passed') passedComponents++;
    
    console.log('');
  });
  
  console.log(`Summary: ${passedComponents}/${Object.keys(results).length} components passed`);
  console.log(`Total issues: ${totalIssues}\n`);
  
  // Generate detailed report file
  const reportContent = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: Object.keys(results).length,
      passedComponents,
      totalIssues
    },
    results
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../accessibility-compliance-report.json'),
    JSON.stringify(reportContent, null, 2)
  );
  
  console.log('📄 Detailed report saved to accessibility-compliance-report.json');
  
  // Exit with error code if any issues found
  process.exit(totalIssues > 0 ? 1 : 0);
}

// Main validation flow
async function main() {
  try {
    validateFlutterAccessibility();
    validateReactAccessibility('Admin Panel', 'apps/admin-panel');
    validateReactAccessibility('CMS Panel', 'apps/cms-panel');
    validateReactAccessibility('Landing Page', 'apps/landing-page');
    validateBackendAccessibility();
    
    generateReport();
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, results };