// Mock Redis implementation for testing
class MockRedis {
  private store: Map<string, { value: string; expiry?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);

    if (!item) return null;

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, { value });
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    const expiry = Date.now() + (seconds * 1000);
    this.store.set(key, { value, expiry });
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);

    if (!item) return 0;

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return 0;
    }

    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);

    if (!item) return 0;

    const expiry = Date.now() + (seconds * 1000);
    this.store.set(key, { ...item, expiry });
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);

    if (!item) return -2;
    if (!item.expiry) return -1;

    const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  clear(): void {
    this.store.clear();
  }

  // Additional utility methods for testing
  size(): number {
    return this.store.size;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async incr(key: string): Promise<number> {
    const item = this.store.get(key);
    const currentValue = item ? parseInt(item.value, 10) || 0 : 0;
    const newValue = currentValue + 1;
    this.store.set(key, { value: newValue.toString() });
    return newValue;
  }
}

export const mockRedis = new MockRedis();

// Mock the redis service
jest.mock('../../services/redis', () => ({
  redis: mockRedis
}));

export default mockRedis;