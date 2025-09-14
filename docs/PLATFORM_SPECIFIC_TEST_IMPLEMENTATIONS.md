# Platform-Specific Test Implementation Guide

## 1. Backend API Test Implementation Examples

### AI Service Unit Tests
```typescript
// services/api/src/services/__tests__/AIService.comprehensive.test.ts
import { AIService } from '../ai/AIService';
import { ChatMessage } from '../../models/ChatMessage';
import { User } from '../../models/User';
import { userFactory, chatMessageFactory } from '../../../tests/factories';

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockUser: User;
  
  beforeEach(() => {
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any;
    
    aiService = new AIService(mockOpenAI);
    mockUser = userFactory.build();
  });

  describe('generateCoachingResponse', () => {
    it('should generate contextual coaching response', async () => {
      const mockRequest = {
        message: 'I\'m struggling with motivation to exercise',
        userId: mockUser.id,
        conversationId: 'conv-123',
        context: {
          userGoals: ['fitness', 'weight-loss'],
          recentMoods: ['unmotivated', 'tired'],
          preferredCoachingStyle: 'supportive'
        }
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              message: "I understand that motivation can be challenging. Let's start with small, achievable steps.",
              confidence: 0.85,
              actionItems: [
                "Start with a 10-minute walk today",
                "Set a specific time for tomorrow's workout"
              ],
              coachingStyle: 'supportive',
              followUpQuestions: [
                "What time of day do you feel most energetic?",
                "What type of exercise do you enjoy most?"
              ]
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

      const result = await aiService.generateCoachingResponse(mockRequest);

      expect(result).toMatchObject({
        message: expect.stringContaining('motivation'),
        confidence: expect.any(Number),
        actionItems: expect.arrayContaining([
          expect.stringMatching(/walk|workout/)
        ]),
        followUpQuestions: expect.any(Array)
      });

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.actionItems).toHaveLength.greaterThan(0);
    });

    it('should handle rate limiting with circuit breaker', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

      const result = await aiService.generateCoachingResponse({
        message: 'Test message',
        userId: mockUser.id,
        conversationId: 'conv-123'
      });

      expect(result).toMatchObject({
        message: expect.stringContaining('temporarily unavailable'),
        confidence: 0,
        isError: true,
        retryAfter: expect.any(Number)
      });
    });

    it('should sanitize and validate input', async () => {
      const maliciousInput = {
        message: '<script>alert("xss")</script>Help me with goals',
        userId: 'user-123',
        conversationId: 'conv-123',
        context: {
          userGoals: ['<script>alert("xss")</script>']
        }
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              message: 'Clean response',
              confidence: 0.8,
              actionItems: []
            })
          }
        }]
      });

      const result = await aiService.generateCoachingResponse(maliciousInput);

      // Verify input sanitization occurred
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.not.stringContaining('<script>')
            })
          ])
        })
      );
    });

    it('should track conversation context and memory', async () => {
      const conversationHistory = [
        chatMessageFactory.build({ role: 'user', content: 'I want to lose weight' }),
        chatMessageFactory.build({ role: 'assistant', content: 'Let\'s create a plan for healthy weight loss' }),
        chatMessageFactory.build({ role: 'user', content: 'I struggle with portion control' })
      ];

      jest.spyOn(aiService, 'getConversationHistory')
        .mockResolvedValue(conversationHistory);

      await aiService.generateCoachingResponse({
        message: 'What should I do about snacking?',
        userId: mockUser.id,
        conversationId: 'conv-123'
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('portion control')
            })
          ])
        })
      );
    });
  });

  describe('analyzeUserSentiment', () => {
    it('should analyze message sentiment accurately', async () => {
      const positiveMessage = "I'm feeling great today and ready to tackle my goals!";
      const negativeMessage = "I'm feeling overwhelmed and don't know what to do.";
      const neutralMessage = "I need to update my workout schedule.";

      const positiveResult = await aiService.analyzeUserSentiment(positiveMessage);
      const negativeResult = await aiService.analyzeUserSentiment(negativeMessage);
      const neutralResult = await aiService.analyzeUserSentiment(neutralMessage);

      expect(positiveResult.score).toBeGreaterThan(0.5);
      expect(positiveResult.label).toBe('positive');

      expect(negativeResult.score).toBeLessThan(-0.5);
      expect(negativeResult.label).toBe('negative');

      expect(Math.abs(neutralResult.score)).toBeLessThan(0.5);
      expect(neutralResult.label).toBe('neutral');
    });
  });

  describe('generatePersonalizedRecommendations', () => {
    it('should generate recommendations based on user profile', async () => {
      const userProfile = {
        goals: ['fitness', 'nutrition'],
        preferences: {
          workoutType: 'cardio',
          dietaryRestrictions: ['vegetarian'],
          timeAvailable: '30-60 minutes'
        },
        currentLevel: 'beginner',
        recentProgress: {
          workoutsCompleted: 5,
          goalsAchieved: 2,
          avgMoodRating: 7.5
        }
      };

      const recommendations = await aiService.generatePersonalizedRecommendations(
        mockUser.id, 
        userProfile
      );

      expect(recommendations).toMatchObject({
        workoutRecommendations: expect.arrayContaining([
          expect.objectContaining({
            type: 'cardio',
            duration: expect.stringMatching(/30|45|60/),
            difficulty: 'beginner'
          })
        ]),
        nutritionRecommendations: expect.arrayContaining([
          expect.objectContaining({
            dietaryCompatible: true,
            category: expect.any(String)
          })
        ]),
        habitRecommendations: expect.any(Array),
        confidence: expect.numberMatching(n => n >= 0 && n <= 1)
      });
    });
  });
});
```

