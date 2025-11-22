const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Performance test hooks for Artillery
module.exports = {
  // Generate auth token for regular users
  generateAuthToken: function (context, events, done) {
    const token = jwt.sign(
      {
        id: context.vars.userId || '123e4567-e89b-12d3-a456-426614174000',
        email: context.vars.email || 'test@example.com',
        role: 'user',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    context.vars.authToken = token;
    return done();
  },

  // Generate auth token for admin users
  generateAdminToken: function (context, events, done) {
    const token = jwt.sign(
      {
        id: 'admin-123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@upcoach.ai',
        role: 'admin',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    context.vars.adminToken = token;
    return done();
  },

  // Generate random user data
  generateUserData: function (context, events, done) {
    const randomId = crypto.randomBytes(16).toString('hex');

    context.vars.newUser = {
      email: `user-${randomId}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${randomId}`,
    };

    return done();
  },

  // Custom metric collection
  collectMetrics: function (requestParams, response, context, ee, next) {
    const responseTime = response.timings.phases.firstByte;
    const endpoint = `${requestParams.method} ${requestParams.url}`;

    // Collect custom metrics
    ee.emit('counter', `endpoint.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}.count`, 1);
    ee.emit(
      'histogram',
      `endpoint.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}.response_time`,
      responseTime
    );

    // Check for slow responses
    if (responseTime > 1000) {
      ee.emit('counter', 'slow_responses', 1);
      console.log(`Slow response detected: ${endpoint} took ${responseTime}ms`);
    }

    // Check for errors
    if (response.statusCode >= 400) {
      ee.emit('counter', `errors.${response.statusCode}`, 1);
      console.log(`Error response: ${endpoint} returned ${response.statusCode}`);
    }

    return next();
  },

  // Validate response structure
  validateResponse: function (requestParams, response, context, ee, next) {
    try {
      const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;

      // Basic validation
      if (!body || typeof body !== 'object') {
        ee.emit('counter', 'invalid_response_structure', 1);
        console.error(`Invalid response structure for ${requestParams.url}`);
      }

      // Check for required fields based on endpoint
      if (requestParams.url.includes('/auth/login') && response.statusCode === 200) {
        if (!body.token || !body.user) {
          ee.emit('counter', 'missing_auth_fields', 1);
          console.error('Login response missing required fields');
        }
      }

      if (requestParams.url.includes('/financial/dashboard') && response.statusCode === 200) {
        if (!body.revenue || !body.mrr || !body.subscriptions) {
          ee.emit('counter', 'missing_dashboard_fields', 1);
          console.error('Dashboard response missing required fields');
        }
      }
    } catch (error) {
      ee.emit('counter', 'response_validation_error', 1);
      console.error(`Error validating response: ${error.message}`);
    }

    return next();
  },

  // Simulate user behavior patterns
  simulateUserBehavior: function (context, events, done) {
    // Randomly decide user action
    const actions = ['browse', 'create', 'update', 'delete'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    context.vars.userAction = action;
    context.vars.thinkTime = Math.floor(Math.random() * 10) + 1; // 1-10 seconds

    return done();
  },

  // Before scenario setup
  beforeScenario: function (context, events, done) {
    // Set up scenario-specific variables
    context.vars.sessionId = crypto.randomBytes(16).toString('hex');
    context.vars.startTime = Date.now();

    console.log(`Starting scenario with session ID: ${context.vars.sessionId}`);
    return done();
  },

  // After scenario cleanup
  afterScenario: function (context, events, done) {
    const duration = Date.now() - context.vars.startTime;
    console.log(`Scenario completed in ${duration}ms`);

    // Clean up any test data if needed
    if (context.vars.createdResources) {
      // Cleanup logic here
    }

    return done();
  },
};
