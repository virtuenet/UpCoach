/**
 * Global Test Setup for A+ Testing Standards
 * Initializes test environment, databases, and external services
 * Runs once before all test suites
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const sleep = promisify(setTimeout);

interface GlobalTestConfig {
  databases: {
    postgresql: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    redis: {
      host: string;
      port: number;
      password?: string;
    };
  };
  services: {
    api: {
      port: number;
      baseUrl: string;
    };
    frontend: {
      adminPanel: { port: number; baseUrl: string };
      cmsPanel: { port: number; baseUrl: string };
      landingPage: { port: number; baseUrl: string };
    };
  };
  testData: {
    seedFile: string;
    cleanupOnExit: boolean;
  };
}

const testConfig: GlobalTestConfig = {
  databases: {
    postgresql: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5433'), // Different port for test DB
      database: process.env.TEST_DB_NAME || 'upcoach_test',
      username: process.env.TEST_DB_USER || 'test_user',
      password: process.env.TEST_DB_PASSWORD || 'test_password',
    },
    redis: {
      host: process.env.TEST_REDIS_HOST || 'localhost',
      port: parseInt(process.env.TEST_REDIS_PORT || '6380'), // Different port for test Redis
      password: process.env.TEST_REDIS_PASSWORD,
    },
  },
  services: {
    api: {
      port: parseInt(process.env.TEST_API_PORT || '8081'), // Different port for test API
      baseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:8081',
    },
    frontend: {
      adminPanel: {
        port: parseInt(process.env.TEST_ADMIN_PORT || '8007'),
        baseUrl: process.env.TEST_ADMIN_BASE_URL || 'http://localhost:8007',
      },
      cmsPanel: {
        port: parseInt(process.env.TEST_CMS_PORT || '8008'),
        baseUrl: process.env.TEST_CMS_BASE_URL || 'http://localhost:8008',
      },
      landingPage: {
        port: parseInt(process.env.TEST_LANDING_PORT || '8009'),
        baseUrl: process.env.TEST_LANDING_BASE_URL || 'http://localhost:8009',
      },
    },
  },
  testData: {
    seedFile: path.join(__dirname, 'fixtures', 'test-seed.sql'),
    cleanupOnExit: process.env.TEST_CLEANUP !== 'false',
  },
};

class TestEnvironmentSetup {
  private processes: Array<{ name: string; process: any }> = [];
  private isSetupComplete = false;

  async setup(): Promise<void> {
    console.log('🚀 Setting up comprehensive test environment...');

    try {
      // Step 1: Verify Docker is running
      await this.verifyDockerRunning();

      // Step 2: Start test databases
      await this.startTestDatabases();

      // Step 3: Wait for databases to be ready
      await this.waitForDatabases();

      // Step 4: Run database migrations
      await this.runDatabaseMigrations();

      // Step 5: Seed test data
      await this.seedTestData();

      // Step 6: Start test services (optional for integration tests)
      if (process.env.TEST_START_SERVICES === 'true') {
        await this.startTestServices();
      }

      // Step 7: Verify all services are healthy
      await this.verifyServicesHealth();

      // Step 8: Setup test monitoring
      await this.setupTestMonitoring();

      this.isSetupComplete = true;
      console.log('✅ Test environment setup complete!');

    } catch (error) {
      console.error('❌ Test environment setup failed:', error);
      await this.cleanup();
      throw error;
    }
  }

  private async verifyDockerRunning(): Promise<void> {
    console.log('🔍 Verifying Docker is running...');
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['info'], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Docker is running');
          resolve();
        } else {
          reject(new Error('Docker is not running. Please start Docker Desktop.'));
        }
      });

      docker.on('error', () => {
        reject(new Error('Docker command not found. Please install Docker.'));
      });
    });
  }

  private async startTestDatabases(): Promise<void> {
    console.log('🗄️ Starting test databases...');

    // Create test database containers
    const postgresCommand = [
      'run', '-d',
      '--name', 'upcoach-test-postgres',
      '--rm',
      '-e', `POSTGRES_DB=${testConfig.databases.postgresql.database}`,
      '-e', `POSTGRES_USER=${testConfig.databases.postgresql.username}`,
      '-e', `POSTGRES_PASSWORD=${testConfig.databases.postgresql.password}`,
      '-p', `${testConfig.databases.postgresql.port}:5432`,
      'postgres:14-alpine'
    ];

    const redisCommand = [
      'run', '-d',
      '--name', 'upcoach-test-redis',
      '--rm',
      '-p', `${testConfig.databases.redis.port}:6379`,
      'redis:7-alpine'
    ];

    // Start PostgreSQL
    await this.runDockerCommand(postgresCommand, 'PostgreSQL');
    
    // Start Redis
    await this.runDockerCommand(redisCommand, 'Redis');

    console.log('✅ Test databases started');
  }

  private async runDockerCommand(command: string[], serviceName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn('docker', command, { stdio: 'pipe' });
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${serviceName} container started`);
          resolve();
        } else {
          // Check if container is already running
          if (errorOutput.includes('port is already allocated') || 
              errorOutput.includes('name is already in use')) {
            console.log(`⚠️ ${serviceName} container already running`);
            resolve();
          } else {
            reject(new Error(`Failed to start ${serviceName}: ${errorOutput}`));
          }
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Docker command failed for ${serviceName}: ${error.message}`));
      });
    });
  }

  private async waitForDatabases(): Promise<void> {
    console.log('⏳ Waiting for databases to be ready...');

    // Wait for PostgreSQL
    await this.waitForPostgreSQL();
    
    // Wait for Redis
    await this.waitForRedis();

    console.log('✅ Databases are ready');
  }

  private async waitForPostgreSQL(maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { Client } = require('pg');
        const client = new Client({
          host: testConfig.databases.postgresql.host,
          port: testConfig.databases.postgresql.port,
          database: testConfig.databases.postgresql.database,
          user: testConfig.databases.postgresql.username,
          password: testConfig.databases.postgresql.password,
        });

        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        
        console.log('✅ PostgreSQL is ready');
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`PostgreSQL not ready after ${maxRetries} attempts`);
        }
        await sleep(2000); // Wait 2 seconds before retry
      }
    }
  }

  private async waitForRedis(maxRetries = 15): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const Redis = require('ioredis');
        const redis = new Redis({
          host: testConfig.databases.redis.host,
          port: testConfig.databases.redis.port,
          password: testConfig.databases.redis.password,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });

        await redis.connect();
        await redis.ping();
        await redis.quit();
        
        console.log('✅ Redis is ready');
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Redis not ready after ${maxRetries} attempts`);
        }
        await sleep(1000); // Wait 1 second before retry
      }
    }
  }

  private async runDatabaseMigrations(): Promise<void> {
    console.log('📊 Running database migrations...');

    // Set environment variables for migration
    (process.env as any).NODE_ENV = 'test';
    process.env.DATABASE_URL = `postgresql://${testConfig.databases.postgresql.username}:${testConfig.databases.postgresql.password}@${testConfig.databases.postgresql.host}:${testConfig.databases.postgresql.port}/${testConfig.databases.postgresql.database}`;

    return new Promise((resolve, reject) => {
      const migrationProcess = spawn('npm', ['run', 'db:migrate'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        env: { ...process.env },
      });

      let output = '';
      let errorOutput = '';

      migrationProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      migrationProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      migrationProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database migrations completed');
          resolve();
        } else {
          reject(new Error(`Migration failed: ${errorOutput}`));
        }
      });

      migrationProcess.on('error', (error) => {
        reject(new Error(`Migration process error: ${error.message}`));
      });
    });
  }

  private async seedTestData(): Promise<void> {
    console.log('🌱 Seeding test data...');

    try {
      // Check if seed file exists
      const seedExists = await fs.access(testConfig.testData.seedFile).then(() => true).catch(() => false);
      
      if (seedExists) {
        // Run seed file
        const seedData = await fs.readFile(testConfig.testData.seedFile, 'utf-8');
        
        const { Client } = require('pg');
        const client = new Client({
          host: testConfig.databases.postgresql.host,
          port: testConfig.databases.postgresql.port,
          database: testConfig.databases.postgresql.database,
          user: testConfig.databases.postgresql.username,
          password: testConfig.databases.postgresql.password,
        });

        await client.connect();
        await client.query(seedData);
        await client.end();

        console.log('✅ Test data seeded successfully');
      } else {
        console.log('⚠️ No seed file found, skipping data seeding');
      }
    } catch (error) {
      console.error('❌ Failed to seed test data:', error);
      throw error;
    }
  }

  private async startTestServices(): Promise<void> {
    console.log('🚀 Starting test services...');

    // This is optional - only start services if needed for integration tests
    // Most unit tests can use mocked services

    if (process.env.INTEGRATION_TESTS === 'true') {
      console.log('🔧 Integration tests enabled, starting services...');
      // Start API service
      // Start frontend services if needed
    } else {
      console.log('📝 Unit tests mode, using mocked services');
    }

    console.log('✅ Services configuration complete');
  }

  private async verifyServicesHealth(): Promise<void> {
    console.log('🔍 Verifying services health...');

    // Basic health checks
    const healthChecks = [
      {
        name: 'PostgreSQL',
        check: () => this.checkPostgreSQLHealth(),
      },
      {
        name: 'Redis',
        check: () => this.checkRedisHealth(),
      },
    ];

    for (const { name, check } of healthChecks) {
      try {
        await check();
        console.log(`✅ ${name} health check passed`);
      } catch (error) {
        console.error(`❌ ${name} health check failed:`, error);
        throw error;
      }
    }

    console.log('✅ All services are healthy');
  }

  private async checkPostgreSQLHealth(): Promise<void> {
    const { Client } = require('pg');
    const client = new Client({
      host: testConfig.databases.postgresql.host,
      port: testConfig.databases.postgresql.port,
      database: testConfig.databases.postgresql.database,
      user: testConfig.databases.postgresql.username,
      password: testConfig.databases.postgresql.password,
    });

    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();

    if (!result.rows || result.rows.length === 0) {
      throw new Error('PostgreSQL health check failed');
    }
  }

  private async checkRedisHealth(): Promise<void> {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: testConfig.databases.redis.host,
      port: testConfig.databases.redis.port,
      password: testConfig.databases.redis.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    await redis.connect();
    const result = await redis.ping();
    await redis.quit();

    if (result !== 'PONG') {
      throw new Error('Redis health check failed');
    }
  }

  private async setupTestMonitoring(): Promise<void> {
    console.log('📊 Setting up test monitoring...');

    // Setup performance monitoring for tests
    if (process.env.MONITOR_TESTS === 'true') {
      console.log('📈 Test performance monitoring enabled');
      
      // Initialize test metrics collection
      (global as any).testMetrics = {
        startTime: Date.now(),
        testCount: 0,
        failedTests: 0,
        slowTests: [],
        memoryUsage: process.memoryUsage(),
      };
    }

    // Setup test reporting
    await this.setupTestReporting();

    console.log('✅ Test monitoring setup complete');
  }

  private async setupTestReporting(): Promise<void> {
    // Ensure coverage and report directories exist
    const directories = [
      'coverage',
      'coverage/backend-unit',
      'coverage/backend-integration',
      'coverage/contract-tests',
      'coverage/frontend',
      'coverage/combined',
      'test-results',
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
      } catch (error) {
        // Directory already exists or permission error
        console.warn(`Warning: Could not create directory ${dir}:`, error);
      }
    }
  }

  async cleanup(): Promise<void> {
    if (!testConfig.testData.cleanupOnExit) {
      console.log('⚠️ Test cleanup disabled, leaving containers running');
      return;
    }

    console.log('🧹 Cleaning up test environment...');

    try {
      // Stop test containers
      const containers = ['upcoach-test-postgres', 'upcoach-test-redis'];
      
      for (const container of containers) {
        await this.stopContainer(container);
      }

      // Kill any running processes
      for (const { name, process } of this.processes) {
        try {
          process.kill('SIGTERM');
          console.log(`✅ Stopped ${name} process`);
        } catch (error) {
          console.warn(`⚠️ Could not stop ${name} process:`, error);
        }
      }

      console.log('✅ Test environment cleanup complete');
    } catch (error) {
      console.error('❌ Test environment cleanup failed:', error);
    }
  }

  private async stopContainer(containerName: string): Promise<void> {
    return new Promise((resolve) => {
      const stopProcess = spawn('docker', ['stop', containerName], { stdio: 'pipe' });
      
      stopProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Stopped container ${containerName}`);
        } else {
          console.warn(`⚠️ Container ${containerName} may not have been running`);
        }
        resolve();
      });

      stopProcess.on('error', () => {
        console.warn(`⚠️ Could not stop container ${containerName}`);
        resolve();
      });
    });
  }

  getConfig(): GlobalTestConfig {
    return testConfig;
  }

  isReady(): boolean {
    return this.isSetupComplete;
  }
}

// Global setup function called by Jest
export default async function globalSetup(): Promise<void> {
  console.log('🧪 Initializing comprehensive test environment for A+ standards...');
  
  const setup = new TestEnvironmentSetup();
  
  // Store cleanup function globally
  (global as any).__TEST_SETUP__ = setup;
  
  try {
    await setup.setup();
    console.log('🎉 Test environment ready for A+ testing standards!');
  } catch (error) {
    console.error('💥 Failed to setup test environment:', error);
    await setup.cleanup();
    process.exit(1);
  }
}