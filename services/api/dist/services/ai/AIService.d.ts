export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
    function_call?: any;
}
export interface AIResponse {
    content: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
        total_tokens?: number;
    };
    model?: string;
    provider?: 'openai' | 'claude';
}
export interface AIOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    provider?: 'openai' | 'claude';
    personality?: string;
    context?: any;
    useCache?: boolean;
    cacheTTL?: number;
}
export declare class AIService {
    private openai;
    private anthropic;
    private promptEngine;
    private contextManager;
    private personalityEngine;
    private circuitBreaker;
    private retry;
    private metrics;
    constructor();
    generateResponse(messages: AIMessage[], options?: AIOptions): Promise<AIResponse>;
    private generateOpenAIResponse;
    private generateClaudeResponse;
    generateCoachingResponse(userMessage: string, options?: {
        conversationHistory?: AIMessage[];
        userId?: string;
        personality?: string;
        context?: any;
        provider?: 'openai' | 'claude';
    }): Promise<AIResponse>;
    analyzeConversation(messages: AIMessage[], analysisType: 'sentiment' | 'topics' | 'summary' | 'insights'): Promise<any>;
    generatePersonalizedPrompt(basePrompt: string, userId: string, promptType: 'goal' | 'habit' | 'reflection' | 'motivation'): Promise<string>;
    getOptimalModel(task: 'coaching' | 'analysis' | 'creative' | 'technical'): {
        provider: 'openai' | 'claude';
        model: string;
    };
    createInitialSession(userId: number, onboardingData: any): Promise<void>;
    private optimizeTokenUsage;
    getMetrics(): {
        totalRequests: number;
        totalErrors: number;
        averageResponseTime: number;
        errorRate: number;
        cacheHitRate: number;
        circuitBreakerState: import("./CircuitBreaker").CircuitState;
        cacheStats: import("../cache/UnifiedCacheService").CacheStats;
    };
    clearCache(namespace?: string): Promise<void>;
    healthCheck(): Promise<{
        openai: boolean;
        claude: boolean;
        cache: boolean;
        circuitBreaker: string;
    }>;
}
export declare const aiService: AIService;
//# sourceMappingURL=AIService.d.ts.map