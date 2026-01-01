/**
 * TestingFramework.ts
 * Comprehensive testing utilities for backend tests
 *
 * Features:
 * - Test data factories (FactoryBot pattern) for all models
 * - Database fixtures and seeding
 * - Mock service providers
 * - API client for integration tests
 * - Authentication helpers
 * - Database transaction rollback
 * - Test database management
 * - Snapshot testing utilities
 * - Time manipulation
 * - Email/SMS/Webhook testing
 * - File upload testing
 * - WebSocket testing
 * - Redis/S3/Payment provider mocks
 */

import { faker } from '@faker-js/faker';
import { Sequelize, Transaction, Model } from 'sequelize';
import supertest, { SuperTest, Test } from 'supertest';
import { Express } from 'express';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { S3 } from 'aws-sdk';
import Redis from 'ioredis';
import { Server as SocketServer } from 'socket.io';
import { io as socketClient, Socket } from 'socket.io-client';
import timekeeper from 'timekeeper';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Types
interface FactoryAttributes {
  [key: string]: any;
}

interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'client' | 'coach' | 'admin';
  created_at: Date;
  updated_at: Date;
}

interface TestGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  deadline: Date;
  created_at: Date;
  updated_at: Date;
}

interface TestHabit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  created_at: Date;
  updated_at: Date;
}