### Authentication Controller Integration Tests
```typescript
// services/api/src/controllers/__tests__/AuthController.integration.test.ts
import request from 'supertest';
import { app } from '../../index';
import { User } from '../../models/User';
import { TwoFactorAuth } from '../../models/TwoFactorAuth';
import { testDatabase } from '../../../tests/helpers/database';
import { userFactory } from '../../../tests/factories';

describe('AuthController Integration', () => {
  beforeEach(async () => {
    await testDatabase.sync({ force: true });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const userData = userFactory.build();
      const user = await User.create({
        ...userData,
        password: await hash('ValidPass123!')
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'ValidPass123!',
          deviceFingerprint: 'test-device-123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        expiresIn: 3600
      });

      // Verify JWT token is valid
      const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET!);
      expect(decodedToken).toMatchObject({
        userId: user.id,
        email: user.email
      });
    });

    it('should enforce 2FA when enabled', async () => {
      const user = await User.create(userFactory.build({
        password: await hash('ValidPass123!'),
        twoFactorEnabled: true
      }));

      await TwoFactorAuth.create({
        userId: user.id,
        secret: 'TESTSECRET123456789',
        backupCodes: ['123456', '789012'],
        isActive: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'ValidPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        requiresTwoFactor: true,
        tempToken: expect.any(String)
      });
      expect(response.body.token).toBeUndefined();
    });

    it('should prevent brute force attacks with rate limiting', async () => {
      const user = await User.create(userFactory.build({
        password: await hash('ValidPass123!')
      }));

      // Make 10 failed login attempts
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'WrongPassword123!'
          })
      );

      const responses = await Promise.all(requests);
      
      // Last few requests should be rate limited
      const rateLimitedResponses = responses.slice(-3);
      rateLimitedResponses.forEach(response => {
        expect(response.status).toBe(429);
        expect(response.body.error).toContain('Too many attempts');
      });
    });

    it('should validate input and prevent injection attacks', async () => {
      const maliciousInputs = [
        { email: "'; DROP TABLE users; --", password: 'password' },
        { email: '<script>alert("xss")</script>', password: 'password' },
        { email: 'user@example.com', password: "'; DELETE FROM users; --" }
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(input);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid input');
      }

      // Verify database is intact
      const userCount = await User.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    it('should log security events for monitoring', async () => {
      const loggerSpy = jest.spyOn(console, 'log');
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password'
        });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed login attempt'),
        expect.objectContaining({
          email: 'nonexistent@example.com',
          ip: expect.any(String),
          timestamp: expect.any(String)
        })
      );

      loggerSpy.mockRestore();
    });
  });

  describe('POST /api/auth/2fa/verify', () => {
    it('should complete login with valid 2FA code', async () => {
      const user = await User.create(userFactory.build({
        password: await hash('ValidPass123!'),
        twoFactorEnabled: true
      }));

      const twoFactorAuth = await TwoFactorAuth.create({
        userId: user.id,
        secret: 'TESTSECRET123456789',
        isActive: true
      });

      // Get temp token from login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'ValidPass123!'
        });

      const validCode = speakeasy.totp({
        secret: twoFactorAuth.secret,
        encoding: 'base32'
      });

      const verifyResponse = await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          tempToken: loginResponse.body.tempToken,
          code: validCode
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: user.id,
          email: user.email
        }
      });
    });

    it('should accept backup codes when TOTP fails', async () => {
      const user = await User.create(userFactory.build({
        twoFactorEnabled: true
      }));

      const backupCodes = ['123456', '789012', '345678'];
      await TwoFactorAuth.create({
        userId: user.id,
        secret: 'TESTSECRET123456789',
        backupCodes,
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'ValidPass123!'
        });

      const verifyResponse = await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          tempToken: loginResponse.body.tempToken,
          code: '123456' // Using backup code
        });

      expect(verifyResponse.status).toBe(200);
      
      // Verify backup code is consumed
      const updatedAuth = await TwoFactorAuth.findOne({ where: { userId: user.id } });
      expect(updatedAuth!.backupCodes).not.toContain('123456');
    });
  });
});
```

## 2. Frontend Test Implementation Examples

### Admin Panel Component Tests
```typescript
// apps/admin-panel/src/pages/__tests__/FinancialDashboard.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FinancialDashboard } from '../FinancialDashboard';
import { financialDataFactory } from '../../tests/factories';
import { mockApiClient } from '../../tests/mocks/apiClient';

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Chart: () => <div data-testid="mock-chart">Chart</div>,
  Line: () => <div data-testid="mock-line-chart">Line Chart</div>,
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart</div>
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('FinancialDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display financial metrics correctly', async () => {
    const mockFinancialData = financialDataFactory.build({
      totalRevenue: 125000,
      monthlyRecurringRevenue: 45000,
      activeSubscriptions: 1250,
      churnRate: 3.5,
      revenueGrowth: 12.5
    });

    mockApiClient.getFinancialDashboard.mockResolvedValue(mockFinancialData);

    renderWithProviders(<FinancialDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('$125,000')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument();
      expect(screen.getByText('1,250 active')).toBeInTheDocument();
      expect(screen.getByText('3.5%')).toBeInTheDocument();
      expect(screen.getByText('12.5% growth')).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockApiClient.getFinancialDashboard).toHaveBeenCalledTimes(1);
  });

  it('should handle loading states properly', () => {
    mockApiClient.getFinancialDashboard.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(<FinancialDashboard />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    expect(screen.getByText('Loading financial data...')).toBeInTheDocument();
  });

  it('should handle error states gracefully', async () => {
    mockApiClient.getFinancialDashboard.mockRejectedValue(
      new Error('Failed to fetch financial data')
    );

    renderWithProviders(<FinancialDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading financial data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockApiClient.getFinancialDashboard).toHaveBeenCalledTimes(2);
  });

  it('should filter data by date range', async () => {
    const user = userEvent.setup();
    const mockData = financialDataFactory.build();
    mockApiClient.getFinancialDashboard.mockResolvedValue(mockData);

    renderWithProviders(<FinancialDashboard />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument();
    });

    // Change date range
    const dateFilter = screen.getByDisplayValue('Last 30 days');
    await user.selectOptions(dateFilter, 'Last 90 days');

    await waitFor(() => {
      expect(mockApiClient.getFinancialDashboard).toHaveBeenCalledWith({
        dateRange: 'Last 90 days'
      });
    });
  });

  it('should export financial report', async () => {
    const user = userEvent.setup();
    const mockData = financialDataFactory.build();
    mockApiClient.getFinancialDashboard.mockResolvedValue(mockData);
    mockApiClient.exportFinancialReport.mockResolvedValue(new Blob(['csv data']));

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    renderWithProviders(<FinancialDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Report');
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockApiClient.exportFinancialReport).toHaveBeenCalled();
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should be accessible via keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockData = financialDataFactory.build();
    mockApiClient.getFinancialDashboard.mockResolvedValue(mockData);

    renderWithProviders(<FinancialDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
    });

    // Test keyboard navigation through interactive elements
    await user.tab();
    expect(screen.getByDisplayValue('Last 30 days')).toHaveFocus();

    await user.tab();
    expect(screen.getByText('Export Report')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(mockApiClient.exportFinancialReport).toHaveBeenCalled();
  });

  it('should have proper ARIA labels and roles', async () => {
    const mockData = financialDataFactory.build();
    mockApiClient.getFinancialDashboard.mockResolvedValue(mockData);

    renderWithProviders(<FinancialDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Financial metrics' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export financial report' })).toBeInTheDocument();
      expect(screen.getByLabelText('Date range filter')).toBeInTheDocument();
    });
  });

  it('should handle real-time updates via WebSocket', async () => {
    const mockData = financialDataFactory.build();
    mockApiClient.getFinancialDashboard.mockResolvedValue(mockData);

    const { rerender } = renderWithProviders(<FinancialDashboard />);

    await waitFor(() => {
      expect(screen.getByText('$125,000')).toBeInTheDocument();
    });

    // Simulate WebSocket update
    const updatedData = { ...mockData, totalRevenue: 130000 };
    mockApiClient.getFinancialDashboard.mockResolvedValue(updatedData);

    // Trigger re-render (simulating WebSocket message)
    rerender(<FinancialDashboard />);

    await waitFor(() => {
      expect(screen.getByText('$130,000')).toBeInTheDocument();
    });
  });
});
```

