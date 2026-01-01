import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ESLint } from 'eslint';
import * as ts from 'typescript';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import Benchmark from 'benchmark';
import { execSync } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';

interface OptimizationIssue {
  id: string;
  type: 'sync-operation' | 'blocking-io' | 'inefficient-loop' | 'unnecessary-clone' |
        'json-operation' | 'missing-await' | 'algorithm' | 'data-structure' |
        'redundant-computation' | 'memory-leak' | 'query' | 'bundle';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column: number;
  description: string;
  currentCode: string;
  suggestedCode: string;
  impact: {
    estimatedImprovement: number;
    category: 'cpu' | 'memory' | 'io' | 'network' | 'bundle';
  };
  difficulty: 'low' | 'medium' | 'high';
  autoFixable: boolean;
}

interface AlgorithmSuggestion {
  currentComplexity: string;
  suggestedComplexity: string;
  currentApproach: string;
  suggestedApproach: string;
  reason: string;
  example: string;
}

interface QueryOptimization {
  query: string;
  issues: string[];
  suggestions: string[];
  rewrittenQuery?: string;
  estimatedImprovement: number;
}

interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: Array<{
      name: string;
      size: number;
    }>;
  }>;
  duplicates: Array<{
    module: string;
    count: number;
    size: number;
  }>;
  treeshakingOpportunities: Array<{
    module: string;
    unusedExports: string[];
    potentialSavings: number;
  }>;
}

interface RefactoringResult {
  file: string;
  issueId: string;
  success: boolean;
  originalCode: string;
  refactoredCode: string;
  error?: string;
}

interface BenchmarkResult {
  name: string;
  opsPerSecond: number;
  meanTime: number;
  marginOfError: number;
  relativeMarginOfError: number;
  standardDeviation: number;
}

interface PerformanceReport {
  totalIssues: number;
  issuesBySeverity: Record<string, number>;
  issuesByType: Record<string, number>;
  topOptimizations: OptimizationIssue[];
  estimatedTotalImprovement: number;
  autoFixableCount: number;
}

export class CodeOptimizer extends EventEmitter {
  private static instance: CodeOptimizer;
  private eslint: ESLint;
  private issues: Map<string, OptimizationIssue[]> = new Map();
  private appliedOptimizations: Set<string> = new Set();
  private benchmarkCache: Map<string, BenchmarkResult> = new Map();