interface TestSession {
  id: string;
  coach_id: string;
  client_id: string;
  type: '1-on-1' | 'group' | 'async';
  scheduled_at: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

interface EmailAssertion {
  to?: string | string[];
  from?: string;
  subject?: string | RegExp;
  body?: string | RegExp;
  html?: string | RegExp;
}

interface SMSAssertion {
  to: string;
  from?: string;
  body: string | RegExp;
}

interface WebhookAssertion {
  url: string;
  method?: string;
  payload?: any;
}

// Database Management
class TestDatabase {
  private sequelize: Sequelize;
  private transaction: Transaction | null = null;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async setup(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      await this.sequelize.sync({ force: true });
    } catch (error) {
      throw new Error(`Database setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async teardown(): Promise<void> {
    try {
      await this.sequelize.close();
    } catch (error) {
      throw new Error(`Database teardown failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async beginTransaction(): Promise<Transaction> {
    try {
      this.transaction = await this.sequelize.transaction();
      return this.transaction;
    } catch (error) {
      throw new Error(`Transaction begin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async rollback(): Promise<void> {
    if (this.transaction) {
      try {
        await this.transaction.rollback();
        this.transaction = null;
      } catch (error) {
        throw new Error(`Transaction rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  async truncate(): Promise<void> {
    try {
      const models = Object.values(this.sequelize.models);
      for (const model of models) {
        await model.destroy({ where: {}, force: true });
      }
    } catch (error) {
      throw new Error(`Database truncate failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Base Factory
class BaseFactory<T extends FactoryAttributes> {
  protected model: any;
  protected transaction: Transaction | null = null;

  constructor(model: any) {
    this.model = model;
  }

  setTransaction(transaction: Transaction): void {
    this.transaction = transaction;
  }

  protected async save(attributes: Partial<T>): Promise<T> {
    try {
      const options = this.transaction ? { transaction: this.transaction } : {};
      return await this.model.create(attributes, options);
    } catch (error) {
      throw new Error(`Factory save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected generateDefaults(): Partial<T> {
    return {};
  }

  async create(overrides: Partial<T> = {}): Promise<T> {
    const defaults = this.generateDefaults();
    const attributes = { ...defaults, ...overrides };
    return await this.save(attributes);
  }

  async createMany(count: number, overrides: Partial<T> = {}): Promise<T[]> {
    const promises = Array.from({ length: count }, () => this.create(overrides));
    return await Promise.all(promises);
  }
}

// User Factory
class UserFactory extends BaseFactory<TestUser> {
  protected generateDefaults(): Partial<TestUser> {
    const password = faker.internet.password();
    return {
      id: faker.string.uuid(),
      email: faker.internet.email().toLowerCase(),
      password: bcrypt.hashSync(password, 10),
      name: faker.person.fullName(),
      role: 'client',
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createCoach(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return await this.create({ ...overrides, role: 'coach' });
  }

  async createAdmin(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return await this.create({ ...overrides, role: 'admin' });
  }

  async createWithPassword(password: string, overrides: Partial<TestUser> = {}): Promise<TestUser & { plainPassword: string }> {
    const user = await this.create({
      ...overrides,
      password: bcrypt.hashSync(password, 10),
    });
    return { ...user, plainPassword: password };
  }
}

// Goal Factory
class GoalFactory extends BaseFactory<TestGoal> {
  protected generateDefaults(): Partial<TestGoal> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      status: 'active',
      deadline: faker.date.future(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<TestGoal> = {}): Promise<TestGoal> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createDraft(overrides: Partial<TestGoal> = {}): Promise<TestGoal> {
    return await this.create({ ...overrides, status: 'draft' });
  }

  async createCompleted(overrides: Partial<TestGoal> = {}): Promise<TestGoal> {
    return await this.create({ ...overrides, status: 'completed' });
  }
}

// Habit Factory
class HabitFactory extends BaseFactory<TestHabit> {
  protected generateDefaults(): Partial<TestHabit> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      frequency: 'daily',
      target_count: faker.number.int({ min: 1, max: 7 }),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<TestHabit> = {}): Promise<TestHabit> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createWeekly(overrides: Partial<TestHabit> = {}): Promise<TestHabit> {
    return await this.create({ ...overrides, frequency: 'weekly' });
  }

  async createMonthly(overrides: Partial<TestHabit> = {}): Promise<TestHabit> {
    return await this.create({ ...overrides, frequency: 'monthly' });
  }
}

// Session Factory
class SessionFactory extends BaseFactory<TestSession> {
  protected generateDefaults(): Partial<TestSession> {
    return {
      id: faker.string.uuid(),
      coach_id: faker.string.uuid(),
      client_id: faker.string.uuid(),
      type: '1-on-1',
      scheduled_at: faker.date.future(),
      duration: 60,
      status: 'scheduled',
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForCoachAndClient(coachId: string, clientId: string, overrides: Partial<TestSession> = {}): Promise<TestSession> {
    return await this.create({ ...overrides, coach_id: coachId, client_id: clientId });
  }

  async createGroupSession(overrides: Partial<TestSession> = {}): Promise<TestSession> {
    return await this.create({ ...overrides, type: 'group' });
  }

  async createAsyncSession(overrides: Partial<TestSession> = {}): Promise<TestSession> {
    return await this.create({ ...overrides, type: 'async' });
  }
}

// Reflection Factory
class ReflectionFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      content: faker.lorem.paragraphs(3),
      mood: faker.helpers.arrayElement(['happy', 'neutral', 'sad', 'anxious', 'excited']),
      tags: faker.helpers.arrayElements(['growth', 'challenge', 'success', 'learning'], 2),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }
}

// Journal Factory
class JournalFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(5),
      is_private: faker.datatype.boolean(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createPrivate(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, is_private: true });
  }

  async createPublic(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, is_private: false });
  }
}

// Milestone Factory
class MilestoneFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      goal_id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      target_date: faker.date.future(),
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForGoal(goalId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, goal_id: goalId });
  }

  async createCompleted(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, is_completed: true });
  }
}

// Task Factory
class TaskFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      status: 'pending',
      due_date: faker.date.future(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createUrgent(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, priority: 'urgent' });
  }

  async createCompleted(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, status: 'completed' });
  }
}

// Note Factory
class NoteFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      tags: faker.helpers.arrayElements(['important', 'idea', 'todo', 'reminder'], 2),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }
}

// Attachment Factory
class AttachmentFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      filename: faker.system.fileName(),
      mime_type: faker.system.mimeType(),
      size: faker.number.int({ min: 1000, max: 1000000 }),
      url: faker.internet.url(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createImage(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({
      ...overrides,
      filename: `${faker.lorem.word()}.jpg`,
      mime_type: 'image/jpeg',
    });
  }

  async createPDF(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({
      ...overrides,
      filename: `${faker.lorem.word()}.pdf`,
      mime_type: 'application/pdf',
    });
  }
}

// Subscription Factory
class SubscriptionFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      plan_id: faker.string.uuid(),
      status: 'active',
      current_period_start: new Date(),
      current_period_end: faker.date.future(),
      cancel_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createCancelled(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({
      ...overrides,
      status: 'cancelled',
      cancel_at: new Date(),
    });
  }

  async createTrialing(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, status: 'trialing' });
  }
}

