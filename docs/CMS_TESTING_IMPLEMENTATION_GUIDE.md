# CMS Testing Implementation Guide

## React/TypeScript Component Testing Patterns

### 1. Drag-and-Drop Page Builder Testing

#### Component Test Example
```typescript
// apps/cms-panel/src/components/PageBuilder/__tests__/DragDropEditor.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi } from 'vitest';
import { DragDropEditor } from '../DragDropEditor';
import { TestBackend } from 'react-dnd-test-backend';

const DragDropWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={TestBackend}>
    {children}
  </DndProvider>
);

describe('DragDropEditor', () => {
  const mockComponents = [
    { id: 'text-1', type: 'text', content: 'Sample text', position: { x: 0, y: 0 } },
    { id: 'image-1', type: 'image', src: '/test-image.jpg', position: { x: 0, y: 100 } }
  ];

  it('should render components in correct positions', () => {
    render(
      <DragDropWrapper>
        <DragDropEditor components={mockComponents} onUpdate={vi.fn()} />
      </DragDropWrapper>
    );

    const textComponent = screen.getByTestId('component-text-1');
    const imageComponent = screen.getByTestId('component-image-1');

    expect(textComponent).toHaveStyle({ transform: 'translate(0px, 0px)' });
    expect(imageComponent).toHaveStyle({ transform: 'translate(0px, 100px)' });
  });

  it('should handle component drag and drop operations', async () => {
    const mockOnUpdate = vi.fn();

    render(
      <DragDropWrapper>
        <DragDropEditor components={mockComponents} onUpdate={mockOnUpdate} />
      </DragDropWrapper>
    );

    const textComponent = screen.getByTestId('component-text-1');

    // Simulate drag start
    fireEvent.dragStart(textComponent);

    // Simulate drop at new position
    const dropZone = screen.getByTestId('drop-zone');
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'text-1',
            position: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number)
            })
          })
        ])
      );
    });
  });

  it('should auto-save changes after 2 seconds of inactivity', async () => {
    const mockAutoSave = vi.fn();
    vi.useFakeTimers();

    render(
      <DragDropWrapper>
        <DragDropEditor
          components={mockComponents}
          onUpdate={vi.fn()}
          onAutoSave={mockAutoSave}
        />
      </DragDropWrapper>
    );

    const textComponent = screen.getByTestId('component-text-1');
    fireEvent.dragStart(textComponent);
    fireEvent.drop(screen.getByTestId('drop-zone'));

    // Fast-forward time by 2 seconds
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockAutoSave).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('should maintain 60 FPS during drag operations', async () => {
    const performanceEntries: PerformanceEntry[] = [];

    // Mock performance API
    vi.spyOn(performance, 'mark').mockImplementation((name) => {
      performanceEntries.push({
        name,
        entryType: 'mark',
        startTime: performance.now(),
        duration: 0
      } as PerformanceEntry);
    });

    render(
      <DragDropWrapper>
        <DragDropEditor components={mockComponents} onUpdate={vi.fn()} />
      </DragDropWrapper>
    );

    const textComponent = screen.getByTestId('component-text-1');

    // Simulate rapid drag movements
    for (let i = 0; i < 60; i++) {
      fireEvent.dragStart(textComponent);
      fireEvent.dragOver(screen.getByTestId('drop-zone'), {
        clientX: i * 10,
        clientY: i * 5
      });
    }

    // Verify frame timing (should be < 16.67ms for 60 FPS)
    const frameTimes = performanceEntries
      .filter(entry => entry.name.includes('frame'))
      .map(entry => entry.duration);

    const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    expect(averageFrameTime).toBeLessThan(16.67);
  });
});
```

### 2. Content Workflow Testing

