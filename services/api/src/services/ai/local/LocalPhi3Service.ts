import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

import { config } from '../../../config/environment';
import { logger } from '../../../utils/logger';

interface LocalGenerationOptions {
  temperature: number;
  maxTokens: number;
}

interface LocalGenerationResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

class LocalPhi3Service {
  private modelVerified = false;
  private verifyingPromise: Promise<void> | null = null;

  constructor() {
    if (config.localLLM.enabled) {
      this.verifyingPromise = this.verifyModelPath();
    }
  }

  private async verifyModelPath(): Promise<void> {
    try {
      await fs.access(config.localLLM.modelPath);
      this.modelVerified = true;
      logger.info('[LocalPhi3Service] Verified local model path', {
        path: config.localLLM.modelPath,
        backend: config.localLLM.backend,
      });
    } catch (error) {
      this.modelVerified = false;
      logger.warn('[LocalPhi3Service] Local model file missing', {
        path: config.localLLM.modelPath,
        error: (error as Error).message,
      });
    }
  }

  async isReady(): Promise<boolean> {
    if (!config.localLLM.enabled) {
      return false;
    }
    if (this.verifyingPromise) {
      await this.verifyingPromise;
      this.verifyingPromise = null;
    }
    return this.modelVerified;
  }

  async generate(prompt: string, options: LocalGenerationOptions): Promise<LocalGenerationResult> {
    if (!(await this.isReady())) {
      throw new Error('Local Phi-3.5 model is not ready');
    }

    const scriptPath = path.resolve(__dirname, '../../../scripts/llm_runner.py');

    return new Promise((resolve, reject) => {
      const pythonArgs = [
        scriptPath,
        '--model',
        config.localLLM.modelPath,
        '--backend',
        config.localLLM.backend,
        '--prompt',
        prompt,
        '--max-tokens',
        Math.min(options.maxTokens, config.localLLM.maxTokens).toString(),
        '--temperature',
        options.temperature.toString(),
      ];

      const processRef = spawn('python3', pythonArgs, {
        env: {
          ...process.env,
        },
      });

      let stdout = '';
      let stderr = '';
      let timeoutHandle: NodeJS.Timeout | null = null;

      processRef.stdout.on('data', chunk => {
        stdout += chunk.toString();
      });

      processRef.stderr.on('data', chunk => {
        stderr += chunk.toString();
      });

      processRef.on('error', error => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(error);
      });

      processRef.on('close', code => {
        if (timeoutHandle) clearTimeout(timeoutHandle);

        if (code !== 0) {
          logger.warn('[LocalPhi3Service] LLM runner exited with non-zero code', {
            code,
            stderr,
          });
          return reject(new Error(stderr || 'Local LLM runner failed'));
        }

        try {
          const payload = JSON.parse(stdout);
          if (payload.error) {
            return reject(new Error(payload.error));
          }
          resolve({
            text: payload.text ?? '',
            promptTokens: payload.prompt_tokens ?? 0,
            completionTokens: payload.completion_tokens ?? 0,
            totalTokens: payload.total_tokens ?? 0,
          });
        } catch (error) {
          reject(new Error(`Failed to parse local LLM output: ${(error as Error).message}`));
        }
      });

      timeoutHandle = setTimeout(() => {
        processRef.kill('SIGKILL');
        reject(new Error('Local LLM request timed out'));
      }, config.localLLM.timeoutMs);
    });
  }
}

export const localPhi3Service = new LocalPhi3Service();