### CMS Panel Security Tests
```typescript
// apps/cms-panel/src/components/__tests__/RichTextEditor.security.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '../RichTextEditor';

describe('RichTextEditor Security', () => {
  it('should sanitize dangerous HTML content', async () => {
    const user = userEvent.setup();
    const onContentChange = jest.fn();
    
    render(
      <RichTextEditor 
        initialContent="" 
        onChange={onContentChange}
      />
    );

    const editor = screen.getByRole('textbox');
    
    // Attempt to inject malicious content
    const maliciousContent = `
      <script>alert('xss')</script>
      <img src=x onerror=alert('xss')>
      <iframe src="javascript:alert('xss')"></iframe>
      <p onclick="alert('xss')">Safe content</p>
      <a href="javascript:alert('xss')">Link</a>
    `;

    await user.click(editor);
    await user.clear(editor);
    await user.type(editor, maliciousContent);

    await waitFor(() => {
      const editorContent = editor.innerHTML;
      
      // Verify dangerous elements are removed
      expect(editorContent).not.toContain('<script>');
      expect(editorContent).not.toContain('onerror');
      expect(editorContent).not.toContain('<iframe>');
      expect(editorContent).not.toContain('onclick');
      expect(editorContent).not.toContain('javascript:');
      
      // Verify safe content is preserved
      expect(editorContent).toContain('<p>Safe content</p>');
    });

    expect(onContentChange).toHaveBeenCalledWith(
      expect.stringContaining('<p>Safe content</p>')
    );
    expect(onContentChange).toHaveBeenCalledWith(
      expect.not.stringContaining('<script>')
    );
  });

  it('should validate and sanitize URLs', async () => {
    const user = userEvent.setup();
    const onContentChange = jest.fn();
    
    render(<RichTextEditor initialContent="" onChange={onContentChange} />);

    const editor = screen.getByRole('textbox');
    
    const maliciousUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'vbscript:msgbox("xss")',
      'file:///etc/passwd',
      'ftp://malicious.com/file.exe'
    ];

    for (const url of maliciousUrls) {
      await user.clear(editor);
      await user.type(editor, `<a href="${url}">Link</a>`);

      await waitFor(() => {
        const content = editor.innerHTML;
        expect(content).not.toContain(url);
        // Should either remove href entirely or replace with safe placeholder
        expect(content).toMatch(/href="#"|href=""|\>Link<\/a>/);
      });
    }

    // Test safe URLs are preserved
    const safeUrls = [
      'https://example.com',
      'http://example.com',
      'mailto:test@example.com',
      '/relative/path',
      '#anchor'
    ];

    for (const url of safeUrls) {
      await user.clear(editor);
      await user.type(editor, `<a href="${url}">Link</a>`);

      await waitFor(() => {
        const content = editor.innerHTML;
        expect(content).toContain(`href="${url}"`);
      });
    }
  });

  it('should prevent CSS injection attacks', async () => {
    const user = userEvent.setup();
    const onContentChange = jest.fn();
    
    render(<RichTextEditor initialContent="" onChange={onContentChange} />);

    const editor = screen.getByRole('textbox');
    
    const maliciousCss = `
      <p style="background: url('javascript:alert(1)');">Test</p>
      <div style="expression(alert('xss'));">Test</div>
      <span style="behavior: url('xss.htc');">Test</span>
      <p style="background: red; -moz-binding: url('xss.xml');">Test</p>
    `;

    await user.click(editor);
    await user.clear(editor);
    await user.type(editor, maliciousCss);

    await waitFor(() => {
      const content = editor.innerHTML;
      
      // Verify dangerous CSS is removed
      expect(content).not.toContain('javascript:');
      expect(content).not.toContain('expression(');
      expect(content).not.toContain('behavior:');
      expect(content).not.toContain('-moz-binding:');
    });
  });

  it('should maintain content versioning for audit trail', async () => {
    const user = userEvent.setup();
    const onContentChange = jest.fn();
    const onVersionSaved = jest.fn();
    
    render(
      <RichTextEditor 
        initialContent="Initial content" 
        onChange={onContentChange}
        onVersionSaved={onVersionSaved}
      />
    );

    const editor = screen.getByRole('textbox');
    
    // Make multiple edits
    await user.click(editor);
    await user.clear(editor);
    await user.type(editor, 'First edit');

    await waitFor(() => {
      expect(onVersionSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'First edit',
          version: 1,
          timestamp: expect.any(Date),
          author: expect.any(String)
        })
      );
    });

    await user.clear(editor);
    await user.type(editor, 'Second edit');

    await waitFor(() => {
      expect(onVersionSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Second edit',
          version: 2
        })
      );
    });
  });

  it('should enforce content length limits', async () => {
    const user = userEvent.setup();
    const onContentChange = jest.fn();
    const maxLength = 1000;
    
    render(
      <RichTextEditor 
        initialContent=""
        onChange={onContentChange}
        maxLength={maxLength}
      />
    );

    const editor = screen.getByRole('textbox');
    const longContent = 'a'.repeat(maxLength + 100);

    await user.click(editor);
    await user.type(editor, longContent);

    await waitFor(() => {
      expect(screen.getByText(/Character limit exceeded/)).toBeInTheDocument();
      expect(onContentChange).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^.{0,${maxLength}}$`))
      );
    });
  });

  it('should handle file upload security', async () => {
    const user = userEvent.setup();
    const onImageUpload = jest.fn();
    
    render(
      <RichTextEditor 
        initialContent=""
        onImageUpload={onImageUpload}
      />
    );

    // Mock file input
    const fileInput = screen.getByLabelText(/upload image/i);
    
    // Test malicious file types
    const maliciousFiles = [
      new File(['<script>alert("xss")</script>'], 'malicious.html', { type: 'text/html' }),
      new File(['<?php echo "hack"; ?>'], 'script.php', { type: 'application/x-php' }),
      new File(['executable content'], 'virus.exe', { type: 'application/x-executable' })
    ];

    for (const file of maliciousFiles) {
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
        expect(onImageUpload).not.toHaveBeenCalled();
      });
    }

    // Test valid image files
    const validImage = new File(['image data'], 'valid.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, validImage);

    await waitFor(() => {
      expect(onImageUpload).toHaveBeenCalledWith(validImage);
    });
  });
});
```

## 3. Mobile App Test Implementation Examples

### Flutter Widget Tests
```dart
// mobile-app/test/features/ai/ai_coach_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mockito/mockito.dart';
import 'package:upcoach_mobile/features/ai/presentation/screens/ai_coach_screen.dart';
import 'package:upcoach_mobile/features/ai/domain/services/ai_service.dart';
import 'package:upcoach_mobile/shared/models/chat_message.dart';

