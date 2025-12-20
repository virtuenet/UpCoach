/**
 * LarkWebhookHandler - Handle incoming Lark webhook events
 * Provides verification, decryption, and event routing
 */

import CryptoJS from 'crypto-js';
import type {
  WebhookEvent,
  MessageReceivedEvent,
  UrlVerificationEvent,
} from '../types';
import { LarkWebhookError } from '../types';

export type EventHandler<T = unknown> = (event: T) => Promise<void> | void;

export interface WebhookHandlerConfig {
  verificationToken: string;
  encryptKey?: string;
}

export interface WebhookRequest {
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export interface WebhookResponse {
  statusCode: number;
  body: unknown;
}

export class LarkWebhookHandler {
  private readonly verificationToken: string;
  private readonly encryptKey: string;
  private readonly eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(config: WebhookHandlerConfig) {
    this.verificationToken = config.verificationToken;
    this.encryptKey = config.encryptKey || '';
  }

  // ============================================================================
  // Event Registration
  // ============================================================================

  /**
   * Register an event handler
   */
  on<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler as EventHandler);
    this.eventHandlers.set(eventType, handlers);
  }

  /**
   * Register handler for message received events
   */
  onMessage(handler: EventHandler<MessageReceivedEvent>): void {
    this.on('im.message.receive_v1', handler);
  }

  /**
   * Register handler for card action events
   */
  onCardAction(handler: EventHandler<WebhookEvent>): void {
    this.on('card.action.trigger', handler);
  }

  /**
   * Register handler for approval events
   */
  onApproval(handler: EventHandler<WebhookEvent>): void {
    this.on('approval.approval.updated_v4', handler);
  }

  /**
   * Remove all handlers for an event type
   */
  off(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }

  // ============================================================================
  // Request Handling
  // ============================================================================

  /**
   * Handle incoming webhook request
   */
  async handle(request: WebhookRequest): Promise<WebhookResponse> {
    try {
      let payload = request.body;

      // Decrypt if encrypted
      if (this.isEncrypted(payload)) {
        payload = this.decrypt(payload as { encrypt: string });
      }

      // Handle URL verification challenge
      if (this.isUrlVerification(payload)) {
        return this.handleUrlVerification(payload as UrlVerificationEvent);
      }

      // Validate webhook token
      if (!this.isValidToken(payload as WebhookEvent)) {
        throw new LarkWebhookError('Invalid verification token');
      }

      // Process the event
      await this.processEvent(payload as WebhookEvent);

      return {
        statusCode: 200,
        body: { code: 0, msg: 'success' },
      };
    } catch (error) {
      if (error instanceof LarkWebhookError) {
        return {
          statusCode: 400,
          body: { code: -1, msg: error.message },
        };
      }

      console.error('Webhook handling error:', error);
      return {
        statusCode: 500,
        body: { code: -1, msg: 'Internal server error' },
      };
    }
  }

  // ============================================================================
  // Verification & Decryption
  // ============================================================================

  /**
   * Check if payload is encrypted
   */
  private isEncrypted(payload: unknown): boolean {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'encrypt' in payload &&
      typeof (payload as { encrypt: string }).encrypt === 'string'
    );
  }

  /**
   * Decrypt encrypted payload
   */
  private decrypt(payload: { encrypt: string }): unknown {
    if (!this.encryptKey) {
      throw new LarkWebhookError('Encrypt key not configured');
    }

    try {
      // Lark uses AES-256-CBC with SHA256 key derivation
      const key = CryptoJS.SHA256(this.encryptKey);
      const encrypted = CryptoJS.enc.Base64.parse(payload.encrypt);

      // Extract IV (first 16 bytes) and ciphertext
      const iv = CryptoJS.lib.WordArray.create(encrypted.words.slice(0, 4), 16);
      const ciphertext = CryptoJS.lib.WordArray.create(
        encrypted.words.slice(4),
        encrypted.sigBytes - 16
      );

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext } as CryptoJS.lib.CipherParams,
        key,
        {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedStr);
    } catch (error) {
      throw new LarkWebhookError(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if payload is URL verification
   */
  private isUrlVerification(payload: unknown): boolean {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'type' in payload &&
      (payload as { type: string }).type === 'url_verification'
    );
  }

  /**
   * Handle URL verification challenge
   */
  private handleUrlVerification(event: UrlVerificationEvent): WebhookResponse {
    // Validate token
    if (event.token !== this.verificationToken) {
      throw new LarkWebhookError('Invalid verification token');
    }

    return {
      statusCode: 200,
      body: { challenge: event.challenge },
    };
  }

  /**
   * Validate webhook token
   */
  private isValidToken(event: WebhookEvent): boolean {
    return event.header?.token === this.verificationToken;
  }

  // ============================================================================
  // Event Processing
  // ============================================================================

  /**
   * Process webhook event
   */
  private async processEvent(event: WebhookEvent): Promise<void> {
    const eventType = event.header.event_type;
    const handlers = this.eventHandlers.get(eventType) || [];

    // Also check for wildcard handlers
    const wildcardHandlers = this.eventHandlers.get('*') || [];

    const allHandlers = [...handlers, ...wildcardHandlers];

    if (allHandlers.length === 0) {
      console.log(`No handlers registered for event type: ${eventType}`);
      return;
    }

    // Execute all handlers
    await Promise.all(
      allHandlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      })
    );
  }

  // ============================================================================
  // Signature Verification
  // ============================================================================

  /**
   * Verify request signature (for added security)
   */
  verifySignature(
    timestamp: string,
    nonce: string,
    body: string,
    signature: string
  ): boolean {
    if (!this.encryptKey) {
      return true; // Skip signature verification if no encrypt key
    }

    const toSign = timestamp + nonce + this.encryptKey + body;
    const computed = CryptoJS.SHA256(toSign).toString();

    return computed === signature;
  }

  /**
   * Create signature for outgoing requests
   */
  createSignature(timestamp: string, nonce: string, body: string): string {
    const toSign = timestamp + nonce + this.encryptKey + body;
    return CryptoJS.SHA256(toSign).toString();
  }
}
