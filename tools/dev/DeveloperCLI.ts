#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import Table from 'cli-table3';
import Handlebars from 'handlebars';
import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import winston from 'winston';
import os from 'os';
import crypto from 'crypto';

dotenv.config();

interface ConfigFile {
  apiBaseUrl: string;
  defaultEnvironment: string;
  logLevel: string;
  editor: string;
  templatesPath: string;
}

interface MigrationRecord {
  id: number;
  name: string;
  executedAt: Date;
}

interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  details?: string;
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage: number;
  description: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

class DeveloperCLI {
  private program: Command;
  private logger: winston.Logger;
  private config: ConfigFile;
  private configPath: string;
  private spinner: Ora | null = null;

  constructor() {
    this.configPath = path.join(os.homedir(), '.upcoachrc');
    this.config = this.loadConfig();
    this.logger = this.setupLogger();
    this.program = new Command();
    this.setupCommands();
  }

  private loadConfig(): ConfigFile {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not load config file, using defaults'));
    }

    const defaultConfig: ConfigFile = {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      defaultEnvironment: 'development',
      logLevel: 'info',
      editor: process.env.EDITOR || 'vim',
      templatesPath: path.join(__dirname, '../../templates'),
    };

    fs.ensureFileSync(this.configPath);
    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  private setupLogger(): winston.Logger {
    return winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'upcoach-cli.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  private setupCommands(): void {
    this.program
      .name('upcoach')
      .description('UpCoach Developer CLI - Comprehensive tooling for platform development')
      .version('1.0.0');

    this.setupGenerateCommands();
    this.setupDatabaseCommands();
    this.setupTestCommands();
    this.setupBuildCommands();
    this.setupDeployCommands();
    this.setupCodeQualityCommands();
    this.setupDocsCommands();
    this.setupPerformanceCommands();
    this.setupLogsCommands();
    this.setupSecretCommands();
    this.setupFeatureFlagCommands();
    this.setupMockCommands();
    this.setupAPICommands();
    this.setupHealthCommands();
    this.setupShellCommand();
  }

  private setupGenerateCommands(): void {
    const generate = this.program.command('generate').alias('g').description('Generate code scaffolding');

    generate
      .command('model <name>')
      .description('Generate a database model with TypeScript types and Sequelize schema')
      .option('-f, --fields <fields>', 'Comma-separated fields (e.g., name:string,age:number)')
      .action(async (name: string, options: { fields?: string }) => {
        await this.generateModel(name, options.fields);
      });

    generate
      .command('api <method> <path>')
      .description('Generate API endpoint (e.g., POST /users)')
      .option('-t, --type <type>', 'API type (rest|graphql|trpc)', 'rest')
      .action(async (method: string, path: string, options: { type: string }) => {
        await this.generateAPI(method, path, options.type);
      });

    generate
      .command('component <name>')
      .description('Generate React component with TypeScript and Material-UI')
      .option('-f, --functional', 'Generate functional component (default)', true)
      .option('-p, --props <props>', 'Component props (e.g., title:string,count:number)')
      .action(async (name: string, options: { functional: boolean; props?: string }) => {
        await this.generateComponent(name, options.props);
      });

    generate
      .command('service <name>')
      .description('Generate service layer with business logic')
      .action(async (name: string) => {
        await this.generateService(name);
      });

    generate
      .command('repository <name>')
      .description('Generate repository pattern with CRUD operations')
      .action(async (name: string) => {
        await this.generateRepository(name);
      });

    generate
      .command('test <filePath>')
      .description('Generate test suite for a file')
      .option('-t, --type <type>', 'Test type (unit|integration|e2e)', 'unit')
      .action(async (filePath: string, options: { type: string }) => {
        await this.generateTest(filePath, options.type);
      });

    generate
      .command('migration <name>')
      .description('Generate database migration script')
      .action(async (name: string) => {
        await this.generateMigration(name);
      });
  }

  private setupDatabaseCommands(): void {
    const db = this.program.command('db').description('Database management commands');

    db.command('migrate')
      .description('Run pending database migrations')
      .option('-e, --env <environment>', 'Environment', this.config.defaultEnvironment)
      .action(async (options: { env: string }) => {
        await this.runMigrations(options.env);
      });

    db.command('rollback')
      .description('Rollback last migration')
      .option('-s, --steps <steps>', 'Number of migrations to rollback', '1')
      .action(async (options: { steps: string }) => {
        await this.rollbackMigrations(parseInt(options.steps));
      });

    db.command('seed')
      .description('Seed database with test data')
      .option('-e, --env <environment>', 'Environment', this.config.defaultEnvironment)
      .option('-f, --file <file>', 'Specific seeder file')
      .action(async (options: { env: string; file?: string }) => {
        await this.seedDatabase(options.env, options.file);
      });

    db.command('reset')
      .description('Reset database (drop all tables and re-migrate)')
      .option('--force', 'Skip confirmation prompt')
      .action(async (options: { force?: boolean }) => {
        await this.resetDatabase(options.force);
      });

    db.command('status')
      .description('Show migration status')
      .action(async () => {
        await this.showMigrationStatus();
      });
  }

