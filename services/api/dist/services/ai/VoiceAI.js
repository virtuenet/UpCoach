"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceAI = exports.VoiceAI = void 0;
const openai_1 = require("openai");
const environment_1 = require("../../config/environment");
const Mood_1 = require("../../models/Mood");
const logger_1 = require("../../utils/logger");
const AIService_1 = require("./AIService");
const UserProfilingService_1 = require("./UserProfilingService");
const VoiceJournalEntry_1 = require("../../models/VoiceJournalEntry");
class VoiceAI {
    openai;
    voiceSessions;
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: environment_1.config.openai?.apiKey || process.env.OPENAI_API_KEY,
        });
        this.voiceSessions = new Map();
    }
    async transcribeAudio(audioBuffer, format = 'mp3') {
        try {
            const file = new File([new Uint8Array(audioBuffer)], `audio.${format}`, { type: `audio/${format}` });
            const transcription = await this.openai.audio.transcriptions.create({
                file,
                model: 'whisper-1',
                language: 'en',
                prompt: 'This is a personal reflection or coaching session.',
            });
            return transcription.text;
        }
        catch (error) {
            logger_1.logger.error('Error transcribing audio:', error);
            throw new Error('Failed to transcribe audio');
        }
    }
    async analyzeVoice(userId, audioBuffer, options) {
        try {
            const transcript = await this.transcribeAudio(audioBuffer);
            const [sentiment, speechPatterns, linguisticAnalysis] = await Promise.all([
                this.analyzeSentiment(transcript),
                this.analyzeSpeechPatterns(transcript, audioBuffer),
                this.analyzeLinguistics(transcript),
            ]);
            const insights = await this.generateVoiceInsights(userId, transcript, sentiment, speechPatterns, linguisticAnalysis, options);
            const analysis = {
                transcript,
                sentiment,
                speechPatterns,
                linguisticAnalysis,
                insights,
            };
            await this.storeVoiceSession(userId, analysis, options);
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing voice:', error);
            throw error;
        }
    }
    async analyzeSentiment(transcript) {
        const prompt = `Analyze the emotional sentiment of this transcript:
"${transcript}"

Provide a JSON response with:
- overall: "positive", "neutral", or "negative"
- score: number between -1 (very negative) and 1 (very positive)
- emotions: object with scores (0-1) for: joy, sadness, anger, fear, surprise, trust

Consider tone, word choice, and emotional indicators.`;
        try {
            const response = await AIService_1.aiService.generateResponse([
                {
                    role: 'system',
                    content: 'You are an expert at emotional analysis and sentiment detection. Always respond with valid JSON.',
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
            logger_1.logger.error('Error analyzing sentiment:', error);
            return {
                overall: 'neutral',
                score: 0,
                emotions: {
                    joy: 0.5,
                    sadness: 0.5,
                    anger: 0.5,
                    fear: 0.5,
                    surprise: 0.5,
                    trust: 0.5,
                },
            };
        }
    }
    async analyzeSpeechPatterns(transcript, audioBuffer) {
        const words = transcript.split(/\s+/);
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
        const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
        const fillerCount = words.filter(w => fillerWords.includes(w.toLowerCase())).length;
        const estimatedDuration = audioBuffer.length / 16000;
        const speechRate = (words.length / estimatedDuration) * 60;
        let pace;
        if (speechRate < 120)
            pace = 'slow';
        else if (speechRate > 180)
            pace = 'fast';
        else
            pace = 'normal';
        const pauseIndicators = (transcript.match(/[,.!?;:]/g) || []).length;
        const pauseDuration = pauseIndicators / sentences.length;
        return {
            pace,
            volume: 'normal',
            tone: this.analyzeTone(transcript),
            fillerWords: fillerCount,
            pauseDuration,
            speechRate: Math.round(speechRate),
        };
    }
    analyzeTone(transcript) {
        const exclamations = (transcript.match(/!/g) || []).length;
        const questions = (transcript.match(/\?/g) || []).length;
        const emotiveWords = [
            'love',
            'hate',
            'amazing',
            'terrible',
            'wonderful',
            'awful',
            'excited',
            'worried',
        ];
        const emotiveCount = transcript
            .toLowerCase()
            .split(/\s+/)
            .filter(w => emotiveWords.some(ew => w.includes(ew))).length;
        const totalSentences = transcript.split(/[.!?]+/).length;
        const expressiveness = (exclamations + questions + emotiveCount) / totalSentences;
        if (expressiveness > 0.5)
            return 'expressive';
        if (expressiveness > 0.2)
            return 'varied';
        return 'monotone';
    }
    async analyzeLinguistics(transcript) {
        const words = transcript
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 0);
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
        const uniqueWords = new Set(words);
        const commonWords = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'from',
            'is',
            'are',
            'was',
            'were',
            'been',
            'be',
            'have',
            'has',
            'had',
            'do',
            'does',
            'did',
            'will',
            'would',
            'could',
            'should',
            'may',
            'might',
            'must',
            'can',
            'i',
            'you',
            'he',
            'she',
            'it',
            'we',
            'they',
            'them',
            'their',
            'this',
            'that',
            'these',
            'those',
        ]);
        const sophisticatedWords = Array.from(uniqueWords).filter(w => !commonWords.has(w) && w.length > 6);
        const sophistication = Math.min(10, (sophisticatedWords.length / uniqueWords.size) * 20);
        const avgSentenceLength = words.length / Math.max(1, sentences.length);
        const complexity = avgSentenceLength < 10 ? 'simple' : avgSentenceLength > 20 ? 'complex' : 'moderate';
        return {
            complexity,
            vocabulary: {
                uniqueWords: uniqueWords.size,
                totalWords: words.length,
                sophistication: Math.round(sophistication * 10) / 10,
            },
            sentenceStructure: {
                avgLength: Math.round(avgSentenceLength),
                complexity: Math.min(10, avgSentenceLength / 2),
            },
        };
    }
    async generateVoiceInsights(userId, transcript, sentiment, speechPatterns, linguisticAnalysis, options) {
        const insights = [];
        if (sentiment.score < -0.3) {
            insights.push({
                type: 'emotional',
                insight: 'You seem to be experiencing some challenging emotions right now.',
                confidence: 0.8,
                recommendations: [
                    'Take a few deep breaths to center yourself',
                    'Consider what specific factors are contributing to these feelings',
                    "Remember that it's okay to have difficult days",
                ],
            });
        }
        else if (sentiment.score > 0.5) {
            insights.push({
                type: 'emotional',
                insight: 'Your positive energy is evident in your voice!',
                confidence: 0.85,
                recommendations: [
                    'Harness this positive momentum for your goals',
                    "Consider what's contributing to this good feeling",
                    'Share your positivity with others today',
                ],
            });
        }
        if (speechPatterns.fillerWords > 5) {
            insights.push({
                type: 'behavioral',
                insight: "You're using several filler words, which might indicate uncertainty or nervousness.",
                confidence: 0.7,
                recommendations: [
                    'Take a moment to collect your thoughts before speaking',
                    'Practice pausing instead of using filler words',
                    'Focus on speaking more slowly and deliberately',
                ],
            });
        }
        if (speechPatterns.pace === 'fast') {
            insights.push({
                type: 'behavioral',
                insight: 'Your rapid speech pace suggests excitement or anxiety.',
                confidence: 0.75,
                recommendations: [
                    'Try to slow down and breathe between thoughts',
                    'Ground yourself with a brief mindfulness moment',
                    "Consider if you're trying to rush through something",
                ],
            });
        }
        if (linguisticAnalysis.complexity === 'complex' &&
            linguisticAnalysis.vocabulary.sophistication > 7) {
            insights.push({
                type: 'linguistic',
                insight: 'Your sophisticated vocabulary and complex thoughts show deep reflection.',
                confidence: 0.8,
                recommendations: [
                    'This analytical thinking is valuable for problem-solving',
                    'Consider balancing analysis with action',
                    'Use this clarity to set specific goals',
                ],
            });
        }
        if (sentiment.emotions.sadness > 0.7 || sentiment.emotions.fear > 0.7) {
            insights.push({
                type: 'health',
                insight: 'Your emotional state may be affecting your overall well-being.',
                confidence: 0.7,
                recommendations: [
                    'Consider reaching out to a friend or support system',
                    'Engage in self-care activities that bring you comfort',
                    'Remember that seeking professional help is a sign of strength',
                ],
            });
        }
        const patterns = await this.analyzeVoicePatterns(userId, transcript);
        insights.push(...patterns.map(p => ({
            type: 'behavioral',
            insight: p.significance,
            confidence: 0.75,
            recommendations: p.recommendations,
        })));
        return insights;
    }
    async analyzeVoicePatterns(userId, transcript) {
        const sessions = this.voiceSessions.get(userId) || [];
        const patterns = [];
        if (sessions.length < 3)
            return patterns;
        const commonPhrases = this.findCommonPhrases(sessions.map(s => s.transcript).concat(transcript));
        if (commonPhrases.length > 0) {
            patterns.push({
                pattern: 'recurring_themes',
                frequency: commonPhrases.length,
                examples: commonPhrases.slice(0, 3),
                significance: "You frequently mention these topics, indicating they're important to you.",
                recommendations: [
                    'Focus your goals around these recurring themes',
                    'Explore why these topics keep coming up',
                    'Consider taking concrete action on these areas',
                ],
            });
        }
        const emotionalTrend = this.analyzeEmotionalTrend(sessions);
        if (emotionalTrend) {
            patterns.push(emotionalTrend);
        }
        return patterns;
    }
    findCommonPhrases(transcripts) {
        const allPhrases = new Map();
        transcripts.forEach(transcript => {
            const words = transcript.toLowerCase().split(/\s+/);
            for (let len = 2; len <= 4; len++) {
                for (let i = 0; i <= words.length - len; i++) {
                    const phrase = words.slice(i, i + len).join(' ');
                    if (!this.isCommonPhrase(phrase)) {
                        allPhrases.set(phrase, (allPhrases.get(phrase) || 0) + 1);
                    }
                }
            }
        });
        return Array.from(allPhrases.entries())
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .map(([phrase]) => phrase);
    }
    isCommonPhrase(phrase) {
        const commonPhrases = [
            'i am',
            'i have',
            'i want',
            'i need',
            'i think',
            'i feel',
            'it is',
            'it was',
            'there is',
            'there are',
            'and the',
            'of the',
        ];
        return commonPhrases.some(cp => phrase.includes(cp));
    }
    analyzeEmotionalTrend(sessions) {
        if (sessions.length < 3)
            return null;
        const recentSentiments = sessions.slice(-5).map(s => s.analysis.sentiment.score);
        const avgRecent = recentSentiments.reduce((sum, s) => sum + s, 0) / recentSentiments.length;
        const olderSentiments = sessions.slice(-10, -5).map(s => s.analysis.sentiment.score);
        const avgOlder = olderSentiments.length > 0
            ? olderSentiments.reduce((sum, s) => sum + s, 0) / olderSentiments.length
            : 0;
        if (avgRecent > avgOlder + 0.3) {
            return {
                pattern: 'improving_mood',
                frequency: sessions.length,
                examples: ['Sentiment improving over time'],
                significance: 'Your emotional state has been improving recently.',
                recommendations: [
                    "Keep doing what's working for you",
                    "Document what's contributing to this positive change",
                    'Use this momentum to tackle bigger challenges',
                ],
            };
        }
        else if (avgRecent < avgOlder - 0.3) {
            return {
                pattern: 'declining_mood',
                frequency: sessions.length,
                examples: ['Sentiment declining over time'],
                significance: 'Your emotional well-being seems to be declining.',
                recommendations: [
                    'Identify what might be causing increased stress',
                    'Return to activities that previously brought you joy',
                    'Consider reaching out for additional support',
                ],
            };
        }
        return null;
    }
    async storeVoiceSession(userId, analysis, options) {
        const session = {
            id: `voice_${Date.now()}`,
            userId,
            timestamp: new Date(),
            duration: analysis.speechPatterns.speechRate > 0
                ? (analysis.transcript.split(/\s+/).length / analysis.speechPatterns.speechRate) * 60
                : 60,
            transcript: analysis.transcript,
            analysis,
            coachingResponse: options?.coachingResponse,
            actionItems: options?.actionItems,
        };
        const userSessions = this.voiceSessions.get(userId) || [];
        userSessions.push(session);
        if (userSessions.length > 50) {
            userSessions.shift();
        }
        this.voiceSessions.set(userId, userSessions);
        if (analysis.sentiment.overall !== 'neutral') {
            await this.updateMoodFromVoice(userId, analysis);
        }
    }
    async updateMoodFromVoice(userId, analysis) {
        try {
            let mood;
            if (analysis.sentiment.overall === 'positive') {
                mood = analysis.sentiment.emotions.joy > 0.7 ? 'great' : 'good';
            }
            else if (analysis.sentiment.overall === 'negative') {
                if (analysis.sentiment.emotions.sadness > 0.6)
                    mood = 'bad';
                else if (analysis.sentiment.emotions.anger > 0.6)
                    mood = 'terrible';
                else
                    mood = 'bad';
            }
            else {
                mood = 'okay';
            }
            const energy = analysis.speechPatterns.pace === 'fast'
                ? 7
                : analysis.speechPatterns.pace === 'slow'
                    ? 3
                    : 5;
            await Mood_1.Mood.create({
                userId,
                mood,
                moodScore: mood === 'great' ? 5 : mood === 'good' ? 4 : mood === 'okay' ? 3 : mood === 'bad' ? 2 : 1,
                energyLevel: energy,
                notes: `Voice reflection: ${analysis.transcript.substring(0, 100)}...`,
                activities: ['voice_reflection'],
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating mood from voice:', error);
        }
    }
    async generateVoiceCoaching(userId, voiceAnalysis, options) {
        try {
            const profile = await UserProfilingService_1.userProfilingService.createOrUpdateProfile(userId);
            const context = {
                emotionalState: voiceAnalysis.sentiment,
                communicationStyle: voiceAnalysis.speechPatterns,
                keyThemes: this.extractKeyThemes(voiceAnalysis.transcript),
                insights: voiceAnalysis.insights,
            };
            const prompt = this.buildVoiceCoachingPrompt(voiceAnalysis.transcript, context, profile, options);
            const response = await AIService_1.aiService.generateResponse([
                {
                    role: 'system',
                    content: 'You are a compassionate voice coach who provides personalized guidance based on voice analysis. Be warm, understanding, and actionable.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ], {
                personality: profile.communicationPreference,
                temperature: 0.8,
                maxTokens: 800,
            });
            const { actionItems, followUpQuestions } = this.parseCoachingResponse(response.content);
            return {
                response: response.content,
                actionItems,
                followUpQuestions,
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating voice coaching:', error);
            throw error;
        }
    }
    buildVoiceCoachingPrompt(transcript, context, profile, options) {
        const style = options?.style || 'supportive';
        const focusArea = options?.focusArea || 'general wellbeing';
        return `Based on this voice reflection, provide ${style} coaching:

User said: "${transcript}"

Context:
- Emotional state: ${context.emotionalState.overall} (score: ${context.emotionalState.score})
- Key emotions: ${Object.entries(context.emotionalState.emotions)
            .filter(([_, v]) => v > 0.5)
            .map(([k]) => k)
            .join(', ')}
- Speech patterns: ${context.communicationStyle.pace} pace, ${context.communicationStyle.tone} tone
- Key themes: ${context.keyThemes.join(', ')}

User profile:
- Learning style: ${profile.learningStyle}
- Communication preference: ${profile.communicationPreference}
- Current goals: ${profile.progressMetrics?.totalGoalsSet} active

Please provide:
1. A warm, personalized response addressing their reflection
2. 2-3 specific action items they can take today
3. 2-3 follow-up questions to deepen their reflection

Focus on: ${focusArea}
Style: ${style}`;
    }
    extractKeyThemes(transcript) {
        const keywords = [
            'goal',
            'challenge',
            'feeling',
            'progress',
            'struggle',
            'success',
            'worried',
            'excited',
            'grateful',
            'stressed',
        ];
        const words = transcript.toLowerCase().split(/\s+/);
        const themes = keywords.filter(keyword => words.some(word => word.includes(keyword)));
        if (transcript.toLowerCase().includes('work') || transcript.toLowerCase().includes('job')) {
            themes.push('career');
        }
        if (transcript.toLowerCase().includes('family') ||
            transcript.toLowerCase().includes('relationship')) {
            themes.push('relationships');
        }
        if (transcript.toLowerCase().includes('health') ||
            transcript.toLowerCase().includes('exercise')) {
            themes.push('health');
        }
        return [...new Set(themes)];
    }
    parseCoachingResponse(response) {
        const actionItems = [];
        const followUpQuestions = [];
        const actionMatches = response.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n|$)/g);
        if (actionMatches) {
            actionItems.push(...actionMatches.map(m => m.replace(/^[\d+.\-*]\s*/, '').trim()));
        }
        const questionMatches = response.match(/([^.!]+\?)/g);
        if (questionMatches) {
            followUpQuestions.push(...questionMatches.map(q => q.trim()));
        }
        return {
            actionItems: actionItems.slice(0, 3),
            followUpQuestions: followUpQuestions.slice(0, 3),
        };
    }
    async getVoiceInsightSummary(userId, days = 30) {
        const sessions = this.voiceSessions.get(userId) || [];
        const recentSessions = sessions.filter(s => s.timestamp > new Date(Date.now() - days * 24 * 60 * 60 * 1000));
        if (recentSessions.length === 0) {
            return {
                summary: 'No voice sessions recorded in the specified period.',
                trends: [],
                recommendations: ['Try recording a voice reflection to get started'],
                stats: {
                    totalSessions: 0,
                    avgSentiment: 0,
                    dominantEmotion: 'neutral',
                    avgSpeechRate: 0,
                    vocabularyGrowth: 0,
                },
            };
        }
        const avgSentiment = recentSessions.reduce((sum, s) => sum + s.analysis.sentiment.score, 0) /
            recentSessions.length;
        const allEmotions = recentSessions.flatMap(s => Object.entries(s.analysis.sentiment.emotions));
        const emotionSums = {};
        allEmotions.forEach(([emotion, score]) => {
            emotionSums[emotion] = (emotionSums[emotion] || 0) + score;
        });
        const dominantEmotion = Object.entries(emotionSums).sort((a, b) => b[1] - a[1])[0][0];
        const avgSpeechRate = recentSessions.reduce((sum, s) => sum + s.analysis.speechPatterns.speechRate, 0) /
            recentSessions.length;
        const trends = this.analyzeVoiceTrends(recentSessions);
        const summary = await this.generateInsightSummary(recentSessions, avgSentiment, dominantEmotion, trends);
        const recommendations = this.generateVoiceRecommendations(avgSentiment, dominantEmotion, trends, recentSessions);
        return {
            summary,
            trends,
            recommendations,
            stats: {
                totalSessions: recentSessions.length,
                avgSentiment: Math.round(avgSentiment * 100) / 100,
                dominantEmotion,
                avgSpeechRate: Math.round(avgSpeechRate),
                vocabularyGrowth: this.calculateVocabularyGrowth(recentSessions),
            },
        };
    }
    analyzeVoiceTrends(sessions) {
        const trends = [];
        const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
        const secondHalf = sessions.slice(Math.floor(sessions.length / 2));
        const firstHalfSentiment = firstHalf.reduce((sum, s) => sum + s.analysis.sentiment.score, 0) /
            Math.max(1, firstHalf.length);
        const secondHalfSentiment = secondHalf.reduce((sum, s) => sum + s.analysis.sentiment.score, 0) /
            Math.max(1, secondHalf.length);
        if (secondHalfSentiment > firstHalfSentiment + 0.1) {
            trends.push({
                metric: 'Emotional Well-being',
                trend: 'improving',
                detail: 'Your emotional state has been improving over time',
            });
        }
        else if (secondHalfSentiment < firstHalfSentiment - 0.1) {
            trends.push({
                metric: 'Emotional Well-being',
                trend: 'declining',
                detail: 'Your emotional state shows signs of decline',
            });
        }
        else {
            trends.push({
                metric: 'Emotional Well-being',
                trend: 'stable',
                detail: 'Your emotional state remains consistent',
            });
        }
        const recentSpeechRate = secondHalf.reduce((sum, s) => sum + s.analysis.speechPatterns.speechRate, 0) /
            Math.max(1, secondHalf.length);
        const olderSpeechRate = firstHalf.reduce((sum, s) => sum + s.analysis.speechPatterns.speechRate, 0) /
            Math.max(1, firstHalf.length);
        if (Math.abs(recentSpeechRate - olderSpeechRate) < 10) {
            trends.push({
                metric: 'Communication Style',
                trend: 'stable',
                detail: 'Your speech patterns remain consistent',
            });
        }
        return trends;
    }
    async generateInsightSummary(sessions, avgSentiment, dominantEmotion, trends) {
        const emotionDescription = avgSentiment > 0.3 ? 'generally positive' : avgSentiment < -0.3 ? 'challenging' : 'balanced';
        const summary = `Over the past ${sessions.length} voice sessions, your emotional state has been ${emotionDescription}. ` +
            `Your dominant emotion has been ${dominantEmotion}, appearing in ${Math.round((sessions.filter(s => Object.entries(s.analysis.sentiment.emotions).sort((a, b) => b[1] - a[1])[0][0] ===
                dominantEmotion).length /
                sessions.length) *
                100)}% of sessions. ` +
            `Your communication style shows ${trends.find(t => t.metric === 'Communication Style')?.detail || 'consistent patterns'}.`;
        return summary;
    }
    generateVoiceRecommendations(avgSentiment, dominantEmotion, trends, sessions) {
        const recommendations = [];
        if (avgSentiment < -0.2) {
            recommendations.push('Consider incorporating mood-lifting activities into your daily routine');
            recommendations.push('Try gratitude journaling alongside your voice reflections');
        }
        else if (avgSentiment > 0.5) {
            recommendations.push("Document what's working well to maintain this positive momentum");
            recommendations.push('Use your positive energy to tackle more challenging goals');
        }
        if (dominantEmotion === 'sadness') {
            recommendations.push('Reach out to your support network when feeling down');
        }
        else if (dominantEmotion === 'stress' || dominantEmotion === 'anger') {
            recommendations.push('Practice stress-reduction techniques like deep breathing');
        }
        else if (dominantEmotion === 'joy') {
            recommendations.push('Share your positive experiences with others');
        }
        const fillerWordAvg = sessions.reduce((sum, s) => sum + s.analysis.speechPatterns.fillerWords, 0) / sessions.length;
        if (fillerWordAvg > 5) {
            recommendations.push('Practice speaking more confidently by preparing key points before recording');
        }
        return recommendations.slice(0, 3);
    }
    calculateVocabularyGrowth(sessions) {
        if (sessions.length < 2)
            return 0;
        const firstSession = sessions[0];
        const lastSession = sessions[sessions.length - 1];
        const growth = (lastSession.analysis.linguisticAnalysis.vocabulary.sophistication -
            firstSession.analysis.linguisticAnalysis.vocabulary.sophistication) /
            firstSession.analysis.linguisticAnalysis.vocabulary.sophistication;
        return Math.round(growth * 100);
    }
    async compareVoiceSessions(userId, sessionId1, sessionId2) {
        const sessions = this.voiceSessions.get(userId) || [];
        const session1 = sessions.find(s => s.id === sessionId1);
        const session2 = sessions.find(s => s.id === sessionId2);
        if (!session1 || !session2) {
            throw new Error('Sessions not found');
        }
        const sentimentChange = session2.analysis.sentiment.score - session1.analysis.sentiment.score;
        const speechRateChange = session2.analysis.speechPatterns.speechRate - session1.analysis.speechPatterns.speechRate;
        const vocabularyChange = session2.analysis.linguisticAnalysis.vocabulary.sophistication -
            session1.analysis.linguisticAnalysis.vocabulary.sophistication;
        const emotionChanges = {};
        Object.keys(session1.analysis.sentiment.emotions).forEach(emotion => {
            emotionChanges[emotion] =
                session2.analysis.sentiment.emotions[emotion] -
                    session1.analysis.sentiment.emotions[emotion];
        });
        const insights = this.generateComparisonInsights(sentimentChange, speechRateChange, vocabularyChange, emotionChanges);
        const recommendations = this.generateComparisonRecommendations(sentimentChange, speechRateChange, vocabularyChange);
        return {
            comparison: {
                sentiment: {
                    change: sentimentChange,
                    interpretation: sentimentChange > 0.2
                        ? 'Significant improvement'
                        : sentimentChange < -0.2
                            ? 'Notable decline'
                            : 'Relatively stable',
                },
                speechRate: {
                    change: speechRateChange,
                    interpretation: Math.abs(speechRateChange) < 20
                        ? 'Consistent pace'
                        : speechRateChange > 0
                            ? 'Speaking faster'
                            : 'Speaking slower',
                },
                vocabulary: {
                    change: vocabularyChange,
                    interpretation: vocabularyChange > 1
                        ? 'Vocabulary expanding'
                        : vocabularyChange < -1
                            ? 'Simpler language use'
                            : 'Stable vocabulary',
                },
                emotions: emotionChanges,
            },
            insights,
            recommendations,
        };
    }
    generateComparisonInsights(sentimentChange, speechRateChange, vocabularyChange, emotionChanges) {
        const insights = [];
        if (sentimentChange > 0.3) {
            insights.push('Your emotional state has significantly improved between these sessions');
        }
        else if (sentimentChange < -0.3) {
            insights.push('You seem to be facing more challenges in the recent session');
        }
        if (speechRateChange > 30) {
            insights.push('Your increased speech rate might indicate excitement or anxiety');
        }
        else if (speechRateChange < -30) {
            insights.push('Your slower pace suggests more thoughtful reflection');
        }
        const biggestEmotionChange = Object.entries(emotionChanges).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
        if (Math.abs(biggestEmotionChange[1]) > 0.3) {
            insights.push(`Notable change in ${biggestEmotionChange[0]}: ${biggestEmotionChange[1] > 0 ? 'increased' : 'decreased'}`);
        }
        return insights;
    }
    generateComparisonRecommendations(sentimentChange, speechRateChange, vocabularyChange) {
        const recommendations = [];
        if (sentimentChange < -0.3) {
            recommendations.push('Identify what changed between sessions to address the decline');
            recommendations.push('Consider revisiting strategies that worked in the earlier session');
        }
        else if (sentimentChange > 0.3) {
            recommendations.push('Document what contributed to this positive change');
            recommendations.push('Apply these successful strategies to other areas');
        }
        if (Math.abs(speechRateChange) > 40) {
            recommendations.push('Be mindful of your speaking pace for clearer communication');
        }
        return recommendations.slice(0, 3);
    }
    async saveAnalysis(userId, analysis, options) {
        try {
            const title = options?.title || this.generateAnalysisTitle(analysis);
            const summary = this.generateAnalysisSummary(analysis);
            let emotionalTone;
            if (analysis.sentiment.score > 0.3) {
                emotionalTone = 'positive';
            }
            else if (analysis.sentiment.score < -0.3) {
                emotionalTone = 'negative';
            }
            else if (Math.abs(analysis.sentiment.score) < 0.1) {
                emotionalTone = 'neutral';
            }
            else {
                emotionalTone = 'mixed';
            }
            const tags = this.generateAnalysisTags(analysis, options?.sessionType);
            const voiceEntry = await VoiceJournalEntry_1.VoiceJournalEntry.create({
                userId,
                title,
                transcriptionText: analysis.transcript,
                audioFilePath: options?.audioUrl,
                duration: options?.duration || Math.floor(analysis.transcript.split(/\s+/).length / 2.5 * 60),
                summary,
                tags,
                emotionalTone,
                isTranscribed: true,
                isAnalyzed: true,
                isFavorite: false,
            });
            logger_1.logger.info('Voice analysis saved successfully', {
                userId,
                entryId: voiceEntry.id,
                analysisType: options?.sessionType || 'general',
                sentiment: analysis.sentiment.overall,
                insightCount: analysis.insights.length,
            });
            return voiceEntry;
        }
        catch (error) {
            logger_1.logger.error('Error saving voice analysis:', error);
            throw new Error(`Failed to save voice analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    generateAnalysisTitle(analysis) {
        const keyWords = analysis.transcript
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 4)
            .slice(0, 5);
        const sentiment = analysis.sentiment.overall;
        const date = new Date().toLocaleDateString();
        const themes = this.extractKeyThemes(analysis.transcript);
        const mainTheme = themes.length > 0 ? themes[0] : 'reflection';
        if (mainTheme !== 'reflection') {
            return `${mainTheme.charAt(0).toUpperCase() + mainTheme.slice(1)} Reflection - ${date}`;
        }
        if (analysis.insights.length > 0) {
            const firstInsight = analysis.insights[0];
            if (firstInsight.type === 'emotional' && sentiment === 'positive') {
                return `Positive Voice Reflection - ${date}`;
            }
            else if (firstInsight.type === 'behavioral') {
                return `Behavioral Insights - ${date}`;
            }
            else if (firstInsight.type === 'health') {
                return `Wellness Check-in - ${date}`;
            }
        }
        return `Voice Reflection - ${date}`;
    }
    generateAnalysisSummary(analysis) {
        const parts = [];
        parts.push(`Overall sentiment: ${analysis.sentiment.overall} (${analysis.sentiment.score > 0 ? '+' : ''}${(analysis.sentiment.score * 100).toFixed(0)}%)`);
        parts.push(`Speech: ${analysis.speechPatterns.pace} pace, ${analysis.speechPatterns.tone} tone`);
        parts.push(`Language: ${analysis.linguisticAnalysis.complexity} complexity, ${analysis.linguisticAnalysis.vocabulary.uniqueWords} unique words`);
        if (analysis.insights.length > 0) {
            const topInsights = analysis.insights
                .filter(insight => insight.confidence > 0.7)
                .slice(0, 2)
                .map(insight => insight.insight);
            if (topInsights.length > 0) {
                parts.push(`Key insights: ${topInsights.join('; ')}`);
            }
        }
        return parts.join('. ');
    }
    generateAnalysisTags(analysis, sessionType) {
        const tags = new Set();
        if (sessionType) {
            tags.add(sessionType);
        }
        tags.add(analysis.sentiment.overall);
        Object.entries(analysis.sentiment.emotions).forEach(([emotion, score]) => {
            if (score > 0.6) {
                tags.add(emotion);
            }
        });
        if (analysis.speechPatterns.pace !== 'normal') {
            tags.add(`${analysis.speechPatterns.pace}_pace`);
        }
        if (analysis.speechPatterns.tone === 'expressive') {
            tags.add('expressive');
        }
        if (analysis.linguisticAnalysis.complexity === 'complex') {
            tags.add('complex_language');
        }
        analysis.insights.forEach(insight => {
            if (insight.confidence > 0.7) {
                tags.add(insight.type);
            }
        });
        const themes = this.extractKeyThemes(analysis.transcript);
        themes.forEach(theme => tags.add(theme));
        return Array.from(tags).slice(0, 8);
    }
}
exports.VoiceAI = VoiceAI;
exports.voiceAI = new VoiceAI();
