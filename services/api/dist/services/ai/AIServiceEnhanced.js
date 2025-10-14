"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiServiceEnhanced = exports.AIServiceEnhanced = void 0;
const tslib_1 = require("tslib");
const openai_1 = require("openai");
const sdk_1 = tslib_1.__importDefault(require("@anthropic-ai/sdk"));
const environment_1 = require("../../config/environment");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const CircuitBreaker_1 = require("./CircuitBreaker");
const RetryMechanism_1 = require("./RetryMechanism");
class AIServiceEnhanced {
    openai;
    anthropic;
    cache;
    circuitBreaker;
    retry;
    defaultOpenAIModel = 'gpt-4-turbo-preview';
    defaultClaudeModel = 'claude-3-sonnet-20240229';
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        tokenUsage: {
            input: 0,
            output: 0,
            total: 0
        }
    };
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: environment_1.config.openai?.apiKey || process.env.OPENAI_API_KEY,
        });
        this.anthropic = new sdk_1.default({
            apiKey: environment_1.config.claude?.apiKey || process.env.CLAUDE_API_KEY,
        });
        this.cache = new UnifiedCacheService_1.UnifiedCacheService();
        this.circuitBreaker = new CircuitBreaker_1.CircuitBreaker({
            failureThreshold: 5,
            resetTimeout: 60000,
            monitoringPeriod: 60000,
            halfOpenRetries: 3,
        });
        this.retry = new RetryMechanism_1.RetryMechanism();
    }
    async analyzeVoice(audioBuffer, userId, context) {
        const cacheKey = `voice:${userId}:${Buffer.from(audioBuffer).toString('base64').substring(0, 32)}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const transcription = await this.transcribeAudio(audioBuffer);
            const emotionalAnalysis = await this.analyzeEmotionalContent(transcription.text);
            const topicsAnalysis = await this.extractKeyTopics(transcription.text, context);
            const coachingInsights = await this.generateVoiceCoachingInsights(transcription.text, emotionalAnalysis, topicsAnalysis, context);
            const speakingMetrics = this.analyzeSpeakingMetrics(transcription);
            const result = {
                transcription: transcription.text,
                sentiment: emotionalAnalysis.sentiment,
                emotions: {
                    joy: emotionalAnalysis.emotions.joy || 0,
                    sadness: emotionalAnalysis.emotions.sadness || 0,
                    anger: emotionalAnalysis.emotions.anger || 0,
                    fear: emotionalAnalysis.emotions.fear || 0,
                    surprise: emotionalAnalysis.emotions.surprise || 0
                },
                speakingRate: speakingMetrics.rate,
                confidence: speakingMetrics.confidence,
                keyTopics: topicsAnalysis.topics,
                actionableInsights: coachingInsights.insights,
                coachingRecommendations: coachingInsights.recommendations
            };
            await this.cache.set(cacheKey, result, { ttl: 3600 });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Voice analysis error:', error);
            throw new Error(`Failed to analyze voice: ${error.message}`);
        }
    }
    async generateRecommendations(userId, userProfile, recentActivity, goals) {
        const cacheKey = `recommendations:${userId}:${Date.now()}`;
        try {
            const context = {
                userProfile,
                recentActivity: recentActivity.slice(0, 10),
                activeGoals: goals.filter(g => g.status === 'active'),
                completedGoals: goals.filter(g => g.status === 'completed'),
                preferences: userProfile.preferences || {},
                strengths: userProfile.strengths || [],
                challenges: userProfile.challenges || []
            };
            const prompt = this.buildRecommendationPrompt(context);
            const response = await this.circuitBreaker.execute(async () => {
                return await this.openai.chat.completions.create({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert life coach AI generating personalized recommendations. Provide specific, actionable, and motivating recommendations based on the user\'s profile, goals, and recent activity.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                    response_format: { type: 'json_object' }
                });
            });
            const rawRecommendations = JSON.parse(response.choices[0].message.content || '{}');
            const recommendations = rawRecommendations.recommendations.map((rec, index) => ({
                id: `rec_${userId}_${Date.now()}_${index}`,
                category: rec.category,
                title: rec.title,
                description: rec.description,
                rationale: rec.rationale,
                expectedBenefit: rec.expectedBenefit,
                difficulty: rec.difficulty,
                timeCommitment: rec.timeCommitment,
                priority: rec.priority,
                personalizationFactors: rec.personalizationFactors,
                resources: rec.resources
            }));
            recommendations.sort((a, b) => b.priority - a.priority);
            await this.cache.set(cacheKey, recommendations, { ttl: 86400 });
            return recommendations;
        }
        catch (error) {
            logger_1.logger.error('Recommendation generation error:', error);
            throw new Error(`Failed to generate recommendations: ${error.message}`);
        }
    }
    async generateCoachingInsights(userId, userData) {
        try {
            const insights = [];
            const behavioralInsights = await this.analyzeBehavioralPatterns(userData);
            insights.push(...behavioralInsights);
            const emotionalInsights = await this.analyzeEmotionalPatterns(userData);
            insights.push(...emotionalInsights);
            const goalInsights = await this.analyzeGoalProgress(userData);
            insights.push(...goalInsights);
            const relationshipInsights = await this.analyzeRelationshipPatterns(userData);
            insights.push(...relationshipInsights);
            const skillInsights = await this.analyzeSkillDevelopment(userData);
            insights.push(...skillInsights);
            insights.sort((a, b) => {
                const severityOrder = { critical: 0, warning: 1, info: 2, positive: 3 };
                const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
                if (severityDiff !== 0)
                    return severityDiff;
                return b.confidence - a.confidence;
            });
            return insights.slice(0, 10);
        }
        catch (error) {
            logger_1.logger.error('Insight generation error:', error);
            throw new Error(`Failed to generate insights: ${error.message}`);
        }
    }
    async analyzeSentiment(text) {
        const cacheKey = `sentiment:${text.substring(0, 50)}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a sentiment analysis expert. Analyze the emotional content and sentiment of the provided text. Return a detailed JSON analysis.'
                    },
                    {
                        role: 'user',
                        content: `Analyze the sentiment of this text and return a JSON object with the following structure:
            {
              "overallSentiment": <number between -1 and 1>,
              "sentimentLabel": <"very-negative" | "negative" | "neutral" | "positive" | "very-positive">,
              "emotionalTone": {
                "primary": <primary emotion>,
                "secondary": [<list of secondary emotions>]
              },
              "confidenceScore": <0-1>,
              "sentimentProgression": [
                {
                  "position": <position in text 0-1>,
                  "sentiment": <sentiment score>,
                  "text": <relevant text snippet>
                }
              ],
              "keyPhrases": [
                {
                  "phrase": <key phrase>,
                  "sentiment": <sentiment score>,
                  "importance": <0-1>
                }
              ],
              "recommendations": [<coaching recommendations based on sentiment>]
            }
            
            Text to analyze: "${text}"`
                    }
                ],
                temperature: 0.3,
                max_tokens: 1500,
                response_format: { type: 'json_object' }
            });
            const result = JSON.parse(response.choices[0].message.content || '{}');
            await this.cache.set(cacheKey, result, { ttl: 86400 });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Sentiment analysis error:', error);
            throw new Error(`Failed to analyze sentiment: ${error.message}`);
        }
    }
    async predictGoalSuccess(goalData, userData) {
        try {
            const prompt = `
        Analyze this goal and predict success probability:
        
        Goal: ${goalData.description}
        Current Progress: ${goalData.currentProgress}%
        Target Date: ${goalData.targetDate}
        Historical Progress: ${JSON.stringify(goalData.historicalProgress)}
        
        User Profile:
        - Completed Goals: ${userData.completedGoals}/${userData.totalGoals}
        - Average Completion Time: ${userData.averageCompletionTime} days
        - Current Motivation Level: ${userData.currentMotivation}/10
        
        Provide a detailed prediction with:
        1. Success probability (0-100%)
        2. Estimated completion date
        3. Risk factors with impact levels and mitigations
        4. Accelerators with potential impact and effort required
        5. Key milestones with target dates and probabilities
        6. Adjustment recommendations
      `;
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert goal achievement analyst. Provide realistic, data-driven predictions based on the provided information.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.4,
                max_tokens: 1500,
                response_format: { type: 'json_object' }
            });
            const prediction = JSON.parse(response.choices[0].message.content || '{}');
            return {
                goalId: goalData.id,
                successProbability: prediction.successProbability,
                estimatedCompletionDate: new Date(prediction.estimatedCompletionDate),
                riskFactors: prediction.riskFactors,
                accelerators: prediction.accelerators,
                milestones: prediction.milestones.map((m) => ({
                    ...m,
                    targetDate: new Date(m.targetDate)
                })),
                adjustmentRecommendations: prediction.adjustmentRecommendations
            };
        }
        catch (error) {
            logger_1.logger.error('Goal prediction error:', error);
            throw new Error(`Failed to predict goal success: ${error.message}`);
        }
    }
    async analyzeConversation(messages, userId) {
        try {
            const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert coaching conversation analyst. Analyze the conversation for key insights, emotional patterns, and coaching opportunities.'
                    },
                    {
                        role: 'user',
                        content: `Analyze this coaching conversation and provide:
            1. A concise summary
            2. Key themes discussed
            3. Emotional journey with timestamps
            4. Action items identified
            5. Breakthrough moments
            6. Areas of concern
            7. Follow-up questions for next session
            8. Coaching opportunities
            
            Conversation:
            ${conversationText}`
                    }
                ],
                temperature: 0.5,
                max_tokens: 2000,
                response_format: { type: 'json_object' }
            });
            const analysis = JSON.parse(response.choices[0].message.content || '{}');
            return {
                summary: analysis.summary,
                keyThemes: analysis.keyThemes,
                emotionalJourney: analysis.emotionalJourney.map((e) => ({
                    ...e,
                    timestamp: new Date(e.timestamp)
                })),
                actionItems: analysis.actionItems,
                breakthroughs: analysis.breakthroughs,
                concerns: analysis.concerns,
                followUpQuestions: analysis.followUpQuestions,
                coachingOpportunities: analysis.coachingOpportunities
            };
        }
        catch (error) {
            logger_1.logger.error('Conversation analysis error:', error);
            throw new Error(`Failed to analyze conversation: ${error.message}`);
        }
    }
    async transcribeAudio(audioBuffer) {
        try {
            const file = new File([new Uint8Array(audioBuffer)], 'audio.webm', { type: 'audio/webm' });
            const transcription = await this.openai.audio.transcriptions.create({
                file: file,
                model: 'whisper-1',
                response_format: 'verbose_json',
                language: 'en'
            });
            return {
                text: transcription.text,
                segments: transcription.segments
            };
        }
        catch (error) {
            logger_1.logger.error('Audio transcription error:', error);
            throw error;
        }
    }
    async analyzeEmotionalContent(text) {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'Analyze the emotional content of the text. Return sentiment (-1 to 1) and emotion scores (0-1) for joy, sadness, anger, fear, and surprise.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 200,
            response_format: { type: 'json_object' }
        });
        return JSON.parse(response.choices[0].message.content || '{}');
    }
    async extractKeyTopics(text, context) {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'Extract key topics and themes from the text. Return a list of 3-5 main topics.'
                },
                {
                    role: 'user',
                    content: `Context: ${JSON.stringify(context || {})}\n\nText: ${text}`
                }
            ],
            temperature: 0.4,
            max_tokens: 200,
            response_format: { type: 'json_object' }
        });
        return JSON.parse(response.choices[0].message.content || '{"topics": []}');
    }
    async generateVoiceCoachingInsights(text, emotions, topics, context) {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'Generate actionable coaching insights and recommendations based on the voice analysis.'
                },
                {
                    role: 'user',
                    content: `
            Text: ${text}
            Emotions: ${JSON.stringify(emotions)}
            Topics: ${JSON.stringify(topics)}
            Context: ${JSON.stringify(context || {})}
            
            Provide 3-5 actionable insights and 3-5 coaching recommendations.
          `
                }
            ],
            temperature: 0.6,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });
        return JSON.parse(response.choices[0].message.content || '{"insights": [], "recommendations": []}');
    }
    analyzeSpeakingMetrics(transcription) {
        const segments = transcription.segments || [];
        if (segments.length === 0) {
            return { rate: 'normal', confidence: 0.7 };
        }
        const totalDuration = segments[segments.length - 1]?.end || 10;
        const wordCount = transcription.text.split(' ').length;
        const wordsPerMinute = (wordCount / totalDuration) * 60;
        let rate;
        if (wordsPerMinute < 110)
            rate = 'slow';
        else if (wordsPerMinute > 160)
            rate = 'fast';
        else
            rate = 'normal';
        const confidence = Math.min(0.95, 0.7 + (segments.length / 100) * 0.25);
        return { rate, confidence };
    }
    buildRecommendationPrompt(context) {
        return `
      Generate 5-7 personalized coaching recommendations for this user:
      
      User Profile:
      - Strengths: ${JSON.stringify(context.strengths)}
      - Challenges: ${JSON.stringify(context.challenges)}
      - Preferences: ${JSON.stringify(context.preferences)}
      
      Recent Activity:
      ${JSON.stringify(context.recentActivity)}
      
      Active Goals:
      ${JSON.stringify(context.activeGoals)}
      
      Completed Goals:
      ${JSON.stringify(context.completedGoals)}
      
      For each recommendation, provide:
      {
        "recommendations": [
          {
            "category": "content" | "exercise" | "habit" | "goal" | "coaching-session",
            "title": "Clear, actionable title",
            "description": "Detailed description",
            "rationale": "Why this is recommended for this user",
            "expectedBenefit": "What the user will gain",
            "difficulty": "easy" | "medium" | "hard",
            "timeCommitment": <minutes>,
            "priority": <1-10>,
            "personalizationFactors": ["factors that make this relevant"],
            "resources": [
              {
                "type": "article" | "video" | "exercise" | "tool",
                "title": "Resource title",
                "url": "optional URL",
                "duration": <optional minutes>
              }
            ]
          }
        ]
      }
    `;
    }
    async analyzeBehavioralPatterns(userData) {
        const insights = [];
        const activityPattern = this.detectActivityPatterns(userData.activities);
        if (activityPattern) {
            insights.push({
                type: 'behavioral',
                title: activityPattern.title,
                description: activityPattern.description,
                severity: activityPattern.severity,
                confidence: activityPattern.confidence,
                evidence: activityPattern.evidence,
                recommendations: activityPattern.recommendations,
                timeframe: 'short-term'
            });
        }
        return insights;
    }
    async analyzeEmotionalPatterns(userData) {
        const insights = [];
        const moodTrend = this.detectMoodTrends(userData.moods);
        if (moodTrend) {
            insights.push({
                type: 'emotional',
                title: moodTrend.title,
                description: moodTrend.description,
                severity: moodTrend.severity,
                confidence: moodTrend.confidence,
                evidence: moodTrend.evidence,
                recommendations: moodTrend.recommendations,
                timeframe: 'immediate'
            });
        }
        return insights;
    }
    async analyzeGoalProgress(userData) {
        const insights = [];
        const goalPattern = this.detectGoalPatterns(userData.goals);
        if (goalPattern) {
            insights.push({
                type: 'goal-oriented',
                title: goalPattern.title,
                description: goalPattern.description,
                severity: goalPattern.severity,
                confidence: goalPattern.confidence,
                evidence: goalPattern.evidence,
                recommendations: goalPattern.recommendations,
                relatedGoals: goalPattern.relatedGoals,
                timeframe: 'long-term'
            });
        }
        return insights;
    }
    async analyzeRelationshipPatterns(userData) {
        return [];
    }
    async analyzeSkillDevelopment(userData) {
        return [];
    }
    detectActivityPatterns(activities) {
        if (!activities || activities.length === 0)
            return null;
        const recentActivities = activities.slice(0, 10);
        const activityTypes = recentActivities.map(a => a.type);
        const uniqueTypes = new Set(activityTypes);
        if (uniqueTypes.size < 3) {
            return {
                title: 'Limited Activity Variety',
                description: 'Your recent activities show limited variety',
                severity: 'warning',
                confidence: 0.7,
                evidence: [`Only ${uniqueTypes.size} types of activities in recent history`],
                recommendations: ['Try exploring new types of activities', 'Diversify your routine']
            };
        }
        return null;
    }
    detectMoodTrends(moods) {
        if (!moods || moods.length < 3)
            return null;
        const recentMoods = moods.slice(0, 7);
        const avgMood = recentMoods.reduce((sum, m) => sum + (m.score || 5), 0) / recentMoods.length;
        if (avgMood < 4) {
            return {
                title: 'Low Mood Pattern Detected',
                description: 'Your recent mood scores indicate a concerning pattern',
                severity: 'warning',
                confidence: 0.8,
                evidence: [`Average mood score: ${avgMood.toFixed(1)}/10`],
                recommendations: [
                    'Consider scheduling a coaching session',
                    'Practice mood-lifting activities',
                    'Review and adjust current goals if feeling overwhelmed'
                ]
            };
        }
        else if (avgMood > 7) {
            return {
                title: 'Positive Mood Momentum',
                description: 'Your mood has been consistently positive',
                severity: 'positive',
                confidence: 0.8,
                evidence: [`Average mood score: ${avgMood.toFixed(1)}/10`],
                recommendations: [
                    'Leverage this positive state for challenging goals',
                    'Document what\'s working well',
                    'Share your success strategies'
                ]
            };
        }
        return null;
    }
    detectGoalPatterns(goals) {
        if (!goals || goals.length === 0)
            return null;
        const activeGoals = goals.filter(g => g.status === 'active');
        const completedGoals = goals.filter(g => g.status === 'completed');
        const abandonedGoals = goals.filter(g => g.status === 'abandoned');
        if (abandonedGoals.length > completedGoals.length) {
            return {
                title: 'High Goal Abandonment Rate',
                description: 'More goals are being abandoned than completed',
                severity: 'warning',
                confidence: 0.85,
                evidence: [
                    `${abandonedGoals.length} abandoned vs ${completedGoals.length} completed`
                ],
                recommendations: [
                    'Set smaller, more achievable goals',
                    'Review goal-setting strategy',
                    'Focus on one goal at a time'
                ],
                relatedGoals: abandonedGoals.map(g => g.id)
            };
        }
        if (activeGoals.length > 5) {
            return {
                title: 'Goal Overload',
                description: 'Too many active goals may reduce focus',
                severity: 'info',
                confidence: 0.7,
                evidence: [`${activeGoals.length} goals currently active`],
                recommendations: [
                    'Prioritize top 3 goals',
                    'Consider pausing lower-priority goals',
                    'Focus on completion before adding new goals'
                ],
                relatedGoals: activeGoals.map(g => g.id)
            };
        }
        return null;
    }
    getMetrics() {
        return {
            ...this.metrics,
            averageLatency: this.metrics.totalRequests > 0
                ? this.metrics.averageLatency / this.metrics.totalRequests
                : 0,
            successRate: this.metrics.totalRequests > 0
                ? this.metrics.successfulRequests / this.metrics.totalRequests
                : 0,
            errorRate: this.metrics.totalRequests > 0
                ? this.metrics.failedRequests / this.metrics.totalRequests
                : 0
        };
    }
    async generateHybridResponse(messages, options = {}) {
        try {
            const startTime = Date.now();
            const openai = new openai_1.OpenAI({
                apiKey: environment_1.config.openaiApiKey,
            });
            const response = await openai.chat.completions.create({
                model: options.model || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7,
            });
            const routingDecisionTime = Date.now() - startTime;
            return {
                response: {
                    content: response.choices[0]?.message?.content || '',
                    model: response.model,
                    usage: {
                        totalTokens: response.usage?.total_tokens || 0,
                        promptTokens: response.usage?.prompt_tokens || 0,
                        completionTokens: response.usage?.completion_tokens || 0,
                    },
                },
                metrics: {
                    provider: 'openai',
                    fallbackOccurred: false,
                    routingDecisionTime,
                    qualityScore: 0.85,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error in hybrid response generation:', error);
            throw error;
        }
    }
}
exports.AIServiceEnhanced = AIServiceEnhanced;
exports.aiServiceEnhanced = new AIServiceEnhanced();
