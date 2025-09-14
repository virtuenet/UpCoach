/**
 * Local LLM Load Testing with k6
 * Comprehensive performance testing for UpCoach local LLM implementation
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ============================================================================
// Custom Metrics
// ============================================================================
const errorRate = new Rate('error_rate');
const localProcessingLatency = new Trend('local_processing_latency');
const cloudFallbackLatency = new Trend('cloud_fallback_latency');
const hybridDecisionTime = new Trend('hybrid_decision_time');
const qualityScore = new Trend('response_quality_score');
const localProcessingRate = new Rate('local_processing_rate');
const fallbackRate = new Rate('fallback_rate');
const concurrentUsers = new Gauge('concurrent_users');
const requestsPerSecond = new Rate('requests_per_second');

// ============================================================================
// Test Configuration
// ============================================================================
export let options = {
  stages: [
    // Ramp up phase
    { duration: '2m', target: 20 },    // Gradual warm-up
    { duration: '3m', target: 50 },    // Normal load
    { duration: '5m', target: 100 },   // High load
    { duration: '3m', target: 200 },   // Peak load
    { duration: '2m', target: 500 },   // Stress test
    { duration: '5m', target: 500 },   // Sustain stress
    { duration: '2m', target: 100 },   // Scale down
    { duration: '3m', target: 0 },     // Cool down
  ],
  
  thresholds: {
    // Performance thresholds
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'local_processing_latency': ['p(95)<200', 'p(99)<300'],
    'cloud_fallback_latency': ['p(95)<1000', 'p(99)<2000'],
    'hybrid_decision_time': ['p(95)<50', 'p(99)<100'],
    
    // Quality thresholds
    'response_quality_score': ['avg>4.0', 'p(95)>3.5'],
    'error_rate': ['rate<0.05'], // Less than 5% error rate
    
    // Business thresholds
    'local_processing_rate': ['rate>0.4'], // >40% local processing
    'fallback_rate': ['rate<0.6'], // <60% fallback rate
    
    // System thresholds
    'http_req_failed': ['rate<0.1'], // Less than 10% failed requests
  },
  
  // Resource limits
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0 (UpCoach Local LLM)',
  
  // Test metadata
  tags: {
    test_type: 'load_test',
    service: 'local_llm',
    environment: __ENV.TEST_ENV || 'staging'
  }
};

// ============================================================================
// Test Data
// ============================================================================
const testScenarios = new SharedArray('test_scenarios', function () {
  return [
    {
      name: 'goal_setting',
      messages: [{ role: 'user', content: 'Help me set a SMART fitness goal for weight loss' }],
      routingHints: { preferLocal: true, privacyLevel: 'public' },
      expectedKeywords: ['smart', 'goal', 'fitness', 'weight']
    },
    {
      name: 'motivation_coaching',
      messages: [{ role: 'user', content: 'I feel unmotivated and don\'t know how to start exercising' }],
      routingHints: { preferLocal: true, privacyLevel: 'private' },
      expectedKeywords: ['motivation', 'start', 'exercise', 'help']
    },
    {
      name: 'habit_formation',
      messages: [{ role: 'user', content: 'How can I build a consistent morning routine?' }],
      routingHints: { preferLocal: false, privacyLevel: 'public' },
      expectedKeywords: ['habit', 'routine', 'consistent', 'morning']
    },
    {
      name: 'stress_management',
      messages: [{ role: 'user', content: 'I\'m feeling overwhelmed with work stress. What can I do?' }],
      routingHints: { preferLocal: true, privacyLevel: 'sensitive' },
      expectedKeywords: ['stress', 'overwhelmed', 'work', 'manage']
    },
    {
      name: 'productivity_tips',
      messages: [{ role: 'user', content: 'What are some effective productivity techniques?' }],
      routingHints: { preferLocal: false, privacyLevel: 'public' },
      expectedKeywords: ['productivity', 'techniques', 'effective']
    },
    {
      name: 'complex_analysis',
      messages: [
        { role: 'user', content: 'I want to lose weight' },
        { role: 'assistant', content: 'I can help you create a weight loss plan...' },
        { role: 'user', content: 'Analyze my progress over the last 6 months and suggest improvements' }
      ],
      routingHints: { preferLocal: false, privacyLevel: 'private' },
      expectedKeywords: ['analysis', 'progress', 'improvement']
    }
  ];
});

const deviceProfiles = new SharedArray('device_profiles', function () {
  return [
    {
      name: 'high_end_ios',
      model: 'iPhone 15 Pro',
      batteryLevel: 85,
      thermalState: 'nominal',
      capabilities: ['coreml', 'neural_engine']
    },
    {
      name: 'mid_range_android',
      model: 'Samsung Galaxy S22',
      batteryLevel: 60,
      thermalState: 'fair',
      capabilities: ['nnapi', 'gpu_compute']
    },
    {
      name: 'low_battery_device',
      model: 'iPhone 12',
      batteryLevel: 15,
      thermalState: 'critical',
      capabilities: ['coreml']
    },
    {
      name: 'older_device',
      model: 'iPhone SE',
      batteryLevel: 40,
      thermalState: 'nominal',
      capabilities: ['cpu_only']
    }
  ];
});

// ============================================================================
// Utility Functions
// ============================================================================
function getRandomScenario() {
  return testScenarios[Math.floor(Math.random() * testScenarios.length)];
}

function getRandomDeviceProfile() {
  return deviceProfiles[Math.floor(Math.random() * deviceProfiles.length)];
}

function validateResponse(response, scenario) {
  const data = JSON.parse(response.body);
  
  // Structural validation
  const structureValid = check(data, {
    'has response content': (d) => d.response && d.response.content && d.response.content.length > 0,
    'has processing mode': (d) => ['local', 'cloud', 'hybrid'].includes(d.processingMode),
    'has metrics': (d) => d.metrics && typeof d.metrics.latency === 'number',
    'has valid tokens': (d) => d.metrics.tokensGenerated > 0
  });
  
  // Content quality validation
  const content = data.response.content.toLowerCase();
  const hasExpectedKeywords = scenario.expectedKeywords.some(keyword => 
    content.includes(keyword.toLowerCase())
  );
  
  check(data, {
    'response contains expected keywords': () => hasExpectedKeywords,
    'response is substantial': (d) => d.response.content.length > 50,
    'quality score acceptable': (d) => !d.qualityScore || d.qualityScore >= 3.5
  });
  
  return {
    valid: structureValid,
    processingMode: data.processingMode,
    latency: data.metrics.latency,
    qualityScore: data.qualityScore || 4.0,
    tokensGenerated: data.metrics.tokensGenerated
  };
}

// ============================================================================
// Main Test Function
// ============================================================================
export default function() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';
  const scenario = getRandomScenario();
  const deviceProfile = getRandomDeviceProfile();
  
  // Update concurrent users metric
  concurrentUsers.add(1);
  
  group('Local LLM Hybrid Processing', function() {
    const payload = {
      messages: scenario.messages,
      routingHints: {
        ...scenario.routingHints,
        maxLatency: 2000
      },
      deviceProfile: {
        model: deviceProfile.model,
        capabilities: deviceProfile.capabilities,
        batteryLevel: deviceProfile.batteryLevel,
        thermalState: deviceProfile.thermalState
      },
      testMetadata: {
        scenario: scenario.name,
        virtualUser: __VU,
        iteration: __ITER
      }
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_API_KEY || 'test-key'}`,
      'X-Test-Run': 'local-llm-load-test',
      'X-User-Agent': 'k6-load-test'
    };
    
    // Measure request timing
    const startTime = Date.now();
    
    const response = http.post(
      `${baseUrl}/api/ai/hybrid/process`,
      JSON.stringify(payload),
      { headers: headers, timeout: '30s' }
    );
    
    const endTime = Date.now();
    const totalLatency = endTime - startTime;
    
    // Basic response validation
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time acceptable': () => totalLatency < 5000,
      'has response body': (r) => r.body && r.body.length > 0
    });
    
    if (!success) {
      errorRate.add(1);
      console.error(`Request failed for scenario ${scenario.name}:`, response.status, response.body);
      return;
    }
    
    // Detailed response validation
    const validation = validateResponse(response, scenario);
    
    if (validation.valid) {
      // Record metrics based on processing mode
      if (validation.processingMode === 'local') {
        localProcessingLatency.add(validation.latency);
        localProcessingRate.add(1);
      } else {
        cloudFallbackLatency.add(validation.latency);
        fallbackRate.add(1);
      }
      
      // Record quality metrics
      qualityScore.add(validation.qualityScore);
      
      // Record request success
      requestsPerSecond.add(1);
      
    } else {
      errorRate.add(1);
    }
  });
  
  // Variable sleep based on current load
  const currentVUsers = __ENV.K6_VUS || 1;
  const sleepTime = Math.max(0.5, 3 - (currentVUsers / 100));
  sleep(sleepTime);
}

// ============================================================================
// Test Lifecycle Functions
// ============================================================================
export function setup() {
  console.log('🚀 Starting Local LLM Load Testing');
  console.log(`Target: ${__ENV.BASE_URL || 'http://localhost:8080'}`);
  console.log(`Environment: ${__ENV.TEST_ENV || 'staging'}`);
  console.log(`Test scenarios: ${testScenarios.length}`);
  console.log(`Device profiles: ${deviceProfiles.length}`);
  
  // Health check
  const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';
  const healthResponse = http.get(`${baseUrl}/api/health`);
  
  if (healthResponse.status !== 200) {
    throw new Error(`Service health check failed: ${healthResponse.status}`);
  }
  
  console.log('✅ Service health check passed');
  
  return {
    startTime: Date.now(),
    testVersion: '1.0.0'
  };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n🏁 Test completed in ${duration}s`);
  
  // Log final metrics summary
  console.log('\n📊 Final Metrics Summary:');
  console.log('========================');
  
  // Note: Actual metric values would be available in k6 output
  console.log('Performance metrics will be available in the test results');
  console.log('Check thresholds to see if performance targets were met');
}

// ============================================================================
// Test Scenarios for Different Use Cases
// ============================================================================

// High-frequency, low-complexity requests (mobile-like usage)
export function mobileUsagePattern() {
  const scenarios = [
    'Quick motivation boost',
    'Daily check-in',
    'Simple goal update',
    'Brief coaching tip'
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  const payload = {
    messages: [{ role: 'user', content: scenario }],
    routingHints: { preferLocal: true, privacyLevel: 'public', maxLatency: 500 },
    deviceProfile: { model: 'iPhone 14', batteryLevel: 70, thermalState: 'nominal' }
  };
  
  const response = http.post(
    `${__ENV.BASE_URL || 'http://localhost:8080'}/api/ai/hybrid/process`,
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'mobile request successful': (r) => r.status === 200,
    'mobile latency acceptable': (r) => JSON.parse(r.body).metrics.latency < 500
  });
  
  sleep(0.5); // High frequency usage
}

// Enterprise batch processing scenario
export function enterpriseBatchProcessing() {
  const batchSize = 5;
  const requests = [];
  
  for (let i = 0; i < batchSize; i++) {
    const scenario = getRandomScenario();
    requests.push({
      method: 'POST',
      url: `${__ENV.BASE_URL || 'http://localhost:8080'}/api/ai/hybrid/process`,
      body: JSON.stringify({
        messages: scenario.messages,
        routingHints: { preferLocal: false, privacyLevel: 'sensitive' },
        batchId: `batch-${__VU}-${__ITER}-${i}`
      }),
      params: { headers: { 'Content-Type': 'application/json' } }
    });
  }
  
  const responses = http.batch(requests);
  
  responses.forEach((response, index) => {
    check(response, {
      [`batch request ${index} successful`]: (r) => r.status === 200,
      [`batch request ${index} processed`]: (r) => JSON.parse(r.body).processingMode !== undefined
    });
  });
  
  sleep(2); // Batch processing pause
}

// ============================================================================
// Export additional test functions
// ============================================================================
export { mobileUsagePattern, enterpriseBatchProcessing };