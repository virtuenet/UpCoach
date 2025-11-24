# Sticky Engagement Suite - Architecture Documentation

## Overview

The Sticky Engagement Suite is a comprehensive set of features designed to increase user retention and engagement through personalized AI-powered interactions, social accountability, contextual challenges, and progress celebration.

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Flutter)                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Daily Pulse  │ Micro-Chall  │  Guardians  │  Progress Feed │
│   Widget     │   Cards      │  Encourage  │   Highlights   │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       │              │              │                │
       ▼              ▼              ▼                ▼
┌──────────────────────────────────────────────────────────────┐
│                     API Layer (Express)                       │
├───────────────┬────────────────┬───────────────┬─────────────┤
│ DailyPulse    │ MicroAdventure │ StreakGuardian│  Progress   │
│  Controller   │   Controller   │   Controller  │  Controller │
└───────┬───────┴────────┬───────┴───────┬───────┴──────┬──────┘
        │                │               │              │
        ▼                ▼               ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├───────────────┬────────────────┬──────────────┬──────────────┤
│ DailyPulse    │ MicroAdventure │ StreakGuard  │ ProgressHigh │
│  Service      │   Service      │  Service     │  Service     │
└───────┬───────┴────────┬───────┴──────┬───────┴──────┬───────┘
        │                │              │              │
        └────────────────┴──────────────┴──────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │      UserDayContextService                  │
        │  (Shared Analytics & Context Builder)      │
        └─────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴────────────────────────┐
        │                                              │
        ▼                                              ▼
┌───────────────┐                            ┌────────────────┐
│   AI Service  │                            │  Database      │
│  (Local/Cloud)│                            │  (PostgreSQL)  │
└───────┬───────┘                            └────────────────┘
        │
┌───────┴────────┐
│ LocalPhi3      │
│ Service        │
│  (ONNX)        │
└────────────────┘
```

## Core Components

### 1. Daily Pulse Service

**Purpose**: Generate personalized morning and evening check-ins based on user context.

**Key Features**:
- Context-aware message generation using AI
- Scheduled broadcasts (6 AM morning, 8 PM evening)
- Cache-backed pulse storage (1-hour TTL)
- Push notification delivery

**Data Flow**:
```
Scheduler → DailyPulseService.broadcastPulse()
  ↓
UserDayContextService.build(userId)
  ↓
AIService.generateResponse(context, period)
  ↓
Cache.set(pulse, TTL=1h)
  ↓
NotificationService.send(userId, pulse)
```

**Technologies**:
- Node-cron for scheduling
- OpenAI/Claude for pulse generation (with local LLM fallback)
- Redis for caching
- Firebase Cloud Messaging for notifications

---

### 2. Micro-Adventures Service

**Purpose**: Recommend short, context-aware challenges to drive micro-commitments.

**Key Features**:
- 12+ pre-defined challenges in catalog
- Trigger matching (period, task count, mood, weather)
- Real-time recommendations (3-5 challenges per request)
- Points/badge integration

**Challenge Matching Algorithm**:
```typescript
function matchChallenge(challenge, context) {
  if (challenge.trigger.period && !challenge.trigger.period.includes(context.period))
    return false;

  if (challenge.trigger.minTasksDue && context.overdueTasks < challenge.trigger.minTasksDue)
    return false;

  if (challenge.trigger.maxDurationMinutes && context.availableTime < challenge.trigger.maxDurationMinutes)
    return false;

  return true;
}
```

**Technologies**:
- Static JSON catalog (microChallengesCatalog.ts)
- Redis for user completion tracking
- Gamification service integration

---

### 3. Streak Guardians Service

**Purpose**: Facilitate social accountability through paired guardian relationships.

**Key Features**:
- Invite/accept/block workflow
- Hourly at-risk user scanning
- Real-time encouragement messaging
- Privacy-preserving guardian notifications

**Database Schema**:
```sql
CREATE TABLE streak_guardian_links (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  guardian_user_id UUID NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(owner_user_id, guardian_user_id)
);
```

**At-Risk Detection**:
```typescript
isAtRisk = (overdueTasks >= 3) ||
           (habitTrend[0]?.completionRate < 0.4)
