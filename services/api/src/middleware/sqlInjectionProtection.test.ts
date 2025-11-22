/**
 * Tests for SQL Injection Protection Middleware
 * Created: 2025-10-28
 */

import { Request, Response, NextFunction } from 'express';
import {
  validateSQLInjection,
  containsSQLInjection,
  sanitizeSQLInput,
  createSafeLikePattern,
  isValidUUID,
  isSafeInteger,
  enforceParameterizedQueries
} from './sqlInjectionProtection';

describe('SQL Injection Protection', () => {
  describe('containsSQLInjection', () => {
    it('should detect SQL injection in SELECT statements', () => {
      expect(containsSQLInjection("' OR '1'='1")).toBe(true);
      expect(containsSQLInjection("admin' --")).toBe(true);
      expect(containsSQLInjection("1; DROP TABLE users")).toBe(true);
    });

    it('should detect UNION-based SQL injection', () => {
      expect(containsSQLInjection("' UNION SELECT * FROM users--")).toBe(true);
      expect(containsSQLInjection("1 UNION ALL SELECT password FROM users")).toBe(true);
    });

    it('should detect boolean-based SQL injection', () => {
      expect(containsSQLInjection("1' OR '1'='1")).toBe(true);
      expect(containsSQLInjection("admin' OR 1=1--")).toBe(true);
    });

    it('should detect time-based SQL injection', () => {
      expect(containsSQLInjection("'; WAITFOR DELAY '00:00:05'--")).toBe(true);
      expect(containsSQLInjection("1; EXEC xp_cmdshell('dir')")).toBe(true);
    });

    it('should detect hex-encoded injection', () => {
      expect(containsSQLInjection("0x73656c656374")).toBe(true);
    });

    it('should allow safe inputs', () => {
      expect(containsSQLInjection('john.doe@example.com')).toBe(false);
      expect(containsSQLInjection('John Doe')).toBe(false);
      expect(containsSQLInjection('1234567890')).toBe(false);
      expect(containsSQLInjection('user-id-123')).toBe(false);
    });

    it('should handle non-string values', () => {
      expect(containsSQLInjection(123)).toBe(false);
      expect(containsSQLInjection(null)).toBe(false);
      expect(containsSQLInjection(undefined)).toBe(false);
      expect(containsSQLInjection(true)).toBe(false);
    });
  });

  describe('sanitizeSQLInput', () => {
    it('should escape single quotes', () => {
      expect(sanitizeSQLInput("O'Brien")).toBe("O''Brien");
      expect(sanitizeSQLInput("It's")).toBe("It''s");
    });

    it('should remove SQL comments', () => {
      expect(sanitizeSQLInput("test -- comment")).toBe("test ");
      expect(sanitizeSQLInput("test /* comment */ value")).toBe("test  value");
    });

    it('should remove dangerous SQL keywords', () => {
      // The function removes "; DROP" but leaves "TABLE users"
      expect(sanitizeSQLInput("test; DROP TABLE users")).toBe("test TABLE users");
      expect(sanitizeSQLInput("value; DELETE FROM data")).toBe("value FROM data");
    });

    it('should remove null bytes', () => {
      expect(sanitizeSQLInput("test\0value")).toBe("testvalue");
    });
  });

  describe('validateSQLInjection middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
      mockRequest = {
        params: {},
        query: {},
        body: {},
        path: '/test',
        ip: '127.0.0.1',
        get: jest.fn()
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      mockNext = jest.fn();
    });

    it('should allow safe URL parameters', () => {
      mockRequest.params = { id: '12345', email: 'test@example.com' };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block SQL injection in URL parameters', () => {
      mockRequest.params = { id: "1' OR '1'='1" };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_INPUT',
            field: 'id'
          })
        })
      );
    });

    it('should allow safe query string parameters', () => {
      mockRequest.query = { search: 'test query', page: '1' };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block SQL injection in query string', () => {
      mockRequest.query = { search: "test'; DROP TABLE users--" };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should allow safe request body', () => {
      mockRequest.body = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: "O'Brien",
        age: 25
      };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block SQL injection in request body', () => {
      mockRequest.body = {
        email: "admin' OR '1'='1'--",
        password: 'test123'
      };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_INPUT',
            message: expect.stringContaining('request body')
          })
        })
      );
    });

    it('should block SQL injection in nested objects', () => {
      mockRequest.body = {
        user: {
          profile: {
            bio: "Test'; DROP TABLE users--"
          }
        }
      };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should block SQL injection in arrays', () => {
      mockRequest.body = {
        tags: ['tag1', 'tag2', "'; DROP TABLE users--"]
      };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should apply strict validation to sensitive fields', () => {
      // IDs should only contain alphanumeric and common safe characters
      mockRequest.body = {
        userId: 'user-123',
        email: 'test@example.com'
      };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();

      // Reset
      mockNext.mockClear();
      mockRequest.body = {
        userId: 'user-123; DROP TABLE'
      };

      validateSQLInjection(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createSafeLikePattern', () => {
    it('should escape special LIKE characters', () => {
      expect(createSafeLikePattern('test%value')).toBe('%test\\%value%');
      expect(createSafeLikePattern('test_value')).toBe('%test\\_value%');
      expect(createSafeLikePattern('test\\value')).toBe('%test\\\\value%');
    });

    it('should create pattern for start match', () => {
      expect(createSafeLikePattern('test', 'start')).toBe('test%');
    });

    it('should create pattern for end match', () => {
      expect(createSafeLikePattern('test', 'end')).toBe('%test');
    });

    it('should create pattern for contains match', () => {
      expect(createSafeLikePattern('test', 'contains')).toBe('%test%');
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isSafeInteger', () => {
    it('should validate safe integers', () => {
      expect(isSafeInteger('123')).toBe(true);
      expect(isSafeInteger('0')).toBe(true);
      expect(isSafeInteger('999999')).toBe(true);
    });

    it('should reject invalid integers', () => {
      expect(isSafeInteger('-1')).toBe(false);
      expect(isSafeInteger('12.5')).toBe(false);
      expect(isSafeInteger('abc')).toBe(false);
      expect(isSafeInteger('9007199254740992')).toBe(false); // Above MAX_SAFE_INTEGER
    });
  });

  describe('enforceParameterizedQueries', () => {
    it('should allow parameterized queries', () => {
      const originalQuery = jest.fn().mockResolvedValue([]);
      const mockDB: Record<string, unknown> = {
        query: originalQuery
      };

      const wrappedDB = enforceParameterizedQueries(mockDB);

      expect(() => {
        wrappedDB.query('SELECT * FROM users WHERE id = $1', ['user-123']);
      }).not.toThrow();

      expect(originalQuery).toHaveBeenCalled();
    });

    it('should throw error for string concatenation', () => {
      const originalQuery = jest.fn().mockResolvedValue([]);
      const mockDB: Record<string, unknown> = {
        query: originalQuery
      };

      const wrappedDB = enforceParameterizedQueries(mockDB);

      // This query string contains "+ '" pattern which indicates concatenation
      expect(() => {
        wrappedDB.query("SELECT * FROM users WHERE id = '+ user123 + '");
      }).toThrow(/string concatenation/);
    });

    it('should warn about template literals without parameters', () => {
      const originalQuery = jest.fn().mockResolvedValue([]);
      const mockDB: Record<string, unknown> = {
        query: originalQuery
      };

      const wrappedDB = enforceParameterizedQueries(mockDB);

      // This should not throw but should log a warning
      const userId = 'user-123';
      wrappedDB.query(`SELECT * FROM users WHERE id = '${userId}'`);

      // The original query should still be called (warning, not error)
      expect(originalQuery).toHaveBeenCalled();
    });
  });

  describe('Real-world SQL injection attempts', () => {
    it('should block common authentication bypass attempts', () => {
      const attacks = [
        "admin' --",
        "admin' #",
        "admin'/*",
        "' or 1=1--",
        "' or 1=1#",
        "' or 1=1/*",
        "') or '1'='1--",
        "') or ('1'='1--",
        "' OR '1'='1' -- ",
        "' OR '1'='1' ({",
        "' OR '1'='1' /*"
      ];

      attacks.forEach(attack => {
        expect(containsSQLInjection(attack)).toBe(true);
      });
    });

    it('should block UNION-based data extraction', () => {
      const attacks = [
        "' UNION SELECT NULL--",
        "' UNION SELECT password FROM users--",
        "' UNION ALL SELECT table_name FROM information_schema.tables--",
        "1' ORDER BY 1--",
        "1' ORDER BY 2--",
        "1' ORDER BY 3--"
      ];

      attacks.forEach(attack => {
        expect(containsSQLInjection(attack)).toBe(true);
      });
    });

    it('should block stored procedure execution', () => {
      const attacks = [
        "'; EXEC xp_cmdshell('dir')--",
        "'; EXEC sp_executesql N'SELECT * FROM users'--",
        "1; EXECUTE('DROP TABLE users')--"
      ];

      attacks.forEach(attack => {
        expect(containsSQLInjection(attack)).toBe(true);
      });
    });

    it('should block blind SQL injection attempts', () => {
      const attacks = [
        "1' AND '1'='1",
        "1' AND '1'='2",
        "1' AND SLEEP(5)--",
        "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
        "'; IF (1=1) WAITFOR DELAY '00:00:05'--"
      ];

      attacks.forEach(attack => {
        expect(containsSQLInjection(attack)).toBe(true);
      });
    });
  });
});
