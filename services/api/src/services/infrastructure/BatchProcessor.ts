/**
 * Batch Processor Service
 * Phase 12 Week 1
 *
 * Efficient batch processing with automatic chunking, parallel execution,
 * and error handling for large dataset operations
 */

import EventEmitter from 'events';

export interface BatchConfig {
  batchSize: number;
  concurrency: number;
  retryAttempts?: number;
  retryDelay?: number; // ms
  onProgress?: (progress: BatchProgress) => void;
  onError?: (error: BatchError) => void;
}

export interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
  estimatedTimeRemaining: number; // ms
}

export interface BatchError {
  item: any;
  error: Error;
  attempt: number;
  batch: number;
}

export interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: any; error: Error }>;
  stats: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    duration: number; // ms
    averageItemTime: number; // ms
  };
}

export class BatchProcessor<TInput, TOutput> extends EventEmitter {
  private progress: BatchProgress;
  private startTime: number = 0;
  private processingTimes: number[] = [];

  constructor(private config: BatchConfig) {
    super();

    this.progress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      percentage: 0,
      estimatedTimeRemaining: 0
    };
  }

  /**
   * Process items in batches
   */
  async process(
    items: TInput[],
    processor: (item: TInput) => Promise<TOutput>
  ): Promise<BatchResult<TOutput>> {
    this.startTime = Date.now();
    this.progress = {
      total: items.length,
      processed: 0,
      successful: 0,
      failed: 0,
      percentage: 0,
      estimatedTimeRemaining: 0
    };

    const successful: TOutput[] = [];
    const failed: Array<{ item: TInput; error: Error }> = [];

    // Split items into batches
    const batches = this.chunkArray(items, this.config.batchSize);

    // Process batches with concurrency limit
    for (let i = 0; i < batches.length; i += this.config.concurrency) {
      const batchSlice = batches.slice(i, i + this.config.concurrency);

      const batchPromises = batchSlice.map((batch, batchIndex) =>
        this.processBatch(
          batch,
          processor,
          i + batchIndex,
          successful,
          failed
        )
      );

      await Promise.all(batchPromises);

      // Emit progress
      this.updateProgress();
      this.emit('progress', this.progress);

      if (this.config.onProgress) {
        this.config.onProgress(this.progress);
      }
    }

    const duration = Date.now() - this.startTime;
    const averageItemTime = duration / items.length;

    return {
      successful,
      failed,
      stats: {
        total: items.length,
        processed: this.progress.processed,
        successful: this.progress.successful,
        failed: this.progress.failed,
        duration,
        averageItemTime
      }
    };
  }

  /**
   * Process single batch
   */
  private async processBatch(
    batch: TInput[],
    processor: (item: TInput) => Promise<TOutput>,
    batchIndex: number,
    successful: TOutput[],
    failed: Array<{ item: TInput; error: Error }>
  ): Promise<void> {
    const batchStartTime = Date.now();

    for (const item of batch) {
      const result = await this.processItemWithRetry(item, processor, batchIndex);

      if (result.success && result.value !== undefined) {
        successful.push(result.value);
        this.progress.successful++;
      } else if (result.error) {
        failed.push({ item, error: result.error });
        this.progress.failed++;

        if (this.config.onError) {
          this.config.onError({
            item,
            error: result.error,
            attempt: this.config.retryAttempts || 0,
            batch: batchIndex
          });
        }
      }

      this.progress.processed++;
    }

    const batchTime = Date.now() - batchStartTime;
    this.processingTimes.push(batchTime);

    this.emit('batch:completed', {
      batchIndex,
      itemsProcessed: batch.length,
      duration: batchTime
    });
  }

  /**
   * Process single item with retry logic
   */
  private async processItemWithRetry(
    item: TInput,
    processor: (item: TInput) => Promise<TOutput>,
    batchIndex: number
  ): Promise<{ success: boolean; value?: TOutput; error?: Error }> {
    const maxAttempts = (this.config.retryAttempts || 0) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const itemStartTime = Date.now();
        const value = await processor(item);
        const itemTime = Date.now() - itemStartTime;

        this.emit('item:processed', {
          item,
          value,
          duration: itemTime,
          batch: batchIndex
        });

        return { success: true, value };
      } catch (error) {
        const err = error as Error;

        this.emit('item:error', {
          item,
          error: err,
          attempt,
          batch: batchIndex
        });

        // Retry if not last attempt
        if (attempt < maxAttempts) {
          const delay = this.config.retryDelay || 1000;
          await this.sleep(delay * attempt); // Exponential backoff
          continue;
        }

        return { success: false, error: err };
      }
    }

    return { success: false, error: new Error('Max retry attempts reached') };
  }

  /**
   * Update progress metrics
   */
  private updateProgress(): void {
    this.progress.percentage = Math.round(
      (this.progress.processed / this.progress.total) * 100
    );

    // Calculate estimated time remaining
    const elapsed = Date.now() - this.startTime;
    const averageTimePerItem = elapsed / this.progress.processed;
    const remaining = this.progress.total - this.progress.processed;
    this.progress.estimatedTimeRemaining = Math.round(averageTimePerItem * remaining);
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current progress
   */
  getProgress(): BatchProgress {
    return { ...this.progress };
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    averageBatchTime: number;
    totalBatches: number;
  } {
    const averageBatchTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    return {
      averageBatchTime: Math.round(averageBatchTime),
      totalBatches: this.processingTimes.length
    };
  }
}

/**
 * Batch processor factory
 */
export class BatchProcessorFactory {
  /**
   * Create database batch insert processor
   */
  static createDatabaseBatchInsert<T>(
    config: Partial<BatchConfig> = {}
  ): BatchProcessor<T, void> {
    return new BatchProcessor({
      batchSize: 1000,
      concurrency: 5,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    });
  }

  /**
   * Create API batch request processor
   */
  static createAPIBatchRequest<TInput, TOutput>(
    config: Partial<BatchConfig> = {}
  ): BatchProcessor<TInput, TOutput> {
    return new BatchProcessor({
      batchSize: 100,
      concurrency: 10,
      retryAttempts: 2,
      retryDelay: 500,
      ...config
    });
  }

  /**
   * Create file processing batch processor
   */
  static createFileProcessor<TInput, TOutput>(
    config: Partial<BatchConfig> = {}
  ): BatchProcessor<TInput, TOutput> {
    return new BatchProcessor({
      batchSize: 50,
      concurrency: 3,
      retryAttempts: 1,
      retryDelay: 2000,
      ...config
    });
  }

  /**
   * Create email batch processor
   */
  static createEmailBatch<T>(
    config: Partial<BatchConfig> = {}
  ): BatchProcessor<T, void> {
    return new BatchProcessor({
      batchSize: 500,
      concurrency: 20,
      retryAttempts: 3,
      retryDelay: 5000,
      ...config
    });
  }
}

/**
 * Helper function for simple batch operations
 */
export async function batchProcess<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput) => Promise<TOutput>,
  options?: Partial<BatchConfig>
): Promise<BatchResult<TOutput>> {
  const batchProcessor = new BatchProcessor<TInput, TOutput>({
    batchSize: options?.batchSize || 100,
    concurrency: options?.concurrency || 5,
    retryAttempts: options?.retryAttempts || 0,
    retryDelay: options?.retryDelay || 1000,
    onProgress: options?.onProgress,
    onError: options?.onError
  });

  return batchProcessor.process(items, processor);
}