// Payment Factory
class PaymentFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      amount: faker.number.int({ min: 1000, max: 100000 }),
      currency: 'USD',
      status: 'succeeded',
      payment_method: 'card',
      stripe_payment_id: `pi_${faker.string.alphanumeric(24)}`,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createFailed(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, status: 'failed' });
  }

  async createPending(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, status: 'pending' });
  }
}

// Notification Factory
class NotificationFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      type: faker.helpers.arrayElement(['email', 'sms', 'push', 'in_app']),
      title: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      is_read: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }

  async createRead(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, is_read: true });
  }

  async createEmail(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, type: 'email' });
  }
}

// Webhook Factory
class WebhookFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      url: faker.internet.url(),
      event_type: faker.helpers.arrayElement(['user.created', 'goal.completed', 'payment.succeeded']),
      payload: { data: faker.lorem.words() },
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createDelivered(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, status: 'delivered' });
  }

  async createFailed(overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, status: 'failed' });
  }
}

// Comment Factory
class CommentFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      post_id: faker.string.uuid(),
      content: faker.lorem.paragraph(),
      likes_count: faker.number.int({ min: 0, max: 100 }),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }
}

// Achievement Factory
class AchievementFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      user_id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      icon: faker.image.avatar(),
      earned_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async createForUser(userId: string, overrides: Partial<any> = {}): Promise<any> {
    return await this.create({ ...overrides, user_id: userId });
  }
}

// Badge Factory
class BadgeFactory extends BaseFactory<any> {
  protected generateDefaults(): Partial<any> {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      icon_url: faker.image.avatar(),
      criteria: { type: 'streak', count: faker.number.int({ min: 7, max: 365 }) },
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}

// API Client
class TestAPIClient {
  private app: Express;
  private client: SuperTest<Test>;
  private authToken: string | null = null;

  constructor(app: Express) {
    this.app = app;
    this.client = supertest(app);
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  async get(url: string, options: any = {}): Promise<any> {
    try {
      const request = this.client.get(url);
      if (this.authToken) {
        request.set('Authorization', `Bearer ${this.authToken}`);
      }
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request.set(key, value as string);
        });
      }
      return await request;
    } catch (error) {
      throw new Error(`GET request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async post(url: string, data: any = {}, options: any = {}): Promise<any> {
    try {
      const request = this.client.post(url).send(data);
      if (this.authToken) {
        request.set('Authorization', `Bearer ${this.authToken}`);
      }
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request.set(key, value as string);
        });
      }
      return await request;
    } catch (error) {
      throw new Error(`POST request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async put(url: string, data: any = {}, options: any = {}): Promise<any> {
    try {
      const request = this.client.put(url).send(data);
      if (this.authToken) {
        request.set('Authorization', `Bearer ${this.authToken}`);
      }
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request.set(key, value as string);
        });
      }
      return await request;
    } catch (error) {
      throw new Error(`PUT request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(url: string, options: any = {}): Promise<any> {
    try {
      const request = this.client.delete(url);
      if (this.authToken) {
        request.set('Authorization', `Bearer ${this.authToken}`);
      }
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request.set(key, value as string);
        });
      }
      return await request;
    } catch (error) {
      throw new Error(`DELETE request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async upload(url: string, fieldName: string, filePath: string, options: any = {}): Promise<any> {
    try {
      const request = this.client.post(url).attach(fieldName, filePath);
      if (this.authToken) {
        request.set('Authorization', `Bearer ${this.authToken}`);
      }
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request.set(key, value as string);
        });
      }
      return await request;
    } catch (error) {
      throw new Error(`Upload request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Authentication Helpers
class AuthHelpers {
  private jwtSecret: string;

  constructor(jwtSecret: string = 'test-secret') {
    this.jwtSecret = jwtSecret;
  }

  generateToken(user: Partial<TestUser>): string {
    try {
      return jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      );
    } catch (error) {
      throw new Error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  hashPassword(password: string): string {
    try {
      return bcrypt.hashSync(password, 10);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  comparePassword(password: string, hash: string): boolean {
    try {
      return bcrypt.compareSync(password, hash);
    } catch (error) {
      throw new Error(`Password comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Time Manipulation
class TimeHelpers {
  freeze(date: string | Date): void {
    const freezeDate = typeof date === 'string' ? new Date(date) : date;
    timekeeper.freeze(freezeDate);
  }

  travel(date: string | Date): void {
    const travelDate = typeof date === 'string' ? new Date(date) : date;
    timekeeper.travel(travelDate);
  }

  restore(): void {
    timekeeper.reset();
  }

  addDays(days: number): void {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + days);
    timekeeper.travel(currentDate);
  }

  addHours(hours: number): void {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + hours);
    timekeeper.travel(currentDate);
  }
}

// Email Testing
class EmailTester {
  private sentEmails: any[] = [];
  private transport: any;

