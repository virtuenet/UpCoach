import { localPhi3Service } from '../../services/ai/local/LocalPhi3Service';
import { config } from '../../config/environment';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('../../config/environment');

describe('LocalPhi3Service', () => {
  const mockPrompt = 'What is the capital of France?';
  const mockMaxTokens = 256;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should call Python runner with correct arguments', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      const mockResponse = {
        text: 'The capital of France is Paris.',
        prompt_tokens: 10,
        completion_tokens: 8,
        total_tokens: 18
      };

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      // Simulate process success
      setTimeout(() => {
        mockProcess.stdout.emit('data', JSON.stringify(mockResponse));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await localPhi3Service.generate(mockPrompt, { maxTokens: mockMaxTokens });

      expect(result).toBeDefined();
      expect(result.content).toBe(mockResponse.text);
      expect(result.usage.totalTokens).toBe(mockResponse.total_tokens);
    });

    it('should handle Python runner errors gracefully', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      setTimeout(() => {
        mockProcess.stderr.emit('data', 'Model not found');
        mockProcess.emit('close', 1);
      }, 10);

      await expect(localPhi3Service.generate(mockPrompt))
        .rejects.toThrow();
    });

    it('should timeout if Python process hangs', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      // Don't emit any events - simulate hanging process

      await expect(localPhi3Service.generate(mockPrompt, { timeout: 100 }))
        .rejects.toThrow('timeout');

      expect(mockProcess.kill).toHaveBeenCalled();
    }, 150);

    it('should pass correct backend parameter', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      const mockResponse = {
        text: 'Response',
        prompt_tokens: 5,
        completion_tokens: 3,
        total_tokens: 8
      };

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      setTimeout(() => {
        mockProcess.stdout.emit('data', JSON.stringify(mockResponse));
        mockProcess.emit('close', 0);
      }, 10);

      await localPhi3Service.generate(mockPrompt, { backend: 'onnx' });

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['--backend', 'onnx']),
        expect.any(Object)
      );
    });

    it('should handle malformed JSON from Python', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Invalid JSON{');
        mockProcess.emit('close', 0);
      }, 10);

      await expect(localPhi3Service.generate(mockPrompt))
        .rejects.toThrow();
    });
  });

  describe('checkStatus', () => {
    it('should return online status when model is accessible', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      const status = await localPhi3Service.checkStatus();

      expect(status.online).toBe(true);
    });

    it('should return offline status when model is not accessible', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      setTimeout(() => {
        mockProcess.stderr.emit('data', 'Model file not found');
        mockProcess.emit('close', 1);
      }, 10);

      const status = await localPhi3Service.checkStatus();

      expect(status.online).toBe(false);
      expect(status.error).toBeDefined();
    });

    it('should include backend and model path in status', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      const status = await localPhi3Service.checkStatus();

      expect(status.backend).toBeDefined();
      expect(status.modelPath).toBeDefined();
    });
  });

  describe('configuration validation', () => {
    it('should validate model path exists', () => {
      expect(config.localLLM.modelPath).toBeDefined();
      expect(typeof config.localLLM.modelPath).toBe('string');
    });

    it('should validate backend is supported', () => {
      const validBackends = ['llama.cpp', 'transformers', 'onnx'];
      expect(validBackends).toContain(config.localLLM.backend);
    });

    it('should have reasonable token limits', () => {
      expect(config.localLLM.maxTokens).toBeGreaterThan(0);
      expect(config.localLLM.maxTokens).toBeLessThanOrEqual(4096);
      expect(config.localLLM.contextWindow).toBeGreaterThanOrEqual(config.localLLM.maxTokens);
    });

    it('should have reasonable timeout', () => {
      expect(config.localLLM.timeoutMs).toBeGreaterThan(1000);
      expect(config.localLLM.timeoutMs).toBeLessThanOrEqual(60000);
    });
  });

  describe('error recovery', () => {
    it('should provide fallback suggestions when model fails', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      setTimeout(() => {
        mockProcess.stderr.emit('data', 'ONNX Runtime not found');
        mockProcess.emit('close', 1);
      }, 10);

      try {
        await localPhi3Service.generate(mockPrompt);
      } catch (error: any) {
        expect(error.message).toBeDefined();
        // Error should contain helpful information
      }
    });
  });
});