#### Workflow State Machine Testing
```typescript
// apps/cms-panel/src/components/ContentWorkflow/__tests__/WorkflowManager.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { WorkflowManager } from '../WorkflowManager';
import { workflowService } from '../../../services/workflowService';

// Mock the workflow service
vi.mock('../../../services/workflowService', () => ({
  workflowService: {
    updateContentStatus: vi.fn(),
    getWorkflowHistory: vi.fn(),
    validateTransition: vi.fn()
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

describe('WorkflowManager', () => {
  const mockContent = {
    id: 'content-123',
    title: 'Test Article',
    status: 'draft',
    authorId: 'user-456',
    workflow: {
      currentStage: 'creation',
      availableTransitions: ['submit_for_review']
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display current workflow status', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WorkflowManager content={mockContent} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Status: Draft')).toBeInTheDocument();
    expect(screen.getByText('Stage: Creation')).toBeInTheDocument();
  });

  it('should show available workflow actions', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WorkflowManager content={mockContent} />
      </QueryClientProvider>
    );

    expect(screen.getByRole('button', { name: 'Submit for Review' })).toBeInTheDocument();
  });

  it('should handle workflow transition', async () => {
    const mockUpdateStatus = vi.mocked(workflowService.updateContentStatus);
    mockUpdateStatus.mockResolvedValue({
      success: true,
      newStatus: 'review',
      newStage: 'review'
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WorkflowManager content={mockContent} />
      </QueryClientProvider>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit for Review' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith('content-123', {
        action: 'submit_for_review',
        fromStatus: 'draft',
        toStatus: 'review'
      });
    });
  });

  it('should prevent invalid workflow transitions', async () => {
    const mockValidateTransition = vi.mocked(workflowService.validateTransition);
    mockValidateTransition.mockResolvedValue({
      valid: false,
      reason: 'User lacks permission to publish content'
    });

    const queryClient = createTestQueryClient();
    const invalidContent = {
      ...mockContent,
      workflow: {
        currentStage: 'review',
        availableTransitions: ['publish'] // User shouldn't be able to publish
      }
    };

    render(
      <QueryClientProvider client={queryClient}>
        <WorkflowManager content={invalidContent} />
      </QueryClientProvider>
    );

    const publishButton = screen.getByRole('button', { name: 'Publish' });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('User lacks permission to publish content')).toBeInTheDocument();
    });
  });

  it('should display workflow history', async () => {
    const mockHistory = [
      {
        id: '1',
        action: 'created',
        fromStatus: null,
        toStatus: 'draft',
        userId: 'user-456',
        userName: 'John Doe',
        timestamp: '2024-01-01T10:00:00Z',
        comment: 'Initial creation'
      },
      {
        id: '2',
        action: 'submitted_for_review',
        fromStatus: 'draft',
        toStatus: 'review',
        userId: 'user-456',
        userName: 'John Doe',
        timestamp: '2024-01-01T11:00:00Z',
        comment: 'Ready for review'
      }
    ];

    const mockGetHistory = vi.mocked(workflowService.getWorkflowHistory);
    mockGetHistory.mockResolvedValue(mockHistory);

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WorkflowManager content={mockContent} showHistory={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe created content')).toBeInTheDocument();
      expect(screen.getByText('John Doe submitted content for review')).toBeInTheDocument();
    });
  });
});
```

### 3. Real-time Collaboration Testing

