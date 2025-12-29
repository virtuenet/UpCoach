import { EventEmitter } from 'events';

export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  category: BugCategory;
  affectedComponents: string[];
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: EnvironmentInfo;
  reportedBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolution?: BugResolution;
  attachments: Attachment[];
  relatedBugs: string[];
  impactMetrics: ImpactMetrics;
}

export enum BugSeverity {
  CRITICAL = 'critical', // System crash, data loss
  HIGH = 'high',         // Major functionality broken
  MEDIUM = 'medium',     // Minor functionality affected
  LOW = 'low',           // Cosmetic issues
  TRIVIAL = 'trivial',   // Very minor issues
}

export enum BugPriority {
  P0 = 'p0', // Immediate fix required
  P1 = 'p1', // Fix in next release
  P2 = 'p2', // Fix when possible
  P3 = 'p3', // Fix if time permits
}

export enum BugStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  VERIFIED = 'verified',
  CLOSED = 'closed',
  REOPENED = 'reopened',
  WONT_FIX = 'wont_fix',
  DUPLICATE = 'duplicate',
}

export enum BugCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  API = 'api',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UI_UX = 'ui_ux',
  INTEGRATION = 'integration',
}

export interface BugResolution {
  type: 'fixed' | 'duplicate' | 'wont_fix' | 'cannot_reproduce' | 'by_design';
  description: string;
  fixCommit?: string;
  fixVersion?: string;
}

export interface EnvironmentInfo {
  platform: string;
  browser?: string;
  browserVersion?: string;
  os: string;
  osVersion: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
}

export interface Attachment {
  type: 'screenshot' | 'video' | 'log' | 'file';
  url: string;
  description?: string;
}

export interface ImpactMetrics {
  usersAffected: number;
  reportsCount: number;
  firstReportedAt: Date;
  estimatedRevenueLoss?: number;
  estimatedTimeToFix?: number; // hours
}

export interface BugAnalytics {
  totalBugs: number;
  openBugs: number;
  resolvedBugs: number;
  averageTimeToResolve: number;
  bugsBySeverity: Record<BugSeverity, number>;
  bugsByCategory: Record<BugCategory, number>;
  topAffectedComponents: { component: string; count: number }[];
  resolutionRate: number;
  reopenRate: number;
}

/**
 * Bug Tracker
 *
 * Comprehensive bug tracking and management system for the production launch phase.
 * Tracks bugs, analyzes patterns, and provides insights for quality improvement.
 */
export class BugTracker extends EventEmitter {
  private bugs: Map<string, Bug> = new Map();
  private bugCounter = 1;

