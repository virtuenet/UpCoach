"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictiveAnalytics = exports.PredictiveAnalytics = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const Chat_1 = require("../../models/Chat");
const ChatMessage_1 = require("../../models/ChatMessage");
const Goal_1 = require("../../models/Goal");
const Mood_1 = require("../../models/Mood");
const Task_1 = require("../../models/Task");
const UserProfile_1 = require("../../models/UserProfile");
const logger_1 = require("../../utils/logger");
const AIService_1 = require("./AIService");
const CacheService_1 = require("./CacheService");
class PredictiveAnalytics {
    async predictUserSuccess(userId) {
        try {
            const userData = await this.gatherUserData(userId);
            const patterns = await this.analyzeBehaviorPatterns(userData);
            const successIndicators = this.calculateSuccessIndicators(userData, patterns);
            const prediction = await this.generateSuccessPrediction(userData, patterns, successIndicators);
            return prediction;
        }
        catch (error) {
            logger_1.logger.error('Error predicting user success:', error);
            throw error;
        }
    }
    async predictChurnRisk(userId) {
        try {
            const userData = await this.gatherUserData(userId);
            const engagementMetrics = await this.calculateEngagementMetrics(userData);
            const indicators = [];
            let riskScore = 0;
            if (engagementMetrics.trend === 'decreasing') {
                indicators.push('Engagement declining over past 2 weeks');
                riskScore += 0.3;
            }
            const incompletionRate = userData.tasks.filter((t) => t.status !== 'completed').length /
                Math.max(1, userData.tasks.length);
            if (incompletionRate > 0.7) {
                indicators.push('High task incompletion rate');
                riskScore += 0.25;
            }
            if (userData.avgMoodTrend < 0) {
                indicators.push('Declining mood patterns');
                riskScore += 0.2;
            }
            if (engagementMetrics.sessionFrequency < 2) {
                indicators.push('Less than 2 sessions per week');
                riskScore += 0.25;
            }
            const recentGoals = userData.goals.filter((g) => new Date(g.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
            if (recentGoals.length === 0) {
                indicators.push('No new goals in past month');
                riskScore += 0.15;
            }
            let severity;
            if (riskScore < 0.3)
                severity = 'low';
            else if (riskScore < 0.6)
                severity = 'medium';
            else
                severity = 'high';
            const timeToIntervention = severity === 'high' ? 1 : severity === 'medium' ? 3 : 7;
            const mitigationStrategies = this.generateMitigationStrategies(indicators, severity, userData);
            return {
                riskType: 'churn',
                severity,
                probability: Math.min(0.95, riskScore),
                indicators,
                mitigationStrategies,
                timeToIntervention,
            };
        }
        catch (error) {
            logger_1.logger.error('Error predicting churn risk:', error);
            throw error;
        }
    }
    async predictGoalCompletion(goalId) {
        try {
            const goal = await Goal_1.Goal.findByPk(goalId);
            if (!goal)
                throw new Error('Goal not found');
            const tasks = await Task_1.Task.findAll({
                where: {
                    goalId,
                    createdAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                order: [['createdAt', 'DESC']],
            });
            const progressVelocity = this.calculateProgressVelocity(goal, tasks);
            const completionPatterns = this.analyzeCompletionPatterns(tasks);
            let probability = 0.5;
            if (goal.progress > 70)
                probability += 0.3;
            else if (goal.progress > 40)
                probability += 0.15;
            if (progressVelocity > 10)
                probability += 0.2;
            else if (progressVelocity > 5)
                probability += 0.1;
            else if (progressVelocity < 2)
                probability -= 0.2;
            if (completionPatterns.consistency > 0.7)
                probability += 0.15;
            else if (completionPatterns.consistency < 0.3)
                probability -= 0.15;
            probability = Math.max(0.1, Math.min(0.95, probability));
            const remainingProgress = 100 - goal.progress;
            const weeksToComplete = progressVelocity > 0 ? remainingProgress / progressVelocity : 52;
            const estimatedCompletionDate = new Date();
            estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + weeksToComplete * 7);
            const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
            const weeksRemaining = targetDate
                ? Math.max(1, (targetDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
                : weeksToComplete;
            const requiredWeeklyProgress = remainingProgress / weeksRemaining;
            const { obstacles, accelerators } = await this.identifyGoalFactors(goal, tasks, completionPatterns);
            return {
                probability,
                estimatedCompletionDate,
                requiredWeeklyProgress,
                obstacles,
                accelerators,
            };
        }
        catch (error) {
            logger_1.logger.error('Error predicting goal completion:', error);
            throw error;
        }
    }
    async analyzeBehaviorPatterns(userId) {
        const userData = await this.gatherUserData(userId);
        const patterns = [];
        const taskPattern = this.analyzeTaskPatterns(userData.tasks);
        patterns.push(taskPattern);
        const moodPattern = this.analyzeMoodPatterns(userData.moods);
        patterns.push(moodPattern);
        const engagementPattern = await this.analyzeEngagementPatterns(userId);
        patterns.push(engagementPattern);
        const goalPattern = this.analyzeGoalPatterns(userData.goals);
        patterns.push(goalPattern);
        const timePattern = await this.analyzeTimePatterns(userData);
        patterns.push(timePattern);
        return patterns;
    }
    async gatherUserData(userId) {
        const [goals, tasks, moods, profile, messages] = await Promise.all([
            Goal_1.Goal.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
                limit: 50,
            }),
            Task_1.Task.findAll({
                where: {
                    userId,
                    createdAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                    },
                },
                order: [['createdAt', 'DESC']],
            }),
            Mood_1.Mood.findAll({
                where: {
                    userId,
                    createdAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                order: [['createdAt', 'DESC']],
            }),
            UserProfile_1.UserProfile.findOne({ where: { userId } }),
            ChatMessage_1.ChatMessage.count({
                include: [
                    {
                        model: Chat_1.Chat,
                        as: 'chat',
                        where: { userId },
                    },
                ],
                where: {
                    createdAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        const avgMoodTrend = this.calculateMoodTrend(moods);
        return {
            goals,
            tasks,
            moods,
            profile,
            messageCount: messages,
            avgMoodTrend,
        };
    }
    calculateSuccessIndicators(userData, patterns) {
        const indicators = {
            consistencyScore: 0,
            progressRate: 0,
            engagementLevel: 0,
            adaptability: 0,
            resilience: 0,
        };
        const taskPattern = patterns.find(p => p.pattern === 'task_completion');
        if (taskPattern) {
            indicators.consistencyScore = taskPattern.frequency;
        }
        const completedGoals = userData.goals.filter((g) => g.status === 'completed');
        indicators.progressRate =
            userData.goals.length > 0 ? completedGoals.length / userData.goals.length : 0;
        const engagementPattern = patterns.find(p => p.pattern === 'engagement');
        if (engagementPattern) {
            indicators.engagementLevel = engagementPattern.frequency;
        }
        const strategyChanges = this.detectStrategyChanges(userData.tasks);
        indicators.adaptability = Math.min(1, strategyChanges / 10);
        const resilienceScore = this.calculateResilience(userData);
        indicators.resilience = resilienceScore;
        return indicators;
    }
    async generateSuccessPrediction(userData, patterns, indicators) {
        let probability = 0.5;
        probability += indicators.consistencyScore * 0.2;
        probability += indicators.progressRate * 0.15;
        probability += indicators.engagementLevel * 0.15;
        probability += indicators.adaptability * 0.1;
        probability += indicators.resilience * 0.1;
        const positivePatterns = patterns.filter((p) => p.impact === 'positive');
        const negativePatterns = patterns.filter((p) => p.impact === 'negative');
        probability += positivePatterns.length * 0.05;
        probability -= negativePatterns.length * 0.05;
        probability = Math.max(0.1, Math.min(0.95, probability));
        const timeframe = probability > 0.7 ? '30 days' : probability > 0.5 ? '60 days' : '90 days';
        const factors = {
            positive: this.extractPositiveFactors(userData, patterns, indicators),
            negative: this.extractNegativeFactors(userData, patterns, indicators),
        };
        const recommendations = await this.generatePersonalizedRecommendations(userData, patterns, indicators, probability);
        const dataPoints = userData.tasks.length + userData.goals.length + userData.moods.length;
        const confidence = Math.min(0.95, 0.5 + dataPoints / 200);
        return {
            type: 'success',
            probability,
            timeframe,
            factors,
            recommendations,
            confidence,
        };
    }
    calculateEngagementMetrics(userData) {
        const recentTasks = userData.tasks.filter((t) => new Date(t.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
        const olderTasks = userData.tasks.filter((t) => new Date(t.createdAt) <= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
            new Date(t.createdAt) > new Date(Date.now() - 28 * 24 * 60 * 60 * 1000));
        const recentEngagement = recentTasks.length;
        const olderEngagement = olderTasks.length;
        let trend;
        if (recentEngagement > olderEngagement * 1.2)
            trend = 'increasing';
        else if (recentEngagement < olderEngagement * 0.8)
            trend = 'decreasing';
        else
            trend = 'stable';
        const uniqueDays = new Set(userData.tasks.map((t) => new Date(t.createdAt).toDateString()))
            .size;
        const weeksCovered = Math.max(1, (Date.now() -
            new Date(userData.tasks[userData.tasks.length - 1]?.createdAt || Date.now()).getTime()) /
            (7 * 24 * 60 * 60 * 1000));
        const sessionFrequency = uniqueDays / weeksCovered;
        return {
            trend,
            sessionFrequency,
            recentEngagement,
            totalEngagement: userData.tasks.length,
        };
    }
    generateMitigationStrategies(indicators, severity, _userData) {
        const strategies = [];
        if (indicators.includes('Engagement declining over past 2 weeks')) {
            strategies.push('Send personalized re-engagement message highlighting past successes');
            strategies.push('Offer a quick win challenge to rebuild momentum');
        }
        if (indicators.includes('High task incompletion rate')) {
            strategies.push('Suggest breaking down tasks into smaller, more manageable pieces');
            strategies.push('Implement daily check-ins with simplified goals');
        }
        if (indicators.includes('Declining mood patterns')) {
            strategies.push('Introduce mood-boosting activities and wellness checks');
            strategies.push('Recommend connecting with support resources');
        }
        if (indicators.includes('Less than 2 sessions per week')) {
            strategies.push('Set up gentle reminder notifications at optimal times');
            strategies.push('Create a 5-minute daily habit to maintain connection');
        }
        if (severity === 'high') {
            strategies.unshift('Immediate personal outreach with empathetic support');
            strategies.push('Offer free coaching session or consultation');
        }
        return strategies;
    }
    calculateProgressVelocity(goal, tasks) {
        if (tasks.length === 0)
            return 0;
        const weeklyProgress = [];
        const weeks = 4;
        for (let i = 0; i < weeks; i++) {
            const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
            const weekTasks = tasks.filter((t) => new Date(t.createdAt) >= weekStart &&
                new Date(t.createdAt) < weekEnd &&
                t.status === 'completed');
            weeklyProgress.push(weekTasks.length);
        }
        const avgProgress = weeklyProgress.reduce((sum, p) => sum + p, 0) / weeks;
        const progressPerTask = goal.progress / Math.max(1, tasks.filter((t) => t.status === 'completed').length);
        return avgProgress * progressPerTask;
    }
    analyzeCompletionPatterns(tasks) {
        const completedTasks = tasks.filter((t) => t.status === 'completed');
        const totalTasks = tasks.length;
        const consistency = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
        const completionTimes = completedTasks.map((t) => {
            const created = new Date(t.createdAt).getTime();
            const completed = new Date(t.completedAt || t.updatedAt).getTime();
            return (completed - created) / (1000 * 60 * 60);
        });
        const avgCompletionTime = completionTimes.length > 0
            ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
            : 24;
        return {
            consistency,
            avgCompletionTime,
            totalCompleted: completedTasks.length,
            completionRate: consistency,
        };
    }
    async identifyGoalFactors(goal, tasks, patterns) {
        const obstacles = [];
        const accelerators = [];
        if (patterns.consistency < 0.5) {
            obstacles.push('Low task completion rate affecting momentum');
        }
        if (patterns.avgCompletionTime > 48) {
            obstacles.push('Tasks taking longer than expected to complete');
        }
        if (goal.progress < 20 && tasks.length > 10) {
            obstacles.push('Many tasks but limited progress - may need restructuring');
        }
        if (patterns.consistency > 0.7) {
            accelerators.push('Strong task completion consistency');
        }
        if (goal.progress > 60) {
            accelerators.push('Already past the halfway point - momentum advantage');
        }
        if (tasks.filter((t) => t.priority === 'high' && t.status === 'completed').length > 3) {
            accelerators.push('Successfully completing high-priority tasks');
        }
        try {
            const aiAnalysis = await this.getAIGoalAnalysis(goal, tasks);
            obstacles.push(...aiAnalysis.obstacles);
            accelerators.push(...aiAnalysis.accelerators);
        }
        catch (error) {
            logger_1.logger.error('Error getting AI goal analysis:', error);
        }
        return {
            obstacles: [...new Set(obstacles)].slice(0, 3),
            accelerators: [...new Set(accelerators)].slice(0, 3),
        };
    }
    async getAIGoalAnalysis(goal, tasks) {
        const prompt = `Analyze this goal and identify obstacles and accelerators:
Goal: ${goal.title}
Progress: ${goal.progress}%
Tasks completed: ${tasks.filter((t) => t.status === 'completed').length}/${tasks.length}

Provide JSON with:
- obstacles: array of 2-3 specific obstacles
- accelerators: array of 2-3 specific accelerators`;
        try {
            const response = await AIService_1.aiService.generateResponse([
                {
                    role: 'system',
                    content: 'You are an expert at analyzing goal achievement patterns. Always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ], {
                temperature: 0.3,
                maxTokens: 300,
            });
            return JSON.parse(response.content);
        }
        catch (error) {
            return { obstacles: [], accelerators: [] };
        }
    }
    analyzeTaskPatterns(tasks) {
        const completedTasks = tasks.filter((t) => t.status === 'completed');
        const frequency = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
        const recentTasks = tasks.filter(t => new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const olderTasks = tasks.filter(t => new Date(t.createdAt) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
            new Date(t.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
        let trend = 'stable';
        if (recentTasks.length > olderTasks.length * 1.2)
            trend = 'increasing';
        else if (recentTasks.length < olderTasks.length * 0.8)
            trend = 'decreasing';
        const impact = frequency > 0.7 ? 'positive' : frequency < 0.3 ? 'negative' : 'neutral';
        const insights = [];
        if (frequency > 0.8)
            insights.push('Excellent task completion rate');
        if (trend === 'increasing')
            insights.push('Task activity is increasing');
        if (completedTasks.length > 20)
            insights.push('Strong track record of completed tasks');
        return {
            pattern: 'task_completion',
            frequency,
            trend,
            impact,
            insights,
        };
    }
    analyzeMoodPatterns(moods) {
        if (moods.length === 0) {
            return {
                pattern: 'mood_tracking',
                frequency: 0,
                trend: 'stable',
                impact: 'neutral',
                insights: ['No mood data available'],
            };
        }
        const moodValues = {
            great: 5,
            good: 4,
            okay: 3,
            bad: 2,
            terrible: 1,
            happy: 5,
            content: 4,
            neutral: 3,
            stressed: 2,
            sad: 1,
        };
        const avgMood = moods.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / moods.length;
        const frequency = Math.min(1, moods.length / 30);
        const recentMoods = moods.slice(0, 7);
        const olderMoods = moods.slice(7, 14);
        const recentAvg = recentMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) /
            Math.max(1, recentMoods.length);
        const olderAvg = olderMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) /
            Math.max(1, olderMoods.length);
        const moodVariance = moods.reduce((sum, m) => {
            const value = moodValues[m.mood] || 3;
            return sum + Math.pow(value - avgMood, 2);
        }, 0) / moods.length;
        const moodVolatility = Math.sqrt(moodVariance);
        let trend = 'stable';
        if (recentAvg > olderAvg + 0.5)
            trend = 'increasing';
        else if (recentAvg < olderAvg - 0.5)
            trend = 'decreasing';
        const impact = avgMood > 3.5 ? 'positive' : avgMood < 2.5 ? 'negative' : 'neutral';
        const insights = this.generateMoodInsights(moods, avgMood, trend, moodVolatility, frequency);
        return {
            pattern: 'mood_tracking',
            frequency,
            trend,
            impact,
            insights,
        };
    }
    generateMoodInsights(moods, avgMood, trend, volatility, frequency) {
        const insights = [];
        if (avgMood > 4.2)
            insights.push('Exceptionally positive mood state');
        else if (avgMood > 3.7)
            insights.push('Generally positive mood state');
        else if (avgMood < 2.3)
            insights.push('Concerning low mood patterns detected');
        else if (avgMood < 2.8)
            insights.push('Below-average mood state needs attention');
        if (trend === 'increasing')
            insights.push('Mood is improving over time - positive momentum');
        else if (trend === 'decreasing')
            insights.push('Mood declining - may need intervention');
        if (frequency > 0.8)
            insights.push('Consistent mood tracking habit established');
        else if (frequency < 0.3)
            insights.push('Irregular mood tracking - encourage consistency');
        if (volatility > 1.5)
            insights.push('High mood volatility - consider stability strategies');
        else if (volatility < 0.5)
            insights.push('Stable mood patterns - good emotional regulation');
        const weeklyPatterns = this.analyzeWeeklyMoodPatterns(moods);
        if (weeklyPatterns.bestDay) {
            insights.push(`${weeklyPatterns.bestDay}s tend to be your best mood days`);
        }
        if (weeklyPatterns.worstDay) {
            insights.push(`${weeklyPatterns.worstDay}s show lower mood patterns`);
        }
        const energyCorrelation = this.analyzeMoodEnergyCorrelation(moods);
        if (energyCorrelation > 0.7) {
            insights.push('Strong positive correlation between mood and energy levels');
        }
        else if (energyCorrelation < -0.3) {
            insights.push('Mood and energy levels show concerning inverse relationship');
        }
        const activityInsights = this.analyzeMoodActivityCorrelations(moods);
        insights.push(...activityInsights);
        return insights.slice(0, 6);
    }
    analyzeWeeklyMoodPatterns(moods) {
        const moodValues = {
            great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
            happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1,
        };
        const dayAverages = {
            Sunday: [], Monday: [], Tuesday: [], Wednesday: [],
            Thursday: [], Friday: [], Saturday: []
        };
        moods.forEach(mood => {
            const dayName = new Date(mood.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
            const moodValue = moodValues[mood.mood] || 3;
            if (dayAverages[dayName]) {
                dayAverages[dayName].push(moodValue);
            }
        });
        const dayScores = {};
        Object.entries(dayAverages).forEach(([day, values]) => {
            if (values.length > 0) {
                dayScores[day] = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        });
        const sortedDays = Object.entries(dayScores).sort((a, b) => b[1] - a[1]);
        return {
            bestDay: sortedDays.length > 0 ? sortedDays[0][0] : undefined,
            worstDay: sortedDays.length > 0 ? sortedDays[sortedDays.length - 1][0] : undefined
        };
    }
    analyzeMoodEnergyCorrelation(moods) {
        const moodValues = {
            great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
            happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1,
        };
        const validMoods = moods.filter(m => m.energyLevel != null);
        if (validMoods.length < 3)
            return 0;
        const moodScores = validMoods.map(m => moodValues[m.mood] || 3);
        const energyScores = validMoods.map(m => m.energyLevel || 5);
        const n = moodScores.length;
        const sumMood = moodScores.reduce((sum, val) => sum + val, 0);
        const sumEnergy = energyScores.reduce((sum, val) => sum + val, 0);
        const sumMoodSquare = moodScores.reduce((sum, val) => sum + val * val, 0);
        const sumEnergySquare = energyScores.reduce((sum, val) => sum + val * val, 0);
        const sumProduct = moodScores.reduce((sum, val, i) => sum + val * energyScores[i], 0);
        const numerator = n * sumProduct - sumMood * sumEnergy;
        const denominator = Math.sqrt((n * sumMoodSquare - sumMood * sumMood) * (n * sumEnergySquare - sumEnergy * sumEnergy));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    analyzeMoodActivityCorrelations(moods) {
        const insights = [];
        const activityMoodMap = {};
        const moodValues = {
            great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
            happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1,
        };
        moods.forEach(mood => {
            const activities = Array.isArray(mood.activities) ? mood.activities : [];
            activities.forEach(activity => {
                if (!activityMoodMap[activity]) {
                    activityMoodMap[activity] = [];
                }
                activityMoodMap[activity].push(moodValues[mood.mood] || 3);
            });
        });
        const activityAverages = Object.entries(activityMoodMap)
            .filter(([_, values]) => values.length >= 3)
            .map(([activity, values]) => ({
            activity,
            average: values.reduce((sum, val) => sum + val, 0) / values.length,
            count: values.length
        }))
            .sort((a, b) => b.average - a.average);
        if (activityAverages.length > 0) {
            const topActivity = activityAverages[0];
            if (topActivity.average > 4) {
                insights.push(`${topActivity.activity} consistently correlates with positive moods`);
            }
            const bottomActivity = activityAverages[activityAverages.length - 1];
            if (bottomActivity.average < 3 && activityAverages.length > 1) {
                insights.push(`${bottomActivity.activity} may be associated with lower moods`);
            }
        }
        return insights.slice(0, 2);
    }
    async analyzeEngagementPatterns(_userId) {
        return {
            pattern: 'engagement',
            frequency: 0.7,
            trend: 'stable',
            impact: 'positive',
            insights: ['Regular platform engagement'],
        };
    }
    analyzeGoalPatterns(goals) {
        const completedGoals = goals.filter((g) => g.status === 'completed');
        const activeGoals = goals.filter((g) => g.status === 'in_progress');
        const completionRate = goals.length > 0 ? completedGoals.length / goals.length : 0;
        const frequency = Math.min(1, goals.length / 12);
        const goalTypes = new Set(goals.map(g => g.category || 'general'));
        const diversity = goalTypes.size / Math.max(1, goals.length);
        let trend = 'stable';
        const recentGoals = goals.filter((g) => new Date(g.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        if (recentGoals.length > goals.length / 4)
            trend = 'increasing';
        const impact = completionRate > 0.6 ? 'positive' : completionRate < 0.3 ? 'negative' : 'neutral';
        const insights = [];
        if (completionRate > 0.7)
            insights.push('High goal achievement rate');
        if (diversity > 0.5)
            insights.push('Diverse goal portfolio');
        if (activeGoals.length > 3)
            insights.push('Ambitious with multiple active goals');
        return {
            pattern: 'goal_setting',
            frequency,
            trend,
            impact,
            insights,
        };
    }
    async analyzeTimePatterns(userData) {
        const taskTimes = userData.tasks.map((t) => new Date(t.createdAt).getHours());
        const hourCounts = taskTimes.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});
        const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
            '9';
        const insights = [];
        if (parseInt(peakHour) < 9)
            insights.push('Early bird - most active in morning');
        else if (parseInt(peakHour) > 20)
            insights.push('Night owl - most active in evening');
        else
            insights.push('Midday peak activity');
        return {
            pattern: 'time_preference',
            frequency: 1,
            trend: 'stable',
            impact: 'neutral',
            insights,
        };
    }
    calculateMoodTrend(moods) {
        if (moods.length < 2)
            return 0;
        const moodValues = {
            happy: 5,
            content: 4,
            neutral: 3,
            stressed: 2,
            sad: 1,
        };
        const points = moods.map((m, i) => ({
            x: i,
            y: moodValues[m.mood] || 3,
        }));
        const n = points.length;
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }
    detectStrategyChanges(tasks) {
        let changes = 0;
        const taskTypes = tasks.map((t) => t.category || 'general');
        for (let i = 1; i < taskTypes.length; i++) {
            if (taskTypes[i] !== taskTypes[i - 1])
                changes++;
        }
        return changes;
    }
    calculateResilience(userData) {
        let resilienceScore = 0.5;
        const incompleteTasks = userData.tasks.filter((t) => t.status !== 'completed');
        const tasksAfterIncomplete = userData.tasks.filter((_t, i) => i > 0 && userData.tasks[i - 1].status !== 'completed');
        if (incompleteTasks.length > 0 && tasksAfterIncomplete.length > 0) {
            resilienceScore += 0.2;
        }
        const moodDips = userData.moods.filter((m) => m.mood === 'stressed' || m.mood === 'sad');
        if (moodDips.length > 0) {
            const recoveries = moodDips.filter((_m, i) => i < userData.moods.length - 1 &&
                (userData.moods[i + 1].mood === 'happy' || userData.moods[i + 1].mood === 'content'));
            resilienceScore += (recoveries.length / moodDips.length) * 0.3;
        }
        return Math.min(1, resilienceScore);
    }
    extractPositiveFactors(_userData, patterns, indicators) {
        const factors = [];
        if (indicators.consistencyScore > 0.7) {
            factors.push('High consistency in task completion');
        }
        if (indicators.progressRate > 0.5) {
            factors.push('Strong goal achievement track record');
        }
        if (indicators.resilience > 0.7) {
            factors.push('Excellent resilience and recovery from setbacks');
        }
        const positivePatterns = patterns.filter((p) => p.impact === 'positive');
        positivePatterns.forEach(p => {
            if (p.insights.length > 0) {
                factors.push(p.insights[0]);
            }
        });
        return [...new Set(factors)].slice(0, 5);
    }
    extractNegativeFactors(userData, patterns, indicators) {
        const factors = [];
        if (indicators.consistencyScore < 0.3) {
            factors.push('Inconsistent task completion');
        }
        if (indicators.engagementLevel < 0.3) {
            factors.push('Low engagement levels');
        }
        if (userData.avgMoodTrend < -0.5) {
            factors.push('Declining mood patterns');
        }
        const negativePatterns = patterns.filter((p) => p.impact === 'negative');
        negativePatterns.forEach(p => {
            if (p.insights.length > 0) {
                factors.push(p.insights[0]);
            }
        });
        return [...new Set(factors)].slice(0, 3);
    }
    async generatePersonalizedRecommendations(_userData, patterns, indicators, probability) {
        const recommendations = [];
        if (indicators.consistencyScore < 0.5) {
            recommendations.push('Start with tiny daily habits to build consistency');
            recommendations.push('Set specific times for your coaching activities');
        }
        if (indicators.engagementLevel < 0.5) {
            recommendations.push('Try shorter, more frequent sessions');
            recommendations.push('Focus on one area that excites you most');
        }
        if (probability > 0.7 && indicators.progressRate < 0.3) {
            recommendations.push('Break down your goals into smaller milestones');
            recommendations.push('Celebrate small wins to maintain momentum');
        }
        const decliningPatterns = patterns.filter((p) => p.trend === 'decreasing');
        if (decliningPatterns.length > 2) {
            recommendations.push('Schedule a reflection session to reassess priorities');
            recommendations.push('Consider if your goals still align with your values');
        }
        if (probability > 0.8) {
            recommendations.push('Challenge yourself with stretch goals');
            recommendations.push('Share your success strategies with the community');
        }
        return recommendations.slice(0, 5);
    }
    async generateInterventionPlan(userId, _riskType) {
        const risk = await this.predictChurnRisk(userId);
        const interventions = [];
        if (risk.severity === 'high') {
            interventions.push({
                timing: 'Immediate (within 24 hours)',
                action: 'Personal outreach',
                channel: 'Email + In-app notification',
                message: 'We noticed you might be facing challenges. How can we help?',
                expectedImpact: '40% reduction in churn probability',
            });
        }
        interventions.push({
            timing: 'Day 2-3',
            action: 'Success story sharing',
            channel: 'In-app',
            message: 'See how others overcame similar challenges',
            expectedImpact: '25% increase in engagement',
        });
        interventions.push({
            timing: 'Day 5-7',
            action: 'Simplified goal offering',
            channel: 'Push notification',
            message: 'Start fresh with a 5-minute daily win',
            expectedImpact: '30% reactivation rate',
        });
        const successMetrics = [
            'User logs in within 48 hours',
            'Completes at least one task within 7 days',
            'Engagement frequency returns to baseline',
            'Mood ratings improve or stabilize',
            'Sets a new goal within 14 days',
        ];
        return { interventions, successMetrics };
    }
    async analyzeGoalRisk(goalId) {
        try {
            const goal = await Goal_1.Goal.findByPk(goalId);
            if (!goal) {
                throw new Error(`Goal with ID ${goalId} not found`);
            }
            const [tasks, userData, relatedGoals] = await Promise.all([
                Task_1.Task.findAll({
                    where: { goalId },
                    order: [['createdAt', 'DESC']],
                    limit: 100,
                }),
                this.gatherUserData(goal.userId),
                Goal_1.Goal.findAll({
                    where: {
                        userId: goal.userId,
                        id: { [sequelize_1.Op.ne]: goalId },
                        status: { [sequelize_1.Op.in]: ['in_progress', 'completed'] },
                    },
                    order: [['createdAt', 'DESC']],
                    limit: 10,
                }),
            ]);
            const timeline = this.calculateGoalTimeline(goal, tasks);
            const riskFactors = await this.analyzeRiskFactors(goal, tasks, userData, relatedGoals);
            const probability = this.calculateRiskProbability(goal, tasks, riskFactors, timeline);
            const riskLevel = this.determineRiskLevel(probability, timeline);
            const recommendations = await this.generateRiskMitigationRecommendations(goal, riskFactors, timeline, riskLevel);
            const interventions = this.generateRiskInterventions(goal, riskLevel, riskFactors, timeline);
            logger_1.logger.info('Goal risk analysis completed', {
                goalId,
                riskLevel,
                probability: Math.round(probability * 100),
                factorsCount: {
                    positive: riskFactors.positive.length,
                    negative: riskFactors.negative.length,
                    neutral: riskFactors.neutral.length,
                },
            });
            return {
                riskLevel,
                probability,
                factors: riskFactors,
                recommendations,
                timeline,
                interventions,
            };
        }
        catch (error) {
            logger_1.logger.error('Error analyzing goal risk:', error);
            throw new Error(`Failed to analyze goal risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    calculateGoalTimeline(goal, tasks) {
        const currentProgress = goal.progress || 0;
        const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
        const createdDate = new Date(goal.createdAt);
        const now = new Date();
        let daysRemaining = 30;
        let expectedProgress = currentProgress;
        if (targetDate) {
            daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const totalDays = Math.ceil((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysElapsed = totalDays - daysRemaining;
            expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
        }
        const remainingProgress = 100 - currentProgress;
        const requiredDailyProgress = daysRemaining > 0 ? remainingProgress / daysRemaining : 0;
        return {
            currentProgress,
            expectedProgress: Math.max(0, Math.min(100, expectedProgress)),
            daysRemaining,
            requiredDailyProgress: Math.max(0, requiredDailyProgress),
        };
    }
    async analyzeRiskFactors(goal, tasks, userData, relatedGoals) {
        const factors = {
            positive: [],
            negative: [],
            neutral: [],
        };
        const completedTasks = tasks.filter((t) => t.status === 'completed');
        const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
        if (completionRate > 0.8) {
            factors.positive.push(`Excellent task completion rate (${Math.round(completionRate * 100)}%)`);
        }
        else if (completionRate > 0.6) {
            factors.positive.push(`Good task completion rate (${Math.round(completionRate * 100)}%)`);
        }
        else if (completionRate < 0.3) {
            factors.negative.push(`Low task completion rate (${Math.round(completionRate * 100)}%)`);
        }
        else {
            factors.neutral.push(`Moderate task completion rate (${Math.round(completionRate * 100)}%)`);
        }
        const recentTasks = tasks.filter((t) => new Date(t.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
        const recentCompletions = recentTasks.filter((t) => t.status === 'completed');
        if (recentCompletions.length > 5) {
            factors.positive.push('High recent activity with multiple task completions');
        }
        else if (recentCompletions.length === 0 && recentTasks.length === 0) {
            factors.negative.push('No recent activity on this goal');
        }
        if (tasks.length > 20) {
            if (completionRate > 0.7) {
                factors.positive.push('Successfully managing complex goal with many tasks');
            }
            else {
                factors.negative.push('Complex goal with many incomplete tasks may cause overwhelm');
            }
        }
        else if (tasks.length < 3) {
            factors.negative.push('Goal may lack sufficient planning and breakdown');
        }
        const overallEngagement = await this.calculateEngagementMetrics(userData);
        if (overallEngagement.trend === 'decreasing') {
            factors.negative.push('Overall user engagement is declining');
        }
        else if (overallEngagement.trend === 'increasing') {
            factors.positive.push('User engagement is increasing');
        }
        const completedRelatedGoals = relatedGoals.filter((g) => g.status === 'completed');
        if (completedRelatedGoals.length > 2) {
            factors.positive.push('Strong track record of completing similar goals');
        }
        else if (completedRelatedGoals.length === 0 && relatedGoals.length > 2) {
            factors.negative.push('No completed goals in recent history');
        }
        const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
        if (targetDate) {
            const daysUntilTarget = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysUntilTarget < 7 && goal.progress < 80) {
                factors.negative.push('Goal deadline approaching with significant work remaining');
            }
            else if (daysUntilTarget > 90 && goal.progress < 10) {
                factors.negative.push('Long-term goal with minimal progress may lose momentum');
            }
            else if (daysUntilTarget > 30 && goal.progress > 50) {
                factors.positive.push('Good progress with adequate time remaining');
            }
        }
        if (userData.avgMoodTrend > 0.2) {
            factors.positive.push('Positive mood trend supports goal achievement');
        }
        else if (userData.avgMoodTrend < -0.2) {
            factors.negative.push('Declining mood may impact goal motivation');
        }
        const highPriorityTasks = tasks.filter((t) => t.priority === 'high');
        const completedHighPriorityTasks = highPriorityTasks.filter((t) => t.status === 'completed');
        if (highPriorityTasks.length > 0) {
            const highPriorityCompletion = completedHighPriorityTasks.length / highPriorityTasks.length;
            if (highPriorityCompletion > 0.8) {
                factors.positive.push('Excellent completion of high-priority tasks');
            }
            else if (highPriorityCompletion < 0.4) {
                factors.negative.push('Struggling with high-priority task completion');
            }
        }
        return factors;
    }
    calculateRiskProbability(goal, tasks, riskFactors, timeline) {
        let riskScore = 0.3;
        const progressGap = timeline.expectedProgress - timeline.currentProgress;
        if (progressGap > 30)
            riskScore += 0.3;
        else if (progressGap > 15)
            riskScore += 0.15;
        else if (progressGap < -10)
            riskScore -= 0.1;
        if (timeline.requiredDailyProgress > 5)
            riskScore += 0.2;
        else if (timeline.requiredDailyProgress > 2)
            riskScore += 0.1;
        const factorBalance = riskFactors.positive.length - riskFactors.negative.length;
        riskScore -= factorBalance * 0.05;
        const completionRate = tasks.length > 0
            ? tasks.filter((t) => t.status === 'completed').length / tasks.length
            : 0;
        if (completionRate < 0.3)
            riskScore += 0.2;
        else if (completionRate > 0.8)
            riskScore -= 0.15;
        if (timeline.daysRemaining < 3 && timeline.currentProgress < 90)
            riskScore += 0.4;
        else if (timeline.daysRemaining < 7 && timeline.currentProgress < 70)
            riskScore += 0.25;
        return Math.max(0, Math.min(1, riskScore));
    }
    determineRiskLevel(probability, timeline) {
        if (timeline.daysRemaining < 2 && timeline.currentProgress < 80 ||
            probability > 0.9) {
            return 'critical';
        }
        if (probability > 0.7 ||
            (timeline.daysRemaining < 7 && timeline.currentProgress < 60) ||
            timeline.requiredDailyProgress > 5) {
            return 'high';
        }
        if (probability > 0.4 ||
            timeline.currentProgress < timeline.expectedProgress - 20 ||
            timeline.requiredDailyProgress > 2) {
            return 'medium';
        }
        return 'low';
    }
    async generateRiskMitigationRecommendations(goal, riskFactors, timeline, riskLevel) {
        const recommendations = [];
        if (timeline.requiredDailyProgress > 3) {
            recommendations.push('Break down remaining work into smaller, daily achievable tasks');
            recommendations.push('Consider extending the deadline if possible to maintain quality');
        }
        if (timeline.currentProgress < timeline.expectedProgress - 15) {
            recommendations.push('Schedule dedicated time blocks for goal-related activities');
            recommendations.push('Review and eliminate low-priority tasks to focus on essentials');
        }
        if (riskLevel === 'critical' || riskLevel === 'high') {
            recommendations.push('Seek support from friends, family, or mentors');
            recommendations.push('Consider simplifying the goal scope to ensure completion');
            recommendations.push('Implement daily progress tracking and accountability');
        }
        if (riskFactors.negative.some(f => f.includes('completion rate'))) {
            recommendations.push('Review task difficulty - consider breaking tasks into smaller steps');
            recommendations.push('Identify and address barriers preventing task completion');
        }
        if (riskFactors.negative.some(f => f.includes('recent activity'))) {
            recommendations.push('Set up daily reminders to maintain momentum');
            recommendations.push('Start with just 10-15 minutes per day to rebuild the habit');
        }
        if (riskFactors.negative.some(f => f.includes('mood'))) {
            recommendations.push('Focus on small wins to rebuild confidence and motivation');
            recommendations.push('Consider addressing underlying wellness factors affecting mood');
        }
        if (riskFactors.positive.length > riskFactors.negative.length) {
            recommendations.push('Leverage your current momentum - increase daily commitment slightly');
            recommendations.push('Document what\'s working well to maintain successful strategies');
        }
        if (recommendations.length === 0) {
            recommendations.push('Maintain current pace and review progress weekly');
            recommendations.push('Prepare contingency plans for potential obstacles');
        }
        return recommendations.slice(0, 6);
    }
    generateRiskInterventions(goal, riskLevel, riskFactors, timeline) {
        const interventions = [];
        if (riskLevel === 'critical') {
            interventions.push({
                type: 'immediate',
                action: 'Emergency goal review and scope reduction',
                priority: 'high',
                expectedImpact: '40% reduction in completion risk',
            });
            interventions.push({
                type: 'immediate',
                action: 'Daily accountability check-ins',
                priority: 'high',
                expectedImpact: '30% increase in daily progress',
            });
        }
        if (riskLevel === 'high' || riskLevel === 'critical') {
            interventions.push({
                type: 'short_term',
                action: 'Restructure remaining tasks by priority and effort',
                priority: 'high',
                expectedImpact: '25% improvement in completion rate',
            });
            interventions.push({
                type: 'short_term',
                action: 'Implement pomodoro technique for focused work',
                priority: 'medium',
                expectedImpact: '20% increase in task completion speed',
            });
        }
        if (riskLevel === 'medium') {
            interventions.push({
                type: 'short_term',
                action: 'Weekly progress review and plan adjustment',
                priority: 'medium',
                expectedImpact: '15% improvement in staying on track',
            });
        }
        interventions.push({
            type: 'long_term',
            action: 'Develop better goal planning and breakdown skills',
            priority: 'low',
            expectedImpact: '50% reduction in future goal completion risks',
        });
        return interventions;
    }
}
exports.PredictiveAnalytics = PredictiveAnalytics;
tslib_1.__decorate([
    (0, CacheService_1.Cached)({ ttl: 900, keyPrefix: 'prediction:success' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], PredictiveAnalytics.prototype, "predictUserSuccess", null);
tslib_1.__decorate([
    (0, CacheService_1.Cached)({ ttl: 1800, keyPrefix: 'prediction:churn' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], PredictiveAnalytics.prototype, "predictChurnRisk", null);
tslib_1.__decorate([
    (0, CacheService_1.Cached)({ ttl: 1200, keyPrefix: 'analysis:behavior' }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], PredictiveAnalytics.prototype, "analyzeBehaviorPatterns", null);
exports.predictiveAnalytics = new PredictiveAnalytics();