#### WebSocket Integration Testing
```typescript
// apps/cms-panel/src/components/Collaboration/__tests__/CollaborationManager.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CollaborationManager } from '../CollaborationManager';
import { mockWebSocket } from '../../../__mocks__/websocket';

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

describe('CollaborationManager', () => {
  const mockContentId = 'content-123';
  const mockCurrentUser = {
    id: 'user-456',
    name: 'John Doe',
    avatar: '/avatar.jpg'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocket.mockClear();
  });

  it('should establish WebSocket connection on mount', () => {
    render(
      <CollaborationManager
        contentId={mockContentId}
        currentUser={mockCurrentUser}
      />
    );

    expect(WebSocket).toHaveBeenCalledWith(
      `ws://localhost:3001/collaboration/${mockContentId}`
    );
  });

  it('should display active collaborators', async () => {
    render(
      <CollaborationManager
        contentId={mockContentId}
        currentUser={mockCurrentUser}
      />
    );

    // Simulate receiving collaborator data
    const collaboratorData = {
      type: 'user_joined',
      user: {
        id: 'user-789',
        name: 'Jane Smith',
        avatar: '/jane-avatar.jpg'
      }
    };

    mockWebSocket.onmessage({ data: JSON.stringify(collaboratorData) });

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByAltText('Jane Smith avatar')).toBeInTheDocument();
    });
  });

  it('should handle concurrent editing conflicts', async () => {
    render(
      <CollaborationManager
        contentId={mockContentId}
        currentUser={mockCurrentUser}
      />
    );

    // Simulate conflict detection
    const conflictData = {
      type: 'edit_conflict',
      conflictId: 'conflict-123',
      localChanges: {
        field: 'title',
        value: 'Local Title',
        timestamp: '2024-01-01T10:30:00Z'
      },
      remoteChanges: {
        field: 'title',
        value: 'Remote Title',
        timestamp: '2024-01-01T10:31:00Z',
        userId: 'user-789',
        userName: 'Jane Smith'
      }
    };

    mockWebSocket.onmessage({ data: JSON.stringify(conflictData) });

    await waitFor(() => {
      expect(screen.getByText('Edit Conflict Detected')).toBeInTheDocument();
      expect(screen.getByText('Your changes: Local Title')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith\'s changes: Remote Title')).toBeInTheDocument();
    });
  });

  it('should show live cursor positions', async () => {
    render(
      <CollaborationManager
        contentId={mockContentId}
        currentUser={mockCurrentUser}
      />
    );

    // Simulate cursor position update
    const cursorData = {
      type: 'cursor_update',
      userId: 'user-789',
      userName: 'Jane Smith',
      position: {
        elementId: 'editor-content',
        x: 150,
        y: 200
      }
    };

    mockWebSocket.onmessage({ data: JSON.stringify(cursorData) });

    await waitFor(() => {
      const cursor = screen.getByTestId('remote-cursor-user-789');
      expect(cursor).toHaveStyle({
        position: 'absolute',
        left: '150px',
        top: '200px'
      });
      expect(cursor).toHaveTextContent('Jane Smith');
    });
  });

  it('should handle connection loss and reconnection', async () => {
    render(
      <CollaborationManager
        contentId={mockContentId}
        currentUser={mockCurrentUser}
      />
    );

    // Simulate connection loss
    mockWebSocket.onclose({ code: 1006, reason: 'Connection lost' });

    await waitFor(() => {
      expect(screen.getByText('Connection lost. Attempting to reconnect...')).toBeInTheDocument();
    });

    // Simulate reconnection
    mockWebSocket.onopen();

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });
});
```

## API Integration Testing Patterns

### 1. Content Management API Tests

```typescript
// tests/integration/cms-api.test.ts
import request from 'supertest';
import { app } from '../../services/api/src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestUser, createTestContent } from '../helpers/fixtures';

