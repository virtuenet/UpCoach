/**
 * Test fixtures
 */

export const fixtures = {
  // User fixtures
  validUser: {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
  },
  
  adminUser: {
    id: '456',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as const,
  },
  
  // API responses
  successResponse: {
    success: true,
    data: {},
    message: 'Success',
  },
  
  errorResponse: {
    success: false,
    error: 'An error occurred',
  },
  
  // Auth tokens
  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ',
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjB9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ',
  
  // Dates
  pastDate: new Date('2023-01-01'),
  futureDate: new Date('2025-01-01'),
  recentDate: new Date(),
};