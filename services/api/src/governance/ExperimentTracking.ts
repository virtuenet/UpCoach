import { Pool } from 'pg';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Experiment {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  status: 'active' | 'completed' | 'failed' | 'archived';
}

export interface ExperimentRun {
  id: string;
  experimentId: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  createdBy: string;
  gitCommit?: string;
  environment: EnvironmentInfo;
  notes?: string;
}

export interface EnvironmentInfo {
  pythonVersion?: string;
  nodeVersion?: string;
  dependencies: Record<string, string>;
  platform: string;
  hostname: string;
}

export interface HyperparameterConfig {
  runId: string;
  parameters: Record<string, any>;
  loggedAt: Date;
}

export interface Metric {
  runId: string;
  key: string;
  value: number;
  step?: number;
  timestamp: Date;
  epoch?: number;
}

export interface Artifact {
  id: string;
  runId: string;
  name: string;
  path: string;
  type: 'model' | 'dataset' | 'visualization' | 'log' | 'other';
  size: number;
  checksum: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface HyperparameterSearchConfig {
  experimentId: string;
  method: 'grid' | 'random' | 'bayesian' | 'hyperband';
  parameterSpace: Record<string, ParameterSpec>;
  metric: string;
  maximize: boolean;
  maxRuns?: number;
  maxDuration?: number;
}

export interface ParameterSpec {
  type: 'continuous' | 'discrete' | 'categorical';
  min?: number;
  max?: number;
  values?: any[];
  distribution?: 'uniform' | 'log_uniform' | 'normal';
}

export interface SearchResult {
  searchId: string;
  experimentId: string;
  method: string;
  bestRun: ExperimentRun;
  bestParameters: Record<string, any>;
  bestScore: number;
  totalRuns: number;
  completedAt: Date;
}

export interface BayesianOptimizationState {
  searchId: string;
  observations: Array<{
    parameters: Record<string, number>;
    score: number;
  }>;
  gpMean: number[];
  gpCovariance: number[][];
  acquisitionFunction: 'ei' | 'ucb' | 'poi';
}

export interface HyperbandBracket {
  bracket: number;
  maxIterations: number;
  numConfigs: number;
  configurations: Array<{
    runId: string;
    parameters: Record<string, any>;
    iterations: number;
    score?: number;
  }>;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  description: string;
  members: string[];
  projects: string[];
  createdAt: Date;
}

export interface ComparisonResult {
  runs: ExperimentRun[];
  parameters: Record<string, any[]>;
  metrics: Record<string, number[]>;
  winner?: ExperimentRun;
}

// ============================================================================
// Experiment Tracking Service
// ============================================================================

export class ExperimentTrackingService extends EventEmitter {
  private db: Pool;
  private artifactStoragePath: string;

  constructor(db: Pool, artifactStoragePath: string = '/tmp/ml-artifacts') {
    super();
    this.db = db;
    this.artifactStoragePath = artifactStoragePath;

    // Create storage directory if it doesn't exist
    if (!fs.existsSync(artifactStoragePath)) {
      fs.mkdirSync(artifactStoragePath, { recursive: true });
    }
  }

  // ============================================================================
  // Experiment Management
  // ============================================================================

  async createExperiment(
    name: string,
    description: string,
    createdBy: string,
    tags: string[] = [],
    projectId?: string
  ): Promise<Experiment> {
    try {
      const id = crypto.randomUUID();
      const now = new Date();

      const query = `
        INSERT INTO experiments (
          id, name, description, tags, created_by, created_at, updated_at, project_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        id,
        name,
        description,
        JSON.stringify(tags),
        createdBy,
        now,
        now,
        projectId || null,
        'active'
      ]);

      const experiment = this.mapExperimentFromDb(result.rows[0]);

      this.emit('experiment:created', experiment);

      return experiment;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      throw new Error(`Experiment creation failed: ${error.message}`);
    }
  }

  async updateExperiment(
    experimentId: string,
    updates: Partial<Pick<Experiment, 'name' | 'description' | 'tags' | 'status'>>
  ): Promise<Experiment> {
    try {
      const setClauses: string[] = ['updated_at = $2'];
      const values: any[] = [experimentId, new Date()];
      let paramCount = 2;

      if (updates.name) {
        setClauses.push(`name = $${++paramCount}`);
        values.push(updates.name);
      }

      if (updates.description) {
        setClauses.push(`description = $${++paramCount}`);
        values.push(updates.description);
      }

      if (updates.tags) {
        setClauses.push(`tags = $${++paramCount}`);
        values.push(JSON.stringify(updates.tags));
      }

      if (updates.status) {
        setClauses.push(`status = $${++paramCount}`);
        values.push(updates.status);
      }

      const query = `
        UPDATE experiments
        SET ${setClauses.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Experiment not found');
      }

      return this.mapExperimentFromDb(result.rows[0]);
    } catch (error) {
      console.error('Failed to update experiment:', error);
      throw new Error(`Experiment update failed: ${error.message}`);
    }
  }

