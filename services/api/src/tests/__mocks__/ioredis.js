const mockRedisInstance = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  mget: jest.fn().mockResolvedValue([]),
  mset: jest.fn().mockResolvedValue('OK'),
  hget: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(1),
  hdel: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn().mockResolvedValue({}),
  lpush: jest.fn().mockResolvedValue(1),
  rpush: jest.fn().mockResolvedValue(1),
  lpop: jest.fn().mockResolvedValue(null),
  rpop: jest.fn().mockResolvedValue(null),
  lrange: jest.fn().mockResolvedValue([]),
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  incr: jest.fn().mockResolvedValue(1),
  decr: jest.fn().mockResolvedValue(0),
  flushdb: jest.fn().mockResolvedValue('OK'),
  ping: jest.fn().mockResolvedValue('PONG'),
  on: jest.fn(),
  off: jest.fn(),
  status: 'ready',
  options: {}
};

// Default export (Redis class constructor)
module.exports = jest.fn().mockImplementation(() => mockRedisInstance);

// Named exports for other Redis utilities
module.exports.Redis = module.exports;
module.exports.Cluster = jest.fn().mockImplementation(() => mockRedisInstance);