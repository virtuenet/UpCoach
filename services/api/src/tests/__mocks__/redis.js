// Mock for redis package
class RedisClient {
  constructor() {
    this.data = new Map();
    this.hashes = new Map();
    this.lists = new Map();
    this.sets = new Map();
    this.ttls = new Map();
    this.connected = false;
    this.isReady = false;
    this.eventHandlers = new Map();

    // All methods as jest.fn() so tests can use .mockResolvedValue(), .mock Resolved(), etc.
    // Basic operations
    this.get = jest.fn((key) => {
      return Promise.resolve(this.data.get(key) || null);
    });

    this.set = jest.fn((key, value, options) => {
      this.data.set(key, value);
      if (options && options.EX) {
        this.ttls.set(key, options.EX);
      }
      return Promise.resolve('OK');
    });

    this.setEx = jest.fn((key, seconds, value) => {
      this.data.set(key, value);
      this.ttls.set(key, seconds);
      return Promise.resolve('OK');
    });

    this.del = jest.fn((key) => {
      const existed = this.data.has(key);
      this.data.delete(key);
      this.ttls.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    });

    this.exists = jest.fn((key) => {
      return Promise.resolve(this.data.has(key) ? 1 : 0);
    });

    this.expire = jest.fn((key, seconds) => {
      const exists = this.data.has(key);
      if (exists) {
        this.ttls.set(key, seconds);
      }
      return Promise.resolve(exists ? true : false);
    });

    this.ttl = jest.fn((key) => {
      if (this.ttls.has(key)) {
        return Promise.resolve(this.ttls.get(key));
      }
      return Promise.resolve(this.data.has(key) ? -1 : -2);
    });

    // Multi operations
    this.mGet = jest.fn((keys) => {
      const values = keys.map(key => this.data.get(key) || null);
      return Promise.resolve(values);
    });

    this.mget = this.mGet; // Alias for lowercase

    this.mSet = jest.fn((keyValuePairs) => {
      if (typeof keyValuePairs === 'object' && !Array.isArray(keyValuePairs)) {
        // Object format: { key1: value1, key2: value2 }
        Object.entries(keyValuePairs).forEach(([key, value]) => {
          this.data.set(key, value);
        });
      } else {
        // Array format: [key1, value1, key2, value2]
        for (let i = 0; i < keyValuePairs.length; i += 2) {
          this.data.set(keyValuePairs[i], keyValuePairs[i + 1]);
        }
      }
      return Promise.resolve('OK');
    });

    this.mset = this.mSet; // Alias for lowercase

    // Counter operations
    this.incr = jest.fn((key) => {
      const current = parseInt(this.data.get(key) || '0', 10);
      const newValue = current + 1;
      this.data.set(key, String(newValue));
      return Promise.resolve(newValue);
    });

    this.decr = jest.fn((key) => {
      const current = parseInt(this.data.get(key) || '0', 10);
      const newValue = current - 1;
      this.data.set(key, String(newValue));
      return Promise.resolve(newValue);
    });

    // Hash operations
    this.hGet = jest.fn((key, field) => {
      const hash = this.hashes.get(key) || new Map();
      return Promise.resolve(hash.get(field));
    });

    this.hget = this.hGet; // Alias for lowercase

    this.hSet = jest.fn((key, field, value) => {
      if (!this.hashes.has(key)) {
        this.hashes.set(key, new Map());
      }
      const hash = this.hashes.get(key);
      const isNew = !hash.has(field);
      hash.set(field, value);
      return Promise.resolve(isNew ? 1 : 0);
    });

    this.hset = this.hSet; // Alias for lowercase

    this.hDel = jest.fn((key, field) => {
      const hash = this.hashes.get(key);
      if (!hash) return Promise.resolve(0);
      const existed = hash.has(field);
      hash.delete(field);
      return Promise.resolve(existed ? 1 : 0);
    });

    this.hdel = this.hDel; // Alias for lowercase

    this.hGetAll = jest.fn((key) => {
      const hash = this.hashes.get(key) || new Map();
      const obj = {};
      hash.forEach((value, field) => {
        obj[field] = value;
      });
      return Promise.resolve(obj);
    });

    this.hgetall = this.hGetAll; // Alias for lowercase

    // List operations
    this.lPush = jest.fn((key, value) => {
      if (!this.lists.has(key)) {
        this.lists.set(key, []);
      }
      const list = this.lists.get(key);
      list.unshift(value);
      return Promise.resolve(list.length);
    });

    this.lpush = this.lPush; // Alias for lowercase

    this.rPush = jest.fn((key, value) => {
      if (!this.lists.has(key)) {
        this.lists.set(key, []);
      }
      const list = this.lists.get(key);
      list.push(value);
      return Promise.resolve(list.length);
    });

    this.rpush = this.rPush; // Alias for lowercase

    this.lPop = jest.fn((key) => {
      const list = this.lists.get(key);
      if (!list || list.length === 0) return Promise.resolve(null);
      return Promise.resolve(list.shift());
    });

    this.lpop = this.lPop; // Alias for lowercase

    this.rPop = jest.fn((key) => {
      const list = this.lists.get(key);
      if (!list || list.length === 0) return Promise.resolve(null);
      return Promise.resolve(list.pop());
    });

    this.rpop = this.rPop; // Alias for lowercase

    this.lRange = jest.fn((key, start, stop) => {
      const list = this.lists.get(key) || [];
      const end = stop === -1 ? list.length : stop + 1;
      return Promise.resolve(list.slice(start, end));
    });

    this.lrange = this.lRange; // Alias for lowercase

    this.lTrim = jest.fn((key, start, stop) => {
      const list = this.lists.get(key);
      if (!list) return Promise.resolve('OK');
      const end = stop === -1 ? list.length : stop + 1;
      this.lists.set(key, list.slice(start, end));
      return Promise.resolve('OK');
    });

    this.ltrim = this.lTrim; // Alias for lowercase

    // Set operations
    this.sAdd = jest.fn((key, member) => {
      if (!this.sets.has(key)) {
        this.sets.set(key, new Set());
      }
      const set = this.sets.get(key);
      const isNew = !set.has(member);
      set.add(member);
      return Promise.resolve(isNew ? 1 : 0);
    });

    this.sadd = this.sAdd; // Alias for lowercase

    this.sRem = jest.fn((key, member) => {
      const set = this.sets.get(key);
      if (!set) return Promise.resolve(0);
      const existed = set.has(member);
      set.delete(member);
      return Promise.resolve(existed ? 1 : 0);
    });

    this.srem = this.sRem; // Alias for lowercase

    this.sMembers = jest.fn((key) => {
      const set = this.sets.get(key) || new Set();
      return Promise.resolve(Array.from(set));
    });

    this.smembers = this.sMembers; // Alias for lowercase

    // Utility operations
    this.ping = jest.fn(() => {
      return Promise.resolve('PONG');
    });

    this.flushDb = jest.fn(() => {
      this.data.clear();
      this.hashes.clear();
      this.lists.clear();
      this.sets.clear();
      this.ttls.clear();
      return Promise.resolve('OK');
    });

    this.flushdb = this.flushDb; // Alias for lowercase

    this.keys = jest.fn((pattern) => {
      const keys = Array.from(this.data.keys());
      if (pattern === '*') {
        return Promise.resolve(keys);
      }
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return Promise.resolve(keys.filter(key => regex.test(key)));
    });

    // Connection methods
    this.connect = jest.fn(() => {
      this.connected = true;
      this.isReady = true;
      this._triggerEvent('connect');
      this._triggerEvent('ready');
      return Promise.resolve();
    });

    this.disconnect = jest.fn(() => {
      this.connected = false;
      this.isReady = false;
      this._triggerEvent('end');
      return Promise.resolve();
    });

    this.quit = jest.fn(() => {
      this.connected = false;
      this.isReady = false;
      this._triggerEvent('end');
      return Promise.resolve('OK');
    });

    // Event handling
    this.on = jest.fn((event, callback) => {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(callback);
      return this;
    });

    this.off = jest.fn((event, callback) => {
      if (!this.eventHandlers.has(event)) return this;
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      return this;
    });
  }