  async getExperiment(experimentId: string): Promise<Experiment | null> {
    try {
      const query = 'SELECT * FROM experiments WHERE id = $1';
      const result = await this.db.query(query, [experimentId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapExperimentFromDb(result.rows[0]);
    } catch (error) {
      console.error('Failed to get experiment:', error);
      throw new Error(`Experiment retrieval failed: ${error.message}`);
    }
  }

  async listExperiments(
    filters?: {
      projectId?: string;
      createdBy?: string;
      tags?: string[];
      status?: Experiment['status'];
    }
  ): Promise<Experiment[]> {
    try {
      let query = 'SELECT * FROM experiments WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (filters?.projectId) {
        params.push(filters.projectId);
        query += ` AND project_id = $${++paramCount}`;
      }

      if (filters?.createdBy) {
        params.push(filters.createdBy);
        query += ` AND created_by = $${++paramCount}`;
      }

      if (filters?.status) {
        params.push(filters.status);
        query += ` AND status = $${++paramCount}`;
      }

      query += ' ORDER BY updated_at DESC';

      const result = await this.db.query(query, params);

      let experiments = result.rows.map(row => this.mapExperimentFromDb(row));

      // Filter by tags if specified
      if (filters?.tags && filters.tags.length > 0) {
        experiments = experiments.filter(exp =>
          filters.tags!.some(tag => exp.tags.includes(tag))
        );
      }

      return experiments;
    } catch (error) {
      console.error('Failed to list experiments:', error);
      throw new Error(`Experiment listing failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Run Tracking
  // ============================================================================

  async startRun(
    experimentId: string,
    name: string,
    createdBy: string,
    gitCommit?: string,
    notes?: string
  ): Promise<ExperimentRun> {
    try {
      const id = crypto.randomUUID();
      const now = new Date();

      // Capture environment info
      const environment: EnvironmentInfo = {
        nodeVersion: process.version,
        dependencies: {},
        platform: process.platform,
        hostname: require('os').hostname()
      };

      const query = `
        INSERT INTO experiment_runs (
          id, experiment_id, name, status, start_time, created_by,
          git_commit, environment, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        id,
        experimentId,
        name,
        'running',
        now,
        createdBy,
        gitCommit || null,
        JSON.stringify(environment),
        notes || null
      ]);

      const run = this.mapRunFromDb(result.rows[0]);

      this.emit('run:started', run);

      return run;
    } catch (error) {
      console.error('Failed to start run:', error);
      throw new Error(`Run start failed: ${error.message}`);
    }
  }

  async endRun(
    runId: string,
    status: 'completed' | 'failed' | 'killed'
  ): Promise<ExperimentRun> {
    try {
      const endTime = new Date();

      // Get start time
      const runQuery = 'SELECT start_time FROM experiment_runs WHERE id = $1';
      const runResult = await this.db.query(runQuery, [runId]);

      if (runResult.rows.length === 0) {
        throw new Error('Run not found');
      }

      const startTime = new Date(runResult.rows[0].start_time);
      const duration = endTime.getTime() - startTime.getTime();

      const query = `
        UPDATE experiment_runs
        SET status = $2, end_time = $3, duration = $4
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [runId, status, endTime, duration]);

      const run = this.mapRunFromDb(result.rows[0]);

      this.emit('run:ended', run);

      return run;
    } catch (error) {
      console.error('Failed to end run:', error);
      throw new Error(`Run end failed: ${error.message}`);
    }
  }

  async getRun(runId: string): Promise<ExperimentRun | null> {
    try {
      const query = 'SELECT * FROM experiment_runs WHERE id = $1';
      const result = await this.db.query(query, [runId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRunFromDb(result.rows[0]);
    } catch (error) {
      console.error('Failed to get run:', error);
      throw new Error(`Run retrieval failed: ${error.message}`);
    }
  }

  async listRuns(experimentId: string): Promise<ExperimentRun[]> {
    try {
      const query = 'SELECT * FROM experiment_runs WHERE experiment_id = $1 ORDER BY start_time DESC';
      const result = await this.db.query(query, [experimentId]);

      return result.rows.map(row => this.mapRunFromDb(row));
    } catch (error) {
      console.error('Failed to list runs:', error);
      throw new Error(`Run listing failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Hyperparameter and Metric Logging
  // ============================================================================

  async logHyperparameters(
    runId: string,
    parameters: Record<string, any>
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO hyperparameters (run_id, parameters, logged_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (run_id) DO UPDATE SET parameters = $2, logged_at = $3
      `;

      await this.db.query(query, [runId, JSON.stringify(parameters), new Date()]);

      this.emit('hyperparameters:logged', { runId, parameters });
    } catch (error) {
      console.error('Failed to log hyperparameters:', error);
      throw new Error(`Hyperparameter logging failed: ${error.message}`);
    }
  }

  async getHyperparameters(runId: string): Promise<Record<string, any> | null> {
    try {
      const query = 'SELECT parameters FROM hyperparameters WHERE run_id = $1';
      const result = await this.db.query(query, [runId]);

      if (result.rows.length === 0) {
        return null;
      }

      return JSON.parse(result.rows[0].parameters);
    } catch (error) {
      console.error('Failed to get hyperparameters:', error);
      throw new Error(`Hyperparameter retrieval failed: ${error.message}`);
    }
  }

  async logMetric(
    runId: string,
    key: string,
    value: number,
    step?: number,
    epoch?: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO metrics (run_id, key, value, step, timestamp, epoch)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await this.db.query(query, [runId, key, value, step || null, new Date(), epoch || null]);

      this.emit('metric:logged', { runId, key, value, step, epoch });
    } catch (error) {
      console.error('Failed to log metric:', error);
      throw new Error(`Metric logging failed: ${error.message}`);
    }
  }

  async getMetrics(
    runId: string,
    key?: string
  ): Promise<Metric[]> {
    try {
      let query = 'SELECT * FROM metrics WHERE run_id = $1';
      const params: any[] = [runId];

      if (key) {
        query += ' AND key = $2';
        params.push(key);
      }

      query += ' ORDER BY step ASC, timestamp ASC';

      const result = await this.db.query(query, params);

      return result.rows.map(row => ({
        runId: row.run_id,
        key: row.key,
        value: row.value,
        step: row.step,
        timestamp: row.timestamp,
        epoch: row.epoch
      }));
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw new Error(`Metric retrieval failed: ${error.message}`);
    }
  }

  async getLatestMetric(runId: string, key: string): Promise<number | null> {
    try {
      const query = `
        SELECT value FROM metrics
        WHERE run_id = $1 AND key = $2
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      const result = await this.db.query(query, [runId, key]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].value;
    } catch (error) {
      console.error('Failed to get latest metric:', error);
      throw new Error(`Latest metric retrieval failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Artifact Management
  // ============================================================================

  async logArtifact(
    runId: string,
    name: string,
    content: Buffer | string,
    type: Artifact['type'] = 'other',
    metadata?: Record<string, any>
  ): Promise<Artifact> {
    try {
      const id = crypto.randomUUID();
      const artifactPath = path.join(this.artifactStoragePath, runId, name);

      // Create directory
      const dir = path.dirname(artifactPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
      fs.writeFileSync(artifactPath, buffer);

      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      const query = `
        INSERT INTO artifacts (
          id, run_id, name, path, type, size, checksum, uploaded_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        id,
        runId,
        name,
        artifactPath,
        type,
        buffer.length,
        checksum,
        new Date(),
        metadata ? JSON.stringify(metadata) : null
      ]);

      const artifact = this.mapArtifactFromDb(result.rows[0]);

      this.emit('artifact:logged', artifact);

      return artifact;
    } catch (error) {
      console.error('Failed to log artifact:', error);
      throw new Error(`Artifact logging failed: ${error.message}`);
    }
  }

  async getArtifact(artifactId: string): Promise<Artifact | null> {
    try {
      const query = 'SELECT * FROM artifacts WHERE id = $1';
      const result = await this.db.query(query, [artifactId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapArtifactFromDb(result.rows[0]);
    } catch (error) {
      console.error('Failed to get artifact:', error);
      throw new Error(`Artifact retrieval failed: ${error.message}`);
    }
  }

  async listArtifacts(runId: string): Promise<Artifact[]> {
    try {
      const query = 'SELECT * FROM artifacts WHERE run_id = $1 ORDER BY uploaded_at DESC';
      const result = await this.db.query(query, [runId]);

      return result.rows.map(row => this.mapArtifactFromDb(row));
    } catch (error) {
      console.error('Failed to list artifacts:', error);
      throw new Error(`Artifact listing failed: ${error.message}`);
    }
  }

  async downloadArtifact(artifactId: string): Promise<Buffer> {
    try {
      const artifact = await this.getArtifact(artifactId);

      if (!artifact) {
        throw new Error('Artifact not found');
      }

      if (!fs.existsSync(artifact.path)) {
        throw new Error('Artifact file not found');
      }

      return fs.readFileSync(artifact.path);
    } catch (error) {
      console.error('Failed to download artifact:', error);
      throw new Error(`Artifact download failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Hyperparameter Optimization
  // ============================================================================

  async gridSearch(
    experimentId: string,
    parameterSpace: Record<string, any[]>,
    evaluationFunction: (params: Record<string, any>) => Promise<number>,
    metric: string,
    maximize: boolean = true,
    createdBy: string = 'system'
  ): Promise<SearchResult> {
    try {
      const searchId = crypto.randomUUID();
      const allCombinations = this.generateGridCombinations(parameterSpace);

      const runs: ExperimentRun[] = [];
      const scores: number[] = [];

      for (let i = 0; i < allCombinations.length; i++) {
        const params = allCombinations[i];

        // Start run
        const run = await this.startRun(
          experimentId,
          `grid_search_${i}`,
          createdBy,
          undefined,
          `Grid search iteration ${i + 1}/${allCombinations.length}`
        );

        // Log hyperparameters
        await this.logHyperparameters(run.id, params);

        try {
          // Evaluate
          const score = await evaluationFunction(params);

          // Log metric
          await this.logMetric(run.id, metric, score);

          // End run
          await this.endRun(run.id, 'completed');

          runs.push(run);
          scores.push(score);
        } catch (error) {
          await this.endRun(run.id, 'failed');
          console.error(`Grid search iteration ${i} failed:`, error);
        }
      }

      // Find best
      const bestIndex = maximize
        ? scores.indexOf(Math.max(...scores))
        : scores.indexOf(Math.min(...scores));

      const result: SearchResult = {
        searchId,
        experimentId,
        method: 'grid',
        bestRun: runs[bestIndex],
        bestParameters: allCombinations[bestIndex],
        bestScore: scores[bestIndex],
        totalRuns: runs.length,
        completedAt: new Date()
      };

      await this.storeSearchResult(result);

      this.emit('search:completed', result);

      return result;
    } catch (error) {
      console.error('Grid search failed:', error);
      throw new Error(`Grid search failed: ${error.message}`);
    }
  }

  private generateGridCombinations(parameterSpace: Record<string, any[]>): Array<Record<string, any>> {
    const keys = Object.keys(parameterSpace);
    const combinations: Array<Record<string, any>> = [];

    const generate = (index: number, current: Record<string, any>) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      const values = parameterSpace[key];

      for (const value of values) {
        current[key] = value;
        generate(index + 1, current);
      }
    };

    generate(0, {});
    return combinations;
  }

  async randomSearch(
    experimentId: string,
    parameterSpace: Record<string, ParameterSpec>,
    evaluationFunction: (params: Record<string, any>) => Promise<number>,
    metric: string,
    maximize: boolean = true,
    maxRuns: number = 50,
    createdBy: string = 'system'
  ): Promise<SearchResult> {
    try {
      const searchId = crypto.randomUUID();
      const runs: ExperimentRun[] = [];
      const scores: number[] = [];
      const parameterSets: Array<Record<string, any>> = [];

      for (let i = 0; i < maxRuns; i++) {
        // Sample random parameters
        const params = this.sampleRandomParameters(parameterSpace);
        parameterSets.push(params);

        // Start run
        const run = await this.startRun(
          experimentId,
          `random_search_${i}`,
          createdBy,
          undefined,
          `Random search iteration ${i + 1}/${maxRuns}`
        );

        // Log hyperparameters
        await this.logHyperparameters(run.id, params);

        try {
          // Evaluate
          const score = await evaluationFunction(params);

          // Log metric
          await this.logMetric(run.id, metric, score);

          // End run
          await this.endRun(run.id, 'completed');

          runs.push(run);
          scores.push(score);
        } catch (error) {
          await this.endRun(run.id, 'failed');
          console.error(`Random search iteration ${i} failed:`, error);
        }
      }

      // Find best
      const bestIndex = maximize
        ? scores.indexOf(Math.max(...scores))
        : scores.indexOf(Math.min(...scores));

      const result: SearchResult = {
        searchId,
        experimentId,
        method: 'random',
        bestRun: runs[bestIndex],
        bestParameters: parameterSets[bestIndex],
        bestScore: scores[bestIndex],
        totalRuns: runs.length,
        completedAt: new Date()
      };

      await this.storeSearchResult(result);

      this.emit('search:completed', result);

      return result;
    } catch (error) {
      console.error('Random search failed:', error);
      throw new Error(`Random search failed: ${error.message}`);
    }
  }

  private sampleRandomParameters(parameterSpace: Record<string, ParameterSpec>): Record<string, any> {
    const params: Record<string, any> = {};

    for (const [key, spec] of Object.entries(parameterSpace)) {
      if (spec.type === 'continuous') {
        if (spec.distribution === 'log_uniform') {
          const logMin = Math.log(spec.min!);
          const logMax = Math.log(spec.max!);
          params[key] = Math.exp(logMin + Math.random() * (logMax - logMin));
        } else {
          params[key] = spec.min! + Math.random() * (spec.max! - spec.min!);
        }
      } else if (spec.type === 'discrete') {
        params[key] = Math.floor(spec.min! + Math.random() * (spec.max! - spec.min! + 1));
      } else if (spec.type === 'categorical') {
        const randomIndex = Math.floor(Math.random() * spec.values!.length);
        params[key] = spec.values![randomIndex];
      }
    }

    return params;
  }

  async bayesianOptimization(
    experimentId: string,
    parameterSpace: Record<string, ParameterSpec>,
    evaluationFunction: (params: Record<string, any>) => Promise<number>,
    metric: string,
    maximize: boolean = true,
    maxRuns: number = 50,
    createdBy: string = 'system'
  ): Promise<SearchResult> {
    try {
      const searchId = crypto.randomUUID();
      const state: BayesianOptimizationState = {
        searchId,
        observations: [],
        gpMean: [],
        gpCovariance: [],
        acquisitionFunction: 'ei'
      };

      const runs: ExperimentRun[] = [];
      const scores: number[] = [];
      const parameterSets: Array<Record<string, any>> = [];

      // Initial random sampling
      const numInitial = Math.min(5, maxRuns);
      for (let i = 0; i < numInitial; i++) {
        const params = this.sampleRandomParameters(parameterSpace);
        const score = await this.evaluateAndLog(experimentId, params, evaluationFunction, metric, `bayesian_${i}`, createdBy);

        parameterSets.push(params);
        scores.push(score);

        state.observations.push({
          parameters: this.parametersToVector(params, parameterSpace),
          score
        });
      }

      // Bayesian optimization loop
      for (let i = numInitial; i < maxRuns; i++) {
        // Fit Gaussian Process
        this.fitGaussianProcess(state, maximize);

        // Acquire next point
        const nextParams = this.acquireNextPoint(state, parameterSpace, maximize);

        // Evaluate
        const score = await this.evaluateAndLog(experimentId, nextParams, evaluationFunction, metric, `bayesian_${i}`, createdBy);

        parameterSets.push(nextParams);
        scores.push(score);

        state.observations.push({
          parameters: this.parametersToVector(nextParams, parameterSpace),
          score
        });
      }

      // Find best
      const bestIndex = maximize
        ? scores.indexOf(Math.max(...scores))
        : scores.indexOf(Math.min(...scores));

      const result: SearchResult = {
        searchId,
        experimentId,
        method: 'bayesian',
        bestRun: runs[bestIndex],
        bestParameters: parameterSets[bestIndex],
        bestScore: scores[bestIndex],
        totalRuns: parameterSets.length,
        completedAt: new Date()
      };

      await this.storeSearchResult(result);

      this.emit('search:completed', result);

      return result;
    } catch (error) {
      console.error('Bayesian optimization failed:', error);
      throw new Error(`Bayesian optimization failed: ${error.message}`);
    }
  }

  private parametersToVector(params: Record<string, any>, space: Record<string, ParameterSpec>): Record<string, number> {
    const vector: Record<string, number> = {};

    for (const [key, value] of Object.entries(params)) {
      const spec = space[key];

      if (spec.type === 'continuous' || spec.type === 'discrete') {
        vector[key] = value;
      } else if (spec.type === 'categorical') {
        const index = spec.values!.indexOf(value);
        vector[key] = index;
      }
    }

    return vector;
  }

  private fitGaussianProcess(state: BayesianOptimizationState, maximize: boolean): void {
    // Simplified GP fitting using mean and variance
    const scores = state.observations.map(o => maximize ? o.score : -o.score);

    state.gpMean = [scores.reduce((a, b) => a + b, 0) / scores.length];

    const variance = scores.reduce((sum, s) => sum + Math.pow(s - state.gpMean[0], 2), 0) / scores.length;
    state.gpCovariance = [[variance]];
  }

  private acquireNextPoint(
    state: BayesianOptimizationState,
    parameterSpace: Record<string, ParameterSpec>,
    maximize: boolean
  ): Record<string, any> {
    // Expected Improvement acquisition
    const numCandidates = 100;
    let bestParams: Record<string, any> | null = null;
    let bestEI = -Infinity;

    const currentBest = maximize
      ? Math.max(...state.observations.map(o => o.score))
      : Math.min(...state.observations.map(o => o.score));

    for (let i = 0; i < numCandidates; i++) {
      const candidateParams = this.sampleRandomParameters(parameterSpace);
      const candidateVector = this.parametersToVector(candidateParams, parameterSpace);

      // Simple EI calculation (using global mean/variance)
      const mean = state.gpMean[0];
      const stdDev = Math.sqrt(state.gpCovariance[0][0]);

      const improvement = maximize ? mean - currentBest : currentBest - mean;
      const z = improvement / (stdDev + 1e-6);
      const ei = improvement * this.normalCDF(z) + stdDev * this.normalPDF(z);

      if (ei > bestEI) {
        bestEI = ei;
        bestParams = candidateParams;
      }
    }

    return bestParams || this.sampleRandomParameters(parameterSpace);
  }

  private normalCDF(x: number): number {
    // Approximation of the standard normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private async evaluateAndLog(
    experimentId: string,
    params: Record<string, any>,
    evaluationFunction: (params: Record<string, any>) => Promise<number>,
    metric: string,
    runName: string,
    createdBy: string
  ): Promise<number> {
    const run = await this.startRun(experimentId, runName, createdBy);
    await this.logHyperparameters(run.id, params);

    try {
      const score = await evaluationFunction(params);
      await this.logMetric(run.id, metric, score);
      await this.endRun(run.id, 'completed');
      return score;
    } catch (error) {
      await this.endRun(run.id, 'failed');
      throw error;
    }
  }

  async hyperband(
    experimentId: string,
    parameterSpace: Record<string, ParameterSpec>,
    evaluationFunction: (params: Record<string, any>, iterations: number) => Promise<number>,
    metric: string,
    maximize: boolean = true,
    maxIterations: number = 81,
    eta: number = 3,
    createdBy: string = 'system'
  ): Promise<SearchResult> {
    try {
      const searchId = crypto.randomUUID();
      const logEta = Math.log(maxIterations) / Math.log(eta);
      const numBrackets = Math.floor(logEta) + 1;

      let bestRun: ExperimentRun | null = null;
      let bestParams: Record<string, any> | null = null;
      let bestScore = maximize ? -Infinity : Infinity;
      let totalRuns = 0;

      for (let bracket = 0; bracket < numBrackets; bracket++) {
        const n = Math.ceil((numBrackets / (bracket + 1)) * Math.pow(eta, bracket));
        const r = maxIterations / Math.pow(eta, bracket);

        let configurations: Array<{ params: Record<string, any>; score: number }> = [];

        // Initialize configurations
        for (let i = 0; i < n; i++) {
          const params = this.sampleRandomParameters(parameterSpace);
          configurations.push({ params, score: maximize ? -Infinity : Infinity });
        }

        // Successive halving
        for (let i = 0; i <= bracket; i++) {
          const numConfigs = Math.floor(n / Math.pow(eta, i));
          const iterations = Math.floor(r * Math.pow(eta, i));

          const scores: number[] = [];

          for (let j = 0; j < Math.min(numConfigs, configurations.length); j++) {
            const config = configurations[j];
            const runName = `hyperband_b${bracket}_i${i}_c${j}`;

            const score = await this.evaluateAndLog(
              experimentId,
              config.params,
              (params) => evaluationFunction(params, iterations),
              metric,
              runName,
              createdBy
            );

            config.score = score;
            scores.push(score);
            totalRuns++;

            if ((maximize && score > bestScore) || (!maximize && score < bestScore)) {
              bestScore = score;
              bestParams = config.params;
            }
          }

          // Keep top configurations
          configurations.sort((a, b) => maximize ? b.score - a.score : a.score - b.score);
          configurations = configurations.slice(0, Math.floor(numConfigs / eta));
        }
      }

      const result: SearchResult = {
        searchId,
        experimentId,
        method: 'hyperband',
        bestRun: bestRun!,
        bestParameters: bestParams!,
        bestScore,
        totalRuns,
        completedAt: new Date()
      };

      await this.storeSearchResult(result);

      this.emit('search:completed', result);

      return result;
    } catch (error) {
      console.error('Hyperband failed:', error);
      throw new Error(`Hyperband failed: ${error.message}`);
    }
  }

  private async storeSearchResult(result: SearchResult): Promise<void> {
    const query = `
      INSERT INTO search_results (
        search_id, experiment_id, method, best_run_id, best_parameters,
        best_score, total_runs, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.db.query(query, [
      result.searchId,
      result.experimentId,
      result.method,
      result.bestRun.id,
      JSON.stringify(result.bestParameters),
      result.bestScore,
      result.totalRuns,
      result.completedAt
    ]);
  }

  // ============================================================================
  // Comparison and Analysis
  // ============================================================================

  async compareRuns(runIds: string[]): Promise<ComparisonResult> {
    try {
      const runs: ExperimentRun[] = [];
      const allParameters: Record<string, any[]> = {};
      const allMetrics: Record<string, number[]> = {};

      for (const runId of runIds) {
        const run = await this.getRun(runId);
        if (!run) continue;

        runs.push(run);

        // Get hyperparameters
        const params = await this.getHyperparameters(runId);
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            if (!allParameters[key]) {
              allParameters[key] = [];
            }
            allParameters[key].push(value);
          }
        }

        // Get final metrics
        const metrics = await this.getMetrics(runId);
        const uniqueKeys = [...new Set(metrics.map(m => m.key))];

        for (const key of uniqueKeys) {
          const latestMetric = await this.getLatestMetric(runId, key);
          if (latestMetric !== null) {
            if (!allMetrics[key]) {
              allMetrics[key] = [];
            }
            allMetrics[key].push(latestMetric);
          }
        }
      }

      return {
        runs,
        parameters: allParameters,
        metrics: allMetrics
      };
    } catch (error) {
      console.error('Failed to compare runs:', error);
      throw new Error(`Run comparison failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private mapExperimentFromDb(row: any): Experiment {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      tags: JSON.parse(row.tags || '[]'),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      projectId: row.project_id,
      status: row.status
    };
  }

  private mapRunFromDb(row: any): ExperimentRun {
    return {
      id: row.id,
      experimentId: row.experiment_id,
      name: row.name,
      status: row.status,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      createdBy: row.created_by,
      gitCommit: row.git_commit,
      environment: JSON.parse(row.environment),
      notes: row.notes
    };
  }

  private mapArtifactFromDb(row: any): Artifact {
    return {
      id: row.id,
      runId: row.run_id,
      name: row.name,
      path: row.path,
      type: row.type,
      size: row.size,
      checksum: row.checksum,
      uploadedAt: row.uploaded_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}

export default ExperimentTrackingService;
