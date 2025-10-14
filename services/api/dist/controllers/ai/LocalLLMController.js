"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalLLMController = void 0;
class LocalLLMController {
    static async processQuery(req, res) {
        res.status(501).json({
            success: false,
            message: 'Local LLM functionality not implemented'
        });
    }
    static async getStatus(req, res) {
        res.json({
            success: true,
            status: 'offline',
            message: 'Local LLM service not configured'
        });
    }
}
exports.LocalLLMController = LocalLLMController;
exports.default = LocalLLMController;