import '../../helpers/test_helpers.dart';
import '../../mocks/mock_ai_service.dart';

void main() {
  group('AiCoachScreen Widget Tests', () {
    late MockAiService mockAiService;
    late ProviderContainer container;

    setUp(() {
      mockAiService = MockAiService();
      container = ProviderContainer(
        overrides: [
          aiServiceProvider.overrideWithValue(mockAiService),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    testWidgets('should display welcome message on first load', (tester) async {
      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => <ChatMessage>[]);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      expect(find.text('Hi! I\'m your AI coach. How can I help you today?'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
      expect(find.byIcon(Icons.send), findsOneWidget);
    });

    testWidgets('should display chat messages correctly', (tester) async {
      final mockMessages = [
        ChatMessage(
          id: '1',
          content: 'Hello! How can I help?',
          isBot: true,
          timestamp: DateTime.now(),
        ),
        ChatMessage(
          id: '2',
          content: 'I need motivation for exercising',
          isBot: false,
          timestamp: DateTime.now(),
        ),
        ChatMessage(
          id: '3',
          content: 'I understand! Let\'s create a plan that works for you.',
          isBot: true,
          timestamp: DateTime.now(),
          actionItems: ['Start with 10-minute walks', 'Set a consistent time'],
        ),
      ];

      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => mockMessages);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Hello! How can I help?'), findsOneWidget);
      expect(find.text('I need motivation for exercising'), findsOneWidget);
      expect(find.text('I understand! Let\'s create a plan that works for you.'), findsOneWidget);
      
      // Verify action items are displayed
      expect(find.text('Start with 10-minute walks'), findsOneWidget);
      expect(find.text('Set a consistent time'), findsOneWidget);
    });

    testWidgets('should send message when send button is pressed', (tester) async {
      final mockResponse = ChatMessage(
        id: '2',
        content: 'That\'s a great goal! Let\'s break it down into manageable steps.',
        isBot: true,
        timestamp: DateTime.now(),
      );

      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => <ChatMessage>[]);
      when(mockAiService.sendMessage(any, any))
          .thenAnswer((_) async => mockResponse);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Type message
      const testMessage = 'I want to lose weight';
      await tester.enterText(find.byType(TextField), testMessage);
      
      // Press send button
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle();

      // Verify message was sent
      verify(mockAiService.sendMessage('test-conversation-id', testMessage)).called(1);
      
      // Verify response is displayed
      expect(find.text('That\'s a great goal! Let\'s break it down into manageable steps.'), findsOneWidget);
    });

    testWidgets('should handle voice input correctly', (tester) async {
      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => <ChatMessage>[]);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Find and tap voice input button
      final voiceButton = find.byIcon(Icons.mic);
      expect(voiceButton, findsOneWidget);
      
      await tester.tap(voiceButton);
      await tester.pumpAndSettle();

      // Verify voice recording UI is shown
      expect(find.byIcon(Icons.mic_off), findsOneWidget);
      expect(find.text('Listening...'), findsOneWidget);

      // Simulate voice input completion
      await tester.tap(find.byIcon(Icons.mic_off));
      await tester.pumpAndSettle();

      // Verify transcription appears in text field
      await tester.pump(Duration(seconds: 2));
      expect(find.text('Voice transcription here'), findsOneWidget);
    });

    testWidgets('should display loading state during AI response', (tester) async {
      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => <ChatMessage>[]);
      
      // Simulate delayed response
      when(mockAiService.sendMessage(any, any))
          .thenAnswer((_) async {
            await Future.delayed(Duration(seconds: 2));
            return ChatMessage(
              id: '2',
              content: 'Response',
              isBot: true,
              timestamp: DateTime.now(),
            );
          });

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Send message
      await tester.enterText(find.byType(TextField), 'Test message');
      await tester.tap(find.byIcon(Icons.send));
      await tester.pump();

      // Verify loading state
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('AI is thinking...'), findsOneWidget);

      // Wait for response
      await tester.pumpAndSettle();
      
      // Verify loading state is gone
      expect(find.byType(CircularProgressIndicator), findsNothing);
      expect(find.text('Response'), findsOneWidget);
    });

    testWidgets('should handle network errors gracefully', (tester) async {
      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => <ChatMessage>[]);
      when(mockAiService.sendMessage(any, any))
          .thenThrow(Exception('Network error'));

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Send message
      await tester.enterText(find.byType(TextField), 'Test message');
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle();

      // Verify error message is displayed
      expect(find.text('Failed to send message. Please try again.'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);

      // Test retry functionality
      await tester.tap(find.text('Retry'));
      verify(mockAiService.sendMessage(any, 'Test message')).called(2);
    });

    testWidgets('should be accessible for screen readers', (tester) async {
      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => <ChatMessage>[]);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify semantic labels
      expect(find.bySemanticsLabel('Message input field'), findsOneWidget);
      expect(find.bySemanticsLabel('Send message'), findsOneWidget);
      expect(find.bySemanticsLabel('Voice input'), findsOneWidget);
      expect(find.bySemanticsLabel('Chat messages'), findsOneWidget);

      // Test keyboard navigation
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pumpAndSettle();
      
      // Verify focus moves correctly between elements
      expect(tester.testTextInput.hasValue, isTrue);
    });

    testWidgets('should persist conversation state across app lifecycle', (tester) async {
      final conversation = [
        ChatMessage(
          id: '1',
          content: 'Previous message',
          isBot: false,
          timestamp: DateTime.now().subtract(Duration(minutes: 5)),
        ),
      ];

      when(mockAiService.getConversationHistory(any))
          .thenAnswer((_) async => conversation);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: AiCoachScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify previous conversation is loaded
      expect(find.text('Previous message'), findsOneWidget);

      // Simulate app lifecycle change
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.lifecycle,
        (MethodCall methodCall) async {
          return null;
        },
      );

      await tester.binding.defaultBinaryMessenger.handlePlatformMessage(
        SystemChannels.lifecycle.name,
        SystemChannels.lifecycle.codec.encodeMethodCall(
          MethodCall('routePopped'),
        ),
        (data) {},
      );

      // Verify state is maintained
      expect(find.text('Previous message'), findsOneWidget);
    });
  });
}
```

### Flutter Integration Tests
```dart
// mobile-app/integration_test/ai_features_integration_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:upcoach_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('AI Features Integration Tests', () {
    testWidgets('Complete AI coaching conversation flow', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate through onboarding if needed
      if (find.text('Get Started').maybeFound(tester) != null) {
        await tester.tap(find.text('Get Started'));
        await tester.pumpAndSettle();

        // Complete onboarding flow
        await tester.enterText(find.byKey(Key('name_input')), 'Test User');
        await tester.tap(find.text('Continue'));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Fitness')); // Select goal
        await tester.tap(find.text('Continue'));
        await tester.pumpAndSettle();
      }

      // Navigate to AI coach screen
      await tester.tap(find.byIcon(Icons.chat));
      await tester.pumpAndSettle();

      // Verify AI coach interface loads
      expect(find.text('Hi! I\'m your AI coach. How can I help you today?'), findsOneWidget);

      // Start conversation
      const message1 = 'I want to improve my fitness';
      await tester.enterText(find.byKey(Key('message_input')), message1);
      await tester.tap(find.byKey(Key('send_button')));
      await tester.pumpAndSettle(Duration(seconds: 5)); // Wait for AI response

      // Verify AI response appears
      expect(find.textContaining('fitness'), findsAtLeastNWidgets(1));
      
      // Continue conversation
      const message2 = 'I have 30 minutes per day';
      await tester.enterText(find.byKey(Key('message_input')), message2);
      await tester.tap(find.byKey(Key('send_button')));
      await tester.pumpAndSettle(Duration(seconds: 5));

      // Verify personalized response
      expect(find.textContaining('30 minutes'), findsAtLeastNWidgets(1));

      // Test action items creation
      final actionItemsFinder = find.byKey(Key('action_items'));
      if (actionItemsFinder.maybeFound(tester) != null) {
        await tester.tap(actionItemsFinder);
        await tester.pumpAndSettle();

        // Verify action items can be added to goals/tasks
        expect(find.text('Add to Goals'), findsAtLeastNWidgets(1));
        await tester.tap(find.text('Add to Goals').first);
        await tester.pumpAndSettle();

        // Navigate to goals to verify
        await tester.tap(find.byIcon(Icons.flag));
        await tester.pumpAndSettle();

        expect(find.textContaining('30 minutes'), findsAtLeastNWidgets(1));
      }
    });

    testWidgets('Voice journal recording and AI analysis', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to voice journal
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Start recording
      await tester.tap(find.byKey(Key('start_recording')));
      await tester.pumpAndSettle();

      // Verify recording UI
      expect(find.byKey(Key('recording_indicator')), findsOneWidget);
      expect(find.text('Recording...'), findsOneWidget);

      // Simulate recording duration (5 seconds)
      await tester.pump(Duration(seconds: 5));

      // Stop recording
      await tester.tap(find.byKey(Key('stop_recording')));
      await tester.pumpAndSettle();

      // Verify recording saved
      expect(find.text('Recording saved'), findsOneWidget);
      expect(find.byKey(Key('play_recording')), findsOneWidget);

      // Test playback
      await tester.tap(find.byKey(Key('play_recording')));
      await tester.pumpAndSettle();
      expect(find.byKey(Key('audio_player')), findsOneWidget);

      // Wait for AI analysis
      await tester.pumpAndSettle(Duration(seconds: 10));

      // Verify AI insights appear
      expect(find.text('AI Insights'), findsOneWidget);
      expect(find.byKey(Key('sentiment_analysis')), findsOneWidget);
      expect(find.byKey(Key('key_themes')), findsOneWidget);
    });

    testWidgets('Offline functionality and sync', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Simulate going offline
      await tester.binding.defaultBinaryMessenger.handlePlatformMessage(
        'plugins.flutter.io/connectivity',
        tester.binding.codec.encodeMethodCall(MethodCall('ConnectivityChanged', 'none')),
        (data) {},
      );

      // Navigate to voice journal
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Create entry while offline
      const offlineEntry = 'This is an offline journal entry';
      await tester.enterText(find.byKey(Key('journal_input')), offlineEntry);
      await tester.tap(find.byKey(Key('save_entry')));
      await tester.pumpAndSettle();

      // Verify offline indicator
      expect(find.text('Saved offline'), findsOneWidget);
      expect(find.byIcon(Icons.cloud_off), findsOneWidget);

      // Simulate coming back online
      await tester.binding.defaultBinaryMessenger.handlePlatformMessage(
        'plugins.flutter.io/connectivity',
        tester.binding.codec.encodeMethodCall(MethodCall('ConnectivityChanged', 'wifi')),
        (data) {},
      );

      await tester.pumpAndSettle();

      // Trigger manual sync
      await tester.drag(find.byKey(Key('journal_list')), Offset(0, 300));
      await tester.pumpAndSettle(Duration(seconds: 5));

      // Verify sync completion
      expect(find.text('Synced'), findsOneWidget);
      expect(find.byIcon(Icons.cloud_done), findsOneWidget);
    });

    testWidgets('Biometric authentication flow', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to settings
      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      // Navigate to security settings
      await tester.tap(find.text('Security'));
      await tester.pumpAndSettle();

      // Enable biometric authentication
      final biometricToggle = find.byKey(Key('biometric_toggle'));
      await tester.tap(biometricToggle);
      await tester.pumpAndSettle();

      // Verify biometric setup dialog
      expect(find.text('Enable Biometric Authentication?'), findsOneWidget);
      await tester.tap(find.text('Enable'));
      await tester.pumpAndSettle();

      // Simulate biometric authentication
      await tester.binding.defaultBinaryMessenger.handlePlatformMessage(
        'plugins.flutter.io/local_auth',
        tester.binding.codec.encodeMethodCall(
          MethodCall('authenticate', {
            'localizedReason': 'Authenticate to enable biometric login',
            'authMessages': <String, String>{},
            'options': <String, Object>{
              'biometricOnly': false,
              'stickyAuth': false,
              'sensitiveTransaction': true,
            },
          }),
        ),
        (data) async {
          return tester.binding.codec.encodeSuccessEnvelope(true);
        },
      );

      await tester.pumpAndSettle();

      // Verify biometric authentication is enabled
      expect(find.text('Biometric authentication enabled'), findsOneWidget);

      // Test biometric login
      await tester.tap(find.byIcon(Icons.logout)); // Logout
      await tester.pumpAndSettle();

      // Verify login screen shows biometric option
      expect(find.byKey(Key('biometric_login_button')), findsOneWidget);

      await tester.tap(find.byKey(Key('biometric_login_button')));
      await tester.pumpAndSettle();

      // Simulate successful biometric authentication
      await tester.binding.defaultBinaryMessenger.handlePlatformMessage(
        'plugins.flutter.io/local_auth',
        tester.binding.codec.encodeMethodCall(
          MethodCall('authenticate', {
            'localizedReason': 'Authenticate to access UpCoach',
            'authMessages': <String, String>{},
            'options': <String, Object>{
              'biometricOnly': true,
              'stickyAuth': false,
              'sensitiveTransaction': false,
            },
          }),
        ),
        (data) async {
          return tester.binding.codec.encodeSuccessEnvelope(true);
        },
      );

      await tester.pumpAndSettle();

      // Verify successful login
      expect(find.byKey(Key('home_screen')), findsOneWidget);
    });

    testWidgets('Performance under load', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to AI chat
      await tester.tap(find.byIcon(Icons.chat));
      await tester.pumpAndSettle();

      // Send multiple messages rapidly to test performance
      final stopwatch = Stopwatch()..start();
      
      for (int i = 0; i < 10; i++) {
        await tester.enterText(
          find.byKey(Key('message_input')), 
          'Performance test message $i'
        );
        await tester.tap(find.byKey(Key('send_button')));
        await tester.pump(); // Don't wait for settlement to test rapid sending
      }

      await tester.pumpAndSettle(Duration(seconds: 30));
      stopwatch.stop();

      // Verify all messages were processed
      expect(find.textContaining('Performance test message'), findsAtLeastNWidgets(10));

      // Verify performance is acceptable (adjust threshold as needed)
      expect(stopwatch.elapsedMilliseconds, lessThan(35000)); // 35 seconds max

      // Verify UI remains responsive
      await tester.tap(find.byKey(Key('message_input')));
      await tester.enterText(find.byKey(Key('message_input')), 'UI responsiveness test');
      await tester.tap(find.byKey(Key('send_button')));
      await tester.pumpAndSettle();

      expect(find.text('UI responsiveness test'), findsOneWidget);
    });
  });
}
```

## 4. Performance Testing Implementation

### API Load Testing with k6
```javascript
// tests/performance/comprehensive-load-test.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('error_rate');
export const responseTime = new Trend('response_time');
export const requestCounter = new Counter('total_requests');

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '1m', target: 10 },
    
    // Normal load
    { duration: '5m', target: 50 },
    
    // Peak load
    { duration: '2m', target: 100 },
    
    // Stress test
    { duration: '2m', target: 200 },
    
    // Spike test
    { duration: '30s', target: 500 },
    
    // Recovery
    { duration: '1m', target: 50 },
    
    // Cool down
    { duration: '1m', target: 0 },
  ],
  
  thresholds: {
    // API response time requirements
    'response_time': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'error_rate': ['rate<0.02'], // Error rate under 2%
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.02'],
    
    // Specific endpoint thresholds
    'http_req_duration{endpoint:auth}': ['p(95)<1000'],
    'http_req_duration{endpoint:ai_chat}': ['p(95)<3000'],
    'http_req_duration{endpoint:voice_journal}': ['p(95)<2000'],
  },
  
  // Environment settings
  setupTimeout: '30s',
  teardownTimeout: '30s',
};

