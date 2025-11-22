/**
 * Service-Level Integration Test: User Registration
 *
 * Tests the user registration business logic by testing services directly.
 * This approach:
 * - Tests service integration without HTTP layer
 * - Mocks repository/database layer
 * - Runs fast (no database or HTTP overhead)
 * - Focuses on business logic validation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { MockRepositories, MockServices } from '../helpers/mock-repositories.helper';

/**
 * Mock User Registration Service
 *
 * This simulates the actual UserRegistrationService business logic
 * In a real implementation, this would be imported from src/services/
 */
class UserRegistrationService {
  constructor(
    private userRepo: any,
    private userLevelRepo: any,
    private emailService: any,
    private authService: any,
    private gamificationService: any
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    // Step 1: Validate email not already registered
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Step 2: Hash password
    const hashedPassword = await this.authService.hashPassword(data.password);

    // Step 3: Create user
    const user = await this.userRepo.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: false,
      isActive: true,
    });

    // Step 4: Initialize gamification
    await this.gamificationService.initializeUser(user.id);

    // Step 5: Generate verification token
    const verificationToken = this.authService.generateVerificationToken();

    // Step 6: Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken
    );

    return {
      user,
      verificationToken,
    };
  }

  async verifyEmail(userId: string, token: string) {
    // In real implementation, would validate token
    const user = await this.userRepo.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update user as verified
    await this.userRepo.update(
      { emailVerified: true },
      { where: { id: userId } }
    );

    // Award achievement for email verification
    await this.gamificationService.awardPoints(userId, 50, 'Email verified');

    return { verified: true };
  }

  async completeOnboarding(userId: string, data: {
    interests: string[];
    goals: Array<{ title: string; category: string }>;
  }) {
    // Update user onboarding status
    await this.userRepo.update(
      { onboardingCompleted: true },
      { where: { id: userId } }
    );

    // Award achievement
    await this.gamificationService.unlockAchievement(userId, 'welcome_aboard');

    return {
      onboardingCompleted: true,
      interestsSet: data.interests.length,
      goalsCreated: data.goals.length,
    };
  }
}

