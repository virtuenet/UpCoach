# Stage 7: Community & Social Features Implementation Plan

## Overview
Implement comprehensive community and social features to enable user interaction, knowledge sharing, and collaborative growth within the UpCoach platform.

## Features to Implement

### 1. User Profiles & Social Identity
- Enhanced public user profiles
- Achievement badges and milestones
- Professional bio and expertise areas
- Social links and contact preferences
- Privacy settings and visibility controls

### 2. Discussion Forums
- Topic-based discussion boards
- Categories: General, Goals, Challenges, Success Stories
- Thread creation with rich text support
- Upvoting/downvoting system
- Reply threading and notifications
- Moderation tools and reporting

### 3. Community Groups
- Interest-based groups (e.g., "Entrepreneurs", "Fitness Goals")
- Private vs. public groups
- Group admins and moderators
- Group challenges and events
- Resource sharing within groups

### 4. Direct Messaging
- User-to-user private messaging
- Real-time chat with WebSocket
- Message notifications
- Block/report functionality
- Message history and search

### 5. Social Feed
- Activity stream showing user achievements
- Goal completions and milestones
- Content shares and recommendations
- Follow/unfollow functionality
- Personalized feed algorithm

### 6. Social Sharing
- Share achievements on external platforms
- Share goals and progress
- Invite friends to platform
- Referral rewards system

### 7. Collaborative Features
- Accountability partners matching
- Group goal setting
- Shared progress tracking
- Peer coaching opportunities
- Community challenges

### 8. Gamification
- Points and reputation system
- Leaderboards (daily/weekly/monthly)
- Achievement unlocks
- Streak tracking
- Community badges

## Technical Implementation

### Database Schema
```sql
-- User profiles extension
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN expertise TEXT[];
ALTER TABLE users ADD COLUMN social_links JSONB;
ALTER TABLE users ADD COLUMN privacy_settings JSONB DEFAULT '{"profile": "public", "goals": "friends", "achievements": "public"}';
ALTER TABLE users ADD COLUMN reputation_points INTEGER DEFAULT 0;

-- Forums
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES forum_categories(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  parent_id UUID REFERENCES forum_posts(id),
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forum_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  vote_type INTEGER CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Groups
CREATE TABLE community_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  cover_image VARCHAR(500),
  is_private BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Direct messaging
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  last_read_at TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  attachments JSONB,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social connections
CREATE TABLE user_follows (
  follower_id UUID REFERENCES users(id),
  following_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Activity feed
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100),
  target_id UUID,
  metadata JSONB,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(100),
  points INTEGER DEFAULT 10,
  criteria JSONB NOT NULL
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

### API Endpoints

#### Forums
- `GET /api/forums/categories` - List forum categories
- `GET /api/forums/threads` - List threads (with pagination)
- `POST /api/forums/threads` - Create new thread
- `GET /api/forums/threads/:id` - Get thread with posts
- `POST /api/forums/posts` - Reply to thread
- `POST /api/forums/posts/:id/vote` - Vote on post
- `PUT /api/forums/posts/:id` - Edit post
- `DELETE /api/forums/posts/:id` - Delete post

#### Groups
- `GET /api/groups` - List groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id/members` - List group members
- `POST /api/groups/:id/posts` - Post to group

#### Messaging
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Start conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

#### Social
- `GET /api/users/:id/profile` - Get public profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/feed` - Get activity feed
- `GET /api/achievements` - List achievements
- `GET /api/users/:id/achievements` - Get user achievements

### Mobile App Screens
1. **Community Tab**
   - Forums list
   - Groups list
   - Activity feed
   - Search functionality

2. **Forum Screens**
   - Thread list
   - Thread detail with posts
   - Create thread
   - Reply interface

3. **Groups Screens**
   - Group list
   - Group detail
   - Group posts
   - Member list

4. **Profile Screens**
   - Public profile view
   - Edit profile
   - Achievements display
   - Following/followers

5. **Messaging**
   - Conversations list
   - Chat interface
   - User search

### Admin Panel Features
1. **Moderation Dashboard**
   - Reported content queue
   - User reports
   - Ban/suspend users
   - Content removal tools

2. **Community Analytics**
   - Active users
   - Popular topics
   - Engagement metrics
   - Growth trends

3. **Achievement Management**
   - Create/edit achievements
   - Assign manual achievements
   - View achievement statistics

## Implementation Priority

### Phase 1 (Week 1)
- User profile enhancements
- Basic forum functionality
- Database migrations

### Phase 2 (Week 2)
- Community groups
- Activity feed
- Follow system

### Phase 3 (Week 3)
- Direct messaging
- Real-time notifications
- Mobile app integration

### Phase 4 (Week 4)
- Achievements system
- Gamification elements
- Admin moderation tools

## Security Considerations
- Content moderation and reporting
- Rate limiting for posts/messages
- Privacy controls for profiles
- Spam prevention
- XSS protection in user content
- Input sanitization

## Performance Optimizations
- Redis caching for feeds
- Elasticsearch for search
- WebSocket connection pooling
- Lazy loading for threads/messages
- CDN for user avatars/media