import crypto from 'crypto';

import { logger } from '../../utils/logger';
import { redis } from '../redis';

export interface OIDCSession {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  configId: number;
  createdAt: Date;
}

export class SessionStore {
  private readonly prefix = 'oidc_session:';
  private readonly ttl = 600; // 10 minutes

  async createSession(configId: number, redirectUri: string): Promise<string> {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('hex');

      const session: OIDCSession = {
        state,
        codeVerifier,
        redirectUri,
        configId,
        createdAt: new Date(),
      };

      await redis.setEx(`${this.prefix}${state}`, this.ttl, JSON.stringify(session));

      logger.info('OIDC session created', { state, configId });

      return state;
    } catch (error) {
      logger.error('Failed to create OIDC session', error);
      throw error;
    }
  }

  async getSession(state: string): Promise<OIDCSession | null> {
    try {
      const data = await redis.get(`${this.prefix}${state}`);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as OIDCSession;
    } catch (error) {
      logger.error('Failed to get OIDC session', error);
      return null;
    }
  }

  async deleteSession(state: string): Promise<void> {
    try {
      await redis.del(`${this.prefix}${state}`);
      logger.info('OIDC session deleted', { state });
    } catch (error) {
      logger.error('Failed to delete OIDC session', error);
    }
  }

  async getCodeVerifier(state: string): Promise<string | null> {
    const session = await this.getSession(state);
    return session?.codeVerifier || null;
  }
}

export const sessionStore = new SessionStore();
