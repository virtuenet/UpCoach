"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const LocalLLMController_1 = tslib_1.__importDefault(require("../controllers/ai/LocalLLMController"));
const router = (0, express_1.Router)();
router.post('/query', LocalLLMController_1.default.processQuery);
router.get('/status', LocalLLMController_1.default.getStatus);
exports.default = router;