```

**Technologies**:
- PostgreSQL for relationship storage
- WebSocket/SSE for real-time notifications
- Node-cron for hourly scans

---

### 4. AI Companion Chat Service

**Purpose**: Provide a persistent, context-aware AI coach available 24/7.

**Key Features**:
- Long-lived conversation memory (20-message history)
- Context injection from UserDayContextService
- Proactive outreach capability
- Safety filtering and escalation hooks

**Memory Management**:
```typescript
const MAX_HISTORY = 20;
const history = await cache.get(`companion:${userId}`) || [];

// Trim to most recent messages
if (history.length > MAX_HISTORY) {
  history = history.slice(-MAX_HISTORY);
}
```

**Technologies**:
- Redis for conversation persistence
- OpenAI GPT-4/Claude Sonnet for responses
- Local LLM fallback for privacy-sensitive users

---

### 5. Progress Theater Service

**Purpose**: Generate shareable progress highlights to celebrate wins.

**Key Features**:
- Daily/weekly/monthly highlight generation
- Sentiment analysis (positive, neutral, recovery)
- Privacy-controlled sharing (private/circles/public)
- Landing page public feed integration

**Highlight Generation**:
```typescript
generateHighlight(context) {
  if (context.streakDays >= 30) return milestone(context);
  if (context.completedToday >= 5) return accomplishment(context);
  if (context.overdueTasks === 0) return clear_desk(context);
  if (context.habitTrend[0].completionRate > 0.8) return momentum(context);
  return encouragement(context);
}
```

**Technologies**:
- Analytics service integration
- React components for landing page
- Mobile share sheet integration

---

### 6. Local LLM Infrastructure

**Purpose**: Enable edge inference for privacy, cost reduction, and offline capability.

**Key Features**:
- ONNX Runtime GenAI support
- Phi-3/Phi-4 mini model compatibility (3.8B params)
- Automatic cloud fallback on failure
- Python subprocess runner

**Routing Logic**:
```typescript
if (LOCAL_LLM_ENABLED &&
    promptLength < LOCAL_LLM_CONTEXT_WINDOW &&
    maxTokens <= LOCAL_LLM_MAX_TOKENS) {
  try {
    return await localPhi3Service.generate(prompt);
  } catch (error) {
    logger.warn('Local LLM failed, falling back to cloud');
    return await openaiService.generate(prompt);
  }
}
```

**Technologies**:
- Python 3.13 + onnxruntime-genai
- Node.js child_process spawn
- ONNX model binaries (2.5 GB for Phi-3)

---

### 7. On-Device Mobile LLM

**Purpose**: Run quantized models on mobile devices for instant, offline responses.

**Key Features**:
- 1-2B parameter models (120-200 MB footprint)
- 4-bit GGUF quantization
- Core ML (iOS) / NNAPI (Android) acceleration
- Automatic download management

**Fallback Hierarchy**:
```
User Input
  ↓
Is model downloaded? → NO → Edge LLM API
  ↓ YES
Intent classification → Quick summary? → YES → On-device inference
  ↓ NO                                          ↓ Fast (50-200ms)
Complex prompt? → YES → Edge LLM API
  ↓ NO                  ↓ Slower (1-3s)
On-device inference
```

**Technologies**:
- Flutter MethodChannel
- Core ML (iOS) / TFLite (Android)
- GGUF model format
- Background model updates

---

## Shared Services

### UserDayContextService

Central context builder used by all engagement features:

```typescript
interface DailyUserContext {
  overdueTasks: number;
  upcomingTasks: number;
  completedToday: number;
  streakDays: number;
  moodAverage: number | null;
  habitTrend: Array<{ date: string; completionRate: number }>;
}
```

**Data Sources**:
- Task model (for overdue/upcoming/completed counts)
- Mood model (for average sentiment)
- Habit completion tracking
- Goal progress analytics

---

## Caching Strategy

### Cache Keys
```
daily-pulse:{userId}:{period}     TTL: 1 hour
micro-challenges:{userId}:recs    TTL: 4 hours
companion:chat:{userId}           TTL: 7 days
guardian:at-risk:{userId}         TTL: 15 minutes
progress:highlights:{userId}      TTL: 24 hours
```

### Cache Invalidation
- Manual: When user updates preferences
- Automatic: TTL expiration
- Event-driven: On task completion, mood update, streak break

---

## Scheduler Jobs

```typescript
// Morning pulse - 6:00 AM daily
cron.schedule('0 6 * * *', () => dailyPulseService.broadcastPulse('morning'));

