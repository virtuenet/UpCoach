// Artillery performance test hooks and helper functions

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a valid JWT token for testing
function generateAuthToken(context, events, done) {
  const token = jwt.sign(
    {
      userId: crypto.randomUUID(),
      email: context.vars.email || 'test@example.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    },
    process.env.JWT_SECRET || 'test-secret'
  );

  context.vars.authToken = token;
  return done();
}

// Generate random test data
function generateTestData(context, events, done) {
  context.vars.randomEmail = `test-${Date.now()}@example.com`;
  context.vars.randomUsername = `user_${crypto.randomBytes(4).toString('hex')}`;
  context.vars.randomGoal = ['weight-loss', 'muscle-gain', 'stress-reduction'][
    Math.floor(Math.random() * 3)
  ];

  return done();
}

// Custom metric collection
function collectCustomMetrics(req, res, context, events, done) {
  // Track custom business metrics
  if (res.body && typeof res.body === 'object') {
    if (res.body.mrr) {
      events.emit('counter', 'business.mrr.requests', 1);
      events.emit('histogram', 'business.mrr.value', res.body.mrr);
    }

    if (res.body.responseTime) {
      events.emit('histogram', 'ai.response.time', res.body.responseTime);
    }
  }

  return done();
}

// Validate response structure
function validateResponse(req, res, context, events, done) {
  const path = req.url;

  // Validate based on endpoint
  if (path.includes('/api/dashboard/financial')) {
    if (!res.body.mrr || !res.body.revenue) {
      events.emit('counter', 'validation.failed.financial', 1);
      return done(new Error('Invalid financial dashboard response'));
    }
  }

  if (path.includes('/api/users')) {
    if (Array.isArray(res.body.data)) {
      const invalidUsers = res.body.data.filter(user => !user.id || !user.email);
      if (invalidUsers.length > 0) {
        events.emit('counter', 'validation.failed.users', invalidUsers.length);
      }
    }
  }

  return done();
}

// Simulate real user behavior with think times
function simulateUserBehavior(context, events, done) {
  const actions = [
    { weight: 0.4, thinkTime: 2 }, // Quick navigation
    { weight: 0.3, thinkTime: 5 }, // Reading content
    { weight: 0.2, thinkTime: 10 }, // Filling forms
    { weight: 0.1, thinkTime: 15 }, // Extended interaction
  ];

  const random = Math.random();
  let cumulative = 0;

  for (const action of actions) {
    cumulative += action.weight;
    if (random <= cumulative) {
      context.vars.thinkTime = action.thinkTime;
      break;
    }
  }

  return done();
}

// Handle authentication refresh
function refreshAuthToken(context, events, done) {
  if (context.vars.refreshToken) {
    // Simulate token refresh
    const newToken = jwt.sign(
      {
        userId: context.vars.userId,
        email: context.vars.email,
        role: context.vars.role,
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      process.env.JWT_SECRET || 'test-secret'
    );

    context.vars.authToken = newToken;
    events.emit('counter', 'auth.token.refreshed', 1);
  }

  return done();
}

// Export all functions for Artillery
module.exports = {
  generateAuthToken,
  generateTestData,
  collectCustomMetrics,
  validateResponse,
  simulateUserBehavior,
  refreshAuthToken,
};
