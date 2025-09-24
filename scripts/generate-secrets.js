#!/usr/bin/env node

/**
 * Generate Secure Secrets for Production
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const SECRETS_DIR = path.join(__dirname, '..', '.secrets');
const OUTPUT_FILE = path.join(SECRETS_DIR, 'generated-secrets.json');

/**
 * Generate a cryptographically secure random string
 */
function generateSecret(length = 64) {
  return crypto
    .randomBytes(Math.ceil((length * 3) / 4))
    .toString('base64')
    .slice(0, length)
    .replace(/\+/g, '0')
    .replace(/\//g, '0');
}

/**
 * Generate a strong password with complexity requirements
 */
function generateStrongPassword(length = 24) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@$!%*?&#^';
  const all = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each required character type
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += special[crypto.randomInt(0, special.length)];

  // Fill rest with random characters
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(0, all.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => crypto.randomInt(0, 2) - 1)
    .join('');
}

/**
 * Generate API key with prefix
 */
function generateApiKey(prefix = 'sk') {
  const key = generateSecret(48);
  return `${prefix}_${key}`;
}

/**
 * Generate all required secrets
 */
function generateAllSecrets() {
  console.log('🔐 Generating secure secrets for production...\n');

  const secrets = {
    // JWT Secrets
    JWT_SECRET: generateSecret(128),
    JWT_REFRESH_SECRET: generateSecret(128),

    // Session & CSRF
    SESSION_SECRET: generateSecret(64),
    CSRF_SECRET: generateSecret(64),

    // Encryption
    ENCRYPTION_KEY: generateSecret(64),
    ENCRYPTION_IV: crypto.randomBytes(16).toString('hex'),

    // API Security
    API_KEY_SALT: generateSecret(32),
    WEBHOOK_SECRET: generateSecret(64),
    FINGERPRINT_SECRET: generateSecret(48),

    // Database
    DB_PASSWORD: generateStrongPassword(24),
    DB_ENCRYPTION_KEY: generateSecret(32),

    // Redis
    REDIS_PASSWORD: generateStrongPassword(32),

    // External Services
    STRIPE_WEBHOOK_SECRET: `whsec_${generateSecret(48)}`,
    SENDGRID_API_KEY: generateApiKey('SG'),
    DATADOG_API_KEY: generateSecret(32),
    SENTRY_AUTH_TOKEN: generateSecret(64),

    // OAuth Secrets (placeholders - replace with actual values)
    GOOGLE_CLIENT_SECRET: generateSecret(24),
    FACEBOOK_CLIENT_SECRET: generateSecret(32),
    GITHUB_CLIENT_SECRET: generateSecret(40),

    // Admin Credentials
    ADMIN_PASSWORD: generateStrongPassword(16),
    SUPERUSER_TOKEN: generateApiKey('super'),

    // Backup Encryption
    BACKUP_ENCRYPTION_KEY: generateSecret(64),

    // Generated metadata
    GENERATED_AT: new Date().toISOString(),
    ROTATION_REQUIRED_AFTER: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString(), // 90 days
  };

  return secrets;
}

/**
 * Validate generated secrets
 */
function validateSecrets(secrets) {
  const validations = [
    {
      key: 'JWT_SECRET',
      minLength: 128,
      pattern: /^[A-Za-z0-9]+$/,
    },
    {
      key: 'DB_PASSWORD',
      minLength: 16,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]+$/,
    },
    {
      key: 'SESSION_SECRET',
      minLength: 64,
      pattern: /^[A-Za-z0-9]+$/,
    },
  ];

  let allValid = true;

  for (const validation of validations) {
    const value = secrets[validation.key];

    if (!value) {
      console.error(`❌ ${validation.key} is missing`);
      allValid = false;
      continue;
    }

    if (value.length < validation.minLength) {
      console.error(
        `❌ ${validation.key} is too short (min: ${validation.minLength})`
      );
      allValid = false;
    }

    if (validation.pattern && !validation.pattern.test(value)) {
      console.error(`❌ ${validation.key} doesn't match required pattern`);
      allValid = false;
    }
  }

  return allValid;
}

