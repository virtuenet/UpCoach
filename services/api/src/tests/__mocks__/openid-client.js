// Mock for openid-client to prevent ES module import issues
module.exports = {
  Issuer: {
    discover: jest.fn(() => Promise.resolve({
      metadata: {
        authorization_endpoint: 'https://mock.auth.endpoint',
        token_endpoint: 'https://mock.token.endpoint',
        userinfo_endpoint: 'https://mock.userinfo.endpoint'
      },
      Client: jest.fn(() => ({
        authorizationUrl: jest.fn(() => 'https://mock.authorization.url'),
        callback: jest.fn(() => Promise.resolve({
          access_token: 'mock_access_token',
          id_token: 'mock_id_token',
          refresh_token: 'mock_refresh_token'
        })),
        userinfo: jest.fn(() => Promise.resolve({
          sub: 'mock_user_id',
          email: 'mock@example.com',
          name: 'Mock User'
        }))
      }))
    }))
  },
  generators: {
    codeVerifier: jest.fn(() => 'mock_code_verifier'),
    codeChallenge: jest.fn(() => 'mock_code_challenge'),
    state: jest.fn(() => 'mock_state'),
    nonce: jest.fn(() => 'mock_nonce')
  }
};