  private constructor() {
    super();
    this.eslint = new ESLint({
      useEslintrc: false,
      baseConfig: {
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true
          }
        },
        plugins: ['@typescript-eslint'],
        rules: {
          'no-sync': 'error',
          'no-await-in-loop': 'warn'
        }
      }
    });
  }

  public static getInstance(): CodeOptimizer {
    if (!CodeOptimizer.instance) {
      CodeOptimizer.instance = new CodeOptimizer();
    }
    return CodeOptimizer.instance;
  }

  public async analyzeDirectory(directory: string): Promise<OptimizationIssue[]> {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: directory,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    const allIssues: OptimizationIssue[] = [];

    for (const file of files) {
      const issues = await this.analyzeFile(file);
      allIssues.push(...issues);
      this.issues.set(file, issues);
    }

    this.emit('analysis:complete', {
      filesAnalyzed: files.length,
      issuesFound: allIssues.length
    });

    return allIssues;
  }

  public async analyzeFile(filePath: string): Promise<OptimizationIssue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: OptimizationIssue[] = [];

    issues.push(...await this.detectSyncOperations(filePath, content));
    issues.push(...await this.detectBlockingIO(filePath, content));
    issues.push(...await this.detectInefficientLoops(filePath, content));
    issues.push(...await this.detectUnnecessaryCloning(filePath, content));
    issues.push(...await this.detectExcessiveJSON(filePath, content));
    issues.push(...await this.detectMissingAwait(filePath, content));
    issues.push(...await this.detectMemoryLeaks(filePath, content));
    issues.push(...await this.detectAlgorithmIssues(filePath, content));

    return issues;
  }

  private async detectSyncOperations(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];
    const syncPatterns = [
      { pattern: /fs\.readFileSync/g, async: 'fs.readFile', module: 'fs/promises' },
      { pattern: /fs\.writeFileSync/g, async: 'fs.writeFile', module: 'fs/promises' },
      { pattern: /fs\.readdirSync/g, async: 'fs.readdir', module: 'fs/promises' },
      { pattern: /fs\.statSync/g, async: 'fs.stat', module: 'fs/promises' },
      { pattern: /execSync/g, async: 'exec', module: 'child_process' },
      { pattern: /crypto\.createHash/g, async: 'crypto.createHash (stream)', module: 'crypto' }
    ];

    for (const { pattern, async, module } of syncPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        const lineContent = content.split('\n')[line - 1];

        const isInAsyncContext = this.isInAsyncFunction(content, match.index);

        if (isInAsyncContext) {
          issues.push({
            id: `sync-op-${filePath}-${line}`,
            type: 'sync-operation',
            severity: 'high',
            file: filePath,
            line,
            column: match.index - content.lastIndexOf('\n', match.index),
            description: `Synchronous operation ${match[0]} in async context`,
            currentCode: lineContent.trim(),
            suggestedCode: this.generateAsyncVersion(lineContent, match[0], async),
            impact: {
              estimatedImprovement: 30,
              category: 'io'
            },
            difficulty: 'low',
            autoFixable: true
          });
        }
      }
    }

    return issues;
  }

  private isInAsyncFunction(content: string, position: number): boolean {
    const beforeContent = content.substring(0, position);
    const asyncMatches = beforeContent.match(/async\s+(function|\()/g);
    const functionEnds = beforeContent.match(/^\s*\}/gm);

    if (!asyncMatches) return false;

    return (asyncMatches.length || 0) > (functionEnds?.length || 0);
  }

  private generateAsyncVersion(line: string, syncCall: string, asyncCall: string): string {
    return line.replace(syncCall, `await ${asyncCall}`);
  }

  private async detectBlockingIO(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callee = path.node.callee;

        if (t.isMemberExpression(callee)) {
          const object = callee.object;
          const property = callee.property;

          if (
            t.isIdentifier(object) &&
            object.name === 'crypto' &&
            t.isIdentifier(property) &&
            property.name === 'createHash'
          ) {
            const loc = path.node.loc;
            if (loc) {
              issues.push({
                id: `blocking-io-${filePath}-${loc.start.line}`,
                type: 'blocking-io',
                severity: 'medium',
                file: filePath,
                line: loc.start.line,
                column: loc.start.column,
                description: 'crypto.createHash is CPU-intensive and blocks event loop',
                currentCode: generate(path.node).code,
                suggestedCode: 'Use worker threads or stream-based hashing for large data',
                impact: {
                  estimatedImprovement: 20,
                  category: 'cpu'
                },
                difficulty: 'medium',
                autoFixable: false
              });
            }
          }
        }
      }
    });

    return issues;
  }

  private async detectInefficientLoops(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse(ast, {
      ForStatement: (path: NodePath<t.ForStatement>) => {
        const body = path.node.body;

        if (t.isBlockStatement(body)) {
          let hasNestedLoop = false;

          traverse(
            body,
            {
              ForStatement: () => {
                hasNestedLoop = true;
              },
              WhileStatement: () => {
                hasNestedLoop = true;
              }
            },
            path.scope,
            path
          );

          if (hasNestedLoop) {
            const loc = path.node.loc;
            if (loc) {
              issues.push({
                id: `nested-loop-${filePath}-${loc.start.line}`,
                type: 'inefficient-loop',
                severity: 'high',
                file: filePath,
                line: loc.start.line,
                column: loc.start.column,
                description: 'Nested loop detected - potential O(n²) complexity',
                currentCode: generate(path.node).code.substring(0, 100) + '...',
                suggestedCode: 'Consider using Map/Set for lookups or optimizing algorithm',
                impact: {
                  estimatedImprovement: 50,
                  category: 'cpu'
                },
                difficulty: 'high',
                autoFixable: false
              });
            }
          }
        }

        const hasArrayPush = this.detectArrayPushInLoop(path);
        if (hasArrayPush) {
          const loc = path.node.loc;
          if (loc) {
            issues.push({
              id: `array-push-loop-${filePath}-${loc.start.line}`,
              type: 'inefficient-loop',
              severity: 'medium',
              file: filePath,
              line: loc.start.line,
              column: loc.start.column,
              description: 'Array.push in loop - consider using map/filter',
              currentCode: generate(path.node).code.substring(0, 100) + '...',
              suggestedCode: 'Use array.map() or array.filter() for better performance',
              impact: {
                estimatedImprovement: 15,
                category: 'cpu'
              },
              difficulty: 'low',
              autoFixable: true
            });
          }
        }
      }
    });

    return issues;
  }

  private detectArrayPushInLoop(path: NodePath<t.ForStatement>): boolean {
    let hasPush = false;

    traverse(
      path.node,
      {
        CallExpression: (innerPath: NodePath<t.CallExpression>) => {
          const callee = innerPath.node.callee;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property) &&
            callee.property.name === 'push'
          ) {
            hasPush = true;
          }
        }
      },
      path.scope,
      path
    );

    return hasPush;
  }

  private async detectUnnecessaryCloning(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse(ast, {
      SpreadElement: (path: NodePath<t.SpreadElement>) => {
        const parent = path.parentPath;

        if (
          parent &&
          (t.isObjectExpression(parent.node) || t.isArrayExpression(parent.node))
        ) {
          const loc = path.node.loc;
          if (loc) {
            issues.push({
              id: `spread-clone-${filePath}-${loc.start.line}`,
              type: 'unnecessary-clone',
              severity: 'low',
              file: filePath,
              line: loc.start.line,
              column: loc.start.column,
              description: 'Spread operator creates shallow copy - verify if necessary',
              currentCode: generate(parent.node).code,
              suggestedCode: 'Consider if shallow copy is needed or use reference',
              impact: {
                estimatedImprovement: 10,
                category: 'memory'
              },
              difficulty: 'low',
              autoFixable: false
            });
          }
        }
      },
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callee = path.node.callee;

        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object) &&
          callee.object.name === 'Object' &&
          t.isIdentifier(callee.property) &&
          callee.property.name === 'assign'
        ) {
          const loc = path.node.loc;
          if (loc) {
            issues.push({
              id: `object-assign-${filePath}-${loc.start.line}`,
              type: 'unnecessary-clone',
              severity: 'low',
              file: filePath,
              line: loc.start.line,
              column: loc.start.column,
              description: 'Object.assign creates shallow copy - verify if necessary',
              currentCode: generate(path.node).code,
              suggestedCode: 'Use spread operator or verify if copy is needed',
              impact: {
                estimatedImprovement: 10,
                category: 'memory'
              },
              difficulty: 'low',
              autoFixable: true
            });
          }
        }
      }
    });

    return issues;
  }

  private async detectExcessiveJSON(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    const jsonCalls: Array<{ line: number; type: 'parse' | 'stringify' }> = [];

    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callee = path.node.callee;

        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object) &&
          callee.object.name === 'JSON'
        ) {
          const loc = path.node.loc;
          if (loc && t.isIdentifier(callee.property)) {
            jsonCalls.push({
              line: loc.start.line,
              type: callee.property.name as 'parse' | 'stringify'
            });

            const isInLoop = this.isInsideLoop(path);
            if (isInLoop) {
              issues.push({
                id: `json-in-loop-${filePath}-${loc.start.line}`,
                type: 'json-operation',
                severity: 'high',
                file: filePath,
                line: loc.start.line,
                column: loc.start.column,
                description: `JSON.${callee.property.name} inside loop - expensive operation`,
                currentCode: generate(path.node).code,
                suggestedCode: 'Move JSON operation outside loop or cache result',
                impact: {
                  estimatedImprovement: 40,
                  category: 'cpu'
                },
                difficulty: 'medium',
                autoFixable: false
              });
            }
          }
        }
      }
    });

    return issues;
  }

  private isInsideLoop(path: NodePath): boolean {
    let current = path.parentPath;
    while (current) {
      if (
        current.isForStatement() ||
        current.isWhileStatement() ||
        current.isDoWhileStatement() ||
        current.isForInStatement() ||
        current.isForOfStatement()
      ) {
        return true;
      }
      current = current.parentPath;
    }
    return false;
  }

  private async detectMissingAwait(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callee = path.node.callee;

        if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
          const asyncMethods = ['find', 'findOne', 'findAll', 'create', 'update', 'destroy'];

          if (asyncMethods.includes(callee.property.name)) {
            const parent = path.parentPath;

            if (parent && !parent.isAwaitExpression()) {
              const loc = path.node.loc;
              if (loc) {
                issues.push({
                  id: `missing-await-${filePath}-${loc.start.line}`,
                  type: 'missing-await',
                  severity: 'critical',
                  file: filePath,
                  line: loc.start.line,
                  column: loc.start.column,
                  description: `Potentially missing await for async method ${callee.property.name}`,
                  currentCode: generate(path.node).code,
                  suggestedCode: `await ${generate(path.node).code}`,
                  impact: {
                    estimatedImprovement: 0,
                    category: 'cpu'
                  },
                  difficulty: 'low',
                  autoFixable: true
                });
              }
            }
          }
        }
      }
    });

    return issues;
  }

  private async detectMemoryLeaks(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    const eventListeners: Map<string, number> = new Map();

    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callee = path.node.callee;

        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.property) &&
          (callee.property.name === 'addEventListener' || callee.property.name === 'on')
        ) {
          const loc = path.node.loc;
          if (loc) {
            const key = `${filePath}-${loc.start.line}`;
            eventListeners.set(key, loc.start.line);
          }
        }

        if (
          t.isIdentifier(callee) &&
          (callee.name === 'setInterval' || callee.name === 'setTimeout')
        ) {
          const loc = path.node.loc;
          if (loc) {
            issues.push({
              id: `timer-leak-${filePath}-${loc.start.line}`,
              type: 'memory-leak',
              severity: 'medium',
              file: filePath,
              line: loc.start.line,
              column: loc.start.column,
              description: `${callee.name} may cause memory leak if not cleared`,
              currentCode: generate(path.node).code,
              suggestedCode: `Store timer ID and clear with clear${callee.name.replace('set', '')}`,
              impact: {
                estimatedImprovement: 15,
                category: 'memory'
              },
              difficulty: 'low',
              autoFixable: false
            });
          }
        }
      }
    });

    return issues;
  }

  private async detectAlgorithmIssues(
    filePath: string,
    content: string
  ): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = [];

    const linearSearchPattern = /\.indexOf\(|\.includes\(/g;
    let match;

    while ((match = linearSearchPattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const lineContent = content.split('\n')[line - 1];

      if (lineContent.includes('for') || this.isInHotPath(content, match.index)) {
        issues.push({
          id: `linear-search-${filePath}-${line}`,
          type: 'algorithm',
          severity: 'medium',
          file: filePath,
          line,
          column: match.index - content.lastIndexOf('\n', match.index),
          description: 'Linear search in hot path - consider using Set or Map',
          currentCode: lineContent.trim(),
          suggestedCode: 'const lookupSet = new Set(array); lookupSet.has(item)',
          impact: {
            estimatedImprovement: 35,
            category: 'cpu'
          },
          difficulty: 'low',
          autoFixable: true
        });
      }
    }

    return issues;
  }

  private isInHotPath(content: string, position: number): boolean {
    const beforeContent = content.substring(Math.max(0, position - 500), position);
    return /for\s*\(|while\s*\(|\.map\(|\.forEach\(/.test(beforeContent);
  }

  public suggestAlgorithmImprovement(code: string): AlgorithmSuggestion | null {
    if (code.includes('.sort()') && code.includes('.indexOf')) {
      return {
        currentComplexity: 'O(n log n) + O(n)',
        suggestedComplexity: 'O(n)',
        currentApproach: 'Sort then search',
        suggestedApproach: 'Use Set or Map for O(1) lookup',
        reason: 'Sorting is unnecessary when only checking existence',
        example: 'const set = new Set(array); set.has(item)'
      };
    }

    if (/for\s*\([^)]*\)\s*{[^}]*for\s*\(/s.test(code)) {
      return {
        currentComplexity: 'O(n²)',
        suggestedComplexity: 'O(n)',
        currentApproach: 'Nested loops',
        suggestedApproach: 'Use Map or Set for lookups',
        reason: 'Nested loops create quadratic complexity',
        example: 'const map = new Map(array.map(item => [item.id, item]))'
      };
    }

    return null;
  }

  public async analyzeQuery(query: string): Promise<QueryOptimization> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let estimatedImprovement = 0;

    if (query.includes('SELECT *')) {
      issues.push('Using SELECT * fetches unnecessary columns');
      suggestions.push('Specify only required columns');
      estimatedImprovement += 20;
    }

    if (!query.toUpperCase().includes('WHERE') && !query.toUpperCase().includes('LIMIT')) {
      issues.push('Query without WHERE or LIMIT may fetch entire table');
      suggestions.push('Add WHERE clause or LIMIT to reduce data transfer');
      estimatedImprovement += 30;
    }

    if ((query.match(/JOIN/gi) || []).length > 3) {
      issues.push('Multiple JOINs may be inefficient');
      suggestions.push('Consider denormalization or breaking into multiple queries');
      estimatedImprovement += 25;
    }

    const subqueryCount = (query.match(/\(\s*SELECT/gi) || []).length;
    if (subqueryCount > 0) {
      issues.push('Subqueries can be slow');
      suggestions.push('Consider using JOIN or CTE instead of subqueries');
      estimatedImprovement += 20;
    }

    if (query.includes('LIKE') && query.includes('%')) {
      const likePattern = query.match(/LIKE\s+'%[^']+'/gi);
      if (likePattern) {
        issues.push('Leading wildcard in LIKE prevents index usage');
        suggestions.push('Use full-text search or avoid leading wildcards');
        estimatedImprovement += 40;
      }
    }

    let rewrittenQuery = query;
    if (query.includes('SELECT *')) {
      rewrittenQuery = query.replace('SELECT *', 'SELECT id, name, email');
    }

    return {
      query,
      issues,
      suggestions,
      rewrittenQuery: issues.length > 0 ? rewrittenQuery : undefined,
      estimatedImprovement
    };
  }

  public async analyzeBundleSize(bundlePath: string): Promise<BundleAnalysis> {
    try {
      const stats = await fs.stat(bundlePath);

      const analysis: BundleAnalysis = {
        totalSize: stats.size,
        chunks: [
          {
            name: 'main',
            size: stats.size,
            modules: []
          }
        ],
        duplicates: [],
        treeshakingOpportunities: []
      };

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze bundle: ${error}`);
    }
  }

  public async applyAutoFix(issueId: string): Promise<RefactoringResult> {
    let issue: OptimizationIssue | undefined;
    let filePath: string | undefined;

    for (const [file, issues] of this.issues.entries()) {
      const found = issues.find(i => i.id === issueId);
      if (found) {
        issue = found;
        filePath = file;
        break;
      }
    }

    if (!issue || !filePath) {
      throw new Error(`Issue ${issueId} not found`);
    }

    if (!issue.autoFixable) {
      throw new Error(`Issue ${issueId} is not auto-fixable`);
    }

    try {
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const lines = originalContent.split('\n');
      const targetLine = lines[issue.line - 1];

      if (!targetLine.includes(issue.currentCode)) {
        throw new Error('Code has changed since analysis');
      }

      lines[issue.line - 1] = targetLine.replace(issue.currentCode, issue.suggestedCode);
      const refactoredContent = lines.join('\n');

      await fs.writeFile(filePath, refactoredContent);

      this.appliedOptimizations.add(issueId);
      this.emit('optimization:applied', { issueId, file: filePath });

      return {
        file: filePath,
        issueId,
        success: true,
        originalCode: issue.currentCode,
        refactoredCode: issue.suggestedCode
      };
    } catch (error) {
      return {
        file: filePath,
        issueId,
        success: false,
        originalCode: issue.currentCode,
        refactoredCode: issue.suggestedCode,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async benchmarkFunction(
    code: string,
    name: string = 'function'
  ): Promise<BenchmarkResult> {
    const cached = this.benchmarkCache.get(code);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const suite = new Benchmark.Suite();

      suite
        .add(name, code)
        .on('complete', function (this: any) {
          const benchmark = this[0];
          const result: BenchmarkResult = {
            name,
            opsPerSecond: benchmark.hz,
            meanTime: benchmark.stats.mean * 1000,
            marginOfError: benchmark.stats.moe * 1000,
            relativeMarginOfError: benchmark.stats.rme,
            standardDeviation: benchmark.stats.deviation * 1000
          };

          CodeOptimizer.getInstance().benchmarkCache.set(code, result);
          resolve(result);
        })
        .on('error', (error: Error) => {
          reject(error);
        })
        .run({ async: false });
    });
  }

  public async compareBenchmarks(
    codeA: string,
    codeB: string,
    nameA: string = 'Current',
    nameB: string = 'Optimized'
  ): Promise<{
    current: BenchmarkResult;
    optimized: BenchmarkResult;
    improvement: number;
    improvementPercent: number;
  }> {
    const [current, optimized] = await Promise.all([
      this.benchmarkFunction(codeA, nameA),
      this.benchmarkFunction(codeB, nameB)
    ]);

    const improvement = optimized.opsPerSecond - current.opsPerSecond;
    const improvementPercent = (improvement / current.opsPerSecond) * 100;

    return {
      current,
      optimized,
      improvement,
      improvementPercent
    };
  }

  public generatePerformanceReport(): PerformanceReport {
    const allIssues: OptimizationIssue[] = [];
    for (const issues of this.issues.values()) {
      allIssues.push(...issues);
    }

    const issuesBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const issuesByType: Record<string, number> = {};

    for (const issue of allIssues) {
      issuesBySeverity[issue.severity]++;
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
    }

    const topOptimizations = allIssues
      .sort((a, b) => b.impact.estimatedImprovement - a.impact.estimatedImprovement)
      .slice(0, 10);

    const estimatedTotalImprovement = allIssues.reduce(
      (sum, issue) => sum + issue.impact.estimatedImprovement,
      0
    );

    const autoFixableCount = allIssues.filter(i => i.autoFixable).length;

    return {
      totalIssues: allIssues.length,
      issuesBySeverity,
      issuesByType,
      topOptimizations,
      estimatedTotalImprovement,
      autoFixableCount
    };
  }

  public async generateWeeklyDigest(): Promise<{
    period: { start: Date; end: Date };
    summary: PerformanceReport;
    topOpportunities: Array<{
      issue: OptimizationIssue;
      roi: number;
    }>;
    appliedOptimizations: number;
  }> {
    const report = this.generatePerformanceReport();

    const topOpportunities = report.topOptimizations.map(issue => {
      const effortScore = { low: 1, medium: 3, high: 5 }[issue.difficulty];
      const roi = issue.impact.estimatedImprovement / effortScore;

      return { issue, roi };
    }).sort((a, b) => b.roi - a.roi);

    return {
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      summary: report,
      topOpportunities,
      appliedOptimizations: this.appliedOptimizations.size
    };
  }

  public getIssues(filters?: {
    severity?: string[];
    type?: string[];
    autoFixable?: boolean;
  }): OptimizationIssue[] {
    const allIssues: OptimizationIssue[] = [];
    for (const issues of this.issues.values()) {
      allIssues.push(...issues);
    }

    if (!filters) {
      return allIssues;
    }

    return allIssues.filter(issue => {
      if (filters.severity && !filters.severity.includes(issue.severity)) {
        return false;
      }
      if (filters.type && !filters.type.includes(issue.type)) {
        return false;
      }
      if (filters.autoFixable !== undefined && issue.autoFixable !== filters.autoFixable) {
        return false;
      }
      return true;
    });
  }
}

export default CodeOptimizer;