/**
 * Save secrets to file
 */
function saveSecrets(secrets) {
  // Create secrets directory if it doesn't exist
  if (!fs.existsSync(SECRETS_DIR)) {
    fs.mkdirSync(SECRETS_DIR, { recursive: true, mode: 0o700 });
  }

  // Write secrets file with restricted permissions
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(secrets, null, 2), {
    mode: 0o600,
  });

  // Create .env format file
  const envFile = path.join(SECRETS_DIR, 'production.env');
  const envContent = Object.entries(secrets)
    .filter(([key]) => !key.includes('GENERATED') && !key.includes('ROTATION'))
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');

  fs.writeFileSync(envFile, envContent, { mode: 0o600 });

  // Create Kubernetes secrets YAML
  const k8sFile = path.join(SECRETS_DIR, 'k8s-secrets.yaml');
  const k8sSecrets = Buffer.from(JSON.stringify(secrets)).toString('base64');

  const k8sContent = `apiVersion: v1
kind: Secret
metadata:
  name: upcoach-secrets
  namespace: production
type: Opaque
data:
  secrets.json: ${k8sSecrets}
`;

  fs.writeFileSync(k8sFile, k8sContent, { mode: 0o600 });

  // Create Docker secrets file
  const dockerFile = path.join(SECRETS_DIR, 'docker-secrets.env');
  fs.writeFileSync(dockerFile, envContent, { mode: 0o600 });
}

/**
 * Display important information
 */
function displayInstructions(secrets) {
  console.log('\n✅ Secrets generated successfully!\n');
  console.log('📁 Files created:');
  console.log(`   - ${OUTPUT_FILE}`);
  console.log(`   - ${path.join(SECRETS_DIR, 'production.env')}`);
  console.log(`   - ${path.join(SECRETS_DIR, 'k8s-secrets.yaml')}`);
  console.log(`   - ${path.join(SECRETS_DIR, 'docker-secrets.env')}\n`);

  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Store these secrets in a secure secrets management system immediately');
  console.log('2. Do NOT commit these files to version control');
  console.log('3. Delete local copies after transferring to secure storage');
  console.log('4. Rotate these secrets every 90 days');
  console.log('5. Use different secrets for each environment (dev, staging, prod)\n');

  console.log('🔄 Next rotation required:', secrets.ROTATION_REQUIRED_AFTER);
  console.log('\n📋 Sample environment variable for testing:');
  console.log(`export JWT_SECRET="${secrets.JWT_SECRET.substring(0, 20)}..."`);
  console.log('\n🔒 Admin password for initial setup:');
  console.log(`   Username: admin@upcoach.ai`);
  console.log(`   Password: ${secrets.ADMIN_PASSWORD}`);
  console.log('   (Change this immediately after first login)\n');
}

/**
 * Main execution
 */
function main() {
  try {
    // Check if secrets already exist
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log('⚠️  Secrets file already exists.');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question(
        'Do you want to regenerate all secrets? (yes/no): ',
        (answer) => {
          if (answer.toLowerCase() === 'yes') {
            generateAndSave();
          } else {
            console.log('Aborted. No changes made.');
          }
          readline.close();
        }
      );
    } else {
      generateAndSave();
    }
  } catch (error) {
    console.error('❌ Error generating secrets:', error.message);
    process.exit(1);
  }
}

/**
 * Generate and save secrets
 */
function generateAndSave() {
  const secrets = generateAllSecrets();

  if (!validateSecrets(secrets)) {
    console.error('\n❌ Secret validation failed. Please check the errors above.');
    process.exit(1);
  }

  saveSecrets(secrets);
  displayInstructions(secrets);

  // Set restrictive permissions on the secrets directory
  if (process.platform !== 'win32') {
    const { execSync } = require('child_process');
    execSync(`chmod 700 "${SECRETS_DIR}"`, { stdio: 'inherit' });
    execSync(`find "${SECRETS_DIR}" -type f -exec chmod 600 {} \\;`, {
      stdio: 'inherit',
    });
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateSecret,
  generateStrongPassword,
  generateApiKey,
  generateAllSecrets,
};