  constructor() {
    this.transport = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  }

  async setup(): Promise<void> {
    this.sentEmails = [];
  }

  recordEmail(email: any): void {
    this.sentEmails.push({
      ...email,
      sentAt: new Date(),
    });
  }

  getSentEmails(): any[] {
    return this.sentEmails;
  }

  getLastEmail(): any | null {
    return this.sentEmails.length > 0 ? this.sentEmails[this.sentEmails.length - 1] : null;
  }

  expectEmailSent(assertion: EmailAssertion): boolean {
    const email = this.getLastEmail();
    if (!email) {
      throw new Error('No emails have been sent');
    }

    if (assertion.to) {
      const emailTo = Array.isArray(email.to) ? email.to : [email.to];
      const assertionTo = Array.isArray(assertion.to) ? assertion.to : [assertion.to];
      const matches = assertionTo.every((addr) => emailTo.includes(addr));
      if (!matches) {
        throw new Error(`Email recipient mismatch. Expected: ${assertionTo}, Got: ${emailTo}`);
      }
    }

    if (assertion.from && email.from !== assertion.from) {
      throw new Error(`Email sender mismatch. Expected: ${assertion.from}, Got: ${email.from}`);
    }

    if (assertion.subject) {
      if (assertion.subject instanceof RegExp) {
        if (!assertion.subject.test(email.subject)) {
          throw new Error(`Email subject does not match regex: ${assertion.subject}`);
        }
      } else if (email.subject !== assertion.subject) {
        throw new Error(`Email subject mismatch. Expected: ${assertion.subject}, Got: ${email.subject}`);
      }
    }

    if (assertion.body) {
      if (assertion.body instanceof RegExp) {
        if (!assertion.body.test(email.text)) {
          throw new Error(`Email body does not match regex: ${assertion.body}`);
        }
      } else if (!email.text.includes(assertion.body)) {
        throw new Error(`Email body does not contain expected text: ${assertion.body}`);
      }
    }

    return true;
  }

  expectEmailCount(count: number): boolean {
    if (this.sentEmails.length !== count) {
      throw new Error(`Expected ${count} emails, but ${this.sentEmails.length} were sent`);
    }
    return true;
  }

  clear(): void {
    this.sentEmails = [];
  }
}

// SMS Testing
class SMSTester {
  private sentMessages: any[] = [];

  recordMessage(message: any): void {
    this.sentMessages.push({
      ...message,
      sentAt: new Date(),
    });
  }

  getSentMessages(): any[] {
    return this.sentMessages;
  }

  getLastMessage(): any | null {
    return this.sentMessages.length > 0 ? this.sentMessages[this.sentMessages.length - 1] : null;
  }

  expectSMSSent(assertion: SMSAssertion): boolean {
    const message = this.getLastMessage();
    if (!message) {
      throw new Error('No SMS messages have been sent');
    }

    if (message.to !== assertion.to) {
      throw new Error(`SMS recipient mismatch. Expected: ${assertion.to}, Got: ${message.to}`);
    }

    if (assertion.from && message.from !== assertion.from) {
      throw new Error(`SMS sender mismatch. Expected: ${assertion.from}, Got: ${message.from}`);
    }

    if (assertion.body instanceof RegExp) {
      if (!assertion.body.test(message.body)) {
        throw new Error(`SMS body does not match regex: ${assertion.body}`);
      }
    } else if (message.body !== assertion.body) {
      throw new Error(`SMS body mismatch. Expected: ${assertion.body}, Got: ${message.body}`);
    }

    return true;
  }

  expectSMSCount(count: number): boolean {
    if (this.sentMessages.length !== count) {
      throw new Error(`Expected ${count} SMS messages, but ${this.sentMessages.length} were sent`);
    }
    return true;
  }

  clear(): void {
    this.sentMessages = [];
  }
}

// Webhook Testing
class WebhookTester {
  private webhooks: any[] = [];

  recordWebhook(webhook: any): void {
    this.webhooks.push({
      ...webhook,
      sentAt: new Date(),
    });
  }

