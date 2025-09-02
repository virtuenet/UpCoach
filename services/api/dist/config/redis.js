"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRedis = initializeRedis;
exports.getRedis = getRedis;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDelete = cacheDelete;
exports.cacheExists = cacheExists;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
let redisClient;
async function initializeRedis() {
    redisClient = (0, redis_1.createClient)({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    redisClient.on('error', err => {
        logger_1.logger.error('Redis Client Error:', err);
    });
    redisClient.on('connect', () => {
        logger_1.logger.info('Redis Client Connected');
    });
    await redisClient.connect();
}
function getRedis() {
    if (!redisClient) {
        throw new Error('Redis not initialized. Call initializeRedis() first.');
    }
    return redisClient;
}
// Cache helpers
async function cacheGet(key) {
    const value = await redisClient.get(key);
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
async function cacheSet(key, value, expirySeconds) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (expirySeconds) {
        await redisClient.setEx(key, expirySeconds, stringValue);
    }
    else {
        await redisClient.set(key, stringValue);
    }
}
async function cacheDelete(key) {
    await redisClient.del(key);
}
async function cacheExists(key) {
    const exists = await redisClient.exists(key);
    return exists === 1;
}
//# sourceMappingURL=redis.js.map