  private setupTestCommands(): void {
    this.program
      .command('test [pattern]')
      .description('Run tests')
      .option('-w, --watch', 'Watch mode')
      .option('-c, --coverage', 'Generate coverage report')
      .option('-u, --update-snapshots', 'Update snapshots')
      .action(async (pattern: string | undefined, options: any) => {
        await this.runTests(pattern, options);
      });

    this.program
      .command('test:unit [pattern]')
      .description('Run unit tests only')
      .option('-w, --watch', 'Watch mode')
      .action(async (pattern: string | undefined, options: { watch?: boolean }) => {
        await this.runTests(pattern, { ...options, testPathPattern: 'unit' });
      });

    this.program
      .command('test:integration [pattern]')
      .description('Run integration tests only')
      .action(async (pattern: string | undefined) => {
        await this.runTests(pattern, { testPathPattern: 'integration' });
      });

    this.program
      .command('test:e2e [pattern]')
      .description('Run end-to-end tests')
      .action(async (pattern: string | undefined) => {
        await this.runTests(pattern, { testPathPattern: 'e2e' });
      });
  }

  private setupBuildCommands(): void {
    this.program
      .command('build')
      .description('Build the application')
      .option('-e, --env <environment>', 'Environment', 'production')
      .option('-w, --watch', 'Watch mode')
      .option('--analyze', 'Analyze bundle size')
      .action(async (options: { env: string; watch?: boolean; analyze?: boolean }) => {
        await this.buildApplication(options.env, options.watch, options.analyze);
      });
  }

  private setupDeployCommands(): void {
    this.program
      .command('deploy <environment>')
      .description('Deploy to environment (staging|production)')
      .option('--confirm', 'Skip confirmation prompt')
      .option('--no-build', 'Skip build step')
      .action(async (environment: string, options: { confirm?: boolean; build: boolean }) => {
        await this.deployApplication(environment, options.confirm, options.build);
      });
  }

  private setupCodeQualityCommands(): void {
    this.program
      .command('lint [pattern]')
      .description('Lint code with ESLint')
      .option('--fix', 'Auto-fix issues')
      .action(async (pattern: string | undefined, options: { fix?: boolean }) => {
        await this.lintCode(pattern, options.fix);
      });

    this.program
      .command('format [pattern]')
      .description('Format code with Prettier')
      .option('--check', 'Check formatting without writing')
      .action(async (pattern: string | undefined, options: { check?: boolean }) => {
        await this.formatCode(pattern, options.check);
      });

    this.program
      .command('type-check')
      .description('Run TypeScript type checking')
      .action(async () => {
        await this.typeCheck();
      });

    this.program
      .command('audit')
      .description('Run security audit on dependencies')
      .option('--fix', 'Auto-fix vulnerabilities')
      .action(async (options: { fix?: boolean }) => {
        await this.auditDependencies(options.fix);
      });
  }

  private setupDocsCommands(): void {
    const docs = this.program.command('docs').description('Documentation commands');

    docs
      .command('generate')
      .description('Generate API documentation')
      .option('-f, --format <format>', 'Format (typedoc|jsdoc|openapi)', 'typedoc')
      .action(async (options: { format: string }) => {
        await this.generateDocs(options.format);
      });

    docs
      .command('serve')
      .description('Serve documentation locally')
      .option('-p, --port <port>', 'Port', '8080')
      .action(async (options: { port: string }) => {
        await this.serveDocs(parseInt(options.port));
      });
  }

  private setupPerformanceCommands(): void {
    const perf = this.program.command('perf').description('Performance profiling commands');

    perf
      .command('profile <target>')
      .description('Profile application performance')
      .option('-d, --duration <seconds>', 'Profile duration', '30')
      .action(async (target: string, options: { duration: string }) => {
        await this.profilePerformance(target, parseInt(options.duration));
      });

    perf
      .command('heap-snapshot')
      .description('Take heap snapshot for memory analysis')
      .action(async () => {
        await this.takeHeapSnapshot();
      });

    perf
      .command('analyze')
      .description('Analyze performance metrics')
      .option('-s, --since <hours>', 'Hours to analyze', '24')
      .action(async (options: { since: string }) => {
        await this.analyzePerformance(parseInt(options.since));
      });
  }

  private setupLogsCommands(): void {
    const logs = this.program.command('logs').description('Log management commands');

    logs
      .command('view')
      .description('View application logs')
      .option('-s, --service <service>', 'Filter by service')
      .option('-l, --level <level>', 'Filter by level (error|warn|info|debug)')
      .option('-t, --tail <lines>', 'Number of lines to show', '100')
      .option('-f, --follow', 'Follow log output')
      .action(async (options: any) => {
        await this.viewLogs(options);
      });

    logs
      .command('analyze')
      .description('Analyze logs for patterns')
      .option('--errors-only', 'Show only errors')
      .option('-s, --since <hours>', 'Hours to analyze', '24')
      .action(async (options: { errorsOnly?: boolean; since: string }) => {
        await this.analyzeLogs(options.errorsOnly, parseInt(options.since));
      });
  }

  private setupSecretCommands(): void {
    const secret = this.program.command('secret').description('Secret management commands');

    secret
      .command('set <key> <value>')
      .description('Set a secret value')
      .option('-e, --env <environment>', 'Environment', this.config.defaultEnvironment)
      .action(async (key: string, value: string, options: { env: string }) => {
        await this.setSecret(key, value, options.env);
      });

    secret
      .command('get <key>')
      .description('Get a secret value')
      .option('-e, --env <environment>', 'Environment', this.config.defaultEnvironment)
      .action(async (key: string, options: { env: string }) => {
        await this.getSecret(key, options.env);
      });

    secret
      .command('delete <key>')
      .description('Delete a secret')
      .option('-e, --env <environment>', 'Environment', this.config.defaultEnvironment)
      .action(async (key: string, options: { env: string }) => {
        await this.deleteSecret(key, options.env);
      });

    secret
      .command('rotate <key>')
      .description('Rotate a secret value')
      .option('-e, --env <environment>', 'Environment', this.config.defaultEnvironment)
      .action(async (key: string, options: { env: string }) => {
        await this.rotateSecret(key, options.env);
      });

    secret
      .command('list')
      .description('List all secrets (keys only)')
      .option('-e, --env <environment>', 'Environment', this.config.defaultEnvironment)
      .action(async (options: { env: string }) => {
        await this.listSecrets(options.env);
      });
  }