  getWebhooks(): any[] {
    return this.webhooks;
  }

  getLastWebhook(): any | null {
    return this.webhooks.length > 0 ? this.webhooks[this.webhooks.length - 1] : null;
  }

  expectWebhookSent(assertion: WebhookAssertion): boolean {
    const webhook = this.getLastWebhook();
    if (!webhook) {
      throw new Error('No webhooks have been sent');
    }

    if (webhook.url !== assertion.url) {
      throw new Error(`Webhook URL mismatch. Expected: ${assertion.url}, Got: ${webhook.url}`);
    }

    if (assertion.method && webhook.method !== assertion.method) {
      throw new Error(`Webhook method mismatch. Expected: ${assertion.method}, Got: ${webhook.method}`);
    }

    if (assertion.payload) {
      const payloadMatch = JSON.stringify(webhook.payload) === JSON.stringify(assertion.payload);
      if (!payloadMatch) {
        throw new Error('Webhook payload mismatch');
      }
    }

    return true;
  }

  expectWebhookCount(count: number): boolean {
    if (this.webhooks.length !== count) {
      throw new Error(`Expected ${count} webhooks, but ${this.webhooks.length} were sent`);
    }
    return true;
  }

  clear(): void {
    this.webhooks = [];
  }
}

// Redis Mock
class RedisMock {
  private data: Map<string, any> = new Map();
  private expirations: Map<string, number> = new Map();

  async get(key: string): Promise<string | null> {
    this.checkExpiration(key);
    return this.data.get(key) || null;
  }

  async set(key: string, value: any, expirationMs?: number): Promise<void> {
    this.data.set(key, value);
    if (expirationMs) {
      this.expirations.set(key, Date.now() + expirationMs);
    }
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
    this.expirations.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    this.checkExpiration(key);
    return this.data.has(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.data.has(key)) {
      this.expirations.set(key, Date.now() + seconds * 1000);
    }
  }

  async ttl(key: string): Promise<number> {
    const expiration = this.expirations.get(key);
    if (!expiration) return -1;
    const remaining = Math.floor((expiration - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flush(): Promise<void> {
    this.data.clear();
    this.expirations.clear();
  }

  private checkExpiration(key: string): void {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.data.delete(key);
      this.expirations.delete(key);
    }
  }
}

// S3 Mock
class S3Mock {
  private buckets: Map<string, Map<string, any>> = new Map();

  async putObject(params: { Bucket: string; Key: string; Body: any }): Promise<void> {
    if (!this.buckets.has(params.Bucket)) {
      this.buckets.set(params.Bucket, new Map());
    }
    const bucket = this.buckets.get(params.Bucket)!;
    bucket.set(params.Key, {
      Body: params.Body,
      uploadedAt: new Date(),
    });
  }

  async getObject(params: { Bucket: string; Key: string }): Promise<any> {
    const bucket = this.buckets.get(params.Bucket);
    if (!bucket) {
      throw new Error(`Bucket ${params.Bucket} does not exist`);
    }
    const object = bucket.get(params.Key);
    if (!object) {
      throw new Error(`Object ${params.Key} does not exist in bucket ${params.Bucket}`);
    }
    return object;
  }

  async deleteObject(params: { Bucket: string; Key: string }): Promise<void> {
    const bucket = this.buckets.get(params.Bucket);
    if (bucket) {
      bucket.delete(params.Key);
    }
  }

  async listObjects(params: { Bucket: string; Prefix?: string }): Promise<any[]> {
    const bucket = this.buckets.get(params.Bucket);
    if (!bucket) {
      return [];
    }
    let objects = Array.from(bucket.entries()).map(([key, value]) => ({
      Key: key,
      ...value,
    }));
    if (params.Prefix) {
      objects = objects.filter((obj) => obj.Key.startsWith(params.Prefix!));
    }
    return objects;
  }

  clear(): void {
    this.buckets.clear();
  }
}

// Stripe Mock
class StripeMock {
  private charges: any[] = [];
  private customers: any[] = [];
  private subscriptions: any[] = [];

  mockCharge(charge: any): void {
    this.charges.push({
      id: `ch_${faker.string.alphanumeric(24)}`,
      ...charge,
      created: Math.floor(Date.now() / 1000),
    });
  }

  mockCustomer(customer: any): void {
    this.customers.push({
      id: `cus_${faker.string.alphanumeric(24)}`,
      ...customer,
      created: Math.floor(Date.now() / 1000),
    });
  }

  mockSubscription(subscription: any): void {
    this.subscriptions.push({
      id: `sub_${faker.string.alphanumeric(24)}`,
      ...subscription,
      created: Math.floor(Date.now() / 1000),
    });
  }

  getCharges(): any[] {
    return this.charges;
  }

  getCustomers(): any[] {
    return this.customers;
  }

  getSubscriptions(): any[] {
    return this.subscriptions;
  }

  getLastCharge(): any | null {
    return this.charges.length > 0 ? this.charges[this.charges.length - 1] : null;
  }

  clear(): void {
    this.charges = [];
    this.customers = [];
    this.subscriptions = [];
  }
}

// WebSocket Testing
class WebSocketTester {
  private server: SocketServer | null = null;
  private clients: Socket[] = [];
  private events: any[] = [];

  async connect(url: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const client = socketClient(url, {
        transports: ['websocket'],
      });

      client.on('connect', () => {
        this.clients.push(client);
        resolve(client);
      });

      client.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });
  }

