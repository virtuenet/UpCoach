/**
 * Test to verify database mock is working
 */
import { db } from '../services/database';

describe('Database Mock Test', () => {
  it('should use mocked db.insert', async () => {
    console.error('===== TESTING DB MOCK =====');

    console.error('db object:', typeof db);
    console.error('db.insert:', typeof db.insert);

    const result = await db.insert('users', {
      email: 'test@example.com',
      password_hash: 'hashed_password',
      name: 'Test User',
    });

    console.error('Result:', JSON.stringify(result, null, 2));
    console.error('Result ID:', result?.id);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.email).toBe('test@example.com');
  });
});
