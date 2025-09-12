import request from 'supertest';
import express, { Application } from 'express';
import { securityMonitoring } from '../../middleware/security';
import { logger } from '../../utils/logger';

// Mock logger to capture security events
jest.mock('../../utils/logger');

describe('Enhanced SQL Injection Protection', () => {
  let app: Application;
  const mockLogger = logger as jest.Mocked<typeof logger>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Add request ID middleware for tracking
    app.use((req, res, next) => {
      req.id = 'test-request-id';
      next();
    });
    
    // Apply security monitoring
    app.use(securityMonitoring());
    
    // Test endpoints
    app.get('/api/test', (req, res) => {
      res.json({ success: true, query: req.query });
    });
    
    app.post('/api/test', (req, res) => {
      res.json({ success: true, body: req.body });
    });
    
    app.get('/api/financial/transactions', (req, res) => {
      res.json({ success: true });
    });

    jest.clearAllMocks();
  });

  describe('UNION-based SQL Injection Detection (CVSS 7.5+)', () => {
    it('should detect basic UNION SELECT attacks', async () => {
      const maliciousPayload = "' UNION SELECT password FROM users--";
      
      await request(app)
        .get('/api/test')
        .query({ search: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          event: 'security_threat_critical',
          threatType: 'sqli',
          confidence: expect.any(Number),
          pattern: 'UNION_SELECT'
        })
      );
    });

    it('should detect obfuscated UNION attacks with comments', async () => {
      const maliciousPayload = "' UNION/**/SELECT/**/password/**/FROM/**/users--";
      
      await request(app)
        .get('/api/test')
        .query({ id: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: expect.stringMatching(/UNION|COMMENT/)
        })
      );
    });

    it('should detect UNION ALL SELECT variations', async () => {
      const maliciousPayload = "1' UNION ALL SELECT null,username,password FROM admin_users--";
      
      await request(app)
        .get('/api/test')
        .query({ filter: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should detect nested UNION queries', async () => {
      const maliciousPayload = "SELECT * FROM (SELECT id UNION SELECT password FROM users) t";
      
      await request(app)
        .post('/api/test')
        .send({ query: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: expect.stringMatching(/UNION|NESTED/)
        })
      );
    });
  });

  describe('Blind SQL Injection Detection', () => {
    it('should detect Boolean-based blind SQL injection', async () => {
      const maliciousPayloads = [
        "1' AND 1=1--",
        "1' OR '1'='1'--",
        "admin' AND (SELECT COUNT(*) FROM users)>0--"
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .get('/api/test')
          .query({ userId: payload })
          .expect(200);
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'BOOLEAN_BLIND'
        })
      );
    });

    it('should detect comparison-based blind injection', async () => {
      const maliciousPayload = "1' AND ASCII(SUBSTRING((SELECT password FROM users LIMIT 1),1,1))>65--";
      
      await request(app)
        .get('/api/test')
        .query({ search: maliciousPayload })
        .expect(200);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Potential security threat detected',
        expect.objectContaining({
          threatType: 'sqli'
        })
      );
    });
  });

  describe('Time-based Blind SQL Injection Detection', () => {
    it('should detect SLEEP-based time attacks', async () => {
      const maliciousPayloads = [
        "1'; SELECT SLEEP(5)--",
        "1' AND SLEEP(5)--",
        "1' OR SLEEP(5)--"
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .get('/api/test')
          .query({ id: payload })
          .expect(200);
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'TIME_BASED_BLIND'
        })
      );
    });

    it('should detect PostgreSQL pg_sleep attacks', async () => {
      const maliciousPayload = "1'; SELECT pg_sleep(5)--";
      
      await request(app)
        .get('/api/financial/transactions')
        .query({ filter: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'TIME_BASED_BLIND'
        })
      );
    });

    it('should detect conditional time-based attacks', async () => {
      const maliciousPayload = "1' AND IF(1=1, SLEEP(5), 0)--";
      
      await request(app)
        .post('/api/test')
        .send({ condition: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'CONDITIONAL_TIME_BASED'
        })
      );
    });

    it('should detect BENCHMARK attacks', async () => {
      const maliciousPayload = "1' AND BENCHMARK(1000000, MD5('test'))--";
      
      await request(app)
        .get('/api/test')
        .query({ search: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Error-based SQL Injection Detection', () => {
    it('should detect MySQL error-based attacks', async () => {
      const maliciousPayloads = [
        "1' AND EXTRACTVALUE(1, CONCAT(':', (SELECT password FROM users LIMIT 1)))--",
        "1' AND UPDATEXML(1, CONCAT(':', (SELECT version())), 1)--",
        "1' AND EXP(~(SELECT * FROM (SELECT COUNT(*), CONCAT((SELECT password FROM users LIMIT 1), FLOOR(RAND()*2))x FROM information_schema.tables GROUP BY x)a))--"
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .get('/api/test')
          .query({ data: payload })
          .expect(200);
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Potential security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'ERROR_BASED_MYSQL'
        })
      );
    });

    it('should detect CAST-based error injection', async () => {
      const maliciousPayload = "1' AND CAST((SELECT password FROM users LIMIT 1) AS INT)--";
      
      await request(app)
        .get('/api/test')
        .query({ convert: maliciousPayload })
        .expect(200);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Potential security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'ERROR_BASED_CAST'
        })
      );
    });
  });

  describe('Advanced SQL Injection Techniques', () => {
    it('should detect file operation attacks', async () => {
      const maliciousPayloads = [
        "1' UNION SELECT LOAD_FILE('/etc/passwd')--",
        "1' INTO OUTFILE '/var/www/shell.php'--",
        "1' INTO DUMPFILE '/tmp/dump.txt'--"
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .post('/api/test')
          .send({ file: payload })
          .expect(200);
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'FILE_OPERATIONS'
        })
      );
    });

    it('should detect command execution attempts', async () => {
      const maliciousPayloads = [
        "1'; EXEC xp_cmdshell('dir')--",
        "1'; EXECUTE sp_executesql N'SELECT @@version'--"
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .get('/api/test')
          .query({ cmd: payload })
          .expect(200);
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'COMMAND_EXECUTION'
        })
      );
    });

    it('should detect subquery injection attacks', async () => {
      const maliciousPayload = "1' AND EXISTS(SELECT 1 FROM users WHERE username='admin')--";
      
      await request(app)
        .get('/api/test')
        .query({ check: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'EXISTS_SUBQUERY'
        })
      );
    });

    it('should detect multi-statement injection', async () => {
      const maliciousPayload = "1'; DROP TABLE users; SELECT 1--";
      
      await request(app)
        .get('/api/test')
        .query({ statement: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'MULTI_STATEMENT'
        })
      );
    });
  });

  describe('Encoded and Obfuscated Payloads', () => {
    it('should detect URL-encoded SQL injection', async () => {
      const maliciousPayload = "%27%20UNION%20SELECT%20password%20FROM%20users--";
      
      await request(app)
        .get('/api/test')
        .query({ encoded: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli'
        })
      );
    });

    it('should detect comment-obfuscated payloads', async () => {
      const maliciousPayload = "SELECT/**/password/**/FROM/**/users/**/WHERE/**/id=1";
      
      await request(app)
        .post('/api/test')
        .send({ obfuscated: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli',
          pattern: 'COMMENT_OBFUSCATED'
        })
      );
    });
  });

  describe('Cross-Site Scripting (XSS) Detection', () => {
    it('should detect script-based XSS attacks', async () => {
      const maliciousPayloads = [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img onerror='alert(1)' src='x'>",
        "<div onload='alert(1)'>test</div>"
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .get('/api/test')
          .query({ content: payload })
          .expect(200);
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'xss',
          pattern: 'XSS_PATTERNS'
        })
      );
    });
  });

  describe('Path Traversal Detection', () => {
    it('should detect directory traversal attacks', async () => {
      const maliciousPayloads = [
        "../../../etc/passwd",
        "..\\\\..\\\\..\\\\windows\\\\system32\\\\config\\\\sam",
        "....//....//....//etc//passwd"
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .get('/api/test')
          .query({ file: payload })
          .expect(200);
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'path_traversal',
          pattern: 'PATH_TRAVERSAL'
        })
      );
    });
  });

  describe('Performance Requirements', () => {
    it('should process threat detection within 5ms performance threshold', async () => {
      const complexPayload = "a".repeat(1000) + "' UNION SELECT " + "b".repeat(1000) + " FROM users--";
      
      const startTime = process.hrtime.bigint();
      
      await request(app)
        .post('/api/test')
        .send({ large: complexPayload })
        .expect(200);
        
      const endTime = process.hrtime.bigint();
      const processingTime = Number(endTime - startTime) / 1000000; // Convert to ms
      
      // Should complete within reasonable time (allowing for test overhead)
      expect(processingTime).toBeLessThan(100); // 100ms including HTTP overhead
      
      // Check if performance warning was logged for detection itself
      const performanceWarnings = mockLogger.warn.mock.calls.filter(
        call => typeof call[0] === 'string' && call[0].includes('exceeded performance threshold')
      );
      
      // Should not have performance warnings for normal payloads
      expect(performanceWarnings.length).toBe(0);
    });

    it('should handle multiple concurrent requests efficiently', async () => {
      const requests = Array(10).fill(0).map((_, i) => 
        request(app)
          .get('/api/test')
          .query({ test: `payload${i}' UNION SELECT password FROM users--` })
      );
      
      const startTime = process.hrtime.bigint();
      await Promise.all(requests);
      const endTime = process.hrtime.bigint();
      
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgTimePerRequest = totalTime / 10;
      
      // Average time per request should be reasonable
      expect(avgTimePerRequest).toBeLessThan(50); // 50ms per request including overhead
    });
  });

  describe('False Positive Prevention', () => {
    it('should not flag legitimate database queries', async () => {
      const legitimateQueries = [
        "SELECT id FROM products WHERE category = 'electronics'",
        "UPDATE user_preferences SET theme = 'dark' WHERE user_id = 123",
        "INSERT INTO logs (message) VALUES ('User logged in')",
        "search term with select word in it",
        "union street address",
        "My name is Union Jack"
      ];

      for (const query of legitimateQueries) {
        await request(app)
          .get('/api/test')
          .query({ legitimate: query })
          .expect(200);
      }

      // Should not trigger high-confidence alerts for legitimate content
      const criticalAlerts = mockLogger.error.mock.calls.filter(
        call => call[1]?.event === 'security_threat_critical'
      );
      
      expect(criticalAlerts.length).toBe(0);
    });

    it('should not flag legitimate web content', async () => {
      const legitimateContent = [
        "Learn about SQL SELECT statements",
        "How to JOIN tables in your database",
        "JavaScript setTimeout function",
        "HTML script tags and best practices",
        "File path: /home/user/documents/file.txt"
      ];

      for (const content of legitimateContent) {
        await request(app)
          .post('/api/test')
          .send({ content })
          .expect(200);
      }

      // Should not trigger alerts for educational/legitimate content
      const alerts = mockLogger.error.mock.calls.filter(
        call => call[1]?.event === 'security_threat_critical'
      );
      
      expect(alerts.length).toBe(0);
    });
  });

  describe('Financial Endpoint Protection', () => {
    it('should provide enhanced monitoring for financial endpoints', async () => {
      await request(app)
        .get('/api/financial/transactions')
        .query({ legit: 'query' })
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Security event',
        expect.objectContaining({
          event: 'security_action',
          path: '/api/financial/transactions'
        })
      );
    });

    it('should detect SQL injection attempts against financial data', async () => {
      const maliciousPayload = "1' UNION SELECT credit_card_number FROM payment_methods--";
      
      await request(app)
        .get('/api/financial/transactions')
        .query({ account: maliciousPayload })
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          event: 'security_threat_critical',
          path: '/api/financial/transactions',
          threatType: 'sqli'
        })
      );
    });
  });

  describe('User-Agent and Header Analysis', () => {
    it('should analyze User-Agent headers for threats', async () => {
      const maliciousUserAgent = "Mozilla/5.0 ' UNION SELECT password FROM users--";
      
      await request(app)
        .get('/api/test')
        .set('User-Agent', maliciousUserAgent)
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'High-confidence security threat detected',
        expect.objectContaining({
          threatType: 'sqli'
        })
      );
    });

    it('should analyze Referer headers for threats', async () => {
      const maliciousReferer = "https://evil.com/page?inject=' UNION SELECT * FROM admin_users--";
      
      await request(app)
        .get('/api/test')
        .set('Referer', maliciousReferer)
        .expect(200);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});