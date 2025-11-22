--
-- PostgreSQL database dump
--

\restrict OnjsTNFdbS0yL8nseAoFU0DR1n9s8Sg6MuXtguIhTjlRLT3AFKGLpfyxIFB58rL

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_coach_memories_memoryType; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public."enum_coach_memories_memoryType" AS ENUM (
    'conversation',
    'insight',
    'goal',
    'pattern',
    'preference',
    'milestone'
);


ALTER TYPE public."enum_coach_memories_memoryType" OWNER TO upcoach;

--
-- Name: enum_kpi_trackers_category; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.enum_kpi_trackers_category AS ENUM (
    'financial',
    'professional',
    'personal',
    'health',
    'relationships',
    'skills',
    'custom'
);


ALTER TYPE public.enum_kpi_trackers_category OWNER TO upcoach;

--
-- Name: enum_kpi_trackers_confidentiality; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.enum_kpi_trackers_confidentiality AS ENUM (
    'public',
    'team',
    'private'
);


ALTER TYPE public.enum_kpi_trackers_confidentiality OWNER TO upcoach;

--
-- Name: enum_kpi_trackers_priority; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.enum_kpi_trackers_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.enum_kpi_trackers_priority OWNER TO upcoach;

--
-- Name: enum_kpi_trackers_reviewFrequency; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public."enum_kpi_trackers_reviewFrequency" AS ENUM (
    'weekly',
    'biweekly',
    'monthly',
    'quarterly'
);


ALTER TYPE public."enum_kpi_trackers_reviewFrequency" OWNER TO upcoach;

--
-- Name: enum_kpi_trackers_status; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.enum_kpi_trackers_status AS ENUM (
    'not_started',
    'in_progress',
    'at_risk',
    'completed',
    'failed',
    'paused'
);


ALTER TYPE public.enum_kpi_trackers_status OWNER TO upcoach;

--
-- Name: enum_kpi_trackers_type; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.enum_kpi_trackers_type AS ENUM (
    'kpi',
    'okr',
    'personal_goal',
    'team_goal'
);


ALTER TYPE public.enum_kpi_trackers_type OWNER TO upcoach;

--
-- Name: enum_user_analytics_periodType; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public."enum_user_analytics_periodType" AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'quarterly'
);


ALTER TYPE public."enum_user_analytics_periodType" OWNER TO upcoach;

--
-- Name: flag_status; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.flag_status AS ENUM (
    'open',
    'in_review',
    'resolved',
    'escalated'
);


ALTER TYPE public.flag_status OWNER TO upcoach;

--
-- Name: flag_type; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.flag_type AS ENUM (
    'inactivity',
    'content_issue',
    'support_request',
    'technical_error',
    'billing_issue'
);


ALTER TYPE public.flag_type OWNER TO upcoach;

--
-- Name: mood_level; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.mood_level AS ENUM (
    'very_bad',
    'bad',
    'neutral',
    'good',
    'very_good'
);


ALTER TYPE public.mood_level OWNER TO upcoach;

--
-- Name: subscription_plan; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.subscription_plan AS ENUM (
    'free',
    'pro',
    'team',
    'enterprise'
);


ALTER TYPE public.subscription_plan OWNER TO upcoach;

--
-- Name: task_status; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.task_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.task_status OWNER TO upcoach;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: upcoach
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'coach',
    'admin',
    'moderator'
);


ALTER TYPE public.user_role OWNER TO upcoach;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: upcoach
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO upcoach;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO upcoach;

