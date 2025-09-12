"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CoachIntelligenceController_1 = __importStar(require("../controllers/CoachIntelligenceController"));
const router = (0, express_1.Router)();
const coachIntelligenceController = new CoachIntelligenceController_1.default();
router.post('/sessions', CoachIntelligenceController_1.coachIntelligenceValidation.processSession, coachIntelligenceController.processSession.bind(coachIntelligenceController));
router.get('/memories/relevant/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getRelevantMemories, coachIntelligenceController.getRelevantMemories.bind(coachIntelligenceController));
router.get('/memories/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getUserMemories, coachIntelligenceController.getUserMemories.bind(coachIntelligenceController));
router.get('/analytics/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getUserAnalytics, coachIntelligenceController.getUserAnalytics.bind(coachIntelligenceController));
router.get('/cohort-analytics', coachIntelligenceController.getCohortAnalytics.bind(coachIntelligenceController));
router.get('/recommendations/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getCoachingRecommendations, coachIntelligenceController.getCoachingRecommendations.bind(coachIntelligenceController));
router.get('/reports/weekly/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getWeeklyReport, coachIntelligenceController.getWeeklyReport.bind(coachIntelligenceController));
router.post('/kpi-trackers', CoachIntelligenceController_1.coachIntelligenceValidation.createKpiTracker, coachIntelligenceController.createKpiTracker.bind(coachIntelligenceController));
router.get('/kpi-trackers/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getUserKpiTrackers, coachIntelligenceController.getUserKpiTrackers.bind(coachIntelligenceController));
router.patch('/kpi-trackers/:id/progress', CoachIntelligenceController_1.coachIntelligenceValidation.updateKpiProgress, coachIntelligenceController.updateKpiProgress.bind(coachIntelligenceController));
exports.default = router;
//# sourceMappingURL=coachIntelligence.js.map