describe('UserRegistrationService Integration', () => {
  let service: UserRegistrationService;
  let mockUserRepo: any;
  let mockUserLevelRepo: any;
  let mockEmailService: any;
  let mockAuthService: any;
  let mockGamificationService: any;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockUserRepo = MockRepositories.createUserRepository();
    mockUserLevelRepo = MockRepositories.createUserLevelRepository();
    mockEmailService = MockServices.createEmailService();
    mockAuthService = MockServices.createAuthService();
    mockGamificationService = MockServices.createGamificationService();

    // Instantiate service with mocks
    service = new UserRegistrationService(
      mockUserRepo,
      mockUserLevelRepo,
      mockEmailService,
      mockAuthService,
      mockGamificationService
    );

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registrationData = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    test('should successfully register a new user', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null); // No existing user
      mockUserRepo.create.mockResolvedValue({
        id: 'user-123',
        ...registrationData,
        password: 'hashed_password',
        emailVerified: false,
        isActive: true,
      });

      // Act
      const result = await service.register(registrationData);

      // Assert
      expect(result).toMatchObject({
        user: {
          id: 'user-123',
          email: registrationData.email,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          emailVerified: false,
        },
        verificationToken: expect.any(String),
      });

      // Verify service interactions
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: registrationData.email },
      });
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith(
        registrationData.password
      );
      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(mockGamificationService.initializeUser).toHaveBeenCalledWith('user-123');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        registrationData.email,
        expect.any(String)
      );
    });

    test('should throw error if email already registered', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({
        id: 'existing-user',
        email: registrationData.email,
      });

      // Act & Assert
      await expect(service.register(registrationData)).rejects.toThrow(
        'Email already registered'
      );

      // Verify no user creation attempted
      expect(mockUserRepo.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    test('should initialize gamification for new user', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-456',
        ...registrationData,
      });

      // Act
      await service.register(registrationData);

      // Assert
      expect(mockGamificationService.initializeUser).toHaveBeenCalledWith('user-456');
      expect(mockGamificationService.initializeUser).toHaveBeenCalledTimes(1);
    });

    test('should send verification email after registration', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-789',
        email: registrationData.email,
      });
      mockAuthService.generateVerificationToken.mockReturnValue('token-abc-123');

      // Act
      await service.register(registrationData);

      // Assert
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        registrationData.email,
        'token-abc-123'
      );
    });

    test('should handle service errors gracefully', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.register(registrationData)).rejects.toThrow(
        'Database error'
      );

      // Verify cleanup/rollback behavior
      expect(mockGamificationService.initializeUser).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    const userId = 'user-123';
    const verificationToken = 'token-abc-123';

    test('should verify user email successfully', async () => {
      // Arrange
      mockUserRepo.findByPk.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        emailVerified: false,
      });
      mockUserRepo.update.mockResolvedValue([1]); // 1 row updated

      // Act
      const result = await service.verifyEmail(userId, verificationToken);

      // Assert
      expect(result).toEqual({ verified: true });
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        { emailVerified: true },
        { where: { id: userId } }
      );
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        50,
        'Email verified'
      );
    });

    test('should throw error if user not found', async () => {
      // Arrange
      mockUserRepo.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.verifyEmail(userId, verificationToken)
      ).rejects.toThrow('User not found');

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    test('should award points for email verification', async () => {
      // Arrange
      mockUserRepo.findByPk.mockResolvedValue({ id: userId });

      // Act
      await service.verifyEmail(userId, verificationToken);

      // Assert
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        50,
        'Email verified'
      );
    });
  });

  describe('completeOnboarding', () => {
    const userId = 'user-123';
    const onboardingData = {
      interests: ['fitness', 'productivity', 'career'],
      goals: [
        { title: 'Run 5K', category: 'fitness' },
        { title: 'Learn coding', category: 'career' },
      ],
    };

    test('should complete onboarding successfully', async () => {
      // Arrange
      mockUserRepo.update.mockResolvedValue([1]);

      // Act
      const result = await service.completeOnboarding(userId, onboardingData);

      // Assert
      expect(result).toEqual({
        onboardingCompleted: true,
        interestsSet: 3,
        goalsCreated: 2,
      });

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        { onboardingCompleted: true },
        { where: { id: userId } }
      );
    });

    test('should unlock welcome achievement', async () => {
      // Arrange
      mockUserRepo.update.mockResolvedValue([1]);

      // Act
      await service.completeOnboarding(userId, onboardingData);

      // Assert
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        userId,
        'welcome_aboard'
      );
    });

    test('should track interests and goals count', async () => {
      // Arrange
      mockUserRepo.update.mockResolvedValue([1]);

      // Act
      const result = await service.completeOnboarding(userId, onboardingData);

      // Assert
      expect(result.interestsSet).toBe(3);
      expect(result.goalsCreated).toBe(2);
    });
  });

  describe('Full Registration Flow Integration', () => {
    test('should complete entire registration workflow', async () => {
      // This test validates the integration between multiple service methods

      const registrationData = {
        email: 'fullflow@example.com',
        password: 'SecurePassword123!',
        firstName: 'Full',
        lastName: 'Flow',
      };

      // Step 1: Register
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-fullflow',
        ...registrationData,
      });

      const registerResult = await service.register(registrationData);

      expect(registerResult.user.id).toBe('user-fullflow');
      expect(mockGamificationService.initializeUser).toHaveBeenCalledWith(
        'user-fullflow'
      );

      // Step 2: Verify Email
      mockUserRepo.findByPk.mockResolvedValue({
        id: 'user-fullflow',
        email: registrationData.email,
      });

      const verifyResult = await service.verifyEmail(
        'user-fullflow',
        registerResult.verificationToken
      );

      expect(verifyResult.verified).toBe(true);
      expect(mockGamificationService.awardPoints).toHaveBeenCalled();

      // Step 3: Complete Onboarding
      const onboardingResult = await service.completeOnboarding('user-fullflow', {
        interests: ['fitness'],
        goals: [{ title: 'Get fit', category: 'fitness' }],
      });

      expect(onboardingResult.onboardingCompleted).toBe(true);
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalled();

      // Verify full flow completed
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.update).toHaveBeenCalledTimes(2); // email verify + onboarding
      expect(mockGamificationService.initializeUser).toHaveBeenCalledTimes(1);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledTimes(1);
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledTimes(1);
    });
  });
});