  recordEvent(event: string, data: any): void {
    this.events.push({
      event,
      data,
      timestamp: new Date(),
    });
  }

  getEvents(): any[] {
    return this.events;
  }

  getLastEvent(): any | null {
    return this.events.length > 0 ? this.events[this.events.length - 1] : null;
  }

  expectEvent(eventName: string, data?: any): boolean {
    const event = this.events.find((e) => e.event === eventName);
    if (!event) {
      throw new Error(`Event ${eventName} was not emitted`);
    }
    if (data) {
      const dataMatch = JSON.stringify(event.data) === JSON.stringify(data);
      if (!dataMatch) {
        throw new Error(`Event ${eventName} data mismatch`);
      }
    }
    return true;
  }

  async disconnect(): Promise<void> {
    for (const client of this.clients) {
      client.disconnect();
    }
    this.clients = [];
  }

  clear(): void {
    this.events = [];
  }
}

// Snapshot Testing
class SnapshotTester {
  private snapshotsDir: string;

  constructor(snapshotsDir: string = '__snapshots__') {
    this.snapshotsDir = snapshotsDir;
    this.ensureSnapshotsDir();
  }

  private ensureSnapshotsDir(): void {
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  toMatchSnapshot(name: string, data: any): boolean {
    const snapshotPath = path.join(this.snapshotsDir, `${name}.json`);
    const serialized = JSON.stringify(data, null, 2);

    if (!fs.existsSync(snapshotPath)) {
      fs.writeFileSync(snapshotPath, serialized, 'utf-8');
      return true;
    }

    const existing = fs.readFileSync(snapshotPath, 'utf-8');
    if (existing !== serialized) {
      throw new Error(`Snapshot mismatch for ${name}`);
    }

    return true;
  }

  updateSnapshot(name: string, data: any): void {
    const snapshotPath = path.join(this.snapshotsDir, `${name}.json`);
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(snapshotPath, serialized, 'utf-8');
  }
}

// Database Transaction Helper
async function withTestDatabase<T>(
  sequelize: Sequelize,
  callback: (db: Sequelize, transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(sequelize, transaction);
    await transaction.rollback();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Exported Testing Framework
export const TestingFramework = {
  // Database
  TestDatabase,
  withTestDatabase,

  // Factories
  UserFactory,
  GoalFactory,
  HabitFactory,
  SessionFactory,
  ReflectionFactory,
  JournalFactory,
  MilestoneFactory,
  TaskFactory,
  NoteFactory,
  AttachmentFactory,
  SubscriptionFactory,
  PaymentFactory,
  NotificationFactory,
  WebhookFactory,
  CommentFactory,
  AchievementFactory,
  BadgeFactory,

  // API Client
  TestAPIClient,

  // Auth
  AuthHelpers,

  // Time
  TimeHelpers,
  freezeTime: (date: string | Date) => new TimeHelpers().freeze(date),
  travelTime: (date: string | Date) => new TimeHelpers().travel(date),
  restoreTime: () => new TimeHelpers().restore(),

  // Email
  EmailTester,

  // SMS
  SMSTester,

  // Webhooks
  WebhookTester,

  // Mocks
  RedisMock,
  S3Mock,
  StripeMock,

  // WebSocket
  WebSocketTester,

  // Snapshots
  SnapshotTester,

  // Utilities
  faker,
};

export default TestingFramework;
