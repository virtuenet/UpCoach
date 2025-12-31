import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import crypto from 'crypto';
import { diff as jsdiff, Change } from 'diff';

/**
 * Workflow Versioning System
 *
 * Production-ready version control system for workflows with Git-like features,
 * branching, merging, conflict detection, and audit trail.
 *
 * Features:
 * - Git-like version control for workflows
 * - Version creation with commit messages
 * - Complete version history tracking
 * - Diff generation between versions
 * - Rollback to previous versions
 * - Branch support (draft, production, testing, feature branches)
 * - Merge conflict detection and resolution
 * - Version tagging (v1.0, v2.0, custom tags)
 * - Automatic change log generation
 * - Complete audit trail
 * - Collaborative editing with file locking
 * - Version comparison UI data
 * - Semantic versioning support
 */

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string;
  branch: string;
  commitMessage: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  parentVersionId?: string;
  snapshot: WorkflowSnapshot;
  tags: string[];
  metadata: VersionMetadata;
}

export interface WorkflowSnapshot {
  name: string;
  description: string;
  trigger: any;
  actions: any[];
  conditions: any[];
  settings: any;
  variables: Record<string, any>;
}

export interface VersionMetadata {
  changeType: 'create' | 'update' | 'merge' | 'rollback';
  changesCount: number;
  affectedSteps: string[];
  breaking: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  deployedAt?: Date;
}

export interface VersionDiff {
  versionA: string;
  versionB: string;
  changes: WorkflowChange[];
  summary: DiffSummary;
  conflicts: MergeConflict[];
}

export interface WorkflowChange {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface DiffSummary {
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  breakingChanges: number;
}

export interface MergeConflict {
  path: string;
  currentValue: any;
  incomingValue: any;
  baseValue?: any;
  resolution?: 'current' | 'incoming' | 'manual';
  resolvedValue?: any;
}

export interface Branch {
  name: string;
  workflowId: string;
  baseVersion: string;
  currentVersion: string;
  createdAt: Date;
  createdBy: string;
  status: 'active' | 'merged' | 'abandoned';
  mergedAt?: Date;
  description: string;
}

export interface VersionTag {
  name: string;
  versionId: string;
  type: 'release' | 'milestone' | 'custom';
  description: string;
  createdAt: Date;
  createdBy: string;
}

export interface ChangeLog {
  workflowId: string;
  fromVersion: string;
  toVersion: string;
  entries: ChangeLogEntry[];
  generatedAt: Date;
}

export interface ChangeLogEntry {
  version: string;
  date: Date;
  author: string;
  commitMessage: string;
  changes: string[];
  breaking: boolean;
}

export interface EditLock {
  workflowId: string;
  branch: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
  sessionId: string;
}

export interface MergeResult {
  success: boolean;
  mergedVersionId?: string;
  conflicts: MergeConflict[];
  message: string;
}

export class WorkflowVersioning extends EventEmitter {
  private redis: Redis;
  private versions: Map<string, WorkflowVersion>;
  private branches: Map<string, Branch>;
  private locks: Map<string, EditLock>;

  constructor() {
    super();

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 9, // Versioning DB
    });

    this.versions = new Map();
    this.branches = new Map();
    this.locks = new Map();

