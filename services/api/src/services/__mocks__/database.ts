/**
 * Manual mock for database service
 * This file is automatically used by Jest when testing
 */

console.error('[MANUAL MOCK] database.ts manual mock is loading...');

// In-memory storage for mock data (cleared on reset)
const mockStorage: Record<string, any[]> = {
  users: [],
  goals: [],
  habits: [],
  tasks: [],
};

export const db = {
  query: async () => {
    console.error('[DB MANUAL MOCK] query called');
    return { rows: [], rowCount: 0 };
  },

  findOne: async (table: string, where: Record<string, unknown>) => {
    console.error('[DB MANUAL MOCK] findOne called:', { table, where });

    // Look up in mock storage
    if (mockStorage[table]) {
      const records = mockStorage[table];
      const match = records.find((record) => {
        return Object.entries(where).every(([key, value]) => {
          // Handle snake_case to camelCase conversion
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          return record[key] === value || record[camelKey] === value;
        });
      });

      if (match) {
        console.error('[DB MANUAL MOCK] findOne found match:', { id: match.id, email: match.email || 'N/A' });
        return match;
      }
    }

    console.error('[DB MANUAL MOCK] findOne no match found');
    return null;
  },

  findAll: async (table: string = 'unknown') => {
    console.error('[DB MANUAL MOCK] findAll called:', { table });
    return mockStorage[table] || [];
  },

  insert: async (table: string, data: Record<string, unknown>) => {
    console.error('[DB MANUAL MOCK] insert called:', { table, dataKeys: Object.keys(data) });

    // Return properly structured User object for users table
    if (table === 'users') {
      const user = {
        id: 'test-user-id-' + Math.random().toString(36).substring(7),
        email: data.email as string,
        passwordHash: data.password_hash as string,
        name: data.name as string,
        bio: (data.bio as string) || null,
        role: (data.role as string) || 'user',
        isActive: true,
        isEmailVerified: false,
        avatar: null,
        avatarUrl: null,
        googleId: null,
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        onboardingSkipped: false,
        preferences: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in mock storage for retrieval
      if (!mockStorage.users) {
        mockStorage.users = [];
      }
      mockStorage.users.push(user);

      console.error('[DB MANUAL MOCK] Stored and returning user:', { id: user.id, email: user.email, totalUsers: mockStorage.users.length });
      return user;
    }

    // Generic response for other tables
    const record = {
      id: 'test-id-' + Math.random().toString(36).substring(7),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in mock storage
    if (!mockStorage[table]) {
      mockStorage[table] = [];
    }
    mockStorage[table].push(record);

    console.error('[DB MANUAL MOCK] Stored record:', { table, id: record.id });
    return record;
  },

  update: async (table: string, data: Record<string, unknown>, where: Record<string, unknown>) => {
    console.error('[DB MANUAL MOCK] update called:', { table, where });

    // Find and update record in mock storage
    if (mockStorage[table]) {
      const records = mockStorage[table];
      const index = records.findIndex((record) => {
        return Object.entries(where).every(([key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          return record[key] === value || record[camelKey] === value;
        });
      });

      if (index !== -1) {
        // Convert snake_case keys to camelCase for the data being updated
        const camelData: Record<string, unknown> = {};
        Object.entries(data).forEach(([key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          camelData[camelKey] = value;
          // Also set the original key in case it's already camelCase
          if (key !== camelKey) {
            camelData[key] = value;
          }
        });

        // Update the record in storage
        mockStorage[table][index] = {
          ...mockStorage[table][index],
          ...camelData,
          updatedAt: new Date(),
        };
        console.error('[DB MANUAL MOCK] Record updated in storage:', {
          table,
          id: mockStorage[table][index].id
        });
        return mockStorage[table][index];
      }
    }

    return {
      ...data,
      updatedAt: new Date(),
    };
  },

  delete: async () => {
    console.error('[DB MANUAL MOCK] delete called');
    return true;
  },

  connect: async () => {
    console.error('[DB MANUAL MOCK] connect called');
    return true;
  },

  disconnect: async () => {
    console.error('[DB MANUAL MOCK] disconnect called');
    return true;
  },

  transaction: async (callback: (client: unknown) => Promise<unknown>) => {
    console.error('[DB MANUAL MOCK] transaction called');
    return await callback({
      query: async () => ({ rows: [], rowCount: 0 }),
      commit: async () => {},
      rollback: async () => {},
    });
  },
};

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: any = null;
  private injectedPool: any = null;

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  static injectPool(pool: any) {
    console.error('[DB MANUAL MOCK] injectPool called');
    const instance = DatabaseService.getInstance();
    instance.injectedPool = pool;
    instance.pool = pool;
  }

  static reset() {
    console.error('[DB MANUAL MOCK] reset called');
    if (DatabaseService.instance) {
      DatabaseService.instance.pool = null;
      DatabaseService.instance.injectedPool = null;
    }
    DatabaseService.instance = undefined as any;

    // Clear mock storage for next test
    Object.keys(mockStorage).forEach(key => {
      mockStorage[key] = [];
    });
    console.error('[DB MANUAL MOCK] Mock storage cleared');
  }

  static async initialize() {
    console.error('[DB MANUAL MOCK] Initialize called');
    return Promise.resolve();
  }

  static async disconnect() {
    console.error('[DB MANUAL MOCK] Disconnect called');
    return Promise.resolve();
  }

  static getPool() {
    console.error('[DB MANUAL MOCK] getPool called');
    const instance = DatabaseService.getInstance();
    if (!instance.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return instance.pool;
  }
}
