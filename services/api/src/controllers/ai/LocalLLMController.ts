/**
 * Local LLM Controller
 * Production implementation for local LLM operations with OpenAI-compatible API
 */

import { Request, Response } from 'express';
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

interface LLMRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  model?: string;
}

interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    text: string;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LocalLLMController {
  private static modelPath = process.env.LOCAL_LLM_MODEL_PATH || '/models/upcoach-ai.gguf';
  private static isModelLoaded = false;
  private static modelProcess: unknown = null;
  private static requestQueue: Array<{ req: Request; res: Response; timestamp: number }> = [];
  private static isProcessing = false;

  static async processQuery(req: Request, res: Response) {
    try {
      const { prompt, max_tokens = 256, temperature = 0.7, top_p = 1.0, stream = false, model = 'upcoach-local' }: LLMRequest = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid prompt provided'
        });
      }

      const startTime = performance.now();

      if (!await this.isModelAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Local LLM model not available',
          fallback_suggestion: 'Consider using cloud LLM endpoint'
        });
      }

      if (this.requestQueue.length > 10) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests queued',
          retry_after: 30
        });
      }

      this.requestQueue.push({ req, res, timestamp: Date.now() });

      if (!this.isProcessing) {
        await this.processQueue();
      }

    } catch (error) {
      console.error('LocalLLM process error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during LLM processing'
      });
    }
  }

  private static async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const item = this.requestQueue.shift();
      if (!item) break;

      const { req, res, timestamp } = item;

      if (Date.now() - timestamp > 60000) {
        res.status(408).json({
          success: false,
          error: 'Request timeout'
        });
        continue;
      }

      try {
        const response = await this.generateResponse(req.body);
        res.json({
          success: true,
          data: response
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate response'
        });
      }
    }

    this.isProcessing = false;
  }

  private static async generateResponse(params: LLMRequest): Promise<LLMResponse> {
    const { prompt, max_tokens = 256, temperature = 0.7, model = 'upcoach-local' } = params;

    return new Promise((resolve, reject) => {
      const llamaProcess = spawn('python3', [
        path.join(__dirname, '../../scripts/llm_runner.py'),
        '--model', this.modelPath,
        '--prompt', prompt,
        '--max-tokens', max_tokens.toString(),
        '--temperature', temperature.toString()
      ]);

      let output = '';
      let errorOutput = '';

      llamaProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      llamaProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      llamaProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            const response: LLMResponse = {
              id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              object: 'text_completion',
              created: Math.floor(Date.now() / 1000),
              model,
              choices: [{
                index: 0,
                text: result.text || '',
                finish_reason: result.finish_reason || 'stop'
              }],
              usage: {
                prompt_tokens: result.prompt_tokens || 0,
                completion_tokens: result.completion_tokens || 0,
                total_tokens: result.total_tokens || 0
              }
            };
            resolve(response);
          } catch (parseError) {
            reject(new Error('Failed to parse LLM response'));
          }
        } else {
          reject(new Error(`LLM process failed: ${errorOutput}`));
        }
      });

      setTimeout(() => {
        llamaProcess.kill();
        reject(new Error('LLM request timeout'));
      }, 30000);
    });
  }

  static async getStatus(req: Request, res: Response) {
    try {
      const modelAvailable = await this.isModelAvailable();
      const queueLength = this.requestQueue.length;
      const systemInfo = await this.getSystemInfo();

      res.json({
        success: true,
        status: modelAvailable ? 'online' : 'offline',
        model_path: this.modelPath,
        model_loaded: this.isModelLoaded,
        queue_length: queueLength,
        is_processing: this.isProcessing,
        system_info: systemInfo,
        capabilities: {
          text_generation: modelAvailable,
          streaming: false,
          max_context_length: 4096,
          supported_formats: ['text/plain', 'application/json']
        }
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve status'
      });
    }
  }

  static async healthCheck(req: Request, res: Response) {
    try {
      const startTime = performance.now();
      const testPrompt = "Hello, this is a health check.";

      if (!await this.isModelAvailable()) {
        return res.status(503).json({
          success: false,
          status: 'unhealthy',
          error: 'Model not available'
        });
      }

      const testResponse = await this.generateResponse({
        prompt: testPrompt,
        max_tokens: 10,
        temperature: 0.1
      });

      const responseTime = performance.now() - startTime;

      res.json({
        success: true,
        status: 'healthy',
        response_time_ms: Math.round(responseTime),
        test_response: testResponse.choices[0]?.text?.trim() || '',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async loadModel(req: Request, res: Response) {
    try {
      if (this.isModelLoaded) {
        return res.json({
          success: true,
          message: 'Model already loaded'
        });
      }

      const modelExists = await this.checkModelFile();
      if (!modelExists) {
        return res.status(404).json({
          success: false,
          error: 'Model file not found',
          model_path: this.modelPath
        });
      }

      this.isModelLoaded = true;

      res.json({
        success: true,
        message: 'Model loaded successfully',
        model_path: this.modelPath
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to load model'
      });
    }
  }

  static async unloadModel(req: Request, res: Response) {
    try {
      if (this.modelProcess) {
        this.modelProcess.kill();
        this.modelProcess = null;
      }

      this.isModelLoaded = false;
      this.requestQueue.length = 0;

      res.json({
        success: true,
        message: 'Model unloaded successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to unload model'
      });
    }
  }

  private static async isModelAvailable(): Promise<boolean> {
    return await this.checkModelFile() && (this.isModelLoaded || process.env.NODE_ENV === 'development');
  }

  private static async checkModelFile(): Promise<boolean> {
    try {
      await fs.access(this.modelPath);
      return true;
    } catch {
      return false;
    }
  }

  private static async getSystemInfo() {
    const os = require('os');
    return {
      platform: os.platform(),
      arch: os.arch(),
      total_memory: os.totalmem(),
      free_memory: os.freemem(),
      cpu_count: os.cpus().length,
      load_average: os.loadavg()
    };
  }

  /**
   * Get list of available LLM models
   */
  static async getAvailableModels(req: Request, res: Response) {
    try {
      const modelsDir = process.env.LOCAL_LLM_MODELS_DIR || path.join(__dirname, '../../models');
      let availableModels: Array<{
        name: string;
        path: string;
        size: number;
        format: string;
        loaded: boolean;
      }> = [];

      try {
        const files = await fs.readdir(modelsDir);
        const modelFiles = files.filter(f =>
          f.endsWith('.gguf') || f.endsWith('.bin') || f.endsWith('.safetensors')
        );

        for (const file of modelFiles) {
          const filePath = path.join(modelsDir, file);
          const stats = await fs.stat(filePath);
          availableModels.push({
            name: file.replace(/\.(gguf|bin|safetensors)$/, ''),
            path: filePath,
            size: stats.size,
            format: path.extname(file).slice(1),
            loaded: filePath === this.modelPath && this.isModelLoaded
          });
        }
      } catch {
        // Models directory doesn't exist or is empty
      }

      // Always include the configured model path
      const configuredModelName = path.basename(this.modelPath).replace(/\.(gguf|bin|safetensors)$/, '');
      const configuredModelExists = await this.checkModelFile();

      if (!availableModels.find(m => m.path === this.modelPath)) {
        availableModels.unshift({
          name: configuredModelName,
          path: this.modelPath,
          size: 0,
          format: path.extname(this.modelPath).slice(1) || 'gguf',
          loaded: this.isModelLoaded
        });
      }

      res.json({
        success: true,
        models: availableModels,
        current_model: {
          name: configuredModelName,
          path: this.modelPath,
          loaded: this.isModelLoaded,
          available: configuredModelExists
        },
        supported_formats: ['gguf', 'bin', 'safetensors']
      });
    } catch (error) {
      console.error('Get available models error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve available models'
      });
    }
  }

  /**
   * Initialize a specific model
   */
  static async initializeModel(req: Request, res: Response) {
    try {
      const { model_path, model_name } = req.body;

      // Use provided path or look up by name
      let targetPath = model_path;
      if (!targetPath && model_name) {
        const modelsDir = process.env.LOCAL_LLM_MODELS_DIR || path.join(__dirname, '../../models');
        targetPath = path.join(modelsDir, `${model_name}.gguf`);
      }

      if (!targetPath) {
        return res.status(400).json({
          success: false,
          error: 'Model path or name required'
        });
      }

      // Check if model file exists
      try {
        await fs.access(targetPath);
      } catch {
        return res.status(404).json({
          success: false,
          error: 'Model file not found',
          path: targetPath
        });
      }

      // Unload current model if different
      if (this.isModelLoaded && this.modelPath !== targetPath) {
        if (this.modelProcess) {
          (this.modelProcess as { kill: () => void }).kill();
          this.modelProcess = null;
        }
        this.isModelLoaded = false;
      }

      // Update model path and mark as loaded
      this.modelPath = targetPath;
      this.isModelLoaded = true;

      res.json({
        success: true,
        message: 'Model initialized successfully',
        model: {
          path: targetPath,
          name: path.basename(targetPath).replace(/\.(gguf|bin|safetensors)$/, ''),
          loaded: true
        }
      });
    } catch (error) {
      console.error('Initialize model error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize model'
      });
    }
  }

  /**
   * Get LLM performance metrics
   */
  static async getMetrics(req: Request, res: Response) {
    try {
      const systemInfo = await this.getSystemInfo();
      const modelAvailable = await this.isModelAvailable();

      // Calculate queue metrics
      const queueLength = this.requestQueue.length;
      const oldestRequest = this.requestQueue[0];
      const queueWaitTime = oldestRequest ? Date.now() - oldestRequest.timestamp : 0;

      // Memory usage
      const memoryUsage = process.memoryUsage();

      res.json({
        success: true,
        metrics: {
          model: {
            path: this.modelPath,
            loaded: this.isModelLoaded,
            available: modelAvailable
          },
          queue: {
            length: queueLength,
            is_processing: this.isProcessing,
            oldest_request_age_ms: queueWaitTime,
            max_queue_size: 10
          },
          performance: {
            uptime_seconds: process.uptime(),
            memory_usage: {
              heap_used: memoryUsage.heapUsed,
              heap_total: memoryUsage.heapTotal,
              rss: memoryUsage.rss,
              external: memoryUsage.external
            }
          },
          system: systemInfo,
          limits: {
            max_tokens: 4096,
            max_context_length: 4096,
            request_timeout_ms: 30000,
            queue_timeout_ms: 60000
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics'
      });
    }
  }
}

// Export both default and named instance for different import styles
export default LocalLLMController;
export const localLLMController = LocalLLMController;