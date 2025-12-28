/**
 * Patch Management Service - Phase 13 Week 2
 * Automated security patch monitoring, testing, and deployment
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Patch {
  id: string;
  package: string;
  currentVersion: string;
  targetVersion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'testing' | 'approved' | 'applied' | 'failed' | 'rejected';
  cveIds: string[];
  description: string;
  releasedAt: Date;
  detectedAt: Date;
  appliedAt?: Date;
  failureReason?: string;
  testResults?: TestResult[];
  requiresManualApproval: boolean;
  rollbackAvailable: boolean;
}

export interface TestResult {
  testType: 'unit' | 'integration' | 'e2e' | 'performance';
  passed: boolean;
  duration: number;
  errors?: string[];
  timestamp: Date;
}

export interface PatchSchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  hour: number; // 0-23
  timezone: string;
  environment: 'staging' | 'production';
}

export class PatchManagementService extends EventEmitter {
  private patches: Map<string, Patch> = new Map();
  private schedules: PatchSchedule[] = [];
  private autoApplyThreshold: { critical: boolean; high: boolean; medium: boolean; low: boolean };

  constructor() {
    super();

    // Auto-apply settings (production defaults: only low/medium)
    this.autoApplyThreshold = {
      critical: false, // Manual approval required
      high: false,     // Manual approval required
      medium: true,    // Auto-apply after testing
      low: true        // Auto-apply after testing
    };

    // Default maintenance windows
    this.schedules = [
      { dayOfWeek: 3, hour: 2, timezone: 'UTC', environment: 'staging' },     // Wednesday 2AM UTC
      { dayOfWeek: 6, hour: 3, timezone: 'UTC', environment: 'production' }   // Saturday 3AM UTC
    ];
  }

  /**
   * Scan for available security patches
   */
  async scanForPatches(): Promise<Patch[]> {
    try {
      // Scan npm dependencies
      const npmPatches = await this.scanNpmPackages();

      // Scan system packages (Ubuntu/Debian)
      const systemPatches = await this.scanSystemPackages();

      const allPatches = [...npmPatches, ...systemPatches];

      // Store new patches
      for (const patch of allPatches) {
        if (!this.patches.has(patch.id)) {
          this.patches.set(patch.id, patch);
          this.emit('patch:detected', patch);

          // Auto-trigger testing for eligible patches
          if (this.shouldAutoApply(patch)) {
            await this.scheduleTesting(patch.id);
          }
        }
      }

      return allPatches;
    } catch (error) {
      this.emit('patch:scan_error', error);
      throw error;
    }
  }

  /**
   * Scan npm packages for security updates
   */
  private async scanNpmPackages(): Promise<Patch[]> {
    try {
      const { stdout } = await execAsync('npm outdated --json');
      const outdated = JSON.parse(stdout || '{}');

      const patches: Patch[] = [];

      for (const [packageName, info] of Object.entries<any>(outdated)) {
        // Check if update addresses security vulnerability
        const hasSecurityFix = await this.checkSecurityAdvisory(packageName, info.latest);

        if (hasSecurityFix) {
          const patch: Patch = {
            id: `npm-${packageName}-${Date.now()}`,
            package: packageName,
            currentVersion: info.current,
            targetVersion: info.latest,
            severity: await this.determineSeverity(packageName, info.latest),
            status: 'pending',
            cveIds: await this.getCVEIds(packageName),
            description: `Update ${packageName} from ${info.current} to ${info.latest}`,
            releasedAt: new Date(),
            detectedAt: new Date(),
            requiresManualApproval: false,
            rollbackAvailable: true
          };

          patches.push(patch);
        }
      }

      return patches;
    } catch (error) {
      // npm outdated returns exit code 1 when packages are outdated (not an error)
      return [];
    }
  }

  /**
   * Scan system packages for security updates
   */
  private async scanSystemPackages(): Promise<Patch[]> {
    try {
      // Check if running on Ubuntu/Debian
      const { stdout: osInfo } = await execAsync('cat /etc/os-release || echo ""');

      if (!osInfo.includes('Ubuntu') && !osInfo.includes('Debian')) {
        return []; // Not a Debian-based system
      }

      // Update package lists
      await execAsync('sudo apt-get update -qq');

      // Get list of upgradable packages with security fixes
      const { stdout } = await execAsync('apt list --upgradable 2>/dev/null | grep -i security || echo ""');

      const patches: Patch[] = [];
      const lines = stdout.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const match = line.match(/^(\S+)\/\S+\s+(\S+)\s+\S+\s+\[upgradable from: (\S+)\]/);

        if (match) {
          const [, packageName, targetVersion, currentVersion] = match;

          const patch: Patch = {
            id: `apt-${packageName}-${Date.now()}`,
            package: packageName,
            currentVersion,
            targetVersion,
            severity: 'high', // Assume high for system packages
            status: 'pending',
            cveIds: [],
            description: `System package update: ${packageName}`,
            releasedAt: new Date(),
            detectedAt: new Date(),
            requiresManualApproval: true, // System packages need approval
            rollbackAvailable: true
          };

          patches.push(patch);
        }
      }

      return patches;
    } catch (error) {
      // System package scanning may fail in non-Debian environments
      return [];
    }
  }

  /**
   * Check if package update addresses security vulnerability
   */
  private async checkSecurityAdvisory(packageName: string, version: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`npm view ${packageName}@${version} --json`);
      const packageInfo = JSON.parse(stdout);

      // Check if version includes security fixes
      const keywords = packageInfo.keywords || [];
      const readme = packageInfo.readme || '';

      return keywords.includes('security') ||
             readme.toLowerCase().includes('security') ||
             readme.toLowerCase().includes('vulnerability');
    } catch {
      return false;
    }
  }

  /**
   * Determine patch severity
   */
  private async determineSeverity(packageName: string, version: string): Promise<Patch['severity']> {
    try {
      const { stdout } = await execAsync('npm audit --json');
      const auditData = JSON.parse(stdout);

      if (auditData.vulnerabilities && auditData.vulnerabilities[packageName]) {
        const severity = auditData.vulnerabilities[packageName].severity;
        return severity as Patch['severity'];
      }
    } catch {}

    return 'medium'; // Default
  }

  /**
   * Get CVE IDs for package
   */
  private async getCVEIds(packageName: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync('npm audit --json');
      const auditData = JSON.parse(stdout);

      if (auditData.vulnerabilities && auditData.vulnerabilities[packageName]) {
        const vulnInfo = auditData.vulnerabilities[packageName].via;
        return vulnInfo
          .filter((v: any) => typeof v === 'object' && v.cve)
          .map((v: any) => v.cve);
      }
    } catch {}

    return [];
  }

  /**
   * Schedule patch testing
   */
  async scheduleTesting(patchId: string): Promise<void> {
    const patch = this.patches.get(patchId);

    if (!patch) {
      throw new Error(`Patch ${patchId} not found`);
    }

    patch.status = 'testing';
    this.patches.set(patchId, patch);
    this.emit('patch:testing_scheduled', patch);

    // Run tests in background
    setImmediate(async () => {
      try {
        const testResults = await this.runTests(patchId);
        patch.testResults = testResults;

        const allPassed = testResults.every(t => t.passed);

        if (allPassed) {
          patch.status = 'approved';
          this.emit('patch:approved', patch);

          // Auto-apply if eligible
          if (this.shouldAutoApply(patch)) {
            await this.applyPatch(patchId);
          }
        } else {
          patch.status = 'failed';
          patch.failureReason = 'Test failures';
          this.emit('patch:test_failed', patch);
        }

        this.patches.set(patchId, patch);
      } catch (error) {
        patch.status = 'failed';
        patch.failureReason = error instanceof Error ? error.message : 'Unknown error';
        this.patches.set(patchId, patch);
        this.emit('patch:test_error', { patch, error });
      }
    });
  }

  /**
   * Run automated tests for patch
   */
  private async runTests(patchId: string): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Unit tests
    const unitTest = await this.runTestType('unit');
    results.push(unitTest);

    // Integration tests
    const integrationTest = await this.runTestType('integration');
    results.push(integrationTest);

    // Skip E2E tests for low/medium severity patches (too time-consuming)
    const patch = this.patches.get(patchId);
    if (patch && (patch.severity === 'critical' || patch.severity === 'high')) {
      const e2eTest = await this.runTestType('e2e');
      results.push(e2eTest);
    }

    return results;
  }

  /**
   * Run specific test type
   */
  private async runTestType(testType: TestResult['testType']): Promise<TestResult> {
    const startTime = Date.now();

    try {
      let command = '';

      switch (testType) {
        case 'unit':
          command = 'npm run test:unit';
          break;
        case 'integration':
          command = 'npm run test:integration';
          break;
        case 'e2e':
          command = 'npm run test:e2e';
          break;
        case 'performance':
          command = 'npm run test:performance';
          break;
      }

      await execAsync(command, { timeout: 300000 }); // 5 min timeout

      return {
        testType,
        passed: true,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        testType,
        passed: false,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Test failed'],
        timestamp: new Date()
      };
    }
  }

  /**
   * Apply patch to system
   */
  async applyPatch(patchId: string): Promise<boolean> {
    const patch = this.patches.get(patchId);

    if (!patch) {
      throw new Error(`Patch ${patchId} not found`);
    }

    if (patch.status !== 'approved') {
      throw new Error(`Patch ${patchId} not approved (status: ${patch.status})`);
    }

    try {
      this.emit('patch:applying', patch);

      // Create backup before applying
      await this.createBackup();

      // Apply the patch
      if (patch.package.startsWith('npm-')) {
        await this.applyNpmPatch(patch);
      } else if (patch.package.startsWith('apt-')) {
        await this.applyAptPatch(patch);
      }

      // Verify installation
      const verified = await this.verifyPatch(patch);

      if (verified) {
        patch.status = 'applied';
        patch.appliedAt = new Date();
        this.patches.set(patchId, patch);
        this.emit('patch:applied', patch);
        return true;
      } else {
        throw new Error('Patch verification failed');
      }
    } catch (error) {
      patch.status = 'failed';
      patch.failureReason = error instanceof Error ? error.message : 'Unknown error';
      this.patches.set(patchId, patch);
      this.emit('patch:apply_failed', { patch, error });

      // Attempt rollback
      await this.rollback();

      return false;
    }
  }

  /**
   * Apply npm package patch
   */
  private async applyNpmPatch(patch: Patch): Promise<void> {
    await execAsync(`npm install ${patch.package}@${patch.targetVersion} --save`);
  }

  /**
   * Apply apt package patch
   */
  private async applyAptPatch(patch: Patch): Promise<void> {
    await execAsync(`sudo apt-get install -y ${patch.package}=${patch.targetVersion}`);
  }

  /**
   * Verify patch was applied successfully
   */
  private async verifyPatch(patch: Patch): Promise<boolean> {
    try {
      if (patch.package.startsWith('npm-')) {
        const { stdout } = await execAsync(`npm list ${patch.package} --depth=0 --json`);
        const packageInfo = JSON.parse(stdout);
        const installedVersion = packageInfo.dependencies?.[patch.package]?.version;
        return installedVersion === patch.targetVersion;
      } else if (patch.package.startsWith('apt-')) {
        const { stdout } = await execAsync(`dpkg -s ${patch.package} | grep Version`);
        return stdout.includes(patch.targetVersion);
      }
    } catch {}

    return false;
  }

  /**
   * Create backup before applying patches
   */
  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await execAsync(`cp package.json package.json.backup.${timestamp}`);
    await execAsync(`cp package-lock.json package-lock.json.backup.${timestamp}`);
  }

  /**
   * Rollback to previous state
   */
  private async rollback(): Promise<void> {
    try {
      // Find most recent backup
      const { stdout } = await execAsync('ls -t package.json.backup.* | head -1');
      const backupFile = stdout.trim();

      if (backupFile) {
        await execAsync(`cp ${backupFile} package.json`);
        await execAsync('npm install');
        this.emit('patch:rolled_back');
      }
    } catch (error) {
      this.emit('patch:rollback_failed', error);
    }
  }

  /**
   * Determine if patch should be auto-applied
   */
  private shouldAutoApply(patch: Patch): boolean {
    if (patch.requiresManualApproval) return false;
    return this.autoApplyThreshold[patch.severity];
  }

  /**
   * Get all patches
   */
  getPatches(): Patch[] {
    return Array.from(this.patches.values());
  }

  /**
   * Get patches by status
   */
  getPatchesByStatus(status: Patch['status']): Patch[] {
    return this.getPatches().filter(p => p.status === status);
  }

  /**
   * Get patches by severity
   */
  getPatchesBySeverity(severity: Patch['severity']): Patch[] {
    return this.getPatches().filter(p => p.severity === severity);
  }

  /**
   * Get patch statistics
   */
  getStatistics(): {
    total: number;
    byStatus: Record<Patch['status'], number>;
    bySeverity: Record<Patch['severity'], number>;
    meanTimeToPatching: number; // Hours
  } {
    const patches = this.getPatches();

    const byStatus = {
      pending: 0,
      testing: 0,
      approved: 0,
      applied: 0,
      failed: 0,
      rejected: 0
    };

    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    let totalPatchTime = 0;
    let patchedCount = 0;

    for (const patch of patches) {
      byStatus[patch.status]++;
      bySeverity[patch.severity]++;

      if (patch.appliedAt) {
        const patchTime = patch.appliedAt.getTime() - patch.detectedAt.getTime();
        totalPatchTime += patchTime;
        patchedCount++;
      }
    }

    return {
      total: patches.length,
      byStatus,
      bySeverity,
      meanTimeToPatching: patchedCount > 0 ? totalPatchTime / patchedCount / (1000 * 60 * 60) : 0
    };
  }

  /**
   * Approve patch for application
   */
  async approvePatch(patchId: string): Promise<void> {
    const patch = this.patches.get(patchId);

    if (!patch) {
      throw new Error(`Patch ${patchId} not found`);
    }

    patch.status = 'approved';
    this.patches.set(patchId, patch);
    this.emit('patch:approved', patch);
  }

  /**
   * Reject patch
   */
  async rejectPatch(patchId: string, reason: string): Promise<void> {
    const patch = this.patches.get(patchId);

    if (!patch) {
      throw new Error(`Patch ${patchId} not found`);
    }

    patch.status = 'rejected';
    patch.failureReason = reason;
    this.patches.set(patchId, patch);
    this.emit('patch:rejected', patch);
  }
}
