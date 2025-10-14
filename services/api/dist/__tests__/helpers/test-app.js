"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
exports.createMockResponse = createMockResponse;
exports.createMockRequest = createMockRequest;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const database_1 = require("../helpers/database");
const error_1 = require("../../middleware/error");
const auth_1 = tslib_1.__importDefault(require("../../routes/auth"));
const users_1 = tslib_1.__importDefault(require("../../routes/users"));
async function createTestApp() {
    const app = (0, express_1.default)();
    await (0, database_1.initializeDatabase)();
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use('/auth', auth_1.default);
    app.use('/users', users_1.default);
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', environment: 'test' });
    });
    app.use(error_1.errorMiddleware);
    return app;
}
function createMockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
}
function createMockRequest(overrides = {}) {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        user: null,
        ...overrides
    };
}
