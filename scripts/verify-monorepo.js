#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Monorepo Structure...\n');

const requiredDirs = [
  'apps/backend',
  'apps/admin-panel',
  'apps/cms-panel',
  'apps/landing-page',
  'packages/shared',
  'packages/types',
  'packages/utils',
  'packages/ui',
  'packages/test-utils',
  '.github/workflows',
  'docker',
];

const requiredFiles = [
  'package.json',
  'turbo.json',
  'tsconfig.json',
  '.eslintrc.js',
  '.prettierrc',
  '.huskyrc',
  '.lintstagedrc',
  'commitlint.config.js',
  '.github/workflows/ci.yml',
];

const requiredPackageJsonFields = {
  'package.json': ['name', 'workspaces', 'scripts'],
  'apps/*/package.json': ['name', 'version', 'scripts'],
  'packages/*/package.json': ['name', 'version', 'main', 'types'],
};

let errors = 0;
let warnings = 0;

// Check directories
console.log('📁 Checking directories...');
requiredDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - Missing`);
    errors++;
  }
});

// Check files
console.log('\n📄 Checking files...');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - Missing`);
    errors++;
  }
});

// Check package.json structure
console.log('\n📦 Checking package.json configurations...');
Object.entries(requiredPackageJsonFields).forEach(([pattern, fields]) => {
  if (pattern.includes('*')) {
    // Handle wildcard patterns
    const [prefix, suffix] = pattern.split('*');
    const baseDir = path.join(__dirname, '..', prefix);
    
    if (fs.existsSync(baseDir)) {
      fs.readdirSync(baseDir).forEach(dir => {
        const packagePath = path.join(baseDir, dir, 'package.json');
        if (fs.existsSync(packagePath)) {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          fields.forEach(field => {
            if (pkg[field]) {
              console.log(`  ✅ ${prefix}${dir}/package.json - ${field}`);
            } else {
              console.log(`  ⚠️  ${prefix}${dir}/package.json - Missing ${field}`);
              warnings++;
            }
          });
        }
      });
    }
  } else {
    // Handle specific files
    const fullPath = path.join(__dirname, '..', pattern);
    if (fs.existsSync(fullPath)) {
      const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      fields.forEach(field => {
        if (pkg[field]) {
          console.log(`  ✅ ${pattern} - ${field}`);
        } else {
          console.log(`  ❌ ${pattern} - Missing ${field}`);
          errors++;
        }
      });
    }
  }
});

// Check TypeScript configuration
console.log('\n🔧 Checking TypeScript configuration...');
const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (tsconfig.references && tsconfig.references.length > 0) {
    console.log(`  ✅ Project references configured (${tsconfig.references.length} projects)`);
  } else {
    console.log('  ⚠️  No project references configured');
    warnings++;
  }
}

// Check Turbo configuration
console.log('\n⚡ Checking Turbo configuration...');
const turboPath = path.join(__dirname, '..', 'turbo.json');
if (fs.existsSync(turboPath)) {
  const turbo = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
  if (turbo.pipeline) {
    const tasks = Object.keys(turbo.pipeline);
    console.log(`  ✅ Pipeline configured with ${tasks.length} tasks: ${tasks.join(', ')}`);
  } else {
    console.log('  ❌ No pipeline configured');
    errors++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('✨ Monorepo structure verification complete!');
  console.log('All checks passed successfully.');
} else {
  console.log(`Verification complete with ${errors} errors and ${warnings} warnings.`);
  if (errors > 0) {
    console.log('\n⚠️  Please fix the errors before proceeding.');
    process.exit(1);
  }
}

console.log('\n📊 Summary:');
console.log(`  • Directories: ${requiredDirs.length} checked`);
console.log(`  • Files: ${requiredFiles.length} checked`);
console.log(`  • Errors: ${errors}`);
console.log(`  • Warnings: ${warnings}`);