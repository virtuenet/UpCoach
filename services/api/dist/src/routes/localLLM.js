"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LocalLLMController_1 = __importDefault(require("../controllers/ai/LocalLLMController"));
const router = (0, express_1.Router)();
router.post('/query', LocalLLMController_1.default.processQuery);
router.get('/status', LocalLLMController_1.default.getStatus);
exports.default = router;
//# sourceMappingURL=localLLM.js.map