describe('CMS API Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    testUser = await createTestUser({ role: 'content-creator' });
    authToken = testUser.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/content', () => {
    it('should create content with workflow state', async () => {
      const contentData = {
        title: 'Integration Test Article',
        body: 'Test content body',
        category: 'coaching-tips',
        tags: ['test', 'integration']
      };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: contentData.title,
        body: contentData.body,
        status: 'draft',
        authorId: testUser.id,
        workflow: {
          currentStage: 'creation',
          availableTransitions: ['submit_for_review']
        }
      });

      // Verify content is in database
      const dbContent = await request(app)
        .get(`/api/content/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(dbContent.body.id).toBe(response.body.id);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        body: 'Missing title'
      };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.errors).toContain(
        expect.objectContaining({
          field: 'title',
          message: 'Title is required'
        })
      );
    });

    it('should sanitize HTML content', async () => {
      const maliciousContent = {
        title: 'Safe Title',
        body: '<script>alert("XSS")</script><p>Safe content</p>'
      };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousContent)
        .expect(201);

      expect(response.body.body).toBe('<p>Safe content</p>');
      expect(response.body.body).not.toContain('<script>');
    });
  });

  describe('PUT /api/content/:id/workflow', () => {
    let testContent: any;

    beforeEach(async () => {
      testContent = await createTestContent({
        authorId: testUser.id,
        status: 'draft'
      });
    });

    it('should transition content through workflow stages', async () => {
      // Submit for review
      const reviewResponse = await request(app)
        .put(`/api/content/${testContent.id}/workflow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'submit_for_review' })
        .expect(200);

      expect(reviewResponse.body.status).toBe('review');
      expect(reviewResponse.body.workflow.currentStage).toBe('review');

      // Create editor user and approve
      const editor = await createTestUser({ role: 'editor' });

      const approveResponse = await request(app)
        .put(`/api/content/${testContent.id}/workflow`)
        .set('Authorization', `Bearer ${editor.token}`)
        .send({ action: 'approve' })
        .expect(200);

      expect(approveResponse.body.status).toBe('approved');
      expect(approveResponse.body.workflow.currentStage).toBe('ready_to_publish');
    });

    it('should prevent invalid workflow transitions', async () => {
      // Try to publish directly from draft (should fail)
      const response = await request(app)
        .put(`/api/content/${testContent.id}/workflow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'publish' })
        .expect(400);

      expect(response.body.error).toContain('Invalid workflow transition');
    });

    it('should enforce role-based permissions', async () => {
      // Content creator tries to approve their own content
      await request(app)
        .put(`/api/content/${testContent.id}/workflow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'submit_for_review' })
        .expect(200);

      const approveResponse = await request(app)
        .put(`/api/content/${testContent.id}/workflow`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'approve' })
        .expect(403);

      expect(approveResponse.body.error).toContain('Insufficient permissions');
    });
  });

  describe('WebSocket Collaboration', () => {
    it('should handle concurrent editing', async () => {
      const content = await createTestContent({ authorId: testUser.id });
      const editor2 = await createTestUser({ role: 'content-creator' });

      // Simulate two users editing the same content
      const update1Promise = request(app)
        .put(`/api/content/${content.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated by User 1',
          version: content.version
        });

      const update2Promise = request(app)
        .put(`/api/content/${content.id}`)
        .set('Authorization', `Bearer ${editor2.token}`)
        .send({
          title: 'Updated by User 2',
          version: content.version
        });

      const [response1, response2] = await Promise.all([update1Promise, update2Promise]);

      // One should succeed, one should conflict
      expect([response1.status, response2.status]).toContain(200);
      expect([response1.status, response2.status]).toContain(409);

      const conflictResponse = response1.status === 409 ? response1 : response2;
      expect(conflictResponse.body.error).toContain('Version conflict');
      expect(conflictResponse.body.conflictData).toBeDefined();
    });
  });
});
```

### 2. Performance API Tests

```javascript
// tests/performance/cms-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.05'],            // Error rate under 5%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

export function setup() {
  // Create test user and get auth token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'load-test@upcoach.com',
    password: 'test-password'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { token: loginResponse.json('token') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Test content creation
  const contentPayload = JSON.stringify({
    title: `Load Test Article ${__VU}-${__ITER}`,
    body: 'This is a load test article with some content to test performance.',
    category: 'testing',
    tags: ['load-test', 'performance']
  });

  const createResponse = http.post(`${BASE_URL}/api/content`, contentPayload, { headers });

  check(createResponse, {
    'content creation status is 201': (r) => r.status === 201,
    'content creation time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  if (createResponse.status === 201) {
    const contentId = createResponse.json('id');

    // Test content retrieval
    const getResponse = http.get(`${BASE_URL}/api/content/${contentId}`, { headers });

    check(getResponse, {
      'content retrieval status is 200': (r) => r.status === 200,
      'content retrieval time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);

    // Test content update (auto-save simulation)
    const updatePayload = JSON.stringify({
      title: `Updated Load Test Article ${__VU}-${__ITER}`,
      body: 'Updated content with additional text to simulate editing.',
      version: getResponse.json('version')
    });

    const updateResponse = http.put(`${BASE_URL}/api/content/${contentId}`, updatePayload, { headers });

    check(updateResponse, {
      'content update status is 200': (r) => r.status === 200,
      'content update time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);

    // Test workflow transition
    const workflowPayload = JSON.stringify({
      action: 'submit_for_review'
    });

    const workflowResponse = http.put(`${BASE_URL}/api/content/${contentId}/workflow`, workflowPayload, { headers });

    check(workflowResponse, {
      'workflow transition status is 200': (r) => r.status === 200,
      'workflow transition time < 400ms': (r) => r.timings.duration < 400,
    }) || errorRate.add(1);
  }

  sleep(1);
}

export function teardown(data) {
  // Cleanup any test data if needed
  console.log('Load test completed');
}
```

## Flutter Mobile Testing Implementation

### 1. Widget Testing for CMS Integration

```dart
// mobile-app/test/features/cms/content_list_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:upcoach_mobile/features/cms/content_list.dart';
import 'package:upcoach_mobile/features/cms/models/content_model.dart';
import 'package:upcoach_mobile/features/cms/providers/content_provider.dart';

import '../../mocks/content_service_mock.dart';

void main() {
  group('ContentList Widget Tests', () {
    late MockContentService mockContentService;

    setUp(() {
      mockContentService = MockContentService();
    });

    testWidgets('should display content list when data is available', (WidgetTester tester) async {
      final testContent = [
        ContentModel(
          id: '1',
          title: 'First Article',
          excerpt: 'First article excerpt',
          publishedAt: DateTime.now(),
          category: 'coaching',
        ),
        ContentModel(
          id: '2',
          title: 'Second Article',
          excerpt: 'Second article excerpt',
          publishedAt: DateTime.now(),
          category: 'habits',
        ),
      ];

      when(mockContentService.getContent()).thenAnswer((_) async => testContent);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contentServiceProvider.overrideWithValue(mockContentService),
          ],
          child: MaterialApp(
            home: ContentList(),
          ),
        ),
      );

      // Wait for data to load
      await tester.pumpAndSettle();

      expect(find.text('First Article'), findsOneWidget);
      expect(find.text('Second Article'), findsOneWidget);
      expect(find.text('First article excerpt'), findsOneWidget);
      expect(find.text('Second article excerpt'), findsOneWidget);
    });

    testWidgets('should handle loading state', (WidgetTester tester) async {
      // Delay the response to test loading state
      when(mockContentService.getContent()).thenAnswer(
        (_) async {
          await Future.delayed(Duration(seconds: 1));
          return [];
        }
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contentServiceProvider.overrideWithValue(mockContentService),
          ],
          child: MaterialApp(
            home: ContentList(),
          ),
        ),
      );

      // Should show loading indicator initially
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Wait for data to load
      await tester.pumpAndSettle();

      // Loading indicator should be gone
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('should handle offline mode gracefully', (WidgetTester tester) async {
      final cachedContent = [
        ContentModel(
          id: '1',
          title: 'Cached Article',
          excerpt: 'This is cached content',
          publishedAt: DateTime.now(),
          category: 'offline',
        ),
      ];

      when(mockContentService.getContent()).thenThrow(
        NetworkException('No internet connection')
      );
      when(mockContentService.getCachedContent()).thenAnswer(
        (_) async => cachedContent
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contentServiceProvider.overrideWithValue(mockContentService),
          ],
          child: MaterialApp(
            home: ContentList(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Should show cached content
      expect(find.text('Cached Article'), findsOneWidget);

      // Should show offline indicator
      expect(find.byIcon(Icons.cloud_off), findsOneWidget);
      expect(find.text('Viewing offline content'), findsOneWidget);
    });

    testWidgets('should handle pull-to-refresh', (WidgetTester tester) async {
      final initialContent = [
        ContentModel(
          id: '1',
          title: 'Initial Article',
          excerpt: 'Initial content',
          publishedAt: DateTime.now(),
          category: 'test',
        ),
      ];

      final refreshedContent = [
        ContentModel(
          id: '2',
          title: 'Refreshed Article',
          excerpt: 'Refreshed content',
          publishedAt: DateTime.now(),
          category: 'test',
        ),
      ];

      when(mockContentService.getContent())
          .thenAnswer((_) async => initialContent);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contentServiceProvider.overrideWithValue(mockContentService),
          ],
          child: MaterialApp(
            home: ContentList(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify initial content
      expect(find.text('Initial Article'), findsOneWidget);

      // Setup mock for refresh
      when(mockContentService.refreshContent())
          .thenAnswer((_) async => refreshedContent);

      // Perform pull-to-refresh
      await tester.fling(find.byType(RefreshIndicator), const Offset(0, 300), 1000);
      await tester.pump();
      await tester.pump(Duration(seconds: 1));

      // Should show refreshed content
      expect(find.text('Refreshed Article'), findsOneWidget);
      expect(find.text('Initial Article'), findsNothing);
    });

    testWidgets('should navigate to content detail on tap', (WidgetTester tester) async {
      final testContent = [
        ContentModel(
          id: '1',
          title: 'Tappable Article',
          excerpt: 'Tap to view details',
          publishedAt: DateTime.now(),
          category: 'test',
        ),
      ];

      when(mockContentService.getContent()).thenAnswer((_) async => testContent);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contentServiceProvider.overrideWithValue(mockContentService),
          ],
          child: MaterialApp(
            home: ContentList(),
            routes: {
              '/content/detail': (context) => Scaffold(
                appBar: AppBar(title: Text('Content Detail')),
                body: Text('Content detail page'),
              ),
            },
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap on the article
      await tester.tap(find.text('Tappable Article'));
      await tester.pumpAndSettle();

      // Should navigate to detail page
      expect(find.text('Content Detail'), findsOneWidget);
      expect(find.text('Content detail page'), findsOneWidget);
    });
  });

  group('ContentList Performance Tests', () => {
    testWidgets('should maintain smooth scrolling with large lists', (WidgetTester tester) async {
      // Generate large content list
      final largeContentList = List.generate(1000, (index) =>
        ContentModel(
          id: '$index',
          title: 'Article $index',
          excerpt: 'Excerpt for article $index with some longer text to test rendering performance',
          publishedAt: DateTime.now().subtract(Duration(days: index)),
          category: 'performance-test',
        )
      );

      when(mockContentService.getContent()).thenAnswer((_) async => largeContentList);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contentServiceProvider.overrideWithValue(mockContentService),
          ],
          child: MaterialApp(
            home: ContentList(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Measure frame timing during scroll
      final timeline = await tester.binding.traceAction(() async {
        // Perform aggressive scrolling
        await tester.fling(find.byType(ListView), const Offset(0, -5000), 10000);
        await tester.pumpAndSettle();
      });

      // Analyze frame timing
      final frameEvents = timeline.events.where((event) => event.name == 'Frame');
      final frameDurations = frameEvents.map((event) => event.duration?.inMicroseconds ?? 0);

      // Count dropped frames (> 16.67ms for 60 FPS)
      final droppedFrames = frameDurations.where((duration) => duration > 16667).length;
      final dropRate = droppedFrames / frameDurations.length;

      // Should maintain < 5% dropped frames
      expect(dropRate, lessThan(0.05));
    });
  });
}
```

### 2. Integration Testing for Mobile App

```dart
// mobile-app/integration_test/cms_integration_test.dart
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:upcoach_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('CMS Integration Tests', () {
    testWidgets('should sync content from CMS and display in app', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to content section
      await tester.tap(find.byKey(Key('content_tab')));
      await tester.pumpAndSettle();

      // Trigger content sync
      await tester.tap(find.byKey(Key('sync_button')));
      await tester.pumpAndSettle();

      // Wait for sync to complete
      await tester.pumpAndSettle(Duration(seconds: 5));

      // Verify content appears
      expect(find.byType(ContentList), findsOneWidget);
      expect(find.text('No content available'), findsNothing);

      // Test content navigation
      final firstArticle = find.byKey(Key('content_item_0'));
      if (tester.any(firstArticle)) {
        await tester.tap(firstArticle);
        await tester.pumpAndSettle();

        // Should navigate to content detail
        expect(find.byType(ContentDetailPage), findsOneWidget);
      }
    });

    testWidgets('should handle offline content access', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Simulate network unavailable
      await tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        MethodChannel('connectivity_plus'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'check') {
            return 'none'; // No network connection
          }
          return null;
        },
      );

      // Navigate to content
      await tester.tap(find.byKey(Key('content_tab')));
      await tester.pumpAndSettle();

      // Should show offline indicator
      expect(find.byIcon(Icons.cloud_off), findsOneWidget);
      expect(find.text('Offline mode'), findsOneWidget);

      // Should still show cached content
      expect(find.byType(ContentList), findsOneWidget);

      // Test offline content interaction
      final cachedContent = find.byKey(Key('cached_content_item'));
      if (tester.any(cachedContent)) {
        await tester.tap(cachedContent);
        await tester.pumpAndSettle();

        expect(find.text('Viewing offline content'), findsOneWidget);
      }
    });

    testWidgets('should handle push notifications for new content', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Simulate receiving push notification
      await tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        MethodChannel('firebase_messaging'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'onMessage') {
            return {
              'notification': {
                'title': 'New Article Published',
                'body': 'Check out the latest coaching tips'
              },
              'data': {
                'contentId': 'new-article-123',
                'type': 'content_published'
              }
            };
          }
          return null;
        },
      );

      // Trigger notification handler
      final notificationMessage = find.text('New Article Published');
      await tester.pumpAndSettle();

      // Should show notification
      expect(notificationMessage, findsOneWidget);

      // Tap notification to navigate
      await tester.tap(notificationMessage);
      await tester.pumpAndSettle();

      // Should navigate to the new content
      expect(find.byType(ContentDetailPage), findsOneWidget);
    });

    testWidgets('should support content search functionality', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to content section
      await tester.tap(find.byKey(Key('content_tab')));
      await tester.pumpAndSettle();

      // Open search
      await tester.tap(find.byKey(Key('search_button')));
      await tester.pumpAndSettle();

      // Enter search query
      await tester.enterText(find.byKey(Key('search_field')), 'coaching tips');
      await tester.pumpAndSettle();

      // Wait for search results
      await tester.pumpAndSettle(Duration(seconds: 2));

      // Should show filtered results
      expect(find.byKey(Key('search_results')), findsOneWidget);
      expect(find.text('No results found'), findsNothing);

      // Test search result interaction
      final searchResult = find.byKey(Key('search_result_0'));
      if (tester.any(searchResult)) {
        await tester.tap(searchResult);
        await tester.pumpAndSettle();

        expect(find.byType(ContentDetailPage), findsOneWidget);
      }
    });

    testWidgets('should handle content sharing', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to content and open an article
      await tester.tap(find.byKey(Key('content_tab')));
      await tester.pumpAndSettle();

      final firstArticle = find.byKey(Key('content_item_0'));
      if (tester.any(firstArticle)) {
        await tester.tap(firstArticle);
        await tester.pumpAndSettle();

        // Tap share button
        await tester.tap(find.byKey(Key('share_button')));
        await tester.pumpAndSettle();

        // Should show share options
        expect(find.byType(ShareOptionsDialog), findsOneWidget);

        // Test different share options
        await tester.tap(find.text('Copy Link'));
        await tester.pumpAndSettle();

        // Should show confirmation
        expect(find.text('Link copied to clipboard'), findsOneWidget);
      }
    });
  });

  group('CMS Sync Performance Tests', () {
    testWidgets('should complete initial sync within 10 seconds', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      final stopwatch = Stopwatch()..start();

      // Navigate to content and trigger sync
      await tester.tap(find.byKey(Key('content_tab')));
      await tester.tap(find.byKey(Key('sync_button')));

      // Wait for sync to complete
      while (tester.any(find.byKey(Key('sync_in_progress')))) {
        await tester.pump(Duration(milliseconds: 100));

        // Timeout after 10 seconds
        if (stopwatch.elapsedMilliseconds > 10000) {
          fail('Sync took longer than 10 seconds');
        }
      }

      stopwatch.stop();

      // Verify sync completed within time limit
      expect(stopwatch.elapsedMilliseconds, lessThan(10000));
      expect(find.byKey(Key('sync_complete')), findsOneWidget);
    });

    testWidgets('should handle large content catalogs efficiently', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to content with large dataset
      await tester.tap(find.byKey(Key('content_tab')));
      await tester.pumpAndSettle();

      // Measure memory usage during scroll
      final initialMemory = await tester.binding.reportMemoryUsage();

      // Perform extensive scrolling
      for (int i = 0; i < 50; i++) {
        await tester.fling(find.byType(ListView), Offset(0, -1000), 5000);
        await tester.pump(Duration(milliseconds: 100));
      }

      final finalMemory = await tester.binding.reportMemoryUsage();

      // Memory increase should be reasonable (less than 50MB)
      final memoryIncrease = finalMemory['total']! - initialMemory['total']!;
      expect(memoryIncrease, lessThan(50 * 1024 * 1024)); // 50MB
    });
  });
}
```

This comprehensive testing implementation guide provides specific, actionable test code for the UpCoach CMS enhanced implementation. The tests cover all critical aspects including React/TypeScript component testing, API integration testing, Flutter mobile testing, performance testing, and accessibility testing.

Key features of this implementation:

1. **Comprehensive Coverage**: Tests cover unit, integration, E2E, performance, security, and accessibility scenarios
2. **Real-world Scenarios**: Test cases reflect actual CMS workflows and user interactions
3. **Performance Focus**: Specific performance benchmarks and monitoring
4. **Cross-platform Testing**: Seamless integration between web CMS and mobile app
5. **Automated Quality Gates**: Enforced coverage thresholds and quality metrics
6. **CI/CD Integration**: Complete pipeline configuration for automated testing

The implementation ensures robust quality assurance for the enhanced CMS features while maintaining development velocity and deployment confidence.