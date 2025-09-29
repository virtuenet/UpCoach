"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockRedis = void 0;
class MockRedis {
    store = new Map();
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value) {
        this.store.set(key, { value });
    }
    async setEx(key, seconds, value) {
        const expiry = Date.now() + (seconds * 1000);
        this.store.set(key, { value, expiry });
    }
    async del(key) {
        const existed = this.store.has(key);
        this.store.delete(key);
        return existed ? 1 : 0;
    }
    async exists(key) {
        const item = this.store.get(key);
        if (!item)
            return 0;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return 0;
        }
        return 1;
    }
    async expire(key, seconds) {
        const item = this.store.get(key);
        if (!item)
            return 0;
        const expiry = Date.now() + (seconds * 1000);
        this.store.set(key, { ...item, expiry });
        return 1;
    }
    async ttl(key) {
        const item = this.store.get(key);
        if (!item)
            return -2;
        if (!item.expiry)
            return -1;
        const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
    clear() {
        this.store.clear();
    }
    size() {
        return this.store.size;
    }
    keys() {
        return Array.from(this.store.keys());
    }
}
exports.mockRedis = new MockRedis();
jest.mock('../../services/redis', () => ({
    redis: exports.mockRedis
}));
exports.default = exports.mockRedis;
//# sourceMappingURL=redis.js.map