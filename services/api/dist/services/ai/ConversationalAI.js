"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationalAI = exports.ConversationalAI = void 0;
const AIService_1 = require("./AIService");
const ContextManager_1 = require("./ContextManager");
const PersonalityEngine_1 = require("./PersonalityEngine");
// import { recommendationEngine } from './RecommendationEngine';
const logger_1 = require("../../utils/logger");
const ChatMessage_1 = require("../../models/ChatMessage");
class ConversationalAI {
    conversationStates;
    intentPatterns = new Map();
    constructor() {
        this.conversationStates = new Map();
        this.initializeIntentPatterns();
    }
    initializeIntentPatterns() {
        this.intentPatterns = new Map([
            [
                'goal_setting',
                [
                    /\b(goal|objective|aim|target|achieve|accomplish)\b/i,
                    /\b(want to|plan to|hoping to|trying to)\b/i,
                    /\b(by|within|in \d+|before)\b.*\b(days?|weeks?|months?|years?)\b/i,
                ],
            ],
            [
                'habit_formation',
                [
                    /\b(habit|routine|daily|weekly|regular|consistently)\b/i,
                    /\b(start|stop|quit|begin|establish)\b/i,
                    /\b(every day|each day|daily|morning|evening)\b/i,
                ],
            ],
            [
                'emotional_support',
                [
                    /\b(feel|feeling|felt|emotion|emotional)\b/i,
                    /\b(stressed|anxious|worried|overwhelmed|sad|depressed)\b/i,
                    /\b(help|support|need|struggling|difficult)\b/i,
                ],
            ],
            [
                'progress_review',
                [
                    /\b(progress|how am i doing|review|check|status)\b/i,
                    /\b(accomplished|completed|finished|done)\b/i,
                    /\b(so far|to date|recently|lately)\b/i,
                ],
            ],
            [
                'motivation',
                [
                    /\b(motivat|inspir|encourag|pump|excit)\b/i,
                    /\b(can\'t|cannot|unable|stuck|blocked)\b/i,
                    /\b(give up|quit|stop|continue)\b/i,
                ],
            ],
            [
                'planning',
                [
                    /\b(plan|schedule|organize|prepare|arrange)\b/i,
                    /\b(tomorrow|next week|upcoming|future)\b/i,
                    /\b(priorit|focus|important|urgent)\b/i,
                ],
            ],
            [
                'reflection',
                [
                    /\b(reflect|think|consider|contemplate|ponder)\b/i,
                    /\b(learn|lesson|insight|understand|realize)\b/i,
                    /\b(past|previous|yesterday|last week)\b/i,
                ],
            ],
        ]);
    }
    async processConversation(userId, message, conversationId, context) {
        try {
            // Detect intent
            const intent = await this.detectIntent(message, context);
            // Get or create conversation state
            const state = this.getOrCreateState(conversationId, intent);
            // Get conversation history
            const history = await this.getConversationHistory(conversationId);
            // Analyze conversation flow
            const flowAnalysis = await this.analyzeConversationFlow(history, message);
            // Generate contextual response
            const response = await this.generateContextualResponse(userId, message, intent, state, flowAnalysis, context);
            // Update conversation state
            this.updateConversationState(conversationId, state, flowAnalysis);
            // Generate follow-up suggestions
            const suggestions = await this.generateFollowUpSuggestions(intent, state);
            // Extract action items if any
            const actions = await this.extractActionItems(response.content, intent);
            return {
                response: response.content,
                intent,
                state,
                suggestions,
                actions,
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing conversation:', error);
            throw error;
        }
    }
    async detectIntent(message, _context) {
        const detectedIntents = [];
        // Pattern matching
        for (const [intent, patterns] of this.intentPatterns.entries()) {
            let score = 0;
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    score += 1;
                }
            }
            if (score > 0) {
                detectedIntents.push({ intent, score: score / patterns.length });
            }
        }
        // Sort by score
        detectedIntents.sort((a, b) => b.score - a.score);
        // Use AI for more nuanced intent detection
        const aiIntentAnalysis = await this.analyzeIntentWithAI(message, detectedIntents);
        const primary = aiIntentAnalysis.primary || detectedIntents[0]?.intent || 'general';
        const secondary = aiIntentAnalysis.secondary || detectedIntents.slice(1, 3).map(d => d.intent);
        const confidence = aiIntentAnalysis.confidence || detectedIntents[0]?.score || 0.5;
        // Generate suggested response type
        const suggestedResponse = this.getSuggestedResponseType(primary);
        return {
            primary,
            secondary,
            confidence,
            suggestedResponse,
        };
    }
    async analyzeIntentWithAI(message, detectedIntents) {
        try {
            const prompt = `Analyze the user's intent in this message:
"${message}"

Detected patterns suggest: ${detectedIntents.map(d => d.intent).join(', ')}

Provide a JSON response with:
- primary: the main intent
- secondary: array of secondary intents
- confidence: 0-1 confidence score
- emotional_state: detected emotional state
- urgency: low/medium/high`;
            const response = await AIService_1.aiService.generateResponse([
                {
                    role: 'system',
                    content: 'You are an expert at understanding user intent in coaching conversations. Always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ], {
                temperature: 0.3,
                maxTokens: 200,
            });
            return JSON.parse(response.content);
        }
        catch (error) {
            logger_1.logger.error('Error analyzing intent with AI:', error);
            return {
                primary: detectedIntents[0]?.intent || 'general',
                secondary: [],
                confidence: 0.7,
            };
        }
    }
    getOrCreateState(conversationId, intent) {
        let state = this.conversationStates.get(conversationId);
        if (!state) {
            state = {
                topic: intent.primary,
                depth: 1,
                emotionalTone: 'neutral',
                userEngagement: 5,
                keyPoints: [],
                nextActions: [],
            };
            this.conversationStates.set(conversationId, state);
        }
        return state;
    }
    async getConversationHistory(conversationId) {
        try {
            const messages = await ChatMessage_1.ChatMessage.findAll({
                where: { chatId: conversationId },
                order: [['createdAt', 'ASC']],
                limit: 20,
            });
            return messages.map((m) => ({
                role: m.role,
                content: m.content,
                timestamp: m.createdAt,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching conversation history:', error);
            return [];
        }
    }
    async analyzeConversationFlow(history, _currentMessage) {
        // Analyze conversation patterns
        const analysis = {
            messageCount: history.length,
            avgMessageLength: 0,
            topicChanges: 0,
            emotionalShifts: 0,
            questionRatio: 0,
            engagementTrend: 'stable',
        };
        if (history.length === 0)
            return analysis;
        // Calculate metrics
        const userMessages = history.filter((m) => m.role === 'user');
        const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
        analysis.avgMessageLength = totalLength / userMessages.length;
        // Question ratio
        const questions = userMessages.filter((m) => m.content.includes('?'));
        analysis.questionRatio = questions.length / userMessages.length;
        // Engagement trend
        if (history.length > 3) {
            const recentLength = history.slice(-3).reduce((sum, m) => sum + m.content.length, 0) / 3;
            const earlierLength = history.slice(0, 3).reduce((sum, m) => sum + m.content.length, 0) / 3;
            if (recentLength > earlierLength * 1.2) {
                analysis.engagementTrend = 'increasing';
            }
            else if (recentLength < earlierLength * 0.8) {
                analysis.engagementTrend = 'decreasing';
            }
        }
        return analysis;
    }
    async generateContextualResponse(userId, message, intent, state, flowAnalysis, _context) {
        // Get user context
        const userContext = await ContextManager_1.contextManager.getUserContext(userId);
        // Select optimal personality
        const personality = PersonalityEngine_1.personalityEngine.selectOptimalPersonality(userContext);
        // Build conversation context
        const conversationContext = {
            intent: intent.primary,
            conversationDepth: state.depth,
            emotionalTone: state.emotionalTone,
            engagement: flowAnalysis.engagementTrend,
            userProfile: userContext,
            keyPoints: state.keyPoints,
        };
        // Generate prompts based on intent
        const systemPrompt = this.buildSystemPrompt(intent, personality, conversationContext);
        // Add conversation management instructions
        const managementInstructions = this.getConversationManagementInstructions(intent, state, flowAnalysis);
        // Generate response
        const response = await AIService_1.aiService.generateResponse([
            {
                role: 'system',
                content: `${systemPrompt}\n\n${managementInstructions}`,
            },
            {
                role: 'user',
                content: message,
            },
        ], {
            personality,
            context: conversationContext,
            temperature: this.getOptimalTemperature(intent, state),
        });
        return response;
    }
    buildSystemPrompt(intent, personality, context) {
        const basePrompt = PersonalityEngine_1.personalityEngine.getSystemPrompt(personality);
        const intentPrompts = {
            goal_setting: `Focus on helping the user clarify and structure their goals using the SMART framework. Ask probing questions to understand their deeper motivations.`,
            habit_formation: `Guide the user through habit formation using proven techniques like habit stacking and environmental design. Make it feel achievable.`,
            emotional_support: `Provide empathetic support while gently guiding toward constructive solutions. Validate feelings before offering advice.`,
            progress_review: `Celebrate achievements, acknowledge challenges, and help identify patterns in their progress. Be specific and encouraging.`,
            motivation: `Energize and inspire while addressing underlying obstacles. Use their past successes as evidence of capability.`,
            planning: `Help structure thoughts into actionable plans. Break down overwhelming tasks into manageable steps.`,
            reflection: `Facilitate deep reflection through thoughtful questions. Help extract insights and lessons from experiences.`,
            general: `Engage naturally while steering toward productive outcomes. Be curious and supportive.`,
        };
        const contextualPrompt = `
Current context:
- User has been engaged for ${context.conversationDepth} messages
- Emotional tone: ${context.emotionalTone}
- Engagement trend: ${context.engagement}
- Key topics discussed: ${context.keyPoints.join(', ')}
`;
        return `${basePrompt}\n\n${intentPrompts[intent.primary] || intentPrompts.general}\n\n${contextualPrompt}`;
    }
    getConversationManagementInstructions(intent, state, flowAnalysis) {
        const instructions = [];
        // Depth management
        if (state.depth > 10) {
            instructions.push('Consider summarizing key points and suggesting next steps.');
        }
        else if (state.depth < 3) {
            instructions.push('Build rapport and understand the full context before diving into solutions.');
        }
        // Engagement management
        if (flowAnalysis.engagementTrend === 'decreasing') {
            instructions.push('Re-engage by asking about their immediate concerns or switching approach.');
        }
        else if (flowAnalysis.engagementTrend === 'increasing') {
            instructions.push('Maintain momentum by going deeper into the topic.');
        }
        // Intent-specific instructions
        switch (intent.primary) {
            case 'goal_setting':
                if (state.depth > 5) {
                    instructions.push('Time to move from exploration to commitment. Help them define the first step.');
                }
                break;
            case 'emotional_support':
                instructions.push('Continue validating their experience. Only offer solutions when they seem ready.');
                break;
            case 'planning':
                if (state.keyPoints.length > 3) {
                    instructions.push('Help prioritize - they may be overwhelmed by too many options.');
                }
                break;
        }
        // Question management
        if (flowAnalysis.questionRatio > 0.7) {
            instructions.push('They have many questions. Provide some concrete guidance alongside your questions.');
        }
        return instructions.join('\n');
    }
    getOptimalTemperature(intent, state) {
        // Lower temperature for factual/planning, higher for creative/emotional
        const temperatureMap = {
            goal_setting: 0.7,
            habit_formation: 0.6,
            emotional_support: 0.8,
            progress_review: 0.5,
            motivation: 0.9,
            planning: 0.5,
            reflection: 0.8,
            general: 0.7,
        };
        let temperature = temperatureMap[intent.primary] || 0.7;
        // Adjust based on conversation depth
        if (state.depth > 10) {
            temperature -= 0.1; // More focused as conversation progresses
        }
        return Math.max(0.3, Math.min(1.0, temperature));
    }
    updateConversationState(conversationId, state, flowAnalysis) {
        // Update depth
        state.depth += 1;
        // Update engagement based on analysis
        if (flowAnalysis.engagementTrend === 'increasing') {
            state.userEngagement = Math.min(10, state.userEngagement + 1);
        }
        else if (flowAnalysis.engagementTrend === 'decreasing') {
            state.userEngagement = Math.max(1, state.userEngagement - 1);
        }
        // Store updated state
        this.conversationStates.set(conversationId, state);
    }
    async generateFollowUpSuggestions(intent, state) {
        const suggestions = [];
        // Intent-based suggestions
        const intentSuggestions = {
            goal_setting: [
                'What would achieving this goal mean to you?',
                "What's the first small step you could take today?",
                'What might get in the way, and how can we plan for it?',
            ],
            habit_formation: [
                'When would be the best time to practice this habit?',
                'How can we make this habit easier to start?',
                'What would remind you to do this each day?',
            ],
            emotional_support: [
                "What helps you feel better when you're feeling this way?",
                'Who in your life provides good support?',
                'What small self-care action could you take right now?',
            ],
            progress_review: [
                'What are you most proud of from this period?',
                'What would you do differently next time?',
                'How can we build on this momentum?',
            ],
            motivation: [
                'Remember when you overcame something similar?',
                "What's one tiny win you could achieve today?",
                'Who inspires you when you need a boost?',
            ],
            planning: [
                'Which of these feels most important to start with?',
                'How much time can you realistically dedicate?',
                'What resources do you need to succeed?',
            ],
            reflection: [
                'What patterns do you notice in your experiences?',
                'How have you grown through this process?',
                'What would you tell your past self?',
            ],
        };
        const baseSuggestions = intentSuggestions[intent.primary] || [];
        // Select based on conversation depth
        if (state.depth < 3) {
            suggestions.push(...baseSuggestions.slice(0, 2));
        }
        else if (state.depth < 8) {
            suggestions.push(...baseSuggestions.slice(1, 3));
        }
        else {
            suggestions.push('Shall we create an action plan from our discussion?', 'Would you like to schedule a follow-up check-in?', 'What support do you need to move forward?');
        }
        return suggestions;
    }
    async extractActionItems(response, intent) {
        const actions = [];
        // Simple pattern matching for action items
        const actionPatterns = [
            /(?:you could|you might|try to|consider|I suggest|I recommend)\s+(.+?)(?:\.|,|;|$)/gi,
            /(?:first|next|then|finally)\s*,?\s*(.+?)(?:\.|,|;|$)/gi,
            /(?:\d+\.\s*|\-\s*|\*\s*)(.+?)(?:\.|$)/gi,
        ];
        for (const pattern of actionPatterns) {
            const matches = response.matchAll(pattern);
            for (const match of matches) {
                if (match[1] && match[1].length > 10 && match[1].length < 200) {
                    actions.push({
                        action: match[1].trim(),
                        type: intent.primary,
                        priority: this.inferPriority(match[1]),
                    });
                }
            }
        }
        // Deduplicate and limit
        const uniqueActions = Array.from(new Map(actions.map(a => [a.action.toLowerCase(), a])).values()).slice(0, 5);
        return uniqueActions;
    }
    inferPriority(action) {
        if (action.match(/\b(today|now|immediately|first)\b/i))
            return 'high';
        if (action.match(/\b(soon|this week|next)\b/i))
            return 'medium';
        return 'low';
    }
    getSuggestedResponseType(intent) {
        const responseTypes = {
            goal_setting: 'clarifying_questions',
            habit_formation: 'structured_guidance',
            emotional_support: 'empathetic_validation',
            progress_review: 'analytical_summary',
            motivation: 'inspirational_encouragement',
            planning: 'systematic_breakdown',
            reflection: 'thoughtful_questions',
            general: 'balanced_engagement',
        };
        return responseTypes[intent] || 'balanced_engagement';
    }
    async generateSmartResponse(_userId, message, options = {}) {
        const { tone = 'balanced', length = 'medium', includeAction = true, includeEmotion = true, } = options;
        const lengthInstructions = {
            short: 'Respond in 1-2 sentences.',
            medium: 'Respond in 3-5 sentences.',
            long: 'Provide a detailed response with examples.',
        };
        const instructions = [
            lengthInstructions[length],
            includeAction ? 'Include a specific action or suggestion.' : '',
            includeEmotion ? 'Acknowledge their emotional state.' : '',
            `Use a ${tone} tone.`,
        ]
            .filter(Boolean)
            .join(' ');
        const response = await AIService_1.aiService.generateResponse([
            {
                role: 'system',
                content: `You are a conversational AI coach. ${instructions}`,
            },
            {
                role: 'user',
                content: message,
            },
        ], {
            temperature: 0.7,
            maxTokens: length === 'short' ? 100 : length === 'long' ? 500 : 250,
        });
        return response.content;
    }
    clearConversationState(conversationId) {
        this.conversationStates.delete(conversationId);
    }
    getConversationState(conversationId) {
        return this.conversationStates.get(conversationId);
    }
}
exports.ConversationalAI = ConversationalAI;
exports.conversationalAI = new ConversationalAI();
//# sourceMappingURL=ConversationalAI.js.map