-- Seed test data for Daily Pulse functionality
-- Generated: 2025-11-25

-- Insert mood entries for the test user (last 7 days)
INSERT INTO mood_entries ("userId", "tenantId", mood, intensity, note, "recordedAt", "createdAt", "updatedAt")
VALUES
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'happy', 4, 'Great progress on my goals today!', NOW() - INTERVAL '1 day', NOW(), NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'motivated', 5, 'Feeling energized and ready to tackle the day', NOW() - INTERVAL '2 days', NOW(), NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'calm', 3, 'Peaceful morning meditation', NOW() - INTERVAL '3 days', NOW(), NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'stressed', 4, 'Busy day but managing well', NOW() - INTERVAL '4 days', NOW(), NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'happy', 5, 'Accomplished a major milestone!', NOW() - INTERVAL '5 days', NOW(), NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'content', 3, 'Steady progress on daily habits', NOW() - INTERVAL '6 days', NOW(), NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'energized', 4, 'Morning workout completed', NOW() - INTERVAL '7 days', NOW(), NOW());

-- Create sample habits for the test user
INSERT INTO habit_check_ins ("userId", "tenantId", "habitId", completed, "completedAt", streak, note, "createdAt", "updatedAt")
VALUES
  -- Morning meditation habit (7-day streak)
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '1 day', 7, 'Completed 10-minute session', NOW() - INTERVAL '1 day', NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '2 days', 6, 'Morning meditation complete', NOW() - INTERVAL '2 days', NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '3 days', 5, 'Calm and focused', NOW() - INTERVAL '3 days', NOW()),

  -- Exercise habit (5-day streak)
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', true, NOW() - INTERVAL '1 day', 5, '30-minute run', NOW() - INTERVAL '1 day', NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', true, NOW() - INTERVAL '2 days', 4, 'Morning workout', NOW() - INTERVAL '2 days', NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', true, NOW() - INTERVAL '3 days', 3, 'Gym session', NOW() - INTERVAL '3 days', NOW()),

  -- Reading habit (3-day streak)
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', true, NOW() - INTERVAL '1 day', 3, 'Read 20 pages', NOW() - INTERVAL '1 day', NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', true, NOW() - INTERVAL '2 days', 2, 'Finished a chapter', NOW() - INTERVAL '2 days', NOW()),
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', true, NOW() - INTERVAL '3 days', 1, 'Evening reading', NOW() - INTERVAL '3 days', NOW()),

  -- Water intake habit (today's check-in)
  ('fdd24318-fbbc-4516-a6e0-c028b5cbd07a', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', true, NOW(), 1, '8 glasses today', NOW(), NOW());

-- Verify the seed data
SELECT 'Mood Entries Count:' as type, COUNT(*)::text as count FROM mood_entries WHERE "userId" = 'fdd24318-fbbc-4516-a6e0-c028b5cbd07a'
UNION ALL
SELECT 'Habit Check-ins Count:' as type, COUNT(*)::text as count FROM habit_check_ins WHERE "userId" = 'fdd24318-fbbc-4516-a6e0-c028b5cbd07a'
UNION ALL
SELECT 'Unique Habits:' as type, COUNT(DISTINCT "habitId")::text as count FROM habit_check_ins WHERE "userId" = 'fdd24318-fbbc-4516-a6e0-c028b5cbd07a';