  public async reportBug(bugData: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bug> {
    const bug: Bug = {
      ...bugData,
      id: `BUG-${String(this.bugCounter++).padStart(5, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bugs.set(bug.id, bug);
    this.emit('bug:reported', bug);

    // Auto-assign priority based on severity
    if (!bug.priority) {
      bug.priority = this.calculatePriority(bug);
      this.emit('bug:priority_assigned', { bugId: bug.id, priority: bug.priority });
    }

    // Check for duplicates
    const duplicates = await this.findDuplicates(bug);
    if (duplicates.length > 0) {
      this.emit('bug:potential_duplicates', { bugId: bug.id, duplicates });
    }

    return bug;
  }

  private calculatePriority(bug: Bug): BugPriority {
    // Critical severity → P0
    if (bug.severity === BugSeverity.CRITICAL) {
      return BugPriority.P0;
    }

    // High severity + many users → P0
    if (bug.severity === BugSeverity.HIGH && bug.impactMetrics.usersAffected > 1000) {
      return BugPriority.P0;
    }

    // High severity → P1
    if (bug.severity === BugSeverity.HIGH) {
      return BugPriority.P1;
    }

    // Medium severity → P2
    if (bug.severity === BugSeverity.MEDIUM) {
      return BugPriority.P2;
    }

    return BugPriority.P3;
  }

  private async findDuplicates(bug: Bug): Promise<Bug[]> {
    const duplicates: Bug[] = [];

    for (const existingBug of this.bugs.values()) {
      if (existingBug.id === bug.id) continue;

      // Simple similarity check based on title and affected components
      const titleSimilarity = this.calculateSimilarity(bug.title, existingBug.title);
      const componentOverlap = bug.affectedComponents.filter(c =>
        existingBug.affectedComponents.includes(c)
      ).length;

      if (titleSimilarity > 0.7 || componentOverlap > 0) {
        duplicates.push(existingBug);
      }
    }

    return duplicates;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  public async updateBug(bugId: string, updates: Partial<Bug>): Promise<Bug> {
    const bug = this.bugs.get(bugId);
    if (!bug) {
      throw new Error(`Bug not found: ${bugId}`);
    }

    const previousStatus = bug.status;
    Object.assign(bug, updates);
    bug.updatedAt = new Date();

    if (updates.status && updates.status !== previousStatus) {
      this.emit('bug:status_changed', { bugId, previousStatus, newStatus: updates.status });

      if (updates.status === BugStatus.RESOLVED) {
        bug.resolvedAt = new Date();
        this.emit('bug:resolved', bug);
      }
    }

    this.bugs.set(bugId, bug);
    this.emit('bug:updated', bug);

    return bug;
  }

  public async assignBug(bugId: string, assignee: string): Promise<Bug> {
    return this.updateBug(bugId, { assignedTo: assignee });
  }

  public async resolveBug(
    bugId: string,
    resolution: BugResolution
  ): Promise<Bug> {
    return this.updateBug(bugId, {
      status: BugStatus.RESOLVED,
      resolution,
      resolvedAt: new Date(),
    });
  }

  public async closeBug(bugId: string): Promise<Bug> {
    return this.updateBug(bugId, { status: BugStatus.CLOSED });
  }

  public async reopenBug(bugId: string, reason: string): Promise<Bug> {
    const bug = await this.updateBug(bugId, { status: BugStatus.REOPENED });
    this.emit('bug:reopened', { bugId, reason });
    return bug;
  }

  public getBug(bugId: string): Bug | undefined {
    return this.bugs.get(bugId);
  }

  public getBugsByStatus(status: BugStatus): Bug[] {
    return Array.from(this.bugs.values()).filter(b => b.status === status);
  }

  public getBugsBySeverity(severity: BugSeverity): Bug[] {
    return Array.from(this.bugs.values()).filter(b => b.severity === severity);
  }

  public getBugsByPriority(priority: BugPriority): Bug[] {
    return Array.from(this.bugs.values()).filter(b => b.priority === priority);
  }

  public getOpenBugs(): Bug[] {
    return Array.from(this.bugs.values()).filter(b =>
      [BugStatus.NEW, BugStatus.CONFIRMED, BugStatus.IN_PROGRESS, BugStatus.REOPENED].includes(b.status)
    );
  }

  public getCriticalBugs(): Bug[] {
    return Array.from(this.bugs.values()).filter(b =>
      b.severity === BugSeverity.CRITICAL &&
      [BugStatus.NEW, BugStatus.CONFIRMED, BugStatus.IN_PROGRESS].includes(b.status)
    );
  }

  public getAnalytics(): BugAnalytics {
    const allBugs = Array.from(this.bugs.values());
    const totalBugs = allBugs.length;
    const openBugs = this.getOpenBugs().length;
    const resolvedBugs = allBugs.filter(b =>
      [BugStatus.RESOLVED, BugStatus.VERIFIED, BugStatus.CLOSED].includes(b.status)
    ).length;

    // Calculate average time to resolve
    const resolvedBugsWithTime = allBugs.filter(b => b.resolvedAt);
    const averageTimeToResolve = resolvedBugsWithTime.length > 0
      ? resolvedBugsWithTime.reduce((sum, bug) => {
          const duration = bug.resolvedAt!.getTime() - bug.createdAt.getTime();
          return sum + duration;
        }, 0) / resolvedBugsWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Bugs by severity
    const bugsBySeverity = {} as Record<BugSeverity, number>;
    Object.values(BugSeverity).forEach(severity => {
      bugsBySeverity[severity] = allBugs.filter(b => b.severity === severity).length;
    });

    // Bugs by category
    const bugsByCategory = {} as Record<BugCategory, number>;
    Object.values(BugCategory).forEach(category => {
      bugsByCategory[category] = allBugs.filter(b => b.category === category).length;
    });

    // Top affected components
    const componentCounts = new Map<string, number>();
    allBugs.forEach(bug => {
      bug.affectedComponents.forEach(component => {
        componentCounts.set(component, (componentCounts.get(component) || 0) + 1);
      });
    });
    const topAffectedComponents = Array.from(componentCounts.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Resolution rate
    const resolutionRate = totalBugs > 0 ? (resolvedBugs / totalBugs) * 100 : 0;

    // Reopen rate
    const reopenedBugs = allBugs.filter(b => b.status === BugStatus.REOPENED).length;
    const reopenRate = resolvedBugs > 0 ? (reopenedBugs / resolvedBugs) * 100 : 0;

    return {
      totalBugs,
      openBugs,
      resolvedBugs,
      averageTimeToResolve,
      bugsBySeverity,
      bugsByCategory,
      topAffectedComponents,
      resolutionRate,
      reopenRate,
    };
  }

  public generateReport(): string {
    const analytics = this.getAnalytics();
    const criticalBugs = this.getCriticalBugs();

    return `
# Bug Tracker Report

## Summary
- **Total Bugs**: ${analytics.totalBugs}
- **Open Bugs**: ${analytics.openBugs}
- **Resolved Bugs**: ${analytics.resolvedBugs}
- **Resolution Rate**: ${analytics.resolutionRate.toFixed(1)}%
- **Reopen Rate**: ${analytics.reopenRate.toFixed(1)}%
- **Avg Time to Resolve**: ${analytics.averageTimeToResolve.toFixed(1)} hours

## Critical Bugs
${criticalBugs.length > 0 ? criticalBugs.map(b => `- ${b.id}: ${b.title}`).join('\n') : 'No critical bugs'}

## Bugs by Severity
${Object.entries(analytics.bugsBySeverity).map(([severity, count]) => `- ${severity}: ${count}`).join('\n')}

## Top Affected Components
${analytics.topAffectedComponents.map(({ component, count }) => `- ${component}: ${count} bugs`).join('\n')}
    `.trim();
  }
}

export default BugTracker;
