export type UserRole = 'user' | 'admin' | 'coach';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'finance';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type GoalCategory = 'career' | 'health' | 'personal' | 'financial' | 'education';
export type MoodLevel = 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
export type MoodCategory = 'work' | 'health' | 'social' | 'personal' | 'family';
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    preferences: Record<string, any>;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface RefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
}
export interface Task {
    id: string;
    userId: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    dueDate?: Date;
    completedAt?: Date;
    tags: string[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    priority: GoalPriority;
    status: GoalStatus;
    category: GoalCategory;
    targetDate?: Date;
    completedAt?: Date;
    progressPercentage: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface GoalMilestone {
    id: string;
    goalId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    completedAt?: Date;
    isCompleted: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface MoodEntry {
    id: string;
    userId: string;
    level: MoodLevel;
    category: MoodCategory;
    notes?: string;
    activities: string[];
    metadata: Record<string, any>;
    timestamp: Date;
    createdAt: Date;
}
export interface ChatConversation {
    id: string;
    userId: string;
    title?: string;
    isActive: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ChatMessage {
    id: string;
    conversationId: string;
    content: string;
    isFromUser: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface UserStatistics {
    id: string;
    userId: string;
    date: Date;
    tasksCompleted: number;
    goalsAchieved: number;
    moodEntries: number;
    chatMessages: number;
    activeTimeMinutes: number;
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface AuditLog {
    id: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export interface CreateUserDto {
    email: string;
    password: string;
    name: string;
    bio?: string;
}
export interface UpdateUserDto {
    name?: string;
    bio?: string;
    avatarUrl?: string;
    preferences?: Record<string, any>;
}
export interface CreateTaskDto {
    title: string;
    description?: string;
    priority?: TaskPriority;
    category?: TaskCategory;
    dueDate?: string;
    tags?: string[];
}
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    category?: TaskCategory;
    dueDate?: string;
    tags?: string[];
}
export interface CreateGoalDto {
    title: string;
    description?: string;
    priority?: GoalPriority;
    category?: GoalCategory;
    targetDate?: string;
}
export interface UpdateGoalDto {
    title?: string;
    description?: string;
    priority?: GoalPriority;
    status?: GoalStatus;
    category?: GoalCategory;
    targetDate?: string;
    progressPercentage?: number;
}
export interface CreateGoalMilestoneDto {
    title: string;
    description?: string;
    targetDate?: string;
    sortOrder?: number;
}
export interface UpdateGoalMilestoneDto {
    title?: string;
    description?: string;
    targetDate?: string;
    isCompleted?: boolean;
    sortOrder?: number;
}
export interface CreateMoodEntryDto {
    level: MoodLevel;
    category?: MoodCategory;
    notes?: string;
    activities?: string[];
}
export interface ChatMessageDto {
    content: string;
    conversationId?: string;
}
export interface UserResponseDto {
    id: string;
    email: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
    role: UserRole;
    isEmailVerified: boolean;
    preferences: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface TaskResponseDto {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    dueDate?: Date;
    completedAt?: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface GoalResponseDto {
    id: string;
    title: string;
    description?: string;
    priority: GoalPriority;
    status: GoalStatus;
    category: GoalCategory;
    targetDate?: Date;
    completedAt?: Date;
    progressPercentage: number;
    milestones?: GoalMilestone[];
    createdAt: Date;
    updatedAt: Date;
}
export interface MoodEntryResponseDto {
    id: string;
    level: MoodLevel;
    category: MoodCategory;
    notes?: string;
    activities: string[];
    timestamp: Date;
    createdAt: Date;
}
export interface ChatConversationResponseDto {
    id: string;
    title?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages?: ChatMessage[];
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface TaskFilters extends PaginationParams {
    status?: TaskStatus;
    priority?: TaskPriority;
    category?: TaskCategory;
    dueBefore?: string;
    dueAfter?: string;
    search?: string;
}
export interface GoalFilters extends PaginationParams {
    status?: GoalStatus;
    priority?: GoalPriority;
    category?: GoalCategory;
    targetBefore?: string;
    targetAfter?: string;
    search?: string;
}
export interface MoodFilters extends PaginationParams {
    level?: MoodLevel;
    category?: MoodCategory;
    dateFrom?: string;
    dateTo?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
//# sourceMappingURL=database.d.ts.map