// Evening pulse - 8:00 PM daily
cron.schedule('0 20 * * *', () => dailyPulseService.broadcastPulse('evening'));

// Guardian risk scan - Every hour at :15
cron.schedule('15 * * * *', () => streakGuardianService.scanForAtRiskUsers());
```

---

## API Endpoints

See [API Documentation](../api/sticky-engagement-api.md) for complete reference.

**Quick Reference**:
- `GET /api/ai/pulse` - Get daily pulse
- `POST /api/ai/pulse/broadcast` - Trigger broadcast (admin)
- `GET /api/gamification/micro-challenges` - Get recommendations
- `POST /api/gamification/micro-challenges/:id/complete` - Complete challenge
- `POST /api/gamification/streak-guardians/invite` - Invite guardian
- `GET /api/gamification/streak-guardians` - List guardians
- `POST /api/gamification/streak-guardians/:id/cheer` - Send encouragement
- `POST /api/ai/companion/message` - Send chat message
- `GET /api/ai/companion/history` - Get conversation history
- `GET /api/progress/highlights` - Get progress highlights
- `GET /api/ai/local-llm/status` - Check local model status

---

## Security Considerations

### Authentication
All endpoints require JWT bearer token authentication.

### Rate Limiting
- AI endpoints: 30 requests/minute per user
- Companion chat: 10 messages/minute per user
- Guardian operations: 20 requests/minute per user

### Data Privacy
- Guardian relationships are opt-in only
- Progress highlights respect user-defined privacy settings
- Companion chat history encrypted at rest
- Local LLM option for privacy-sensitive users

### Input Validation
- All user messages sanitized before AI processing
- Guardian invitation requires valid user ID verification
- Challenge completion validated against catalog

---

## Performance Metrics

### Target SLAs
- Daily pulse generation: < 2 seconds
- Micro-challenge recommendations: < 500ms
- Guardian at-risk scan: < 30 seconds (for 10k users)
- Companion chat response: < 3 seconds (cloud), < 1 second (local)
- Progress highlight generation: < 1 second

### Monitoring
- Pulse delivery success rate
- Challenge completion rate
- Guardian active pairs count
- Companion chat engagement rate
- Local LLM hit rate vs cloud fallback

---

## Future Enhancements

1. **Adaptive scheduling** - Learn optimal pulse delivery times per user
2. **Dynamic challenge generation** - Use AI to create personalized challenges
3. **Guardian matching** - Suggest compatible guardian pairs
4. **Voice companion mode** - Enable voice interactions with AI companion
5. **Multi-language support** - Localize pulses, challenges, and highlights
6. **Wearable integration** - Trigger challenges based on activity data

---

## Dependencies

### Backend
- Node.js 20.x
- Express 4.x
- Sequelize 6.x
- PostgreSQL 15+
- Redis 7+
- OpenAI SDK / Anthropic SDK
- Python 3.13 (for local LLM)
- onnxruntime-genai 0.11.2

### Mobile
- Flutter 3.x
- Riverpod 2.x
- Dio (HTTP client)
- flutter_local_notifications
- path_provider (for model storage)

### Infrastructure
- Docker (for containerization)
- GitHub Actions (CI/CD)
- Firebase Cloud Messaging (push notifications)
- Sentry (error tracking)

---

## Deployment

See [Deployment Guide](../deployment/sticky-engagement-deployment.md) for step-by-step instructions.

**Quick Start**:
```bash
# 1. Install Python dependencies
pip install -r services/api/requirements.txt

# 2. Run database migration
cd services/api && npm run db:migrate

# 3. Configure environment
cp .env.example .env
# Edit LOCAL_LLM_* variables

# 4. Start services
npm run dev
```

---

## Testing

See test files in `services/api/src/__tests__/`:
- Unit tests: `services/*.test.ts`
- Integration tests: `integration/*.test.ts`

**Run tests**:
```bash
cd services/api
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # With coverage report
```

---

## Support & Maintenance

### Logs
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- AI inference logs: `logs/llm.log`

### Troubleshooting
See [Troubleshooting Guide](../deployment/troubleshooting.md)

### Contact
- Engineering lead: [TBD]
- Documentation: [Confluence/Wiki URL]
- Slack channel: #sticky-engagement

---

*Last updated: 2025-11-24*
*Version: 1.0.0*