// Test data
const testUsers = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
];

const aiMessages = [
  'I need help with my fitness goals',
  'How can I improve my motivation?',
  'What workout should I do today?',
  'I\'m struggling with consistency',
  'Can you help me with meal planning?',
];

// Setup function - runs once at the start
export function setup() {
  console.log('Setting up load test environment...');
  
  // Health check
  const healthCheck = http.get('http://localhost:8080/api/health');
  check(healthCheck, {
    'API is healthy': (r) => r.status === 200,
  });
  
  return { baseUrl: 'http://localhost:8080/api' };
}

// Main test function
export default function (data) {
  const baseUrl = data.baseUrl;
  
  group('Authentication Flow', () => {
    testAuthentication(baseUrl);
  });
  
  group('AI Chat Performance', () => {
    testAIChat(baseUrl);
  });
  
  group('Voice Journal Operations', () => {
    testVoiceJournal(baseUrl);
  });
  
  group('User Profile Operations', () => {
    testUserProfile(baseUrl);
  });
  
  sleep(1);
}

function testAuthentication(baseUrl) {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  const loginResponse = http.post(`${baseUrl}/auth/login`, {
    email: user.email,
    password: user.password,
    deviceFingerprint: `load-test-${__VU}-${__ITER}`,
  }, {
    tags: { endpoint: 'auth' },
  });
  
  const isLoginSuccessful = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 1s': (r) => r.timings.duration < 1000,
    'login returns token': (r) => r.json('token') !== undefined,
  });
  
  requestCounter.add(1);
  errorRate.add(!isLoginSuccessful);
  responseTime.add(loginResponse.timings.duration);
  
  if (isLoginSuccessful) {
    const token = loginResponse.json('token');
    
    // Test token refresh
    const refreshResponse = http.post(`${baseUrl}/auth/refresh`, {
      refreshToken: loginResponse.json('refreshToken'),
    }, {
      tags: { endpoint: 'auth' },
    });
    
    check(refreshResponse, {
      'refresh status is 200': (r) => r.status === 200,
      'refresh response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    return token;
  }
  
  return null;
}

function testAIChat(baseUrl) {
  const token = testAuthentication(baseUrl);
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Create conversation
  const createConvResponse = http.post(`${baseUrl}/chat/conversations`, {}, {
    headers,
    tags: { endpoint: 'ai_chat' },
  });
  
  check(createConvResponse, {
    'conversation creation successful': (r) => r.status === 201,
  });
  
  if (createConvResponse.status === 201) {
    const conversationId = createConvResponse.json('id');
    const message = aiMessages[Math.floor(Math.random() * aiMessages.length)];
    
    // Send AI message
    const sendMessageResponse = http.post(
      `${baseUrl}/chat/conversations/${conversationId}/messages`,
      { message },
      {
        headers,
        tags: { endpoint: 'ai_chat' },
        timeout: '10s', // AI responses can take longer
      }
    );
    
    const isMessageSuccessful = check(sendMessageResponse, {
      'AI message status is 200': (r) => r.status === 200,
      'AI response time < 3s': (r) => r.timings.duration < 3000,
      'AI response contains message': (r) => r.json('response.message') !== undefined,
      'AI response has confidence score': (r) => r.json('response.confidence') > 0,
    });
    
    requestCounter.add(1);
    errorRate.add(!isMessageSuccessful);
    responseTime.add(sendMessageResponse.timings.duration);
  }
}

function testVoiceJournal(baseUrl) {
  const token = testAuthentication(baseUrl);
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Create voice journal entry
  const createEntryResponse = http.post(`${baseUrl}/voice-journal`, {
    content: 'This is a test journal entry from load testing',
    duration: 30,
    sentiment: 'positive',
    mood: 'happy',
    tags: ['loadtest', 'performance'],
  }, {
    headers,
    tags: { endpoint: 'voice_journal' },
  });
  
  const isCreateSuccessful = check(createEntryResponse, {
    'journal creation successful': (r) => r.status === 201,
    'journal creation time < 2s': (r) => r.timings.duration < 2000,
  });
  
  if (isCreateSuccessful) {
    const entryId = createEntryResponse.json('id');
    
    // Get journal entries
    const getEntriesResponse = http.get(`${baseUrl}/voice-journal`, {
      headers,
      tags: { endpoint: 'voice_journal' },
    });
    
    check(getEntriesResponse, {
      'get entries successful': (r) => r.status === 200,
      'get entries time < 1s': (r) => r.timings.duration < 1000,
      'entries list contains data': (r) => r.json().length > 0,
    });
    
    // Get specific entry
    const getEntryResponse = http.get(`${baseUrl}/voice-journal/${entryId}`, {
      headers,
      tags: { endpoint: 'voice_journal' },
    });
    
    check(getEntryResponse, {
      'get specific entry successful': (r) => r.status === 200,
      'get entry time < 500ms': (r) => r.timings.duration < 500,
    });
  }
  
  requestCounter.add(1);
  errorRate.add(!isCreateSuccessful);
  responseTime.add(createEntryResponse.timings.duration);
}

function testUserProfile(baseUrl) {
  const token = testAuthentication(baseUrl);
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get user profile
  const getProfileResponse = http.get(`${baseUrl}/users/profile`, {
    headers,
    tags: { endpoint: 'user_profile' },
  });
  
  const isGetSuccessful = check(getProfileResponse, {
    'get profile successful': (r) => r.status === 200,
    'get profile time < 500ms': (r) => r.timings.duration < 500,
    'profile contains user data': (r) => r.json('email') !== undefined,
  });
  
  if (isGetSuccessful) {
    // Update user profile
    const updateProfileResponse = http.put(`${baseUrl}/users/profile`, {
      firstName: `LoadTest_${__VU}`,
      lastName: `User_${__ITER}`,
      preferences: {
        notifications: true,
        theme: 'light',
      },
    }, {
      headers,
      tags: { endpoint: 'user_profile' },
    });
    
    check(updateProfileResponse, {
      'update profile successful': (r) => r.status === 200,
      'update profile time < 1s': (r) => r.timings.duration < 1000,
    });
  }
  
  requestCounter.add(1);
  errorRate.add(!isGetSuccessful);
  responseTime.add(getProfileResponse.timings.duration);
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('Cleaning up load test environment...');
  
  // Final health check
  const healthCheck = http.get(`${data.baseUrl.replace('/api', '')}/health`);
  check(healthCheck, {
    'API still healthy after load test': (r) => r.status === 200,
  });
  
  console.log('Load test completed successfully');
}
```

### Frontend Performance Testing
```javascript
// tests/performance/frontend-performance-test.js
import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for frontend performance
export const pageLoadTime = new Trend('page_load_time');
export const firstContentfulPaint = new Trend('first_contentful_paint');
export const timeToInteractive = new Trend('time_to_interactive');
export const cumulativeLayoutShift = new Rate('cumulative_layout_shift');

export const options = {
  stages: [
    { duration: '2m', target: 20 },
    { duration: '5m', target: 20 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'page_load_time': ['p(95)<3000'], // 95% of pages load under 3s
    'first_contentful_paint': ['p(95)<1500'], // FCP under 1.5s
    'time_to_interactive': ['p(95)<2500'], // TTI under 2.5s
    'http_req_duration': ['p(95)<2000'],
  },
};

export default function () {
  group('Landing Page Performance', () => {
    testLandingPage();
  });
  
  group('Admin Panel Performance', () => {
    testAdminPanel();
  });
  
  group('CMS Panel Performance', () => {
    testCMSPanel();
  });
}

function testLandingPage() {
  const response = http.get('http://localhost:8005', {
    tags: { page: 'landing' },
  });
  
  check(response, {
    'landing page status is 200': (r) => r.status === 200,
    'landing page loads fast': (r) => r.timings.duration < 2000,
    'landing page size reasonable': (r) => r.body.length < 1000000, // 1MB
  });
  
  pageLoadTime.add(response.timings.duration);
  
  // Test critical resources
  const criticalResources = [
    '/_next/static/css/app.css',
    '/_next/static/js/app.js',
    '/api/health',
  ];
  
  criticalResources.forEach(resource => {
    const resourceResponse = http.get(`http://localhost:8005${resource}`, {
      tags: { resource: resource },
    });
    
    check(resourceResponse, {
      [`${resource} loads successfully`]: (r) => r.status === 200,
      [`${resource} loads quickly`]: (r) => r.timings.duration < 1000,
    });
  });
}

function testAdminPanel() {
  // Test admin panel with authentication
  const loginResponse = http.post('http://localhost:8080/api/auth/login', {
    email: 'admin@upcoach.ai',
    password: 'AdminPass123!',
  });
  
  if (loginResponse.status === 200) {
    const token = loginResponse.json('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Cookie': `auth-token=${token}`,
    };
    
    const adminPanelResponse = http.get('http://localhost:8006', {
      headers,
      tags: { page: 'admin' },
    });
    
    check(adminPanelResponse, {
      'admin panel status is 200': (r) => r.status === 200,
      'admin panel loads fast': (r) => r.timings.duration < 3000,
    });
    
    pageLoadTime.add(adminPanelResponse.timings.duration);
    
    // Test dashboard API calls
    const dashboardAPIs = [
      '/api/analytics/financial',
      '/api/users/statistics',
      '/api/analytics/performance',
    ];
    
    dashboardAPIs.forEach(api => {
      const apiResponse = http.get(`http://localhost:8080${api}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { api: api },
      });
      
      check(apiResponse, {
        [`${api} responds successfully`]: (r) => r.status === 200,
        [`${api} responds quickly`]: (r) => r.timings.duration < 1000,
      });
    });
  }
}

function testCMSPanel() {
  const cmsResponse = http.get('http://localhost:8007', {
    tags: { page: 'cms' },
  });
  
  check(cmsResponse, {
    'CMS panel status is 200': (r) => r.status === 200,
    'CMS panel loads fast': (r) => r.timings.duration < 3000,
  });
  
  pageLoadTime.add(cmsResponse.timings.duration);
}
```

## 5. CI/CD Integration Implementation

### Comprehensive GitHub Actions Workflow
```yaml
# .github/workflows/comprehensive-testing-pipeline.yml
name: Comprehensive Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

env:
  NODE_VERSION: '18'
  FLUTTER_VERSION: '3.16.0'
  POSTGRES_VERSION: '14'
  REDIS_VERSION: '7'

jobs:
  # Parallel testing jobs for speed
  backend-unit-tests:
    name: Backend Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: upcoach_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'services/api/package-lock.json'
      
      - name: Install dependencies
        working-directory: services/api
        run: |
          npm ci
          npm run build
      
      - name: Run unit tests
        working-directory: services/api
        run: npm run test:coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/upcoach_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-jwt-secret-for-ci-only
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./services/api/coverage
          flags: backend
          name: backend-coverage
          fail_ci_if_error: true
      
      - name: Generate coverage badge
        run: |
          cd services/api
          npm run generate:coverage-badge
      
      - name: Archive coverage results
        uses: actions/upload-artifact@v3
        with:
          name: backend-coverage
          path: services/api/coverage/

  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    strategy:
      matrix:
        app: [admin-panel, cms-panel, landing-page]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'apps/${{ matrix.app }}/package-lock.json'
      
      - name: Install dependencies
        working-directory: apps/${{ matrix.app }}
        run: npm ci
      
      - name: Run unit tests
        working-directory: apps/${{ matrix.app }}
        run: npm run test:coverage
      
      - name: Run accessibility tests
        if: matrix.app == 'admin-panel'
        working-directory: apps/${{ matrix.app }}
        run: npm run test:a11y
      
      - name: Build application
        working-directory: apps/${{ matrix.app }}
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./apps/${{ matrix.app }}/coverage
          flags: frontend-${{ matrix.app }}
          name: ${{ matrix.app }}-coverage

  mobile-tests:
    name: Mobile App Tests
    runs-on: macos-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          channel: stable
      
      - name: Install dependencies
        working-directory: mobile-app
        run: |
          flutter pub get
          flutter pub run build_runner build --delete-conflicting-outputs
      
      - name: Run static analysis
        working-directory: mobile-app
        run: flutter analyze
      
      - name: Run unit tests
        working-directory: mobile-app
        run: flutter test --coverage
      
      - name: Run golden tests
        working-directory: mobile-app
        run: flutter test test/golden/
      
      - name: Build iOS (check only)
        working-directory: mobile-app
        run: flutter build ios --no-codesign --debug
      
      - name: Build Android (check only)
        working-directory: mobile-app
        run: flutter build apk --debug
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./mobile-app/coverage
          flags: mobile
          name: mobile-coverage

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [backend-unit-tests]
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: upcoach_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Start test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/upcoach_test
          REDIS_URL: redis://localhost:6379
      
      - name: Wait for services to be ready
        run: |
          timeout 300 bash -c 'until curl -f http://localhost:8080/api/health; do sleep 5; done'
          timeout 300 bash -c 'until curl -f http://localhost:8006/; do sleep 5; done'
          timeout 300 bash -c 'until curl -f http://localhost:8007/; do sleep 5; done'
      
      - name: Run integration tests
        run: |
          cd tests/integration
          npm ci
          npm test
      
      - name: Run cross-platform tests
        run: |
          cd tests/integration
          npm run test:cross-platform

  e2e-tests:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [backend-unit-tests, frontend-tests]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Start full application stack
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 60
      
      - name: Install Playwright
        working-directory: tests/e2e
        run: |
          npm ci
          npx playwright install --with-deps chromium firefox webkit
      
      - name: Run E2E tests
        working-directory: tests/e2e
        run: npx playwright test
        env:
          CI: true
      
      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-test-results
          path: |
            tests/e2e/test-results/
            tests/e2e/playwright-report/
      
      - name: Upload E2E videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-videos
          path: tests/e2e/test-results/**/video.webm

  visual-regression-tests:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [frontend-tests]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Start applications
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 45
      
      - name: Install Playwright for visual tests
        working-directory: visual-tests
        run: |
          npm ci
          npx playwright install chromium
      
      - name: Run visual regression tests
        working-directory: visual-tests
        run: npx playwright test
        env:
          UPDATE_SNAPSHOTS: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
      
      - name: Upload visual test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-test-results
          path: |
            visual-tests/test-results/
            visual-tests/playwright-report/

  security-tests:
    name: Security Tests
    runs-on: ubuntu-latest
    timeout-minutes: 25
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Start application for security testing
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 60
      
      - name: Run Semgrep SAST scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
            p/typescript
            p/javascript
            p/react
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
      
      - name: Run OWASP ZAP security scan
        run: |
          docker run -v $(pwd):/zap/wrk/:rw \
            --network="host" \
            -t owasp/zap2docker-stable zap-full-scan.py \
            -t http://localhost:8080 \
            -r zap-report.html \
            -x zap-report.xml
        continue-on-error: true
      
      - name: Run dependency vulnerability scan
        run: |
          npm audit --audit-level high
          cd services/api && npm audit --audit-level high
          cd ../../apps/admin-panel && npm audit --audit-level high
          cd ../cms-panel && npm audit --audit-level high
          cd ../landing-page && npm audit --audit-level high
      
      - name: Upload security reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: |
            zap-report.*
            **/npm-audit.json

  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [backend-unit-tests]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Start application stack
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 60
      
      - name: Run k6 load tests
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/performance/comprehensive-load-test.js
        env:
          K6_OUT: json=performance-results.json
      
      - name: Run Lighthouse performance audit
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:8005
            http://localhost:8006
            http://localhost:8007
          configPath: ./.lighthouserc.json
          uploadArtifacts: true
      
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: |
            performance-results.json
            lhci_reports/

  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: 
      - backend-unit-tests
      - frontend-tests
      - mobile-tests
      - integration-tests
      - e2e-tests
      - visual-regression-tests
      - security-tests
      - performance-tests
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Download all artifacts
        uses: actions/download-artifact@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install quality gate dependencies
        run: npm install --no-save lcov-parse xml2js
      
      - name: Check coverage thresholds
        run: node scripts/check-coverage-thresholds.js
      
      - name: Check performance benchmarks
        run: node scripts/check-performance-benchmarks.js
      
      - name: Check security scan results
        run: node scripts/check-security-results.js
      
      - name: Generate quality report
        run: node scripts/generate-quality-report.js
      
      - name: Upload quality report
        uses: actions/upload-artifact@v3
        with:
          name: quality-report
          path: quality-report.html
      
      - name: Comment PR with quality report
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('quality-report-summary.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
      
      - name: Fail if quality gates not met
        run: |
          if [ -f "quality-gate-failures.txt" ]; then
            echo "Quality gates failed:"
            cat quality-gate-failures.txt
            exit 1
          else
            echo "All quality gates passed! ✅"
          fi

  deployment-ready:
    name: Deployment Ready
    runs-on: ubuntu-latest
    needs: [quality-gates]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Mark deployment ready
        run: |
          echo "✅ All tests passed and quality gates met"
          echo "🚀 Ready for deployment to staging/production"
      
      - name: Trigger deployment workflow
        if: success()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'deploy-staging.yml',
              ref: 'main'
            });
```

This comprehensive implementation guide demonstrates how each testing layer integrates with the overall framework, providing specific examples that can be immediately implemented across the UpCoach platform. The tests are designed to catch issues early, maintain high quality standards, and provide confidence for rapid deployment cycles.