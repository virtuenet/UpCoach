"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionStore = exports.SessionStore = void 0;
const redis_1 = require("../redis");
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
class SessionStore {
    prefix = 'oidc_session:';
    ttl = 600; // 10 minutes
    async createSession(configId, redirectUri) {
        try {
            const state = crypto_1.default.randomBytes(32).toString('hex');
            const codeVerifier = crypto_1.default.randomBytes(32).toString('hex');
            const session = {
                state,
                codeVerifier,
                redirectUri,
                configId,
                createdAt: new Date(),
            };
            await redis_1.redis.setEx(`${this.prefix}${state}`, this.ttl, JSON.stringify(session));
            logger_1.logger.info('OIDC session created', { state, configId });
            return state;
        }
        catch (error) {
            logger_1.logger.error('Failed to create OIDC session', error);
            throw error;
        }
    }
    async getSession(state) {
        try {
            const data = await redis_1.redis.get(`${this.prefix}${state}`);
            if (!data) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error('Failed to get OIDC session', error);
            return null;
        }
    }
    async deleteSession(state) {
        try {
            await redis_1.redis.del(`${this.prefix}${state}`);
            logger_1.logger.info('OIDC session deleted', { state });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete OIDC session', error);
        }
    }
    async getCodeVerifier(state) {
        const session = await this.getSession(state);
        return session?.codeVerifier || null;
    }
}
exports.SessionStore = SessionStore;
exports.sessionStore = new SessionStore();
//# sourceMappingURL=SessionStore.js.map