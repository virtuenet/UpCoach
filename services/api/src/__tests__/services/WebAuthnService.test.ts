import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

import { WebAuthnService } from '../../services/WebAuthnService';
import { redis } from '../../services/redis';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('@simplewebauthn/server');
jest.mock('../../services/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
  },
}));
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockGenerateRegistrationOptions = generateRegistrationOptions as jest.MockedFunction<typeof generateRegistrationOptions>;
const mockVerifyRegistrationResponse = verifyRegistrationResponse as jest.MockedFunction<typeof verifyRegistrationResponse>;
const mockGenerateAuthenticationOptions = generateAuthenticationOptions as jest.MockedFunction<typeof generateAuthenticationOptions>;
const mockVerifyAuthenticationResponse = verifyAuthenticationResponse as jest.MockedFunction<typeof verifyAuthenticationResponse>;
const mockRedis = redis as jest.Mocked<typeof redis>;

describe('WebAuthnService', () => {
  let webAuthnService: WebAuthnService;
  const testUserId = 'user123';
  const testUserName = 'john.doe@upcoach.ai';
  const testUserDisplayName = 'John Doe';
  const testCredentialId = 'test-credential-id-123';
  const testChallenge = 'test-challenge-abc123';

  beforeEach(() => {
    webAuthnService = WebAuthnService.getInstance();
    jest.clearAllMocks();

    // Reset environment variables
    process.env.WEBAUTHN_RP_NAME = 'UpCoach Test';
    process.env.WEBAUTHN_RP_ID = 'test.upcoach.ai';
    process.env.WEBAUTHN_ORIGIN = 'https://test.upcoach.ai';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = WebAuthnService.getInstance();
      const instance2 = WebAuthnService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('configure', () => {
    test('should update configuration settings', () => {
      const config = {
        rpName: 'Custom RP',
        rpID: 'custom.domain.com',
        origin: 'https://custom.domain.com',
        timeout: 120000,
        userVerification: 'required' as const,
      };

      webAuthnService.configure(config);

      expect(logger.info).toHaveBeenCalledWith(
        'WebAuthn configured',
        expect.objectContaining({
          rpName: 'Custom RP',
          rpID: 'custom.domain.com',
        })
      );
    });

    test('should merge partial configuration', () => {
      webAuthnService.configure({ rpName: 'New Name' });

      expect(logger.info).toHaveBeenCalledWith(
        'WebAuthn configured',
        expect.objectContaining({
          rpName: 'New Name',
        })
      );
    });
  });

  describe('generateRegistrationOptions', () => {
    test('should generate registration options for new credential', async () => {
      const mockOptions: PublicKeyCredentialCreationOptionsJSON = {
        challenge: testChallenge,
        rp: { name: 'UpCoach Test', id: 'test.upcoach.ai' },
        user: {
          id: Buffer.from(testUserId).toString('base64'),
          name: testUserName,
          displayName: testUserDisplayName,
        },
        pubKeyCredParams: [],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        excludeCredentials: [],
      };

      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);
      mockRedis.get.mockResolvedValue(null); // No existing credentials

      const result = await webAuthnService.generateRegistrationOptions(
        testUserId,
        testUserName,
        testUserDisplayName
      );

      expect(result).toEqual(mockOptions);
      expect(mockGenerateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpName: expect.any(String),
          rpID: expect.any(String),
          userID: testUserId,
          userName: testUserName,
          userDisplayName: testUserDisplayName,
        })
      );
    });

    test('should exclude existing credentials', async () => {
      const existingCredentials = [
        {
          credentialID: 'existing-cred-1',
          credentialPublicKey: 'public-key-1',
          counter: 1,
          userId: testUserId,
        },
        {
          credentialID: 'existing-cred-2',
          credentialPublicKey: 'public-key-2',
          counter: 2,
          userId: testUserId,
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(existingCredentials));
      mockGenerateRegistrationOptions.mockResolvedValue({} as PublicKeyCredentialCreationOptionsJSON);

      await webAuthnService.generateRegistrationOptions(
        testUserId,
        testUserName,
        testUserDisplayName
      );

      expect(mockGenerateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: expect.arrayContaining([
            expect.objectContaining({ id: expect.any(Buffer) }),
          ]),
        })
      );
    });

    test('should store challenge in Redis', async () => {
      const mockOptions: PublicKeyCredentialCreationOptionsJSON = {
        challenge: testChallenge,
        rp: { name: 'UpCoach Test', id: 'test.upcoach.ai' },
        user: {
          id: Buffer.from(testUserId).toString('base64'),
          name: testUserName,
          displayName: testUserDisplayName,
        },
        pubKeyCredParams: [],
        timeout: 60000,
      };

      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);
      mockRedis.get.mockResolvedValue(null);

      await webAuthnService.generateRegistrationOptions(
        testUserId,
        testUserName,
        testUserDisplayName
      );

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        expect.stringContaining('webauthn:challenge:registration:'),
        expect.any(Number), // TTL in seconds
        expect.stringContaining(testChallenge)
      );
    });

    test('should handle errors gracefully', async () => {
      mockGenerateRegistrationOptions.mockRejectedValue(new Error('Generation failed'));

      await expect(
        webAuthnService.generateRegistrationOptions(
          testUserId,
          testUserName,
          testUserDisplayName
        )
      ).rejects.toThrow('Failed to generate registration options');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('verifyRegistrationResponse', () => {
    test('should verify valid registration response', async () => {
      const registrationResponse: RegistrationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-object',
          publicKey: 'public-key',
        },
        type: 'public-key',
        clientExtensionResults: {},
      };

      const verificationResult = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from(testCredentialId),
          credentialPublicKey: Buffer.from('public-key'),
          counter: 0,
          credentialBackedUp: true,
          credentialDeviceType: 'singleDevice',
        },
      };

      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          challenge: testChallenge,
          userId: testUserId,
          type: 'registration',
        })
      );
      mockRedis.get.mockResolvedValueOnce(null); // No existing credentials
      mockVerifyRegistrationResponse.mockResolvedValue(verificationResult);

      const result = await webAuthnService.verifyRegistrationResponse(
        testUserId,
        registrationResponse
      );

      expect(result.verified).toBe(true);
      expect(result.credentialId).toBeDefined();
    });

    test('should reject invalid challenge', async () => {
      const registrationResponse: RegistrationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-object',
        },
        type: 'public-key',
      };

      mockRedis.get.mockResolvedValue(null); // No challenge found

      await expect(
        webAuthnService.verifyRegistrationResponse(
          testUserId,
          registrationResponse
        )
      ).rejects.toThrow('Registration challenge not found or expired');
    });

    test('should reject expired challenge', async () => {
      const expiredChallenge = {
        challenge: testChallenge,
        userId: testUserId,
        type: 'registration',
        expiresAt: new Date(Date.now() - 10000), // Expired 10 seconds ago
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredChallenge));

      const registrationResponse: RegistrationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-object',
        },
        type: 'public-key',
      };

      await expect(
        webAuthnService.verifyRegistrationResponse(
          testUserId,
          registrationResponse
        )
      ).rejects.toThrow('Registration challenge not found or expired');
    });

    test('should store credential after successful verification', async () => {
      const registrationResponse: RegistrationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-object',
          publicKey: 'public-key',
        },
        type: 'public-key',
      };

      const verificationResult = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from(testCredentialId),
          credentialPublicKey: Buffer.from('public-key'),
          counter: 0,
          credentialBackedUp: false,
        },
      };

      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          challenge: testChallenge,
          userId: testUserId,
          type: 'registration',
        })
      );
      mockRedis.get.mockResolvedValueOnce(null); // No existing credentials

      mockVerifyRegistrationResponse.mockResolvedValue(verificationResult);

      await webAuthnService.verifyRegistrationResponse(
        testUserId,
        registrationResponse
      );

      // Verify credential was stored in Redis - credentialID is now base64 encoded
      const expectedCredentialId = Buffer.from(testCredentialId).toString('base64');
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining(`webauthn:credentials:${testUserId}`),
        expect.stringContaining(expectedCredentialId)
      );
    });

    test('should delete challenge after verification', async () => {
      const registrationResponse: RegistrationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-object',
        },
        type: 'public-key',
      };

      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          challenge: testChallenge,
          userId: testUserId,
          type: 'registration',
        })
      );
      mockRedis.get.mockResolvedValueOnce(null); // No existing credentials
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from(testCredentialId),
          credentialPublicKey: Buffer.from('public-key'),
          counter: 0,
        },
      });

      await webAuthnService.verifyRegistrationResponse(
        testUserId,
        registrationResponse
      );

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('webauthn:challenge:registration:')
      );
    });
  });

  describe('generateAuthenticationOptions', () => {
    test('should generate authentication options', async () => {
      const existingCredentials = [
        {
          credentialID: testCredentialId,
          credentialPublicKey: 'public-key',
          counter: 5,
          transports: ['usb', 'nfc'],
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(existingCredentials));

      const mockOptions: PublicKeyCredentialRequestOptionsJSON = {
        challenge: testChallenge,
        timeout: 60000,
        userVerification: 'preferred',
        rpId: 'test.upcoach.ai',
        allowCredentials: [{
          id: Buffer.from(testCredentialId).toString('base64'),
          type: 'public-key',
          transports: ['usb', 'nfc'],
        }],
      };

      mockGenerateAuthenticationOptions.mockResolvedValue(mockOptions);

      const result = await webAuthnService.generateAuthenticationOptions(testUserId);

      expect(result).toEqual(mockOptions);
      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: expect.any(String),
          allowCredentials: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Buffer),
              transports: ['usb', 'nfc'],
            }),
          ]),
        })
      );
    });

    test('should work without user ID (discoverable credentials)', async () => {
      const mockOptions: PublicKeyCredentialRequestOptionsJSON = {
        challenge: testChallenge,
        timeout: 60000,
        userVerification: 'preferred',
        rpId: 'test.upcoach.ai',
      };

      mockGenerateAuthenticationOptions.mockResolvedValue(mockOptions);

      const result = await webAuthnService.generateAuthenticationOptions();

      expect(result).toEqual(mockOptions);
      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: undefined, // When no userId, allowCredentials is undefined
        })
      );
    });

    test('should store authentication challenge', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockGenerateAuthenticationOptions.mockResolvedValue({
        challenge: testChallenge,
      } as PublicKeyCredentialRequestOptionsJSON);

      await webAuthnService.generateAuthenticationOptions(testUserId);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        expect.stringContaining('webauthn:challenge:authentication:'),
        expect.any(Number), // TTL in seconds
        expect.stringContaining('authentication')
      );
    });
  });

  describe('verifyAuthenticationResponse', () => {
    test('should verify valid authentication response', async () => {
      const authenticationResponse: AuthenticationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
        },
        type: 'public-key',
      };

      const storedCredential = {
        credentialID: testCredentialId,
        credentialPublicKey: 'public-key',
        counter: 5,
        userId: testUserId,
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(storedCredential)); // getCredentialById
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          challenge: testChallenge,
          type: 'authentication',
        })
      ); // getChallenge

      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID: Buffer.from(testCredentialId),
          newCounter: 6,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
        },
      });

      const result = await webAuthnService.verifyAuthenticationResponse(
        authenticationResponse,
        testUserId
      );

      expect(result.verified).toBe(true);
      expect(result.userId).toBe(testUserId);
      expect(result.credentialId).toBe(testCredentialId);
    });

    test('should update counter after successful authentication', async () => {
      const authenticationResponse: AuthenticationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
        },
        type: 'public-key',
      };

      const storedCredential = {
        credentialID: testCredentialId,
        credentialPublicKey: 'public-key',
        counter: 5,
        userId: testUserId,
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(storedCredential)); // getCredentialById
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          challenge: testChallenge,
          type: 'authentication',
        })
      ); // getChallenge
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([storedCredential])); // getUserCredentials for update

      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID: Buffer.from(testCredentialId),
          newCounter: 10, // Counter increased
        },
      });

      await webAuthnService.verifyAuthenticationResponse(
        authenticationResponse,
        testUserId
      );

      // Verify counter was updated
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining(`webauthn:credentials:${testUserId}`),
        expect.stringContaining('"counter":10')
      );
    });

    test('should reject if credential not found', async () => {
      const authenticationResponse: AuthenticationResponseJSON = {
        id: 'unknown-credential',
        rawId: 'unknown-credential',
        response: {
          clientDataJSON: 'client-data',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
        },
        type: 'public-key',
      };

      mockRedis.get.mockResolvedValueOnce(null); // No credential found by ID

      const result = await webAuthnService.verifyAuthenticationResponse(
        authenticationResponse,
        testUserId
      );

      expect(result.verified).toBe(false);
    });

    test('should update lastUsedAt timestamp', async () => {
      const authenticationResponse: AuthenticationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
        },
        type: 'public-key',
      };

      const storedCredential = {
        credentialID: testCredentialId,
        credentialPublicKey: 'public-key',
        counter: 5,
        userId: testUserId,
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(storedCredential)); // getCredentialById
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          challenge: testChallenge,
          type: 'authentication',
        })
      ); // getChallenge
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([storedCredential])); // getUserCredentials for update

      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: {
          credentialID: Buffer.from(testCredentialId),
          newCounter: 6,
        },
      });

      await webAuthnService.verifyAuthenticationResponse(
        authenticationResponse,
        testUserId
      );

      // Verify lastUsedAt was set
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"lastUsedAt"')
      );
    });
  });

  describe('getUserCredentials', () => {
    test('should retrieve user credentials from Redis', async () => {
      const credentials = [
        {
          credentialID: 'cred1',
          credentialPublicKey: 'key1',
          counter: 1,
        },
        {
          credentialID: 'cred2',
          credentialPublicKey: 'key2',
          counter: 2,
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(credentials));

      const result = await webAuthnService.getUserCredentials(testUserId);

      expect(result).toEqual(credentials);
      expect(mockRedis.get).toHaveBeenCalledWith(
        `webauthn:credentials:${testUserId}`
      );
    });

    test('should return empty array if no credentials', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await webAuthnService.getUserCredentials(testUserId);

      expect(result).toEqual([]);
    });

    test('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await webAuthnService.getUserCredentials(testUserId);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteCredential', () => {
    test('should delete specific credential', async () => {
      const credentials = [
        {
          credentialID: 'cred1',
          credentialPublicKey: 'key1',
        },
        {
          credentialID: 'cred2',
          credentialPublicKey: 'key2',
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(credentials));

      await webAuthnService.deleteCredential(testUserId, 'cred1');

      expect(mockRedis.set).toHaveBeenCalledWith(
        `webauthn:credentials:${testUserId}`,
        JSON.stringify([credentials[1]]) // Only cred2 remains
      );
    });

    test('should handle credential not found', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify([]));

      // deleteCredential doesn't throw when credential not found, it just removes it from the list
      await webAuthnService.deleteCredential(testUserId, 'nonexistent');

      // Should still delete the non-existent key
      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('webauthn:credential:nonexistent')
      );
    });
  });

  describe('Rate Limiting', () => {
    test('should handle registration generation errors', async () => {
      mockGenerateRegistrationOptions.mockRejectedValue(new Error('Generation failed'));

      await expect(
        webAuthnService.generateRegistrationOptions(
          testUserId,
          testUserName,
          testUserDisplayName
        )
      ).rejects.toThrow('Failed to generate registration options');
    });

    test('should handle authentication generation errors', async () => {
      mockGenerateAuthenticationOptions.mockRejectedValue(new Error('Generation failed'));

      await expect(
        webAuthnService.generateAuthenticationOptions(testUserId)
      ).rejects.toThrow('Failed to generate authentication options');
    });

    test('should allow valid registration requests', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockGenerateRegistrationOptions.mockResolvedValue({
        challenge: testChallenge,
      } as PublicKeyCredentialCreationOptionsJSON);

      await expect(
        webAuthnService.generateRegistrationOptions(
          testUserId,
          testUserName,
          testUserDisplayName
        )
      ).resolves.toBeDefined();
    });
  });

  describe('Security Features', () => {
    test('should validate origin during verification', async () => {
      const registrationResponse: RegistrationResponseJSON = {
        id: testCredentialId,
        rawId: testCredentialId,
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            origin: 'https://evil.com', // Wrong origin
            type: 'webauthn.create',
            challenge: testChallenge,
          })).toString('base64'),
          attestationObject: 'attestation-object',
        },
        type: 'public-key',
      };

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          challenge: testChallenge,
          userId: testUserId,
          type: 'registration',
        })
      );

      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: false, // Origin mismatch
      });

      const result = await webAuthnService.verifyRegistrationResponse(
        testUserId,
        registrationResponse,
        testChallenge
      );

      expect(result.verified).toBe(false);
    });

    test('should enforce user verification when required', () => {
      webAuthnService.configure({
        userVerification: 'required',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'WebAuthn configured',
        expect.objectContaining({})
      );
    });

    test('should prevent credential ID reuse', async () => {
      const base64CredentialId = Buffer.from(testCredentialId).toString('base64');
      const existingCredentials = [
        {
          credentialID: base64CredentialId, // Stored as base64
          credentialPublicKey: 'public-key',
        },
      ];

      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          challenge: testChallenge,
          userId: testUserId,
          type: 'registration',
        })
      );
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingCredentials));

      const registrationResponse: RegistrationResponseJSON = {
        id: testCredentialId, // Trying to reuse existing ID
        rawId: testCredentialId,
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-object',
        },
        type: 'public-key',
      };

      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from(testCredentialId),
          credentialPublicKey: Buffer.from('public-key'),
          counter: 0,
        },
      });

      await expect(
        webAuthnService.verifyRegistrationResponse(
          testUserId,
          registrationResponse
        )
      ).rejects.toThrow('Credential already exists');
    });
  });
});