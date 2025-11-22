/**
 * Quick test to see what error the register endpoint returns
 */

import { app } from './src/app';
import request from 'supertest';

const testUser = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!',
  acceptTerms: true,
};

async function testRegister() {
  try {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));

    if (response.error) {
      console.log('Error:', response.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit(0);
}

testRegister();
