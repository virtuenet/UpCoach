"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.clearTestDatabase = clearTestDatabase;
exports.closeTestDatabase = closeTestDatabase;
exports.seedTestData = seedTestData;
exports.createTestUser = createTestUser;
exports.createTestAdmin = createTestAdmin;
const sequelize_1 = require("sequelize");
const userService_1 = require("../../services/userService");
let testDb;
async function initializeDatabase() {
    if (!testDb) {
        testDb = new sequelize_1.Sequelize('sqlite::memory:', {
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false,
            define: {
                timestamps: true,
                underscored: false,
            },
        });
        await initializeModels();
        await testDb.sync({ force: true });
    }
}
async function clearTestDatabase() {
    if (testDb) {
        await testDb.sync({ force: true });
    }
}
async function closeTestDatabase() {
    if (testDb) {
        await testDb.close();
    }
}
async function seedTestData() {
    const testUser = await userService_1.UserService.create({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
        role: 'user'
    });
    const testAdmin = await userService_1.UserService.create({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        name: 'Test Admin',
        role: 'admin'
    });
    const testCoach = await userService_1.UserService.create({
        email: 'coach@example.com',
        password: 'CoachPass123!',
        name: 'Test Coach',
        role: 'coach'
    });
    return {
        user: testUser,
        admin: testAdmin,
        coach: testCoach
    };
}
async function initializeModels() {
    const { User } = require('../../models/User');
    const { UserProfile } = require('../../models/UserProfile');
    const { Goal } = require('../../models/Goal');
    const { Task } = require('../../models/Task');
    const { Mood } = require('../../models/Mood');
    const { Chat } = require('../../models/Chat');
    if (User.associate)
        User.associate({ User, UserProfile, Goal, Task, Mood, Chat });
    if (UserProfile.associate)
        UserProfile.associate({ User, UserProfile, Goal, Task, Mood, Chat });
    if (Goal.associate)
        Goal.associate({ User, UserProfile, Goal, Task, Mood, Chat });
    if (Task.associate)
        Task.associate({ User, UserProfile, Goal, Task, Mood, Chat });
    if (Mood.associate)
        Mood.associate({ User, UserProfile, Goal, Task, Mood, Chat });
    if (Chat.associate)
        Chat.associate({ User, UserProfile, Goal, Task, Mood, Chat });
}
function createTestUser(overrides = {}) {
    return {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}
function createTestAdmin(overrides = {}) {
    return {
        id: 'test-admin-id',
        email: 'admin@example.com',
        name: 'Test Admin',
        role: 'admin',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}