--
-- Name: avatars; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.avatars (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.avatars OWNER TO upcoach;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    google_event_id character varying(255),
    title character varying(255) NOT NULL,
    description text,
    event_type character varying(50),
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location text,
    attendees jsonb,
    reminders jsonb,
    is_recurring boolean DEFAULT false,
    recurrence_rule text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.calendar_events OWNER TO upcoach;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    coaching_plan_id uuid,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    message_type character varying(50) DEFAULT 'text'::character varying,
    metadata jsonb,
    is_flagged boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.chat_messages OWNER TO upcoach;

--
-- Name: coach_memories; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.coach_memories (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "avatarId" uuid NOT NULL,
    "sessionId" uuid NOT NULL,
    "memoryType" public."enum_coach_memories_memoryType" NOT NULL,
    content text NOT NULL,
    summary character varying(500) NOT NULL,
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "emotionalContext" jsonb DEFAULT '{"mood": "neutral", "sentiment": 0, "emotionalTrends": []}'::jsonb NOT NULL,
    "coachingContext" jsonb DEFAULT '{"topic": "", "category": "general", "importance": 5, "actionItems": [], "followUpNeeded": false}'::jsonb NOT NULL,
    "conversationDate" timestamp with time zone NOT NULL,
    "lastReferencedDate" timestamp with time zone,
    "expiryDate" timestamp with time zone,
    importance integer DEFAULT 5 NOT NULL,
    "relevanceScore" double precision DEFAULT '0.5'::double precision NOT NULL,
    "accessCount" integer DEFAULT 0 NOT NULL,
    "relatedMemoryIds" uuid[] DEFAULT ARRAY[]::uuid[],
    "parentMemoryId" uuid,
    "childMemoryIds" uuid[] DEFAULT ARRAY[]::uuid[],
    "aiProcessed" boolean DEFAULT false NOT NULL,
    "insightsGenerated" character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.coach_memories OWNER TO upcoach;

--
-- Name: COLUMN coach_memories."sessionId"; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.coach_memories."sessionId" IS 'Coaching session identifier';


--
-- Name: COLUMN coach_memories.content; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.coach_memories.content IS 'Full content of the memory/conversation';


--
-- Name: COLUMN coach_memories.summary; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.coach_memories.summary IS 'Concise summary of the memory';


--
-- Name: COLUMN coach_memories.tags; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.coach_memories.tags IS 'Keywords and tags for categorization';


--
-- Name: COLUMN coach_memories."expiryDate"; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.coach_memories."expiryDate" IS 'When this memory should be considered expired';


--
-- Name: coach_personas; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.coach_personas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    avatar_url text,
    personality_type character varying(50),
    communication_style text,
    strengths text[],
    voice_sample_url text,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.coach_personas OWNER TO upcoach;

--
-- Name: coaching_plans; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.coaching_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    goal_type character varying(100),
    start_date date NOT NULL,
    end_date date,
    status character varying(50) DEFAULT 'active'::character varying,
    progress_percentage integer DEFAULT 0,
    coach_avatar character varying(50),
    cohort character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.coaching_plans OWNER TO upcoach;

--
-- Name: flags; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.flags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    flagged_by uuid,
    flag_type public.flag_type NOT NULL,
    flag_status public.flag_status DEFAULT 'open'::public.flag_status,
    title character varying(255) NOT NULL,
    description text,
    priority integer DEFAULT 3,
    assigned_to uuid,
    resolved_at timestamp with time zone,
    resolution_notes text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.flags OWNER TO upcoach;

--
-- Name: goals; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    coaching_plan_id uuid,
    title character varying(255) NOT NULL,
    description text,
    target_date date,
    progress_percentage integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    kpi_metrics jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.goals OWNER TO upcoach;

--
-- Name: kpi_trackers; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.kpi_trackers (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "organizationId" uuid,
    type public.enum_kpi_trackers_type NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    category public.enum_kpi_trackers_category NOT NULL,
    objective text,
    "keyResults" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "kpiData" jsonb,
    "startDate" timestamp with time zone NOT NULL,
    "endDate" timestamp with time zone NOT NULL,
    "reviewFrequency" public."enum_kpi_trackers_reviewFrequency" DEFAULT 'weekly'::public."enum_kpi_trackers_reviewFrequency" NOT NULL,
    "lastReviewDate" timestamp with time zone,
    "nextReviewDate" timestamp with time zone NOT NULL,
    "overallProgress" integer DEFAULT 0 NOT NULL,
    status public.enum_kpi_trackers_status DEFAULT 'not_started'::public.enum_kpi_trackers_status NOT NULL,
    milestones jsonb DEFAULT '[]'::jsonb NOT NULL,
    "performanceHistory" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "coachingData" jsonb DEFAULT '{"actionItems": [], "coachingNotes": [], "coachingFrequency": "weekly"}'::jsonb NOT NULL,
    analytics jsonb DEFAULT '{"riskFactors": [], "velocityScore": 0.5, "successFactors": [], "averageProgress": 0, "recommendations": [], "consistencyScore": 0.5}'::jsonb NOT NULL,
    collaborators jsonb DEFAULT '[]'::jsonb NOT NULL,
    priority public.enum_kpi_trackers_priority DEFAULT 'medium'::public.enum_kpi_trackers_priority NOT NULL,
    confidentiality public.enum_kpi_trackers_confidentiality DEFAULT 'private'::public.enum_kpi_trackers_confidentiality NOT NULL,
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[] NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.kpi_trackers OWNER TO upcoach;

--
-- Name: COLUMN kpi_trackers."organizationId"; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.kpi_trackers."organizationId" IS 'For enterprise users';


--
-- Name: COLUMN kpi_trackers.objective; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.kpi_trackers.objective IS 'For OKR type goals';


--
-- Name: COLUMN kpi_trackers."kpiData"; Type: COMMENT; Schema: public; Owner: upcoach
--

COMMENT ON COLUMN public.kpi_trackers."kpiData" IS 'For KPI type goals';


--
-- Name: learning_content; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.learning_content (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    content_type character varying(50) NOT NULL,
    content_url text,
    thumbnail_url text,
    duration integer,
    category character varying(100),
    tags text[],
    difficulty_level character varying(20),
    is_published boolean DEFAULT false,
    view_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.learning_content OWNER TO upcoach;

--
-- Name: meeting_notes; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.meeting_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255),
    content text,
    original_file_url text,
    processed_content jsonb,
    extracted_tasks uuid[],
    meeting_date timestamp with time zone,
    attendees text[],
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.meeting_notes OWNER TO upcoach;

--
-- Name: mood_entries; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.mood_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    mood_level public.mood_level NOT NULL,
    energy_level integer,
    stress_level integer,
    notes text,
    factors text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mood_entries_energy_level_check CHECK (((energy_level >= 1) AND (energy_level <= 10))),
    CONSTRAINT mood_entries_stress_level_check CHECK (((stress_level >= 1) AND (stress_level <= 10)))
);


ALTER TABLE public.mood_entries OWNER TO upcoach;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    data jsonb,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO upcoach;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    coaching_plan_id uuid,
    title character varying(255) NOT NULL,
    description text,
    status public.task_status DEFAULT 'pending'::public.task_status,
    priority integer DEFAULT 3,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    estimated_duration integer,
    actual_duration integer,
    category character varying(100),
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO upcoach;

--
-- Name: user_analytics; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.user_analytics (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "periodType" public."enum_user_analytics_periodType" NOT NULL,
    "periodStart" timestamp with time zone NOT NULL,
    "periodEnd" timestamp with time zone NOT NULL,
    "engagementMetrics" jsonb DEFAULT '{"streakCount": 0, "totalDuration": 0, "totalSessions": 0, "missedSessions": 0, "responsiveness": 0.5, "followThroughRate": 0.5, "participationScore": 0.5, "averageSessionDuration": 0}'::jsonb NOT NULL,
    "coachingMetrics" jsonb DEFAULT '{"avatarId": "", "goalsSet": 0, "goalsAchieved": 0, "progressMetrics": {"habitFormation": 0.5, "stressReduction": 0.5, "skillImprovement": 0.5, "confidenceIncrease": 0.5}, "avatarSwitchCount": 0, "goalCompletionRate": 0, "avatarEffectivenessScore": 0.5}'::jsonb NOT NULL,
    "behavioralData" jsonb DEFAULT '{"moodTrends": [], "challengeAreas": [], "topicsOfInterest": [], "preferredDuration": 30, "communicationStyle": "supportive", "learningPreferences": {"visualLearner": 0.33, "auditoryLearner": 0.33, "kinestheticLearner": 0.33}, "preferredSessionTime": "morning"}'::jsonb NOT NULL,
    "kpiMetrics" jsonb DEFAULT '{"npsScore": 0, "churnRisk": 0.2, "customKpis": [], "retentionProbability": 0.7, "userSatisfactionScore": 7}'::jsonb NOT NULL,
    "benchmarkData" jsonb DEFAULT '{"personalBest": 0.5, "userPercentile": 50, "industryBenchmark": 0.5}'::jsonb NOT NULL,
    "aiInsights" jsonb DEFAULT '{"riskFactors": [], "strengthAreas": [], "improvementAreas": [], "predictedOutcomes": [], "recommendedActions": []}'::jsonb NOT NULL,
    "calculatedAt" timestamp with time zone NOT NULL,
    "nextCalculationDate" timestamp with time zone NOT NULL,
    "dataQualityScore" double precision DEFAULT '0.8'::double precision NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.user_analytics OWNER TO upcoach;

--
-- Name: user_learning_progress; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.user_learning_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    progress_percentage integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    time_spent integer DEFAULT 0,
    last_accessed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_learning_progress OWNER TO upcoach;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    notifications_enabled boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    coaching_reminders boolean DEFAULT true,
    mood_check_reminders boolean DEFAULT true,
    preferred_coach_avatar character varying(50),
    coach_personality_type character varying(50),
    language character varying(10) DEFAULT 'en'::character varying,
    theme character varying(20) DEFAULT 'light'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_preferences OWNER TO upcoach;

--
-- Name: users; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    encrypted_password character varying(255),
    google_id character varying(255),
    role public.user_role DEFAULT 'user'::public.user_role,
    subscription_plan public.subscription_plan DEFAULT 'free'::public.subscription_plan,
    full_name character varying(255),
    avatar_url text,
    phone character varying(50),
    department character varying(100),
    job_title character varying(100),
    company character varying(100),
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    onboarding_completed boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO upcoach;

--
-- Name: weekly_reports; Type: TABLE; Schema: public; Owner: upcoach
--

CREATE TABLE public.weekly_reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    week_start_date date NOT NULL,
    week_end_date date NOT NULL,
    tasks_completed integer DEFAULT 0,
    tasks_pending integer DEFAULT 0,
    mood_average numeric(3,2),
    key_achievements text[],
    challenges text[],
    next_week_priorities text[],
    coach_feedback text,
    report_data jsonb,
    export_url text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.weekly_reports OWNER TO upcoach;

--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public."SequelizeMeta" (name) FROM stdin;
20241201000000-create-coach-intelligence-tables.js
\.


--
-- Data for Name: avatars; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.avatars (id, name, created_at) FROM stdin;
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.calendar_events (id, user_id, google_event_id, title, description, event_type, start_time, end_time, location, attendees, reminders, is_recurring, recurrence_rule, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.chat_messages (id, user_id, coaching_plan_id, role, content, message_type, metadata, is_flagged, created_at) FROM stdin;
\.


--
-- Data for Name: coach_memories; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.coach_memories (id, "userId", "avatarId", "sessionId", "memoryType", content, summary, tags, "emotionalContext", "coachingContext", "conversationDate", "lastReferencedDate", "expiryDate", importance, "relevanceScore", "accessCount", "relatedMemoryIds", "parentMemoryId", "childMemoryIds", "aiProcessed", "insightsGenerated", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: coach_personas; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.coach_personas (id, name, avatar_url, personality_type, communication_style, strengths, voice_sample_url, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: coaching_plans; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.coaching_plans (id, user_id, name, description, goal_type, start_date, end_date, status, progress_percentage, coach_avatar, cohort, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flags; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.flags (id, user_id, flagged_by, flag_type, flag_status, title, description, priority, assigned_to, resolved_at, resolution_notes, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.goals (id, user_id, coaching_plan_id, title, description, target_date, progress_percentage, is_completed, completed_at, kpi_metrics, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kpi_trackers; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.kpi_trackers (id, "userId", "organizationId", type, title, description, category, objective, "keyResults", "kpiData", "startDate", "endDate", "reviewFrequency", "lastReviewDate", "nextReviewDate", "overallProgress", status, milestones, "performanceHistory", "coachingData", analytics, collaborators, priority, confidentiality, tags, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: learning_content; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.learning_content (id, title, description, content_type, content_url, thumbnail_url, duration, category, tags, difficulty_level, is_published, view_count, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: meeting_notes; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.meeting_notes (id, user_id, title, content, original_file_url, processed_content, extracted_tasks, meeting_date, attendees, tags, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mood_entries; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.mood_entries (id, user_id, mood_level, energy_level, stress_level, notes, factors, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.tasks (id, user_id, coaching_plan_id, title, description, status, priority, due_date, completed_at, estimated_duration, actual_duration, category, tags, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_analytics; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.user_analytics (id, "userId", "periodType", "periodStart", "periodEnd", "engagementMetrics", "coachingMetrics", "behavioralData", "kpiMetrics", "benchmarkData", "aiInsights", "calculatedAt", "nextCalculationDate", "dataQualityScore", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_learning_progress; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.user_learning_progress (id, user_id, content_id, progress_percentage, is_completed, completed_at, time_spent, last_accessed_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.user_preferences (id, user_id, notifications_enabled, email_notifications, push_notifications, coaching_reminders, mood_check_reminders, preferred_coach_avatar, coach_personality_type, language, theme, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.users (id, email, encrypted_password, google_id, role, subscription_plan, full_name, avatar_url, phone, department, job_title, company, timezone, onboarding_completed, is_active, last_login_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: weekly_reports; Type: TABLE DATA; Schema: public; Owner: upcoach
--

COPY public.weekly_reports (id, user_id, week_start_date, week_end_date, tasks_completed, tasks_pending, mood_average, key_achievements, challenges, next_week_priorities, coach_feedback, report_data, export_url, created_at) FROM stdin;
\.


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: coach_memories coach_memories_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.coach_memories
    ADD CONSTRAINT coach_memories_pkey PRIMARY KEY (id);


--
-- Name: coach_personas coach_personas_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.coach_personas
    ADD CONSTRAINT coach_personas_pkey PRIMARY KEY (id);


--
-- Name: coaching_plans coaching_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.coaching_plans
    ADD CONSTRAINT coaching_plans_pkey PRIMARY KEY (id);


--
-- Name: flags flags_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: kpi_trackers kpi_trackers_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.kpi_trackers
    ADD CONSTRAINT kpi_trackers_pkey PRIMARY KEY (id);


--
-- Name: learning_content learning_content_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.learning_content
    ADD CONSTRAINT learning_content_pkey PRIMARY KEY (id);


--
-- Name: meeting_notes meeting_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_pkey PRIMARY KEY (id);


--
-- Name: mood_entries mood_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.mood_entries
    ADD CONSTRAINT mood_entries_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_analytics user_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_pkey PRIMARY KEY (id);


--
-- Name: user_learning_progress user_learning_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_learning_progress
    ADD CONSTRAINT user_learning_progress_pkey PRIMARY KEY (id);


--
-- Name: user_learning_progress user_learning_progress_user_id_content_id_key; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_learning_progress
    ADD CONSTRAINT user_learning_progress_user_id_content_id_key UNIQUE (user_id, content_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weekly_reports weekly_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.weekly_reports
    ADD CONSTRAINT weekly_reports_pkey PRIMARY KEY (id);


--
-- Name: weekly_reports weekly_reports_user_id_week_start_date_key; Type: CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.weekly_reports
    ADD CONSTRAINT weekly_reports_user_id_week_start_date_key UNIQUE (user_id, week_start_date);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_chat_messages_user_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- Name: idx_coach_memories_avatar_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_avatar_id ON public.coach_memories USING btree ("avatarId");


--
-- Name: idx_coach_memories_date; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_date ON public.coach_memories USING btree ("conversationDate");


--
-- Name: idx_coach_memories_importance; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_importance ON public.coach_memories USING btree (importance);


--
-- Name: idx_coach_memories_relevance; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_relevance ON public.coach_memories USING btree ("relevanceScore");


--
-- Name: idx_coach_memories_session_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_session_id ON public.coach_memories USING btree ("sessionId");


--
-- Name: idx_coach_memories_tags; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_tags ON public.coach_memories USING gin (tags);


--
-- Name: idx_coach_memories_type; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_type ON public.coach_memories USING btree ("memoryType");


--
-- Name: idx_coach_memories_user_date; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_user_date ON public.coach_memories USING btree ("userId", "conversationDate");


--
-- Name: idx_coach_memories_user_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_coach_memories_user_id ON public.coach_memories USING btree ("userId");


--
-- Name: idx_flags_status; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_flags_status ON public.flags USING btree (flag_status);


--
-- Name: idx_kpi_trackers_category; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_category ON public.kpi_trackers USING btree (category);


--
-- Name: idx_kpi_trackers_end_date; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_end_date ON public.kpi_trackers USING btree ("endDate");


--
-- Name: idx_kpi_trackers_next_review; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_next_review ON public.kpi_trackers USING btree ("nextReviewDate");


--
-- Name: idx_kpi_trackers_priority; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_priority ON public.kpi_trackers USING btree (priority);


--
-- Name: idx_kpi_trackers_status; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_status ON public.kpi_trackers USING btree (status);


--
-- Name: idx_kpi_trackers_tags; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_tags ON public.kpi_trackers USING gin (tags);


--
-- Name: idx_kpi_trackers_type; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_type ON public.kpi_trackers USING btree (type);


--
-- Name: idx_kpi_trackers_user_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_user_id ON public.kpi_trackers USING btree ("userId");


--
-- Name: idx_kpi_trackers_user_status; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_kpi_trackers_user_status ON public.kpi_trackers USING btree ("userId", status);


--
-- Name: idx_learning_content_category; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_learning_content_category ON public.learning_content USING btree (category);


--
-- Name: idx_mood_entries_created_at; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_mood_entries_created_at ON public.mood_entries USING btree (created_at);


--
-- Name: idx_mood_entries_user_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_mood_entries_user_id ON public.mood_entries USING btree (user_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_tasks_user_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);


--
-- Name: idx_user_analytics_calculated_at; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_user_analytics_calculated_at ON public.user_analytics USING btree ("calculatedAt");


--
-- Name: idx_user_analytics_next_calculation; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_user_analytics_next_calculation ON public.user_analytics USING btree ("nextCalculationDate");


--
-- Name: idx_user_analytics_period; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_user_analytics_period ON public.user_analytics USING btree ("periodStart", "periodEnd");


--
-- Name: idx_user_analytics_period_type; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_user_analytics_period_type ON public.user_analytics USING btree ("periodType");


--
-- Name: idx_user_analytics_user_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_user_analytics_user_id ON public.user_analytics USING btree ("userId");


--
-- Name: idx_user_analytics_user_period; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE UNIQUE INDEX idx_user_analytics_user_period ON public.user_analytics USING btree ("userId", "periodType", "periodStart");


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: upcoach
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: calendar_events update_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: coach_personas update_coach_personas_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_coach_personas_updated_at BEFORE UPDATE ON public.coach_personas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: coaching_plans update_coaching_plans_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_coaching_plans_updated_at BEFORE UPDATE ON public.coaching_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: flags update_flags_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_flags_updated_at BEFORE UPDATE ON public.flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: goals update_goals_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: learning_content update_learning_content_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_learning_content_updated_at BEFORE UPDATE ON public.learning_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meeting_notes update_meeting_notes_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON public.meeting_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: upcoach
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_events calendar_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_coaching_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_coaching_plan_id_fkey FOREIGN KEY (coaching_plan_id) REFERENCES public.coaching_plans(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: coach_memories coach_memories_avatarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.coach_memories
    ADD CONSTRAINT "coach_memories_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES public.avatars(id) ON DELETE SET NULL;


--
-- Name: coach_memories coach_memories_parentMemoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.coach_memories
    ADD CONSTRAINT "coach_memories_parentMemoryId_fkey" FOREIGN KEY ("parentMemoryId") REFERENCES public.coach_memories(id) ON DELETE SET NULL;


--
-- Name: coach_memories coach_memories_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.coach_memories
    ADD CONSTRAINT "coach_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: coaching_plans coaching_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.coaching_plans
    ADD CONSTRAINT coaching_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: flags flags_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: flags flags_flagged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id);


--
-- Name: flags flags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.flags
    ADD CONSTRAINT flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: goals goals_coaching_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_coaching_plan_id_fkey FOREIGN KEY (coaching_plan_id) REFERENCES public.coaching_plans(id) ON DELETE SET NULL;


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: kpi_trackers kpi_trackers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.kpi_trackers
    ADD CONSTRAINT "kpi_trackers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: learning_content learning_content_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.learning_content
    ADD CONSTRAINT learning_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: meeting_notes meeting_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.meeting_notes
    ADD CONSTRAINT meeting_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mood_entries mood_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.mood_entries
    ADD CONSTRAINT mood_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_coaching_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_coaching_plan_id_fkey FOREIGN KEY (coaching_plan_id) REFERENCES public.coaching_plans(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_analytics user_analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT "user_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_learning_progress user_learning_progress_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_learning_progress
    ADD CONSTRAINT user_learning_progress_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.learning_content(id) ON DELETE CASCADE;


--
-- Name: user_learning_progress user_learning_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_learning_progress
    ADD CONSTRAINT user_learning_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: weekly_reports weekly_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: upcoach
--

ALTER TABLE ONLY public.weekly_reports
    ADD CONSTRAINT weekly_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OnjsTNFdbS0yL8nseAoFU0DR1n9s8Sg6MuXtguIhTjlRLT3AFKGLpfyxIFB58rL

