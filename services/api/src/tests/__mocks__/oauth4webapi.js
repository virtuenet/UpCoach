// Mock for oauth4webapi to prevent ES module import issues  
module.exports = {
  generateRandomCodeVerifier: jest.fn(() => 'mock_code_verifier'),
  calculatePKCECodeChallenge: jest.fn(() => Promise.resolve('mock_code_challenge')),
  generateRandomState: jest.fn(() => 'mock_state'),
  generateRandomNonce: jest.fn(() => 'mock_nonce'),
  authorizationCodeGrantRequest: jest.fn(() => Promise.resolve(new Response(JSON.stringify({
    access_token: 'mock_access_token',
    token_type: 'Bearer',
    expires_in: 3600
  })))),
  userInfoRequest: jest.fn(() => Promise.resolve(new Response(JSON.stringify({
    sub: 'mock_user_id',
    email: 'mock@example.com',
    name: 'Mock User'
  })))),
  processUserInfoResponse: jest.fn((res) => Promise.resolve(res.json()))
};