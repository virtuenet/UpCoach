"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const redis_1 = require("redis");
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
class RedisService {
    client;
    isConnected = false;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: environment_1.config.redisUrl,
            socket: {
                connectTimeout: 5000,
            },
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.logger.info('Redis client connected');
        });
        this.client.on('ready', () => {
            logger_1.logger.info('Redis client ready');
            this.isConnected = true;
        });
        this.client.on('error', err => {
            logger_1.logger.error('Redis client error:', err);
            this.isConnected = false;
        });
        this.client.on('end', () => {
            logger_1.logger.info('Redis client disconnected');
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('Redis client reconnecting');
        });
    }
    async connect() {
        if (!this.isConnected) {
            try {
                await this.client.connect();
            }
            catch (error) {
                logger_1.logger.error('Failed to connect to Redis:', error);
                throw error;
            }
        }
    }
    async disconnect() {
        if (this.isConnected) {
            try {
                await this.client.quit();
            }
            catch (error) {
                logger_1.logger.error('Error disconnecting from Redis:', error);
                throw error;
            }
        }
    }
    // Basic Redis operations
    async get(key) {
        try {
            await this.ensureConnected();
            return await this.client.get(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis GET error for key ${key}:`, error);
            throw error;
        }
    }
    async set(key, value, ttl) {
        try {
            await this.ensureConnected();
            if (ttl) {
                await this.client.setEx(key, ttl, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            logger_1.logger.error(`Redis SET error for key ${key}:`, error);
            throw error;
        }
    }
    async setEx(key, ttl, value) {
        try {
            await this.ensureConnected();
            await this.client.setEx(key, ttl, value);
        }
        catch (error) {
            logger_1.logger.error(`Redis SETEX error for key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            await this.ensureConnected();
            return await this.client.del(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis DEL error for key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            await this.ensureConnected();
            return await this.client.exists(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis EXISTS error for key ${key}:`, error);
            throw error;
        }
    }
    async incr(key) {
        try {
            await this.ensureConnected();
            return await this.client.incr(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis INCR error for key ${key}:`, error);
            throw error;
        }
    }
    async ping() {
        try {
            await this.ensureConnected();
            return await this.client.ping();
        }
        catch (error) {
            logger_1.logger.error('Redis PING error:', error);
            throw error;
        }
    }
    async quit() {
        try {
            if (this.isConnected) {
                return await this.client.quit();
            }
            return 'OK';
        }
        catch (error) {
            logger_1.logger.error('Redis QUIT error:', error);
            throw error;
        }
    }
    // Hash operations
    async hget(key, field) {
        try {
            await this.ensureConnected();
            return await this.client.hGet(key, field);
        }
        catch (error) {
            logger_1.logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }
    async hset(key, field, value) {
        try {
            await this.ensureConnected();
            return await this.client.hSet(key, field, value);
        }
        catch (error) {
            logger_1.logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }
    async hdel(key, field) {
        try {
            await this.ensureConnected();
            return await this.client.hDel(key, field);
        }
        catch (error) {
            logger_1.logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }
    // List operations
    async lpush(key, value) {
        try {
            await this.ensureConnected();
            return await this.client.lPush(key, value);
        }
        catch (error) {
            logger_1.logger.error(`Redis LPUSH error for key ${key}:`, error);
            throw error;
        }
    }
    async rpop(key) {
        try {
            await this.ensureConnected();
            return await this.client.rPop(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis RPOP error for key ${key}:`, error);
            throw error;
        }
    }
    // Session management helpers
    async getSession(sessionId) {
        try {
            const sessionData = await this.get(`session:${sessionId}`);
            return sessionData ? JSON.parse(sessionData) : null;
        }
        catch (error) {
            logger_1.logger.error(`Error getting session ${sessionId}:`, error);
            return null;
        }
    }
    async setSession(sessionId, data, ttl = 3600) {
        try {
            await this.setEx(`session:${sessionId}`, ttl, JSON.stringify(data));
        }
        catch (error) {
            logger_1.logger.error(`Error setting session ${sessionId}:`, error);
            throw error;
        }
    }
    async deleteSession(sessionId) {
        try {
            await this.del(`session:${sessionId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }
    async keys(pattern) {
        try {
            await this.ensureConnected();
            return await this.client.keys(pattern);
        }
        catch (error) {
            logger_1.logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
            throw error;
        }
    }
    async ensureConnected() {
        if (!this.isConnected) {
            await this.connect();
        }
    }
    // Set operations
    async sadd(key, member) {
        try {
            await this.ensureConnected();
            return await this.client.sAdd(key, member);
        }
        catch (error) {
            logger_1.logger.error(`Redis SADD error for key ${key}:`, error);
            throw error;
        }
    }
    async srem(key, member) {
        try {
            await this.ensureConnected();
            return await this.client.sRem(key, member);
        }
        catch (error) {
            logger_1.logger.error(`Redis SREM error for key ${key}:`, error);
            throw error;
        }
    }
    async smembers(key) {
        try {
            await this.ensureConnected();
            return await this.client.sMembers(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis SMEMBERS error for key ${key}:`, error);
            throw error;
        }
    }
    async expire(key, seconds) {
        try {
            await this.ensureConnected();
            return await this.client.expire(key, seconds);
        }
        catch (error) {
            logger_1.logger.error(`Redis EXPIRE error for key ${key}:`, error);
            throw error;
        }
    }
    async ttl(key) {
        try {
            await this.ensureConnected();
            return await this.client.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis TTL error for key ${key}:`, error);
            throw error;
        }
    }
    // Expose the raw client for advanced operations
    get rawClient() {
        return this.client;
    }
}
// Create and export Redis service instance
const redisService = new RedisService();
exports.redis = redisService;
// Auto-connect in non-test environments
if (process.env.NODE_ENV !== 'test') {
    redisService.connect().catch(error => {
        logger_1.logger.error('Failed to auto-connect to Redis:', error);
    });
}
exports.default = redisService;
//# sourceMappingURL=redis.js.map