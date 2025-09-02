"use strict";
/**
 * WebAuthn Service
 * Implements WebAuthn/Passkeys for passwordless authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.webAuthnService = void 0;
const server_1 = require("@simplewebauthn/server");
const logger_1 = require("../utils/logger");
const redis_1 = require("./redis");
class WebAuthnService {
    static instance;
    config;
    challengeExpiry = 300000; // 5 minutes
    constructor() {
        this.config = {
            rpName: process.env.WEBAUTHN_RP_NAME || 'UpCoach',
            rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
            origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
            timeout: 60000, // 1 minute
            userVerification: 'preferred',
            attestationType: 'none',
        };
    }
    static getInstance() {
        if (!WebAuthnService.instance) {
            WebAuthnService.instance = new WebAuthnService();
        }
        return WebAuthnService.instance;
    }
    /**
     * Configure WebAuthn settings
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        logger_1.logger.info('WebAuthn configured', { rpName: this.config.rpName, rpID: this.config.rpID });
    }
    /**
     * Generate registration options for new credential
     */
    async generateRegistrationOptions(userId, userName, userDisplayName) {
        try {
            // Get existing credentials to exclude
            const existingCredentials = await this.getUserCredentials(userId);
            const excludeCredentials = existingCredentials.map(cred => ({
                id: Buffer.from(cred.credentialID, 'base64'),
                type: 'public-key',
                transports: cred.transports,
            }));
            // Generate registration options
            const options = await (0, server_1.generateRegistrationOptions)({
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
            logger_1.logger.info('Generated WebAuthn registration options', { userId });
            return options;
        }
        catch (error) {
            logger_1.logger.error('Error generating registration options', error);
            throw new Error('Failed to generate registration options');
        }
    }
    /**
     * Verify registration response
     */
    async verifyRegistrationResponse(userId, response, credentialName) {
        try {
            // Get stored challenge
            const expectedChallenge = await this.getChallenge(userId, 'registration');
            if (!expectedChallenge) {
                throw new Error('Registration challenge not found or expired');
            }
            // Verify the registration
            const verification = await (0, server_1.verifyRegistrationResponse)({
                response,
                expectedChallenge,
                expectedOrigin: this.config.origin,
                expectedRPID: this.config.rpID,
                requireUserVerification: this.config.userVerification === 'required',
            });
            if (verification.verified && verification.registrationInfo) {
                const { credentialPublicKey, credentialID, counter, credentialBackedUp, credentialDeviceType, } = verification.registrationInfo;
                // Store credential
                const credential = {
                    credentialID: Buffer.from(credentialID).toString('base64'),
                    credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
                    counter,
                    transports: response.response.transports,
                    userId,
                    name: credentialName || `Passkey ${new Date().toLocaleDateString()}`,
                    createdAt: new Date(),
                    backedUp: credentialBackedUp || false,
                    deviceType: credentialDeviceType || 'unknown',
                };
                await this.storeCredential(credential);
                // Clear challenge
                await this.clearChallenge(userId, 'registration');
                logger_1.logger.info('WebAuthn credential registered', {
                    userId,
                    credentialId: credential.credentialID,
                });
                return {
                    verified: true,
                    credentialId: credential.credentialID,
                };
            }
            return { verified: false };
        }
        catch (error) {
            logger_1.logger.error('Error verifying registration', error);
            throw error;
        }
    }
    /**
     * Generate authentication options
     */
    async generateAuthenticationOptions(userId) {
        try {
            let allowCredentials = [];
            if (userId) {
                // Get user's credentials
                const credentials = await this.getUserCredentials(userId);
                allowCredentials = credentials.map(cred => ({
                    id: Buffer.from(cred.credentialID, 'base64'),
                    type: 'public-key',
                    transports: cred.transports,
                }));
            }
            // Generate authentication options
            const options = await (0, server_1.generateAuthenticationOptions)({
                rpID: this.config.rpID,
                timeout: this.config.timeout,
                allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
                userVerification: this.config.userVerification,
            });
            // Store challenge for verification
            const challengeUserId = userId || 'anonymous';
            await this.storeChallenge(challengeUserId, options.challenge, 'authentication');
            logger_1.logger.info('Generated WebAuthn authentication options', { userId: challengeUserId });
            return options;
        }
        catch (error) {
            logger_1.logger.error('Error generating authentication options', error);
            throw new Error('Failed to generate authentication options');
        }
    }
    /**
     * Verify authentication response
     */
    async verifyAuthenticationResponse(response, userId) {
        try {
            // Get credential by ID
            const credentialId = response.id;
            const credential = await this.getCredentialById(credentialId);
            if (!credential) {
                logger_1.logger.warn('Credential not found', { credentialId });
                return { verified: false };
            }
            // Get stored challenge
            const challengeUserId = userId || credential.userId;
            const expectedChallenge = await this.getChallenge(challengeUserId, 'authentication');
            if (!expectedChallenge) {
                throw new Error('Authentication challenge not found or expired');
            }
            // Prepare authenticator for verification
            const authenticator = {
                credentialID: Buffer.from(credential.credentialID, 'base64'),
                credentialPublicKey: Buffer.from(credential.credentialPublicKey, 'base64'),
                counter: credential.counter,
                transports: credential.transports,
            };
            // Verify the authentication
            const verification = await (0, server_1.verifyAuthenticationResponse)({
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
                logger_1.logger.info('WebAuthn authentication successful', {
                    userId: credential.userId,
                    credentialId: credential.credentialID,
                });
                return {
                    verified: true,
                    userId: credential.userId,
                    credentialId: credential.credentialID,
                };
            }
            return { verified: false };
        }
        catch (error) {
            logger_1.logger.error('Error verifying authentication', error);
            return { verified: false };
        }
    }
    /**
     * Get user's WebAuthn credentials
     */
    async getUserCredentials(userId) {
        try {
            const key = `webauthn:credentials:${userId}`;
            const data = await redis_1.redis.get(key);
            if (!data) {
                return [];
            }
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error('Error getting user credentials', error);
            return [];
        }
    }
    /**
     * Get credential by ID
     */
    async getCredentialById(credentialId) {
        try {
            const key = `webauthn:credential:${credentialId}`;
            const data = await redis_1.redis.get(key);
            if (!data) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error('Error getting credential', error);
            return null;
        }
    }
    /**
     * Store credential
     */
    async storeCredential(credential) {
        try {
            // Store in user's credential list
            const userKey = `webauthn:credentials:${credential.userId}`;
            const userCredentials = await this.getUserCredentials(credential.userId);
            userCredentials.push(credential);
            await redis_1.redis.set(userKey, JSON.stringify(userCredentials));
            // Store credential by ID for quick lookup
            const credentialKey = `webauthn:credential:${credential.credentialID}`;
            await redis_1.redis.set(credentialKey, JSON.stringify(credential));
            logger_1.logger.info('Stored WebAuthn credential', {
                userId: credential.userId,
                credentialId: credential.credentialID,
            });
        }
        catch (error) {
            logger_1.logger.error('Error storing credential', error);
            throw new Error('Failed to store credential');
        }
    }
    /**
     * Update credential
     */
    async updateCredential(credential) {
        try {
            // Update in user's credential list
            const userKey = `webauthn:credentials:${credential.userId}`;
            const userCredentials = await this.getUserCredentials(credential.userId);
            const index = userCredentials.findIndex(c => c.credentialID === credential.credentialID);
            if (index !== -1) {
                userCredentials[index] = credential;
                await redis_1.redis.set(userKey, JSON.stringify(userCredentials));
            }
            // Update credential by ID
            const credentialKey = `webauthn:credential:${credential.credentialID}`;
            await redis_1.redis.set(credentialKey, JSON.stringify(credential));
        }
        catch (error) {
            logger_1.logger.error('Error updating credential', error);
            throw new Error('Failed to update credential');
        }
    }
    /**
     * Delete credential
     */
    async deleteCredential(userId, credentialId) {
        try {
            // Remove from user's credential list
            const userKey = `webauthn:credentials:${userId}`;
            const userCredentials = await this.getUserCredentials(userId);
            const filteredCredentials = userCredentials.filter(c => c.credentialID !== credentialId);
            await redis_1.redis.set(userKey, JSON.stringify(filteredCredentials));
            // Remove credential by ID
            const credentialKey = `webauthn:credential:${credentialId}`;
            await redis_1.redis.del(credentialKey);
            logger_1.logger.info('Deleted WebAuthn credential', { userId, credentialId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting credential', error);
            throw new Error('Failed to delete credential');
        }
    }
    /**
     * Rename credential
     */
    async renameCredential(userId, credentialId, newName) {
        try {
            const credential = await this.getCredentialById(credentialId);
            if (!credential || credential.userId !== userId) {
                throw new Error('Credential not found');
            }
            credential.name = newName;
            await this.updateCredential(credential);
            logger_1.logger.info('Renamed WebAuthn credential', { userId, credentialId, newName });
        }
        catch (error) {
            logger_1.logger.error('Error renaming credential', error);
            throw error;
        }
    }
    /**
     * Store challenge for verification
     */
    async storeChallenge(userId, challenge, type) {
        const key = `webauthn:challenge:${type}:${userId}`;
        const challengeData = {
            challenge,
            userId,
            type,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.challengeExpiry),
        };
        await redis_1.redis.setEx(key, Math.floor(this.challengeExpiry / 1000), JSON.stringify(challengeData));
    }
    /**
     * Get stored challenge
     */
    async getChallenge(userId, type) {
        const key = `webauthn:challenge:${type}:${userId}`;
        const data = await redis_1.redis.get(key);
        if (!data) {
            return null;
        }
        const challengeData = JSON.parse(data);
        // Check if expired
        if (new Date() > new Date(challengeData.expiresAt)) {
            await redis_1.redis.del(key);
            return null;
        }
        return challengeData.challenge;
    }
    /**
     * Clear challenge
     */
    async clearChallenge(userId, type) {
        const key = `webauthn:challenge:${type}:${userId}`;
        await redis_1.redis.del(key);
    }
    /**
     * Check if user has WebAuthn credentials
     */
    async hasWebAuthnCredentials(userId) {
        const credentials = await this.getUserCredentials(userId);
        return credentials.length > 0;
    }
    /**
     * Get credential statistics for user
     */
    async getUserCredentialStats(userId) {
        const credentials = await this.getUserCredentials(userId);
        const stats = {
            total: credentials.length,
            platformCredentials: credentials.filter(c => c.deviceType === 'singleDevice').length,
            backedUpCredentials: credentials.filter(c => c.backedUp).length,
            lastUsed: credentials
                .filter(c => c.lastUsedAt)
                .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())[0]
                ?.lastUsedAt,
        };
        return stats;
    }
}
// Export singleton instance
exports.webAuthnService = WebAuthnService.getInstance();
//# sourceMappingURL=WebAuthnService.js.map