  private setupFeatureFlagCommands(): void {
    const feature = this.program.command('feature').description('Feature flag commands');

    feature
      .command('enable <name>')
      .description('Enable a feature flag')
      .action(async (name: string) => {
        await this.setFeatureFlag(name, true, 100);
      });

    feature
      .command('disable <name>')
      .description('Disable a feature flag')
      .action(async (name: string) => {
        await this.setFeatureFlag(name, false, 0);
      });

    feature
      .command('set <name>')
      .description('Set feature flag with percentage rollout')
      .option('-p, --percentage <percentage>', 'Percentage (0-100)', '0')
      .action(async (name: string, options: { percentage: string }) => {
        const percentage = parseInt(options.percentage);
        await this.setFeatureFlag(name, percentage > 0, percentage);
      });

    feature
      .command('list')
      .description('List all feature flags')
      .action(async () => {
        await this.listFeatureFlags();
      });
  }

  private setupMockCommands(): void {
    this.program
      .command('mock <entity> <count>')
      .description('Generate mock data')
      .option('-o, --output <file>', 'Output file')
      .option('-f, --format <format>', 'Format (json|csv|sql)', 'json')
      .action(async (entity: string, count: string, options: { output?: string; format: string }) => {
        await this.generateMockData(entity, parseInt(count), options.output, options.format);
      });
  }

  private setupAPICommands(): void {
    const api = this.program.command('api').description('API testing commands');

    api
      .command('test <method> <path> [body]')
      .description('Test API endpoint')
      .option('-h, --headers <headers>', 'JSON headers')
      .option('-t, --token <token>', 'Authentication token')
      .action(async (method: string, path: string, body: string | undefined, options: any) => {
        await this.testAPI(method, path, body, options);
      });

    api
      .command('explore')
      .description('Interactive API explorer')
      .action(async () => {
        await this.exploreAPI();
      });
  }

  private setupHealthCommands(): void {
    const health = this.program.command('health').description('Health check commands');

    health
      .command('check')
      .description('Check health of all services')
      .action(async () => {
        await this.healthCheckAll();
      });

    health
      .command('ping <service>')
      .description('Ping specific service')
      .action(async (service: string) => {
        await this.pingService(service);
      });
  }

  private setupShellCommand(): void {
    this.program
      .command('shell')
      .description('Interactive shell with auto-completion')
      .action(async () => {
        await this.startInteractiveShell();
      });
  }

  private async generateModel(name: string, fieldsStr?: string): Promise<void> {
    this.spinner = ora(`Generating model: ${name}`).start();

    try {
      const fields = this.parseFields(fieldsStr);
      const modelPath = path.join(process.cwd(), 'src/models', `${name}.ts`);
      const templatePath = path.join(this.config.templatesPath, 'model.hbs');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const code = template({
        name,
        nameLower: name.toLowerCase(),
        fields,
        timestamp: new Date().toISOString(),
        author: await this.getGitAuthor(),
      });

      fs.ensureFileSync(modelPath);
      fs.writeFileSync(modelPath, code);

      this.spinner.succeed(chalk.green(`Model generated: ${modelPath}`));
      this.logger.info(`Generated model: ${name}`, { path: modelPath });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate model'));
      this.handleError(error);
    }
  }

  private async generateAPI(method: string, apiPath: string, type: string): Promise<void> {
    this.spinner = ora(`Generating ${type.toUpperCase()} API: ${method} ${apiPath}`).start();

    try {
      const routeName = apiPath.split('/').filter(Boolean).join('-');
      const routePath = path.join(process.cwd(), 'src/routes', `${routeName}.ts`);
      const templatePath = path.join(this.config.templatesPath, `api-${type}.hbs`);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const code = template({
        method: method.toUpperCase(),
        path: apiPath,
        routeName,
        timestamp: new Date().toISOString(),
        author: await this.getGitAuthor(),
      });

      fs.ensureFileSync(routePath);
      fs.writeFileSync(routePath, code);

      this.spinner.succeed(chalk.green(`API endpoint generated: ${routePath}`));
      this.logger.info(`Generated API endpoint: ${method} ${apiPath}`, { path: routePath });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate API endpoint'));
      this.handleError(error);
    }
  }

  private async generateComponent(name: string, propsStr?: string): Promise<void> {
    this.spinner = ora(`Generating React component: ${name}`).start();

    try {
      const props = this.parseFields(propsStr);
      const componentPath = path.join(process.cwd(), 'src/components', `${name}.tsx`);
      const templatePath = path.join(this.config.templatesPath, 'component.hbs');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const code = template({
        name,
        props,
        timestamp: new Date().toISOString(),
        author: await this.getGitAuthor(),
      });

      fs.ensureFileSync(componentPath);
      fs.writeFileSync(componentPath, code);

      this.spinner.succeed(chalk.green(`Component generated: ${componentPath}`));
      this.logger.info(`Generated component: ${name}`, { path: componentPath });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate component'));
      this.handleError(error);
    }
  }

