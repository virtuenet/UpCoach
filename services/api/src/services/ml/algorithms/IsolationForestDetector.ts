/**
 * Isolation Forest Anomaly Detector
 * Tree-based ensemble method for outlier detection
 * Efficient for high-dimensional data and large datasets
 * @version 1.0.0
 */

import { logger } from '../../../utils/logger';

export interface IsolationForestResult {
  dataIndex: number;
  anomalyScore: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  averagePathLength: number;
}

export interface IsolationForestConfig {
  numTrees: number;           // Number of isolation trees (default: 100)
  sampleSize: number;         // Subsample size for each tree (default: 256)
  threshold: number;          // Anomaly score threshold (default: 0.5)
  randomSeed?: number;        // For reproducibility
  maxDepth?: number;          // Maximum tree depth (default: auto)
}

interface IsolationTree {
  splitAttribute?: number;
  splitValue?: number;
  left?: IsolationTree;
  right?: IsolationTree;
  size?: number;
}

interface DataPoint {
  features: number[];
  index: number;
}

export class IsolationForestDetector {
  private config: IsolationForestConfig;
  private trees: IsolationTree[] = [];
  private isFitted: boolean = false;
  private numFeatures: number = 0;
  private randomState: number;

  constructor(config: Partial<IsolationForestConfig> = {}) {
    this.config = {
      numTrees: config.numTrees ?? 100,
      sampleSize: config.sampleSize ?? 256,
      threshold: config.threshold ?? 0.5,
      randomSeed: config.randomSeed,
      maxDepth: config.maxDepth,
    };
    this.randomState = this.config.randomSeed ?? Date.now();
  }

  /**
   * Simple seeded random number generator (xorshift32)
   */
  private random(): number {
    this.randomState ^= this.randomState << 13;
    this.randomState ^= this.randomState >>> 17;
    this.randomState ^= this.randomState << 5;
    return Math.abs(this.randomState) / 2147483647;
  }

  /**
   * Average path length of unsuccessful search in BST
   * Used for normalization
   */
  private averagePathLength(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;

    // Harmonic number approximation
    const harmonicNumber = Math.log(n - 1) + 0.5772156649; // Euler-Mascheroni constant
    return 2 * harmonicNumber - (2 * (n - 1) / n);
  }

