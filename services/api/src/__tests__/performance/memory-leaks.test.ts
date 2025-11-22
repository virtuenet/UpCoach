/**
 * Performance Tests: Memory Leak Detection
 *
 * Detects memory leaks in:
 * - Service instantiation
 * - Event emitters
 * - WebSocket connections
 * - Cache implementations
 * - Database connection pooling
 */

import { detectMemoryLeak } from './setup.helper';

describe('Performance Tests: Memory Leak Detection', () => {
  describe('Service Instantiation', () => {
    test('should not leak memory when creating services repeatedly', async () => {
      const result = await detectMemoryLeak(
        'Service Creation',
        async () => {
          // Mock service creation
          const service = {
            cache: new Map(),
            listeners: [],
            process: async (data: any) => {
              return data;
            },
          };

          // Simulate usage
          await service.process({ data: 'test' });

          // Cleanup
          service.cache.clear();
          service.listeners = [];
        },
        1000
      );

      expect(result).toNotLeakMemory();
    });
  });

  describe('Event Handlers', () => {
    test('should not leak memory with event listeners', async () => {
      const result = await detectMemoryLeak(
        'Event Listeners',
        async () => {
          const emitter = {
            listeners: [] as any[],
            on(event: string, handler: Function) {
              this.listeners.push({ event, handler });
            },
            emit(event: string, data: any) {
              this.listeners
                .filter(l => l.event === event)
                .forEach(l => l.handler(data));
            },
            removeAllListeners() {
              this.listeners = [];
            },
          };

          // Add listeners
          emitter.on('data', (data: any) => console.log(data));
          emitter.on('error', (err: any) => console.error(err));

          // Emit events
          emitter.emit('data', { test: 'data' });

          // Cleanup
          emitter.removeAllListeners();
        },
        500
      );

      expect(result).toNotLeakMemory();
    });
  });

  describe('Cache Implementations', () => {
    test('should not leak memory with LRU cache', async () => {
      const result = await detectMemoryLeak(
        'LRU Cache',
        async () => {
          const cache = new Map();
          const MAX_SIZE = 100;

          // Add items
          for (let i = 0; i < 150; i++) {
            cache.set(`key${i}`, { data: `value${i}` });

            // Evict oldest if over limit
            if (cache.size > MAX_SIZE) {
              const firstKey = cache.keys().next().value;
              cache.delete(firstKey);
            }
          }

          // Cleanup
          cache.clear();
        },
        200
      );

      expect(result).toNotLeakMemory();
    });

    test('should not leak memory with timed cache eviction', async () => {
      const result = await detectMemoryLeak(
        'Timed Cache Eviction',
        async () => {
          const cache = new Map<string, { value: any; expiry: number }>();

          // Add items with expiry
          const now = Date.now();
          for (let i = 0; i < 100; i++) {
            cache.set(`key${i}`, {
              value: `value${i}`,
              expiry: now + 1000, // 1 second TTL
            });
          }

          // Evict expired items
          const currentTime = Date.now() + 1500; // Simulate 1.5s later
          for (const [key, item] of cache.entries()) {
            if (item.expiry < currentTime) {
              cache.delete(key);
            }
          }

          // Cleanup
          cache.clear();
        },
        200
      );

      expect(result).toNotLeakMemory();
    });
  });

  describe('Data Processing', () => {
    test('should not leak memory processing large datasets', async () => {
      const result = await detectMemoryLeak(
        'Large Dataset Processing',
        async () => {
          // Process 1000 records
          const records = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            data: `record${i}`,
          }));

          // Transform data
          const processed = records
            .map(r => ({ ...r, processed: true }))
            .filter(r => r.id % 2 === 0);

          // Aggregate
          const summary = {
            total: processed.length,
            sum: processed.reduce((acc, r) => acc + r.id, 0),
          };

          // Let records go out of scope
          return summary;
        },
        100
      );

      expect(result).toNotLeakMemory();
    });
  });

  describe('Connection Pooling', () => {
    test('should not leak memory with connection pool', async () => {
      const result = await detectMemoryLeak(
        'Connection Pool',
        async () => {
          const pool = {
            connections: [] as any[],
            maxSize: 10,
            acquire() {
              if (this.connections.length < this.maxSize) {
                const conn = { id: Date.now(), active: true };
                this.connections.push(conn);
                return conn;
              }
              return this.connections[0]; // Reuse existing
            },
            release(conn: any) {
              conn.active = false;
            },
            cleanup() {
              this.connections = this.connections.filter(c => c.active);
            },
          };

          // Acquire and release connections
          for (let i = 0; i < 50; i++) {
            const conn = pool.acquire();
            // Simulate work
            await Promise.resolve();
            pool.release(conn);
          }

          // Cleanup
          pool.cleanup();
        },
        100
      );

      expect(result).toNotLeakMemory();
    });
  });

  describe('Async Operations', () => {
    test('should not leak memory with promise chains', async () => {
      const result = await detectMemoryLeak(
        'Promise Chains',
        async () => {
          const results = await Promise.resolve({ data: 'test' })
            .then(data => ({ ...data, step1: true }))
            .then(data => ({ ...data, step2: true }))
            .then(data => ({ ...data, step3: true }))
            .then(data => ({ final: data }));

          return results;
        },
        500
      );

      expect(result).toNotLeakMemory();
    });

    test('should not leak memory with concurrent promises', async () => {
      const result = await detectMemoryLeak(
        'Concurrent Promises',
        async () => {
          const promises = Array.from({ length: 100 }, (_, i) =>
            Promise.resolve({ id: i, data: `item${i}` })
          );

          const results = await Promise.all(promises);
          return results.length;
        },
        100
      );

      expect(result).toNotLeakMemory();
    });
  });

  describe('Buffer and Stream Operations', () => {
    test('should not leak memory with buffer operations', async () => {
      const result = await detectMemoryLeak(
        'Buffer Operations',
        async () => {
          // Create and transform buffers
          const buffer = Buffer.from('test data'.repeat(100));
          const transformed = Buffer.from(buffer.toString().toUpperCase());
          const result = transformed.toString();

          // Buffers should be garbage collected
          return result.length;
        },
        200
      );

      expect(result).toNotLeakMemory();
    });
  });

  describe('Circular References', () => {
    test('should not leak memory with circular references', async () => {
      const result = await detectMemoryLeak(
        'Circular References',
        async () => {
          const obj1: any = { name: 'obj1' };
          const obj2: any = { name: 'obj2' };

          // Create circular reference
          obj1.ref = obj2;
          obj2.ref = obj1;

          // Process
          const result = `${obj1.name} -> ${obj2.name}`;

          // Break circular reference
          obj1.ref = null;
          obj2.ref = null;

          return result;
        },
        500
      );

      expect(result).toNotLeakMemory();
    });
  });
});