  private async generateService(name: string): Promise<void> {
    this.spinner = ora(`Generating service: ${name}`).start();

    try {
      const servicePath = path.join(process.cwd(), 'src/services', `${name}Service.ts`);
      const templatePath = path.join(this.config.templatesPath, 'service.hbs');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const code = template({
        name,
        nameLower: name.toLowerCase(),
        timestamp: new Date().toISOString(),
        author: await this.getGitAuthor(),
      });

      fs.ensureFileSync(servicePath);
      fs.writeFileSync(servicePath, code);

      this.spinner.succeed(chalk.green(`Service generated: ${servicePath}`));
      this.logger.info(`Generated service: ${name}`, { path: servicePath });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate service'));
      this.handleError(error);
    }
  }

  private async generateRepository(name: string): Promise<void> {
    this.spinner = ora(`Generating repository: ${name}`).start();

    try {
      const repoPath = path.join(process.cwd(), 'src/repositories', `${name}Repository.ts`);
      const templatePath = path.join(this.config.templatesPath, 'repository.hbs');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const code = template({
        name,
        nameLower: name.toLowerCase(),
        timestamp: new Date().toISOString(),
        author: await this.getGitAuthor(),
      });

      fs.ensureFileSync(repoPath);
      fs.writeFileSync(repoPath, code);

      this.spinner.succeed(chalk.green(`Repository generated: ${repoPath}`));
      this.logger.info(`Generated repository: ${name}`, { path: repoPath });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate repository'));
      this.handleError(error);
    }
  }

  private async generateTest(filePath: string, testType: string): Promise<void> {
    this.spinner = ora(`Generating ${testType} test for: ${filePath}`).start();

    try {
      const baseName = path.basename(filePath, path.extname(filePath));
      const testPath = path.join(
        path.dirname(filePath),
        '__tests__',
        `${baseName}.${testType}.test.ts`
      );
      const templatePath = path.join(this.config.templatesPath, `test-${testType}.hbs`);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const code = template({
        name: baseName,
        importPath: path.relative(path.dirname(testPath), filePath).replace(/\\/g, '/'),
        timestamp: new Date().toISOString(),
        author: await this.getGitAuthor(),
      });

      fs.ensureFileSync(testPath);
      fs.writeFileSync(testPath, code);

      this.spinner.succeed(chalk.green(`Test generated: ${testPath}`));
      this.logger.info(`Generated ${testType} test`, { path: testPath });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate test'));
      this.handleError(error);
    }
  }

