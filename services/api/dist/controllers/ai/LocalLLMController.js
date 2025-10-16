"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalLLMController = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const perf_hooks_1 = require("perf_hooks");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const path_1 = tslib_1.__importDefault(require("path"));
class LocalLLMController {
    static modelPath = process.env.LOCAL_LLM_MODEL_PATH || '/models/upcoach-ai.gguf';
    static isModelLoaded = false;
    static modelProcess = null;
    static requestQueue = [];
    static isProcessing = false;
    static async processQuery(req, res) {
        try {
            const { prompt, max_tokens = 256, temperature = 0.7, top_p = 1.0, stream = false, model = 'upcoach-local' } = req.body;
            if (!prompt || typeof prompt !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid prompt provided'
                });
            }
            const startTime = perf_hooks_1.performance.now();
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
        }
        catch (error) {
            console.error('LocalLLM process error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during LLM processing'
            });
        }
    }
    static async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0)
            return;
        this.isProcessing = true;
        while (this.requestQueue.length > 0) {
            const item = this.requestQueue.shift();
            if (!item)
                break;
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate response'
                });
            }
        }
        this.isProcessing = false;
    }
    static async generateResponse(params) {
        const { prompt, max_tokens = 256, temperature = 0.7, model = 'upcoach-local' } = params;
        return new Promise((resolve, reject) => {
            const llamaProcess = (0, child_process_1.spawn)('python3', [
                path_1.default.join(__dirname, '../../scripts/llm_runner.py'),
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
                        const response = {
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
                    }
                    catch (parseError) {
                        reject(new Error('Failed to parse LLM response'));
                    }
                }
                else {
                    reject(new Error(`LLM process failed: ${errorOutput}`));
                }
            });
            setTimeout(() => {
                llamaProcess.kill();
                reject(new Error('LLM request timeout'));
            }, 30000);
        });
    }
    static async getStatus(req, res) {
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
        }
        catch (error) {
            console.error('Status check error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve status'
            });
        }
    }
    static async healthCheck(req, res) {
        try {
            const startTime = perf_hooks_1.performance.now();
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
            const responseTime = perf_hooks_1.performance.now() - startTime;
            res.json({
                success: true,
                status: 'healthy',
                response_time_ms: Math.round(responseTime),
                test_response: testResponse.choices[0]?.text?.trim() || '',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(503).json({
                success: false,
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async loadModel(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to load model'
            });
        }
    }
    static async unloadModel(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to unload model'
            });
        }
    }
    static async isModelAvailable() {
        return await this.checkModelFile() && (this.isModelLoaded || process.env.NODE_ENV === 'development');
    }
    static async checkModelFile() {
        try {
            await promises_1.default.access(this.modelPath);
            return true;
        }
        catch {
            return false;
        }
    }
    static async getSystemInfo() {
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
}
exports.LocalLLMController = LocalLLMController;
exports.default = LocalLLMController;
