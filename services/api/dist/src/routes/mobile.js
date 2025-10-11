"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: {
            version: '1.0.0',
            features: {
                pushNotifications: true,
                biometricAuth: false,
                darkMode: true
            }
        }
    });
});
router.post('/register-device', (req, res) => {
    res.json({
        success: true,
        message: 'Device registered successfully'
    });
});
exports.default = router;
//# sourceMappingURL=mobile.js.map