  private async generateMigration(name: string): Promise<void> {
    this.spinner = ora(`Generating migration: ${name}`).start();

    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const migrationPath = path.join(
        process.cwd(),
        'migrations',
        `${timestamp}-${name}.ts`
      );
      const templatePath = path.join(this.config.templatesPath, 'migration.hbs');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const code = template({
        name,
        timestamp: new Date().toISOString(),
        author: await this.getGitAuthor(),
      });

      fs.ensureFileSync(migrationPath);
      fs.writeFileSync(migrationPath, code);

      this.spinner.succeed(chalk.green(`Migration generated: ${migrationPath}`));
      this.logger.info(`Generated migration: ${name}`, { path: migrationPath });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate migration'));
      this.handleError(error);
    }
  }

  private async runMigrations(environment: string): Promise<void> {
    this.spinner = ora(`Running migrations (${environment})`).start();

    try {
      const result = await this.executeCommand('npm', ['run', 'migrate:up'], {
        env: { ...process.env, NODE_ENV: environment },
      });

      this.spinner.succeed(chalk.green('Migrations completed successfully'));
      console.log(result.stdout);
      this.logger.info('Migrations completed', { environment });
    } catch (error) {
      this.spinner?.fail(chalk.red('Migration failed'));
      this.handleError(error);
    }
  }

  private async rollbackMigrations(steps: number): Promise<void> {
    this.spinner = ora(`Rolling back ${steps} migration(s)`).start();

    try {
      const result = await this.executeCommand('npm', ['run', 'migrate:down'], {
        env: { ...process.env, MIGRATION_STEPS: steps.toString() },
      });

      this.spinner.succeed(chalk.green(`Rolled back ${steps} migration(s)`));
      console.log(result.stdout);
      this.logger.info('Migrations rolled back', { steps });
    } catch (error) {
      this.spinner?.fail(chalk.red('Rollback failed'));
      this.handleError(error);
    }
  }

  private async seedDatabase(environment: string, seedFile?: string): Promise<void> {
    this.spinner = ora(`Seeding database (${environment})`).start();

    try {
      const args = seedFile ? ['run', 'seed', '--', seedFile] : ['run', 'seed'];
      const result = await this.executeCommand('npm', args, {
        env: { ...process.env, NODE_ENV: environment },
      });

      this.spinner.succeed(chalk.green('Database seeded successfully'));
      console.log(result.stdout);
      this.logger.info('Database seeded', { environment, seedFile });
    } catch (error) {
      this.spinner?.fail(chalk.red('Seeding failed'));
      this.handleError(error);
    }
  }

  private async resetDatabase(force?: boolean): Promise<void> {
    if (!force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.yellow('This will drop all tables and data. Continue?'),
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Database reset cancelled'));
        return;
      }
    }

    this.spinner = ora('Resetting database').start();

    try {
      await this.executeCommand('npm', ['run', 'db:reset']);
      this.spinner.succeed(chalk.green('Database reset successfully'));
      this.logger.info('Database reset');
    } catch (error) {
      this.spinner?.fail(chalk.red('Database reset failed'));
      this.handleError(error);
    }
  }

  private async showMigrationStatus(): Promise<void> {
    this.spinner = ora('Fetching migration status').start();

    try {
      const response = await axios.get<MigrationRecord[]>(
        `${this.config.apiBaseUrl}/admin/migrations/status`,
        { headers: this.getAuthHeaders() }
      );

      this.spinner.stop();

      const table = new Table({
        head: ['ID', 'Name', 'Executed At'],
        colWidths: [10, 50, 30],
      });

      response.data.forEach((migration) => {
        table.push([
          migration.id.toString(),
          migration.name,
          new Date(migration.executedAt).toLocaleString(),
        ]);
      });

      console.log(table.toString());
      this.logger.info('Migration status displayed', { count: response.data.length });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to fetch migration status'));
      this.handleError(error);
    }
  }

  private async runTests(pattern?: string, options: any = {}): Promise<void> {
    const args = ['test'];

    if (pattern) args.push(pattern);
    if (options.watch) args.push('--watch');
    if (options.coverage) args.push('--coverage');
    if (options.updateSnapshots) args.push('--updateSnapshot');
    if (options.testPathPattern) args.push('--testPathPattern', options.testPathPattern);

    this.spinner = ora('Running tests').start();

    try {
      const result = await this.executeCommand('npm', ['run', ...args]);
      this.spinner.succeed(chalk.green('Tests completed'));
      console.log(result.stdout);
      this.logger.info('Tests completed', { pattern, options });
    } catch (error) {
      this.spinner?.fail(chalk.red('Tests failed'));
      this.handleError(error);
    }
  }

  private async buildApplication(
    environment: string,
    watch?: boolean,
    analyze?: boolean
  ): Promise<void> {
    this.spinner = ora(`Building application (${environment})`).start();

    try {
      const args = ['run', 'build'];
      if (watch) args.push('--watch');
      if (analyze) args.push('--analyze');

      const result = await this.executeCommand('npm', args, {
        env: { ...process.env, NODE_ENV: environment },
      });

      this.spinner.succeed(chalk.green('Build completed successfully'));
      console.log(result.stdout);
      this.logger.info('Build completed', { environment, watch, analyze });
    } catch (error) {
      this.spinner?.fail(chalk.red('Build failed'));
      this.handleError(error);
    }
  }

  private async deployApplication(
    environment: string,
    skipConfirm?: boolean,
    build: boolean = true
  ): Promise<void> {
    if (environment === 'production' && !skipConfirm) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.yellow('Deploy to PRODUCTION? This cannot be undone.'),
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Deployment cancelled'));
        return;
      }
    }

    this.spinner = ora(`Deploying to ${environment}`).start();

    try {
      if (build) {
        this.spinner.text = 'Building application...';
        await this.executeCommand('npm', ['run', 'build'], {
          env: { ...process.env, NODE_ENV: environment },
        });
      }

      this.spinner.text = `Deploying to ${environment}...`;
      await this.executeCommand('npm', ['run', 'deploy', environment]);

      this.spinner.succeed(chalk.green(`Deployed to ${environment} successfully`));
      this.logger.info('Deployment completed', { environment });
    } catch (error) {
      this.spinner?.fail(chalk.red('Deployment failed'));
      this.handleError(error);
    }
  }

  private async lintCode(pattern?: string, fix?: boolean): Promise<void> {
    this.spinner = ora('Linting code').start();

    try {
      const args = ['run', 'lint'];
      if (pattern) args.push(pattern);
      if (fix) args.push('--fix');

      const result = await this.executeCommand('npm', args);
      this.spinner.succeed(chalk.green('Linting completed'));
      console.log(result.stdout);
      this.logger.info('Linting completed', { pattern, fix });
    } catch (error) {
      this.spinner?.fail(chalk.red('Linting failed'));
      this.handleError(error);
    }
  }

  private async formatCode(pattern?: string, check?: boolean): Promise<void> {
    this.spinner = ora('Formatting code').start();

    try {
      const args = ['run', 'format'];
      if (pattern) args.push(pattern);
      if (check) args.push('--check');

      const result = await this.executeCommand('npm', args);
      this.spinner.succeed(chalk.green('Formatting completed'));
      console.log(result.stdout);
      this.logger.info('Formatting completed', { pattern, check });
    } catch (error) {
      this.spinner?.fail(chalk.red('Formatting failed'));
      this.handleError(error);
    }
  }

  private async typeCheck(): Promise<void> {
    this.spinner = ora('Running type check').start();

    try {
      const result = await this.executeCommand('npm', ['run', 'type-check']);
      this.spinner.succeed(chalk.green('Type check passed'));
      console.log(result.stdout);
      this.logger.info('Type check completed');
    } catch (error) {
      this.spinner?.fail(chalk.red('Type check failed'));
      this.handleError(error);
    }
  }

  private async auditDependencies(fix?: boolean): Promise<void> {
    this.spinner = ora('Auditing dependencies').start();

    try {
      const args = ['audit'];
      if (fix) args.push('fix');

      const result = await this.executeCommand('npm', args);
      this.spinner.succeed(chalk.green('Audit completed'));
      console.log(result.stdout);
      this.logger.info('Audit completed', { fix });
    } catch (error) {
      this.spinner?.fail(chalk.red('Audit found issues'));
      this.handleError(error);
    }
  }

  private async generateDocs(format: string): Promise<void> {
    this.spinner = ora(`Generating ${format} documentation`).start();

    try {
      const result = await this.executeCommand('npm', ['run', `docs:${format}`]);
      this.spinner.succeed(chalk.green('Documentation generated'));
      console.log(result.stdout);
      this.logger.info('Documentation generated', { format });
    } catch (error) {
      this.spinner?.fail(chalk.red('Documentation generation failed'));
      this.handleError(error);
    }
  }

  private async serveDocs(port: number): Promise<void> {
    console.log(chalk.blue(`Serving documentation at http://localhost:${port}`));

    try {
      await this.executeCommand('npm', ['run', 'docs:serve', '--', `--port=${port}`], {
        stdio: 'inherit',
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private async profilePerformance(target: string, duration: number): Promise<void> {
    this.spinner = ora(`Profiling ${target} for ${duration} seconds`).start();

    try {
      const response = await axios.post(
        `${this.config.apiBaseUrl}/admin/perf/profile`,
        { target, duration },
        { headers: this.getAuthHeaders() }
      );

      this.spinner.succeed(chalk.green('Profiling completed'));
      console.log(chalk.blue('Profile saved to:'), response.data.filePath);
      this.logger.info('Performance profiling completed', { target, duration });
    } catch (error) {
      this.spinner?.fail(chalk.red('Profiling failed'));
      this.handleError(error);
    }
  }

  private async takeHeapSnapshot(): Promise<void> {
    this.spinner = ora('Taking heap snapshot').start();

    try {
      const response = await axios.post(
        `${this.config.apiBaseUrl}/admin/perf/heap-snapshot`,
        {},
        { headers: this.getAuthHeaders() }
      );

      this.spinner.succeed(chalk.green('Heap snapshot taken'));
      console.log(chalk.blue('Snapshot saved to:'), response.data.filePath);
      this.logger.info('Heap snapshot taken');
    } catch (error) {
      this.spinner?.fail(chalk.red('Heap snapshot failed'));
      this.handleError(error);
    }
  }

  private async analyzePerformance(hours: number): Promise<void> {
    this.spinner = ora(`Analyzing performance (last ${hours} hours)`).start();

    try {
      const response = await axios.get(
        `${this.config.apiBaseUrl}/admin/perf/analyze?hours=${hours}`,
        { headers: this.getAuthHeaders() }
      );

      this.spinner.stop();

      const { avgResponseTime, p95ResponseTime, errorRate, requestsPerSecond } = response.data;

      const table = new Table({
        head: ['Metric', 'Value'],
      });

      table.push(
        ['Average Response Time', `${avgResponseTime.toFixed(2)}ms`],
        ['P95 Response Time', `${p95ResponseTime.toFixed(2)}ms`],
        ['Error Rate', `${(errorRate * 100).toFixed(2)}%`],
        ['Requests/Second', requestsPerSecond.toFixed(2)]
      );

      console.log(table.toString());
      this.logger.info('Performance analysis completed', { hours });
    } catch (error) {
      this.spinner?.fail(chalk.red('Performance analysis failed'));
      this.handleError(error);
    }
  }

  private async viewLogs(options: any): Promise<void> {
    this.spinner = ora('Fetching logs').start();

    try {
      const params: any = {
        tail: options.tail || 100,
      };

      if (options.service) params.service = options.service;
      if (options.level) params.level = options.level;
      if (options.follow) params.follow = true;

      const response = await axios.get<LogEntry[]>(
        `${this.config.apiBaseUrl}/admin/logs`,
        {
          params,
          headers: this.getAuthHeaders(),
        }
      );

      this.spinner.stop();

      response.data.forEach((log) => {
        const timestamp = chalk.gray(log.timestamp);
        const level = this.colorizeLogLevel(log.level);
        const service = chalk.cyan(`[${log.service}]`);
        const message = log.message;

        console.log(`${timestamp} ${level} ${service} ${message}`);

        if (log.metadata && Object.keys(log.metadata).length > 0) {
          console.log(chalk.gray(JSON.stringify(log.metadata, null, 2)));
        }
      });

      this.logger.info('Logs displayed', { count: response.data.length });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to fetch logs'));
      this.handleError(error);
    }
  }

  private async analyzeLogs(errorsOnly?: boolean, hours: number = 24): Promise<void> {
    this.spinner = ora(`Analyzing logs (last ${hours} hours)`).start();

    try {
      const response = await axios.get(
        `${this.config.apiBaseUrl}/admin/logs/analyze`,
        {
          params: { hours, errorsOnly },
          headers: this.getAuthHeaders(),
        }
      );

      this.spinner.stop();

      const { totalLogs, errorCount, warningCount, topErrors } = response.data;

      console.log(chalk.blue('\nLog Analysis Summary:'));
      console.log(`Total Logs: ${totalLogs}`);
      console.log(`Errors: ${errorCount}`);
      console.log(`Warnings: ${warningCount}`);

      if (topErrors && topErrors.length > 0) {
        console.log(chalk.red('\nTop Errors:'));
        const table = new Table({
          head: ['Error', 'Count'],
          colWidths: [60, 10],
        });

        topErrors.forEach((error: { message: string; count: number }) => {
          table.push([error.message, error.count.toString()]);
        });

        console.log(table.toString());
      }

      this.logger.info('Log analysis completed', { hours, errorsOnly });
    } catch (error) {
      this.spinner?.fail(chalk.red('Log analysis failed'));
      this.handleError(error);
    }
  }

  private async setSecret(key: string, value: string, environment: string): Promise<void> {
    this.spinner = ora(`Setting secret: ${key} (${environment})`).start();

    try {
      await axios.post(
        `${this.config.apiBaseUrl}/admin/secrets`,
        { key, value, environment },
        { headers: this.getAuthHeaders() }
      );

      this.spinner.succeed(chalk.green(`Secret set: ${key}`));
      this.logger.info('Secret set', { key, environment });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to set secret'));
      this.handleError(error);
    }
  }

  private async getSecret(key: string, environment: string): Promise<void> {
    this.spinner = ora(`Getting secret: ${key} (${environment})`).start();

    try {
      const response = await axios.get(
        `${this.config.apiBaseUrl}/admin/secrets/${key}`,
        {
          params: { environment },
          headers: this.getAuthHeaders(),
        }
      );

      this.spinner.stop();
      console.log(chalk.blue(`${key}:`), response.data.value);
      this.logger.info('Secret retrieved', { key, environment });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to get secret'));
      this.handleError(error);
    }
  }

  private async deleteSecret(key: string, environment: string): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Delete secret ${key} in ${environment}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Cancelled'));
      return;
    }

    this.spinner = ora(`Deleting secret: ${key} (${environment})`).start();

    try {
      await axios.delete(`${this.config.apiBaseUrl}/admin/secrets/${key}`, {
        params: { environment },
        headers: this.getAuthHeaders(),
      });

      this.spinner.succeed(chalk.green(`Secret deleted: ${key}`));
      this.logger.info('Secret deleted', { key, environment });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to delete secret'));
      this.handleError(error);
    }
  }

  private async rotateSecret(key: string, environment: string): Promise<void> {
    this.spinner = ora(`Rotating secret: ${key} (${environment})`).start();

    try {
      const newValue = crypto.randomBytes(32).toString('hex');

      await axios.put(
        `${this.config.apiBaseUrl}/admin/secrets/${key}/rotate`,
        { value: newValue, environment },
        { headers: this.getAuthHeaders() }
      );

      this.spinner.succeed(chalk.green(`Secret rotated: ${key}`));
      console.log(chalk.blue('New value:'), newValue);
      this.logger.info('Secret rotated', { key, environment });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to rotate secret'));
      this.handleError(error);
    }
  }

  private async listSecrets(environment: string): Promise<void> {
    this.spinner = ora(`Listing secrets (${environment})`).start();

    try {
      const response = await axios.get<{ key: string; updatedAt: string }[]>(
        `${this.config.apiBaseUrl}/admin/secrets`,
        {
          params: { environment },
          headers: this.getAuthHeaders(),
        }
      );

      this.spinner.stop();

      const table = new Table({
        head: ['Key', 'Last Updated'],
      });

      response.data.forEach((secret) => {
        table.push([secret.key, new Date(secret.updatedAt).toLocaleString()]);
      });

      console.log(table.toString());
      this.logger.info('Secrets listed', { count: response.data.length, environment });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to list secrets'));
      this.handleError(error);
    }
  }

  private async setFeatureFlag(name: string, enabled: boolean, percentage: number): Promise<void> {
    this.spinner = ora(`Setting feature flag: ${name}`).start();

    try {
      await axios.put(
        `${this.config.apiBaseUrl}/admin/feature-flags/${name}`,
        { enabled, percentage },
        { headers: this.getAuthHeaders() }
      );

      this.spinner.succeed(
        chalk.green(`Feature flag ${enabled ? 'enabled' : 'disabled'}: ${name} (${percentage}%)`)
      );
      this.logger.info('Feature flag updated', { name, enabled, percentage });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to set feature flag'));
      this.handleError(error);
    }
  }

  private async listFeatureFlags(): Promise<void> {
    this.spinner = ora('Listing feature flags').start();

    try {
      const response = await axios.get<FeatureFlag[]>(
        `${this.config.apiBaseUrl}/admin/feature-flags`,
        { headers: this.getAuthHeaders() }
      );

      this.spinner.stop();

      const table = new Table({
        head: ['Name', 'Status', 'Percentage', 'Description'],
        colWidths: [30, 10, 12, 40],
      });

      response.data.forEach((flag) => {
        table.push([
          flag.name,
          flag.enabled ? chalk.green('ON') : chalk.red('OFF'),
          `${flag.percentage}%`,
          flag.description || '-',
        ]);
      });

      console.log(table.toString());
      this.logger.info('Feature flags listed', { count: response.data.length });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to list feature flags'));
      this.handleError(error);
    }
  }

  private async generateMockData(
    entity: string,
    count: number,
    outputFile?: string,
    format: string = 'json'
  ): Promise<void> {
    this.spinner = ora(`Generating ${count} mock ${entity} records`).start();

    try {
      const response = await axios.post(
        `${this.config.apiBaseUrl}/admin/mock/generate`,
        { entity, count, format },
        { headers: this.getAuthHeaders() }
      );

      const data = response.data;

      if (outputFile) {
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
        this.spinner.succeed(chalk.green(`Mock data saved to: ${outputFile}`));
      } else {
        this.spinner.succeed(chalk.green(`Generated ${count} mock ${entity} records`));
        console.log(JSON.stringify(data, null, 2));
      }

      this.logger.info('Mock data generated', { entity, count, format, outputFile });
    } catch (error) {
      this.spinner?.fail(chalk.red('Failed to generate mock data'));
      this.handleError(error);
    }
  }

  private async testAPI(
    method: string,
    apiPath: string,
    body?: string,
    options: any = {}
  ): Promise<void> {
    this.spinner = ora(`Testing: ${method.toUpperCase()} ${apiPath}`).start();

    try {
      const headers = options.headers ? JSON.parse(options.headers) : {};
      if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
      }

      const config: any = {
        method: method.toLowerCase(),
        url: `${this.config.apiBaseUrl}${apiPath}`,
        headers,
      };

      if (body) {
        config.data = JSON.parse(body);
      }

      const startTime = Date.now();
      const response = await axios(config);
      const duration = Date.now() - startTime;

      this.spinner.succeed(chalk.green(`Response: ${response.status} (${duration}ms)`));

      console.log(chalk.blue('\nResponse Headers:'));
      console.log(JSON.stringify(response.headers, null, 2));

      console.log(chalk.blue('\nResponse Body:'));
      console.log(JSON.stringify(response.data, null, 2));

      this.logger.info('API test completed', { method, path: apiPath, status: response.status });
    } catch (error) {
      this.spinner?.fail(chalk.red('API test failed'));
      if (axios.isAxiosError(error) && error.response) {
        console.log(chalk.red(`Status: ${error.response.status}`));
        console.log(JSON.stringify(error.response.data, null, 2));
      }
      this.handleError(error);
    }
  }

  private async exploreAPI(): Promise<void> {
    console.log(chalk.blue('Interactive API Explorer'));
    console.log(chalk.gray('Type "exit" to quit\n'));

    let exploring = true;

    while (exploring) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'method',
          message: 'HTTP Method:',
          choices: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        },
        {
          type: 'input',
          name: 'path',
          message: 'Path (e.g., /users):',
          validate: (input) => input.length > 0 || 'Path is required',
        },
        {
          type: 'input',
          name: 'body',
          message: 'Request Body (JSON):',
          when: (answers) => ['POST', 'PUT', 'PATCH'].includes(answers.method),
        },
        {
          type: 'confirm',
          name: 'continue',
          message: 'Make another request?',
          default: true,
        },
      ]);

      await this.testAPI(answers.method, answers.path, answers.body);

      if (!answers.continue) {
        exploring = false;
      }
    }
  }

  private async healthCheckAll(): Promise<void> {
    this.spinner = ora('Checking health of all services').start();

    try {
      const response = await axios.get<HealthCheckResult[]>(
        `${this.config.apiBaseUrl}/admin/health`,
        { headers: this.getAuthHeaders() }
      );

      this.spinner.stop();

      const table = new Table({
        head: ['Service', 'Status', 'Response Time'],
      });

      response.data.forEach((result) => {
        const status =
          result.status === 'healthy'
            ? chalk.green('HEALTHY')
            : result.status === 'degraded'
            ? chalk.yellow('DEGRADED')
            : chalk.red('DOWN');

        table.push([result.service, status, `${result.responseTime}ms`]);
      });

      console.log(table.toString());
      this.logger.info('Health check completed');
    } catch (error) {
      this.spinner?.fail(chalk.red('Health check failed'));
      this.handleError(error);
    }
  }

  private async pingService(service: string): Promise<void> {
    this.spinner = ora(`Pinging ${service}`).start();

    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.config.apiBaseUrl}/admin/health/${service}`, {
        headers: this.getAuthHeaders(),
      });
      const duration = Date.now() - startTime;

      this.spinner.succeed(
        chalk.green(`${service} is ${response.data.status} (${duration}ms)`)
      );
      this.logger.info('Service pinged', { service, status: response.data.status });
    } catch (error) {
      this.spinner?.fail(chalk.red(`Failed to ping ${service}`));
      this.handleError(error);
    }
  }

  private async startInteractiveShell(): Promise<void> {
    console.log(chalk.blue('UpCoach Interactive Shell'));
    console.log(chalk.gray('Type "help" for available commands, "exit" to quit\n'));

    let running = true;

    while (running) {
      const { command } = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: 'upcoach>',
        },
      ]);

      if (command.trim() === 'exit') {
        running = false;
        console.log(chalk.blue('Goodbye!'));
      } else if (command.trim() === 'help') {
        this.program.outputHelp();
      } else if (command.trim()) {
        try {
          const args = command.split(' ');
          await this.program.parseAsync(['node', 'upcoach', ...args]);
        } catch (error) {
          console.error(chalk.red('Command failed:'), error);
        }
      }
    }
  }

  private parseFields(fieldsStr?: string): Array<{ name: string; type: string }> {
    if (!fieldsStr) return [];

    return fieldsStr.split(',').map((field) => {
      const [name, type] = field.trim().split(':');
      return { name, type: type || 'string' };
    });
  }

  private async getGitAuthor(): Promise<string> {
    try {
      const result = await this.executeCommand('git', ['config', 'user.name']);
      return result.stdout.trim();
    } catch {
      return 'Unknown';
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = process.env.UPCOACH_API_TOKEN || '';
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private colorizeLogLevel(level: string): string {
    switch (level.toLowerCase()) {
      case 'error':
        return chalk.red(level.toUpperCase());
      case 'warn':
        return chalk.yellow(level.toUpperCase());
      case 'info':
        return chalk.blue(level.toUpperCase());
      case 'debug':
        return chalk.gray(level.toUpperCase());
      default:
        return level.toUpperCase();
    }
  }

  private async executeCommand(
    command: string,
    args: string[],
    options: any = {}
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        ...options,
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with exit code ${code}\n${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private handleError(error: any): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(chalk.red(`API Error: ${axiosError.response.status}`));
        console.error(axiosError.response.data);
      } else if (axiosError.request) {
        console.error(chalk.red('No response from API'));
      } else {
        console.error(chalk.red(`Request Error: ${axiosError.message}`));
      }
    } else if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('Unknown error occurred'));
    }

    this.logger.error('Command failed', { error: error.message || error });
  }

  public run(args: string[]): void {
    this.program.parse(args);
  }
}

const cli = new DeveloperCLI();
cli.run(process.argv);

export default DeveloperCLI;