  /**
   * Build a single isolation tree
   */
  private buildTree(data: DataPoint[], depth: number, maxDepth: number): IsolationTree {
    const n = data.length;

    // Terminal conditions
    if (depth >= maxDepth || n <= 1) {
      return { size: n };
    }

    // Randomly select attribute and split value
    const splitAttribute = Math.floor(this.random() * this.numFeatures);
    const values = data.map(d => d.features[splitAttribute]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // If all values are the same, create leaf
    if (minVal === maxVal) {
      return { size: n };
    }

    // Random split value between min and max
    const splitValue = minVal + this.random() * (maxVal - minVal);

    // Partition data
    const leftData = data.filter(d => d.features[splitAttribute] < splitValue);
    const rightData = data.filter(d => d.features[splitAttribute] >= splitValue);

    // Handle edge case where all data goes to one side
    if (leftData.length === 0 || rightData.length === 0) {
      return { size: n };
    }

    return {
      splitAttribute,
      splitValue,
      left: this.buildTree(leftData, depth + 1, maxDepth),
      right: this.buildTree(rightData, depth + 1, maxDepth),
    };
  }

  /**
   * Calculate path length for a single data point in a tree
   */
  private pathLength(point: number[], tree: IsolationTree, depth: number): number {
    // Leaf node
    if (tree.size !== undefined) {
      return depth + this.averagePathLength(tree.size);
    }

    // Internal node
    if (point[tree.splitAttribute!] < tree.splitValue!) {
      return this.pathLength(point, tree.left!, depth + 1);
    } else {
      return this.pathLength(point, tree.right!, depth + 1);
    }
  }

  /**
   * Fit the model on training data
   */
  public fit(data: number[][]): void {
    if (data.length === 0) {
      throw new Error('Empty dataset provided');
    }

    this.numFeatures = data[0].length;
    const dataPoints: DataPoint[] = data.map((features, index) => ({ features, index }));

    // Calculate max depth if not specified
    const effectiveSampleSize = Math.min(this.config.sampleSize, data.length);
    const maxDepth = this.config.maxDepth ?? Math.ceil(Math.log2(effectiveSampleSize));

    this.trees = [];

    // Build isolation forest
    for (let i = 0; i < this.config.numTrees; i++) {
      // Random sampling with replacement
      const sample: DataPoint[] = [];
      for (let j = 0; j < effectiveSampleSize; j++) {
        const idx = Math.floor(this.random() * dataPoints.length);
        sample.push(dataPoints[idx]);
      }

      const tree = this.buildTree(sample, 0, maxDepth);
      this.trees.push(tree);
    }

    this.isFitted = true;
    logger.info(`[IsolationForest] Fitted with ${this.config.numTrees} trees, sample size: ${effectiveSampleSize}`);
  }

  /**
   * Calculate anomaly score for a single data point
   */
  public score(point: number[]): number {
    if (!this.isFitted) {
      throw new Error('Model not fitted. Call fit() first.');
    }

    if (point.length !== this.numFeatures) {
      throw new Error(`Expected ${this.numFeatures} features, got ${point.length}`);
    }

    // Calculate average path length across all trees
    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += this.pathLength(point, tree, 0);
    }

    const avgPathLength = totalPathLength / this.trees.length;
    const c = this.averagePathLength(this.config.sampleSize);

    // Anomaly score: 2^(-avgPathLength / c)
    // Score close to 1 = anomaly, close to 0 = normal, 0.5 = uncertain
    return Math.pow(2, -avgPathLength / c);
  }

  /**
   * Detect anomaly for a single data point
   */
  public detectSingle(point: number[], index: number = 0): IsolationForestResult {
    const anomalyScore = this.score(point);
    const isAnomaly = anomalyScore >= this.config.threshold;

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (anomalyScore >= 0.8) severity = 'high';
    else if (anomalyScore >= 0.6) severity = 'medium';

    // Calculate average path length for reference
    let avgPathLength = 0;
    for (const tree of this.trees) {
      avgPathLength += this.pathLength(point, tree, 0);
    }
    avgPathLength /= this.trees.length;

    return {
      dataIndex: index,
      anomalyScore,
      isAnomaly,
      severity,
      averagePathLength: avgPathLength,
    };
  }

  /**
   * Detect anomalies in a batch
   */
  public detectBatch(data: number[][]): IsolationForestResult[] {
    return data.map((point, index) => this.detectSingle(point, index));
  }

  /**
   * Fit and detect in one step
   */
  public fitDetect(data: number[][]): IsolationForestResult[] {
    this.fit(data);
    return this.detectBatch(data);
  }

  /**
   * Get indices of anomalies
   */
  public getAnomalyIndices(data: number[][]): number[] {
    const results = this.detectBatch(data);
    return results
      .filter(r => r.isAnomaly)
      .map(r => r.dataIndex);
  }

  /**
   * Get top-k anomalies by score
   */
  public getTopKAnomalies(data: number[][], k: number): IsolationForestResult[] {
    const results = this.detectBatch(data);
    return results
      .sort((a, b) => b.anomalyScore - a.anomalyScore)
      .slice(0, k);
  }

  /**
   * Check if model is fitted
   */
  public get fitted(): boolean {
    return this.isFitted;
  }

  /**
   * Get number of trees
   */
  public get treeCount(): number {
    return this.trees.length;
  }
}

export const createIsolationForestDetector = (
  config?: Partial<IsolationForestConfig>
): IsolationForestDetector => {
  return new IsolationForestDetector(config);
};