  // Helper method (not a jest.fn since it's internal)
  _triggerEvent(event, ...args) {
    if (!this.eventHandlers.has(event)) return;
    const handlers = this.eventHandlers.get(event);
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        // Ignore handler errors
      }
    });
  }

  // Mock multi/exec for transactions
  multi() {
    const commands = [];
    const client = this;
    return {
      get(key) {
        commands.push(['get', key]);
        return this;
      },
      set(key, value) {
        commands.push(['set', key, value]);
        return this;
      },
      del(key) {
        commands.push(['del', key]);
        return this;
      },
      exec() {
        const results = commands.map(([cmd, ...args]) => {
          switch (cmd) {
            case 'get':
              return client.data.get(args[0]) || null;
            case 'set':
              client.data.set(args[0], args[1]);
              return 'OK';
            case 'del':
              const existed = client.data.has(args[0]);
              client.data.delete(args[0]);
              return existed ? 1 : 0;
            default:
              return null;
          }
        });
        return Promise.resolve(results);
      }
    };
  }
}

// Export both createClient function and RedisClient class
const createClient = jest.fn((options) => {
  console.log('[REDIS MOCK] createClient called with options:', options);
  const client = new RedisClient();
  client.options = options;
  console.log('[REDIS MOCK] returning client:', !!client);
  return client;
});

module.exports = {
  createClient,
  RedisClient
};

// Also export as default for import compatibility
module.exports.default = {
  createClient,
  RedisClient
};
