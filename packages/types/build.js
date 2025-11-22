const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function buildTypes() {
  try {
    // Ensure dist directory exists
    const distPath = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath);
    }

    // Run TypeScript compilation
    execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });

    console.log('Types package built successfully.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildTypes();