"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const OnboardingController_1 = __importDefault(require("../controllers/OnboardingController"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Get onboarding status
router.get('/status', (req, res) => OnboardingController_1.default.getOnboardingStatus(req, res));
// Complete onboarding
router.post('/complete', [
    (0, express_validator_1.body)('profile.name').notEmpty().isString().withMessage('Name is required'),
    (0, express_validator_1.body)('profile.age').optional().isInt({ min: 13, max: 120 }),
    (0, express_validator_1.body)('profile.occupation').optional().isString(),
    (0, express_validator_1.body)('profile.timezone').optional().isString(),
    (0, express_validator_1.body)('goals.primaryGoal').notEmpty().isString(),
    (0, express_validator_1.body)('goals.specificGoals').isArray().notEmpty().withMessage('At least one goal is required'),
    (0, express_validator_1.body)('goals.timeline').notEmpty().isIn(['1-3 months', '3-6 months', '6-12 months', '1+ years']),
    (0, express_validator_1.body)('preferences.coachingStyle')
        .notEmpty()
        .isIn(['supportive', 'challenging', 'analytical', 'holistic']),
    (0, express_validator_1.body)('preferences.challenges').optional().isString(),
    (0, express_validator_1.body)('availability.commitmentLevel').notEmpty().isIn(['daily', 'regular', 'weekly']),
], validation_1.validateRequest, (req, res) => OnboardingController_1.default.completeOnboarding(req, res));
// Skip onboarding
router.post('/skip', (req, res) => OnboardingController_1.default.skipOnboarding(req, res));
exports.default = router;
//# sourceMappingURL=onboarding.js.map