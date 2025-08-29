/**
 * WebAuthn Service
 * Implements WebAuthn/Passkeys for passwordless authentication
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import { logger } from '../utils/logger';
import { redis } from './redis';

export interface WebAuthnConfig {
  rpName: string;
  rpID: string;
  origin: string | string[];
  timeout?: number;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  attestationType?: 'none' | 'indirect' | 'direct' | 'enterprise';
}

export interface WebAuthnCredential {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
  userId: string;
  name?: string;
  createdAt: Date;
  lastUsedAt?: Date;
  backedUp: boolean;
  deviceType?: string;
}

export interface WebAuthnChallenge {
  challenge: string;
  userId: string;
  type: 'registration' | 'authentication';
  createdAt: Date;
  expiresAt: Date;
}

class WebAuthnService {
  private static instance: WebAuthnService;
  private config: WebAuthnConfig;
  private challengeExpiry = 300000; // 5 minutes

  private constructor() {
    this.config = {
      rpName: process.env.WEBAUTHN_RP_NAME || 'UpCoach',
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      timeout: 60000, // 1 minute
      userVerification: 'preferred',
      attestationType: 'none',
    };
  }

  static getInstance(): WebAuthnService {
    if (!WebAuthnService.instance) {
      WebAuthnService.instance = new WebAuthnService();
    }
    return WebAuthnService.instance;
  }

  /**
   * Configure WebAuthn settings
   */
  configure(config: Partial<WebAuthnConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('WebAuthn configured', { rpName: this.config.rpName, rpID: this.config.rpID });
  }

  /**
   * Generate registration options for new credential
   */
  async generateRegistrationOptions(
    userId: string,
    userName: string,
    userDisplayName: string
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    try {
      // Get existing credentials to exclude
      const existingCredentials = await this.getUserCredentials(userId);
      const excludeCredentials = existingCredentials.map(cred => ({
        id: Buffer.from(cred.credentialID, 'base64'),
        type: 'public-key' as const,
        transports: cred.transports as AuthenticatorTransport[],
      }));

      // Generate registration options
      const options = await generateRegistrationOptions({
        rpName: this.config.rpName,
        rpID: this.config.rpID,
        userID: userId,
        userName,
        userDisplayName,
        timeout: this.config.timeout,
        attestationType: this.config.attestationType,
        excludeCredentials,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'preferred',
          userVerification: this.config.userVerification,
        },
        supportedAlgorithmIDs: [-7, -257], // ES256, RS256
      });

      // Store challenge for verification
      await this.storeChallenge(userId, options.challenge, 'registration');

      logger.info('Generated WebAuthn registration options', { userId });

      return options;
    } catch (error) {
      logger.error('Error generating registration options', error);
      throw new Error('Failed to generate registration options');
    }
  }

  /**
   * Verify registration response
   */
  async verifyRegistrationResponse(
    userId: string,
    response: RegistrationResponseJSON,
    credentialName?: string
  ): Promise<{ verified: boolean; credentialId?: string }> {
    try {
      // Get stored challenge
      const expectedChallenge = await this.getChallenge(userId, 'registration');
      if (!expectedChallenge) {
        throw new Error('Registration challenge not found or expired');
      }

      // Verify the registration
      const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.config.origin,
        expectedRPID: this.config.rpID,
        requireUserVerification: this.config.userVerification === 'required',
      });

      if (verification.verified && verification.registrationInfo) {
        const { credentialPublicKey, credentialID, counter, credentialBackedUp, credentialDeviceType } = 
          verification.registrationInfo;

        // Store credential
        const credential: WebAuthnCredential = {
          credentialID: Buffer.from(credentialID).toString('base64'),
          credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
          counter,
          credentialDeviceType: credentialDeviceType || 'unknown',
          credentialBackedUp: credentialBackedUp || false,
          transports: response.response.transports,
          userId,
          name: credentialName || `Passkey ${new Date().toLocaleDateString()}`,
          createdAt: new Date(),
          backedUp: credentialBackedUp || false,
          deviceType: credentialDeviceType,
        };

        await this.storeCredential(credential);

        // Clear challenge
        await this.clearChallenge(userId, 'registration');

        logger.info('WebAuthn credential registered', { userId, credentialId: credential.credentialID });

        return {
          verified: true,
          credentialId: credential.credentialID,
        };
      }

      return { verified: false };
    } catch (error) {
      logger.error('Error verifying registration', error);
      throw error;
    }
  }

  /**
   * Generate authentication options
   */
  async generateAuthenticationOptions(
    userId?: string
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    try {
      let allowCredentials: any[] = [];

      if (userId) {
        // Get user's credentials
        const credentials = await this.getUserCredentials(userId);
        allowCredentials = credentials.map(cred => ({
          id: Buffer.from(cred.credentialID, 'base64'),
          type: 'public-key' as const,
          transports: cred.transports as AuthenticatorTransport[],
        }));
      }

      // Generate authentication options
      const options = await generateAuthenticationOptions({
        rpID: this.config.rpID,
        timeout: this.config.timeout,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: this.config.userVerification,
      });

      // Store challenge for verification
      const challengeUserId = userId || 'anonymous';
      await this.storeChallenge(challengeUserId, options.challenge, 'authentication');

      logger.info('Generated WebAuthn authentication options', { userId: challengeUserId });

      return options;
    } catch (error) {
      logger.error('Error generating authentication options', error);
      throw new Error('Failed to generate authentication options');
    }
  }

  /**
   * Verify authentication response
   */
  async verifyAuthenticationResponse(
    response: AuthenticationResponseJSON,
    userId?: string
  ): Promise<{ verified: boolean; userId?: string; credentialId?: string }> {
    try {
      // Get credential by ID
      const credentialId = response.id;
      const credential = await this.getCredentialById(credentialId);

      if (!credential) {
        logger.warn('Credential not found', { credentialId });
        return { verified: false };
      }

      // Get stored challenge
      const challengeUserId = userId || credential.userId;
      const expectedChallenge = await this.getChallenge(challengeUserId, 'authentication');
      
      if (!expectedChallenge) {
        throw new Error('Authentication challenge not found or expired');
      }

      // Prepare authenticator for verification
      const authenticator: any = {
        credentialID: Uint8Array.from(credential.credentialID, 'base64'),
        credentialPublicKey: Uint8Array.from(credential.credentialPublicKey, 'base64'),
        counter: credential.counter,
        transports: credential.transports,
      };

      // Verify the authentication
      const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.config.origin,
        expectedRPID: this.config.rpID,
        authenticator,
        requireUserVerification: this.config.userVerification === 'required',
      });

      if (verification.verified) {
        // Update credential counter and last used
        credential.counter = verification.authenticationInfo.newCounter;
        credential.lastUsedAt = new Date();
        await this.updateCredential(credential);

        // Clear challenge
        await this.clearChallenge(challengeUserId, 'authentication');

        logger.info('WebAuthn authentication successful', { 
          userId: credential.userId, 
          credentialId: credential.credentialID 
        });

        return {
          verified: true,
          userId: credential.userId,
          credentialId: credential.credentialID,
        };
      }

      return { verified: false };
    } catch (error) {
      logger.error('Error verifying authentication', error);
      return { verified: false };
    }
  }

  /**
   * Get user's WebAuthn credentials
   */
  async getUserCredentials(userId: string): Promise<WebAuthnCredential[]> {
    try {
      const key = `webauthn:credentials:${userId}`;
      const data = await redis.get(key);
      
      if (!data) {
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting user credentials', error);
      return [];
    }
  }

  /**
   * Get credential by ID
   */
  async getCredentialById(credentialId: string): Promise<WebAuthnCredential | null> {
    try {
      const key = `webauthn:credential:${credentialId}`;
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting credential', error);
      return null;
    }
  }

  /**
   * Store credential
   */
  private async storeCredential(credential: WebAuthnCredential): Promise<void> {
    try {
      // Store in user's credential list
      const userKey = `webauthn:credentials:${credential.userId}`;
      const userCredentials = await this.getUserCredentials(credential.userId);
      userCredentials.push(credential);
      await redis.set(userKey, JSON.stringify(userCredentials));

      // Store credential by ID for quick lookup
      const credentialKey = `webauthn:credential:${credential.credentialID}`;
      await redis.set(credentialKey, JSON.stringify(credential));

      logger.info('Stored WebAuthn credential', { 
        userId: credential.userId, 
        credentialId: credential.credentialID 
      });
    } catch (error) {
      logger.error('Error storing credential', error);
      throw new Error('Failed to store credential');
    }
  }

  /**
   * Update credential
   */
  private async updateCredential(credential: WebAuthnCredential): Promise<void> {
    try {
      // Update in user's credential list
      const userKey = `webauthn:credentials:${credential.userId}`;
      const userCredentials = await this.getUserCredentials(credential.userId);
      const index = userCredentials.findIndex(c => c.credentialID === credential.credentialID);
      
      if (index !== -1) {
        userCredentials[index] = credential;
        await redis.set(userKey, JSON.stringify(userCredentials));
      }

      // Update credential by ID
      const credentialKey = `webauthn:credential:${credential.credentialID}`;
      await redis.set(credentialKey, JSON.stringify(credential));
    } catch (error) {
      logger.error('Error updating credential', error);
      throw new Error('Failed to update credential');
    }
  }

  /**
   * Delete credential
   */
  async deleteCredential(userId: string, credentialId: string): Promise<void> {
    try {
      // Remove from user's credential list
      const userKey = `webauthn:credentials:${userId}`;
      const userCredentials = await this.getUserCredentials(userId);
      const filteredCredentials = userCredentials.filter(c => c.credentialID !== credentialId);
      await redis.set(userKey, JSON.stringify(filteredCredentials));

      // Remove credential by ID
      const credentialKey = `webauthn:credential:${credentialId}`;
      await redis.del(credentialKey);

      logger.info('Deleted WebAuthn credential', { userId, credentialId });
    } catch (error) {
      logger.error('Error deleting credential', error);
      throw new Error('Failed to delete credential');
    }
  }

  /**
   * Rename credential
   */
  async renameCredential(
    userId: string,
    credentialId: string,
    newName: string
  ): Promise<void> {
    try {
      const credential = await this.getCredentialById(credentialId);
      
      if (!credential || credential.userId !== userId) {
        throw new Error('Credential not found');
      }

      credential.name = newName;
      await this.updateCredential(credential);

      logger.info('Renamed WebAuthn credential', { userId, credentialId, newName });
    } catch (error) {
      logger.error('Error renaming credential', error);
      throw error;
    }
  }

  /**
   * Store challenge for verification
   */
  private async storeChallenge(
    userId: string,
    challenge: string,
    type: 'registration' | 'authentication'
  ): Promise<void> {
    const key = `webauthn:challenge:${type}:${userId}`;
    const challengeData: WebAuthnChallenge = {
      challenge,
      userId,
      type,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.challengeExpiry),
    };

    await redis.setEx(
      key,
      Math.floor(this.challengeExpiry / 1000),
      JSON.stringify(challengeData)
    );
  }

  /**
   * Get stored challenge
   */
  private async getChallenge(
    userId: string,
    type: 'registration' | 'authentication'
  ): Promise<string | null> {
    const key = `webauthn:challenge:${type}:${userId}`;
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }

    const challengeData: WebAuthnChallenge = JSON.parse(data);
    
    // Check if expired
    if (new Date() > new Date(challengeData.expiresAt)) {
      await redis.del(key);
      return null;
    }

    return challengeData.challenge;
  }

  /**
   * Clear challenge
   */
  private async clearChallenge(
    userId: string,
    type: 'registration' | 'authentication'
  ): Promise<void> {
    const key = `webauthn:challenge:${type}:${userId}`;
    await redis.del(key);
  }

  /**
   * Check if user has WebAuthn credentials
   */
  async hasWebAuthnCredentials(userId: string): Promise<boolean> {
    const credentials = await this.getUserCredentials(userId);
    return credentials.length > 0;
  }

  /**
   * Get credential statistics for user
   */
  async getUserCredentialStats(userId: string): Promise<{
    total: number;
    platformCredentials: number;
    backedUpCredentials: number;
    lastUsed?: Date;
  }> {
    const credentials = await this.getUserCredentials(userId);
    
    const stats = {
      total: credentials.length,
      platformCredentials: credentials.filter(c => c.deviceType === 'singleDevice').length,
      backedUpCredentials: credentials.filter(c => c.backedUp).length,
      lastUsed: credentials
        .filter(c => c.lastUsedAt)
        .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())[0]
        ?.lastUsedAt,
    };

    return stats;
  }
}

// Export singleton instance
export const webAuthnService = WebAuthnService.getInstance();