    this.setupLockCleanup();
  }

  /**
   * Create initial version
   */
  async createInitialVersion(
    workflowId: string,
    snapshot: WorkflowSnapshot,
    authorId: string,
    authorName: string
  ): Promise<WorkflowVersion> {
    const version: WorkflowVersion = {
      id: this.generateVersionId(),
      workflowId,
      version: '1.0.0',
      branch: 'main',
      commitMessage: 'Initial version',
      authorId,
      authorName,
      createdAt: new Date(),
      snapshot,
      tags: ['v1.0.0'],
      metadata: {
        changeType: 'create',
        changesCount: 0,
        affectedSteps: [],
        breaking: false,
      },
    };

    await this.saveVersion(version);
    this.versions.set(version.id, version);

    // Create main branch
    await this.createBranch(workflowId, 'main', version.id, authorId, 'Main production branch');

    this.emit('version:created', version);

    return version;
  }

  /**
   * Create new version
   */
  async createVersion(
    workflowId: string,
    branch: string,
    snapshot: WorkflowSnapshot,
    commitMessage: string,
    authorId: string,
    authorName: string
  ): Promise<WorkflowVersion> {
    // Get current version on branch
    const currentVersion = await this.getCurrentVersion(workflowId, branch);

    if (!currentVersion) {
      throw new Error(`No current version found for workflow ${workflowId} on branch ${branch}`);
    }

    // Calculate diff
    const diff = this.calculateDiff(currentVersion.snapshot, snapshot);

    // Determine new version number
    const newVersionNumber = this.incrementVersion(currentVersion.version, diff.summary.breakingChanges > 0);

    const version: WorkflowVersion = {
      id: this.generateVersionId(),
      workflowId,
      version: newVersionNumber,
      branch,
      commitMessage,
      authorId,
      authorName,
      createdAt: new Date(),
      parentVersionId: currentVersion.id,
      snapshot,
      tags: [],
      metadata: {
        changeType: 'update',
        changesCount: diff.summary.totalChanges,
        affectedSteps: diff.changes.map(c => c.path).filter(p => p.startsWith('actions')),
        breaking: diff.summary.breakingChanges > 0,
      },
    };

    await this.saveVersion(version);
    this.versions.set(version.id, version);

    // Update branch
    await this.updateBranchVersion(workflowId, branch, version.id);

    this.emit('version:created', version);

    return version;
  }

  /**
   * Get version history
   */
  async getVersionHistory(
    workflowId: string,
    branch?: string,
    limit: number = 50
  ): Promise<WorkflowVersion[]> {
    const cacheKey = `history:${workflowId}:${branch || 'all'}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const allVersions = Array.from(this.versions.values())
      .filter(v => v.workflowId === workflowId)
      .filter(v => !branch || v.branch === branch)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(allVersions));

    return allVersions;
  }

  /**
   * Get specific version
   */
  async getVersion(versionId: string): Promise<WorkflowVersion | null> {
    const cached = await this.redis.get(`version:${versionId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const version = this.versions.get(versionId);
    if (version) {
      await this.redis.setex(`version:${versionId}`, 3600, JSON.stringify(version));
    }

    return version || null;
  }

  /**
   * Generate diff between versions
   */
  async generateDiff(versionIdA: string, versionIdB: string): Promise<VersionDiff> {
    const versionA = await this.getVersion(versionIdA);
    const versionB = await this.getVersion(versionIdB);

    if (!versionA || !versionB) {
      throw new Error('One or both versions not found');
    }

    const changes = this.calculateDiff(versionA.snapshot, versionB.snapshot);
    const conflicts = this.detectConflicts(versionA.snapshot, versionB.snapshot);

    return {
      versionA: versionA.version,
      versionB: versionB.version,
      changes: changes.changes,
      summary: changes.summary,
      conflicts,
    };
  }

  /**
   * Calculate diff between snapshots
   */
  private calculateDiff(snapshotA: WorkflowSnapshot, snapshotB: WorkflowSnapshot): {
    changes: WorkflowChange[];
    summary: DiffSummary;
  } {
    const changes: WorkflowChange[] = [];

    // Compare name
    if (snapshotA.name !== snapshotB.name) {
      changes.push({
        type: 'modified',
        path: 'name',
        oldValue: snapshotA.name,
        newValue: snapshotB.name,
        description: `Name changed from "${snapshotA.name}" to "${snapshotB.name}"`,
      });
    }

    // Compare description
    if (snapshotA.description !== snapshotB.description) {
      changes.push({
        type: 'modified',
        path: 'description',
        oldValue: snapshotA.description,
        newValue: snapshotB.description,
        description: 'Description updated',
      });
    }

    // Compare trigger
    const triggerDiff = this.deepCompare(snapshotA.trigger, snapshotB.trigger);
    if (triggerDiff.length > 0) {
      changes.push({
        type: 'modified',
        path: 'trigger',
        oldValue: snapshotA.trigger,
        newValue: snapshotB.trigger,
        description: `Trigger configuration changed: ${triggerDiff.join(', ')}`,
      });
    }

    // Compare actions
    const actionChanges = this.compareArrays(snapshotA.actions, snapshotB.actions, 'actions');
    changes.push(...actionChanges);

    // Compare conditions
    const conditionChanges = this.compareArrays(snapshotA.conditions, snapshotB.conditions, 'conditions');
    changes.push(...conditionChanges);

    // Compare settings
    const settingsDiff = this.deepCompare(snapshotA.settings, snapshotB.settings);
    if (settingsDiff.length > 0) {
      changes.push({
        type: 'modified',
        path: 'settings',
        oldValue: snapshotA.settings,
        newValue: snapshotB.settings,
        description: `Settings changed: ${settingsDiff.join(', ')}`,
      });
    }

    // Calculate summary
    const additions = changes.filter(c => c.type === 'added').length;
    const deletions = changes.filter(c => c.type === 'removed').length;
    const modifications = changes.filter(c => c.type === 'modified').length;

    // Detect breaking changes
    const breakingChanges = changes.filter(c =>
      c.path === 'trigger' || (c.path.startsWith('actions') && c.type === 'removed')
    ).length;

    return {
      changes,
      summary: {
        totalChanges: changes.length,
        additions,
        deletions,
        modifications,
        breakingChanges,
      },
    };
  }

  /**
   * Compare arrays and generate changes
   */
  private compareArrays(arrayA: any[], arrayB: any[], basePath: string): WorkflowChange[] {
    const changes: WorkflowChange[] = [];

    // Create maps by ID for easier comparison
    const mapA = new Map(arrayA.map((item, idx) => [item.id || idx, item]));
    const mapB = new Map(arrayB.map((item, idx) => [item.id || idx, item]));

    // Find added and modified
    for (const [id, itemB] of mapB.entries()) {
      const itemA = mapA.get(id);

      if (!itemA) {
        changes.push({
          type: 'added',
          path: `${basePath}[${id}]`,
          newValue: itemB,
          description: `Added ${basePath} item: ${itemB.name || id}`,
        });
      } else {
        const itemDiff = this.deepCompare(itemA, itemB);
        if (itemDiff.length > 0) {
          changes.push({
            type: 'modified',
            path: `${basePath}[${id}]`,
            oldValue: itemA,
            newValue: itemB,
            description: `Modified ${basePath} item: ${itemDiff.join(', ')}`,
          });
        }
      }
    }

    // Find removed
    for (const [id, itemA] of mapA.entries()) {
      if (!mapB.has(id)) {
        changes.push({
          type: 'removed',
          path: `${basePath}[${id}]`,
          oldValue: itemA,
          description: `Removed ${basePath} item: ${itemA.name || id}`,
        });
      }
    }

    return changes;
  }

  /**
   * Deep compare objects
   */
  private deepCompare(objA: any, objB: any, path: string = ''): string[] {
    const differences: string[] = [];

    if (typeof objA !== typeof objB) {
      differences.push(`${path || 'root'} type changed`);
      return differences;
    }

    if (typeof objA !== 'object' || objA === null) {
      if (objA !== objB) {
        differences.push(path || 'value');
      }
      return differences;
    }

    const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;

      if (!(key in objA)) {
        differences.push(`${newPath} added`);
      } else if (!(key in objB)) {
        differences.push(`${newPath} removed`);
      } else if (JSON.stringify(objA[key]) !== JSON.stringify(objB[key])) {
        differences.push(newPath);
      }
    }

    return differences;
  }

  /**
   * Detect merge conflicts
   */
  private detectConflicts(snapshotA: WorkflowSnapshot, snapshotB: WorkflowSnapshot): MergeConflict[] {
    const conflicts: MergeConflict[] = [];

    // Check for conflicting trigger changes
    if (JSON.stringify(snapshotA.trigger) !== JSON.stringify(snapshotB.trigger)) {
      conflicts.push({
        path: 'trigger',
        currentValue: snapshotA.trigger,
        incomingValue: snapshotB.trigger,
      });
    }

    // Check for conflicting action changes
    const actionsA = new Map(snapshotA.actions.map(a => [a.id, a]));
    const actionsB = new Map(snapshotB.actions.map(a => [a.id, a]));

    for (const [id, actionA] of actionsA.entries()) {
      const actionB = actionsB.get(id);
      if (actionB && JSON.stringify(actionA) !== JSON.stringify(actionB)) {
        conflicts.push({
          path: `actions[${id}]`,
          currentValue: actionA,
          incomingValue: actionB,
        });
      }
    }

    return conflicts;
  }

  /**
   * Rollback to previous version
   */
  async rollbackToVersion(
    workflowId: string,
    versionId: string,
    branch: string,
    authorId: string,
    authorName: string,
    reason: string
  ): Promise<WorkflowVersion> {
    const targetVersion = await this.getVersion(versionId);

    if (!targetVersion || targetVersion.workflowId !== workflowId) {
      throw new Error('Invalid version for rollback');
    }

    // Create new version with rollback snapshot
    const rollbackVersion: WorkflowVersion = {
      id: this.generateVersionId(),
      workflowId,
      version: this.incrementVersion(targetVersion.version, false),
      branch,
      commitMessage: `Rollback to version ${targetVersion.version}: ${reason}`,
      authorId,
      authorName,
      createdAt: new Date(),
      parentVersionId: versionId,
      snapshot: { ...targetVersion.snapshot },
      tags: [`rollback-from-${targetVersion.version}`],
      metadata: {
        changeType: 'rollback',
        changesCount: 0,
        affectedSteps: [],
        breaking: false,
      },
    };

    await this.saveVersion(rollbackVersion);
    this.versions.set(rollbackVersion.id, rollbackVersion);

    await this.updateBranchVersion(workflowId, branch, rollbackVersion.id);

    this.emit('version:rollback', { rollbackVersion, targetVersion });

    return rollbackVersion;
  }

  /**
   * Create branch
   */
  async createBranch(
    workflowId: string,
    branchName: string,
    baseVersionId: string,
    createdBy: string,
    description: string = ''
  ): Promise<Branch> {
    const branchKey = `${workflowId}:${branchName}`;

    if (this.branches.has(branchKey)) {
      throw new Error(`Branch ${branchName} already exists`);
    }

    const branch: Branch = {
      name: branchName,
      workflowId,
      baseVersion: baseVersionId,
      currentVersion: baseVersionId,
      createdAt: new Date(),
      createdBy,
      status: 'active',
      description,
    };

    this.branches.set(branchKey, branch);
    await this.redis.set(`branch:${branchKey}`, JSON.stringify(branch));

    this.emit('branch:created', branch);

    return branch;
  }

  /**
   * Merge branch
   */
  async mergeBranch(
    workflowId: string,
    sourceBranch: string,
    targetBranch: string,
    authorId: string,
    authorName: string,
    conflictResolutions?: MergeConflict[]
  ): Promise<MergeResult> {
    const sourceVersion = await this.getCurrentVersion(workflowId, sourceBranch);
    const targetVersion = await this.getCurrentVersion(workflowId, targetBranch);

    if (!sourceVersion || !targetVersion) {
      return {
        success: false,
        conflicts: [],
        message: 'Source or target branch not found',
      };
    }

    // Detect conflicts
    const conflicts = this.detectConflicts(targetVersion.snapshot, sourceVersion.snapshot);

    // If there are unresolved conflicts
    if (conflicts.length > 0 && !conflictResolutions) {
      return {
        success: false,
        conflicts,
        message: `Found ${conflicts.length} conflicts that need resolution`,
      };
    }

    // Merge snapshots
    const mergedSnapshot = this.mergeSnapshots(
      targetVersion.snapshot,
      sourceVersion.snapshot,
      conflictResolutions || []
    );

    // Create merge version
    const mergeVersion: WorkflowVersion = {
      id: this.generateVersionId(),
      workflowId,
      version: this.incrementVersion(targetVersion.version, false),
      branch: targetBranch,
      commitMessage: `Merge ${sourceBranch} into ${targetBranch}`,
      authorId,
      authorName,
      createdAt: new Date(),
      parentVersionId: targetVersion.id,
      snapshot: mergedSnapshot,
      tags: [`merge-${sourceBranch}`],
      metadata: {
        changeType: 'merge',
        changesCount: conflicts.length,
        affectedSteps: [],
        breaking: false,
      },
    };

    await this.saveVersion(mergeVersion);
    this.versions.set(mergeVersion.id, mergeVersion);

    await this.updateBranchVersion(workflowId, targetBranch, mergeVersion.id);

    // Mark source branch as merged
    const sourceBranchKey = `${workflowId}:${sourceBranch}`;
    const branch = this.branches.get(sourceBranchKey);
    if (branch) {
      branch.status = 'merged';
      branch.mergedAt = new Date();
      await this.redis.set(`branch:${sourceBranchKey}`, JSON.stringify(branch));
    }

    this.emit('branch:merged', { mergeVersion, sourceBranch, targetBranch });

    return {
      success: true,
      mergedVersionId: mergeVersion.id,
      conflicts: [],
      message: 'Branches merged successfully',
    };
  }

  /**
   * Merge snapshots
   */
  private mergeSnapshots(
    base: WorkflowSnapshot,
    incoming: WorkflowSnapshot,
    resolutions: MergeConflict[]
  ): WorkflowSnapshot {
    const merged: WorkflowSnapshot = { ...base };

    // Apply resolutions
    for (const resolution of resolutions) {
      if (resolution.resolution === 'incoming') {
        this.applyValue(merged, resolution.path, resolution.incomingValue);
      } else if (resolution.resolution === 'manual' && resolution.resolvedValue !== undefined) {
        this.applyValue(merged, resolution.path, resolution.resolvedValue);
      }
      // 'current' means keep base value, so no action needed
    }

    // Merge non-conflicting changes
    if (!resolutions.find(r => r.path === 'name')) {
      merged.name = incoming.name || base.name;
    }

    if (!resolutions.find(r => r.path === 'description')) {
      merged.description = incoming.description || base.description;
    }

    return merged;
  }

  /**
   * Apply value to snapshot at path
   */
  private applyValue(snapshot: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = snapshot;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Create version tag
   */
  async createTag(
    versionId: string,
    tagName: string,
    type: 'release' | 'milestone' | 'custom',
    description: string,
    createdBy: string
  ): Promise<VersionTag> {
    const version = await this.getVersion(versionId);

    if (!version) {
      throw new Error('Version not found');
    }

    const tag: VersionTag = {
      name: tagName,
      versionId,
      type,
      description,
      createdAt: new Date(),
      createdBy,
    };

    // Add tag to version
    version.tags.push(tagName);
    await this.saveVersion(version);

    await this.redis.set(`tag:${version.workflowId}:${tagName}`, JSON.stringify(tag));

    this.emit('tag:created', tag);

    return tag;
  }

  /**
   * Generate change log
   */
  async generateChangeLog(
    workflowId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<ChangeLog> {
    const versions = await this.getVersionHistory(workflowId);

    const fromIdx = versions.findIndex(v => v.version === fromVersion);
    const toIdx = versions.findIndex(v => v.version === toVersion);

    if (fromIdx === -1 || toIdx === -1) {
      throw new Error('Version not found in history');
    }

    const relevantVersions = versions.slice(Math.min(fromIdx, toIdx), Math.max(fromIdx, toIdx) + 1);

    const entries: ChangeLogEntry[] = relevantVersions.map(v => {
      const changes: string[] = [];

      if (v.metadata.affectedSteps.length > 0) {
        changes.push(`Modified ${v.metadata.affectedSteps.length} workflow steps`);
      }

      if (v.metadata.changeType === 'merge') {
        changes.push('Merged branch changes');
      }

      if (v.metadata.changeType === 'rollback') {
        changes.push('Rolled back to previous version');
      }

      return {
        version: v.version,
        date: v.createdAt,
        author: v.authorName,
        commitMessage: v.commitMessage,
        changes,
        breaking: v.metadata.breaking,
      };
    });

    return {
      workflowId,
      fromVersion,
      toVersion,
      entries,
      generatedAt: new Date(),
    };
  }

  /**
   * Acquire edit lock
   */
  async acquireLock(
    workflowId: string,
    branch: string,
    userId: string,
    sessionId: string,
    durationMinutes: number = 15
  ): Promise<EditLock> {
    const lockKey = `${workflowId}:${branch}`;

    // Check existing lock
    const existingLock = this.locks.get(lockKey);
    if (existingLock && existingLock.expiresAt > new Date()) {
      if (existingLock.lockedBy !== userId) {
        throw new Error(`Workflow is locked by ${existingLock.lockedBy} until ${existingLock.expiresAt}`);
      }
    }

    const lock: EditLock = {
      workflowId,
      branch,
      lockedBy: userId,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60000),
      sessionId,
    };

    this.locks.set(lockKey, lock);
    await this.redis.setex(`lock:${lockKey}`, durationMinutes * 60, JSON.stringify(lock));

    this.emit('lock:acquired', lock);

    return lock;
  }

  /**
   * Release edit lock
   */
  async releaseLock(workflowId: string, branch: string, userId: string): Promise<void> {
    const lockKey = `${workflowId}:${branch}`;
    const lock = this.locks.get(lockKey);

    if (!lock || lock.lockedBy !== userId) {
      throw new Error('Lock not found or not owned by user');
    }

    this.locks.delete(lockKey);
    await this.redis.del(`lock:${lockKey}`);

    this.emit('lock:released', lock);
  }

  /**
   * Get version comparison data for UI
   */
  async getVersionComparison(versionIdA: string, versionIdB: string): Promise<{
    versionA: WorkflowVersion;
    versionB: WorkflowVersion;
    diff: VersionDiff;
    visualDiff: any;
  }> {
    const versionA = await this.getVersion(versionIdA);
    const versionB = await this.getVersion(versionIdB);

    if (!versionA || !versionB) {
      throw new Error('Version not found');
    }

    const diff = await this.generateDiff(versionIdA, versionIdB);

    // Generate visual diff for UI
    const visualDiff = {
      name: this.generateTextDiff(versionA.snapshot.name, versionB.snapshot.name),
      description: this.generateTextDiff(versionA.snapshot.description, versionB.snapshot.description),
      actions: this.generateArrayDiff(versionA.snapshot.actions, versionB.snapshot.actions),
    };

    return {
      versionA,
      versionB,
      diff,
      visualDiff,
    };
  }

  /**
   * Generate text diff for UI
   */
  private generateTextDiff(textA: string, textB: string): Change[] {
    return jsdiff.diffWords(textA, textB);
  }

  /**
   * Generate array diff for UI
   */
  private generateArrayDiff(arrayA: any[], arrayB: any[]): any {
    const mapA = new Map(arrayA.map((item, idx) => [item.id || idx, item]));
    const mapB = new Map(arrayB.map((item, idx) => [item.id || idx, item]));

    const result: any = {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
    };

    for (const [id, itemB] of mapB.entries()) {
      const itemA = mapA.get(id);
      if (!itemA) {
        result.added.push(itemB);
      } else if (JSON.stringify(itemA) !== JSON.stringify(itemB)) {
        result.modified.push({ old: itemA, new: itemB });
      } else {
        result.unchanged.push(itemB);
      }
    }

    for (const [id, itemA] of mapA.entries()) {
      if (!mapB.has(id)) {
        result.removed.push(itemA);
      }
    }

    return result;
  }

  /**
   * Setup lock cleanup
   */
  private setupLockCleanup(): void {
    // Clean up expired locks every minute
    setInterval(() => {
      const now = new Date();
      for (const [key, lock] of this.locks.entries()) {
        if (lock.expiresAt < now) {
          this.locks.delete(key);
          this.emit('lock:expired', lock);
        }
      }
    }, 60000);
  }

  /**
   * Increment version number
   */
  private incrementVersion(currentVersion: string, breaking: boolean): string {
    const parts = currentVersion.split('.').map(Number);

    if (breaking) {
      // Major version bump
      return `${parts[0] + 1}.0.0`;
    } else {
      // Minor version bump
      return `${parts[0]}.${parts[1] + 1}.0`;
    }
  }

  /**
   * Generate version ID
   */
  private generateVersionId(): string {
    return `ver_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Get current version on branch
   */
  private async getCurrentVersion(workflowId: string, branch: string): Promise<WorkflowVersion | null> {
    const branchKey = `${workflowId}:${branch}`;
    const branchData = this.branches.get(branchKey);

    if (!branchData) {
      return null;
    }

    return this.getVersion(branchData.currentVersion);
  }

  /**
   * Update branch version
   */
  private async updateBranchVersion(workflowId: string, branch: string, versionId: string): Promise<void> {
    const branchKey = `${workflowId}:${branch}`;
    const branchData = this.branches.get(branchKey);

    if (branchData) {
      branchData.currentVersion = versionId;
      await this.redis.set(`branch:${branchKey}`, JSON.stringify(branchData));
    }
  }

  /**
   * Save version
   */
  private async saveVersion(version: WorkflowVersion): Promise<void> {
    await this.redis.set(`version:${version.id}`, JSON.stringify(version));

    // Add to workflow's version list
    await this.redis.lpush(`versions:${version.workflowId}`, version.id);
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export default WorkflowVersioning;
