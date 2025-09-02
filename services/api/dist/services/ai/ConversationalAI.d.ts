export interface ConversationState {
    topic: string;
    depth: number;
    emotionalTone: string;
    userEngagement: number;
    keyPoints: string[];
    nextActions: string[];
}
export interface ConversationIntent {
    primary: string;
    secondary: string[];
    confidence: number;
    suggestedResponse: string;
}
export declare class ConversationalAI {
    private conversationStates;
    private intentPatterns;
    constructor();
    private initializeIntentPatterns;
    processConversation(userId: string, message: string, conversationId: string, context?: any): Promise<{
        response: string;
        intent: ConversationIntent;
        state: ConversationState;
        suggestions?: string[];
        actions?: any[];
    }>;
    private detectIntent;
    private analyzeIntentWithAI;
    private getOrCreateState;
    private getConversationHistory;
    private analyzeConversationFlow;
    private generateContextualResponse;
    private buildSystemPrompt;
    private getConversationManagementInstructions;
    private getOptimalTemperature;
    private updateConversationState;
    private generateFollowUpSuggestions;
    private extractActionItems;
    private inferPriority;
    private getSuggestedResponseType;
    generateSmartResponse(_userId: string, message: string, options?: {
        tone?: string;
        length?: 'short' | 'medium' | 'long';
        includeAction?: boolean;
        includeEmotion?: boolean;
    }): Promise<string>;
    clearConversationState(conversationId: string): void;
    getConversationState(conversationId: string): ConversationState | undefined;
}
export declare const conversationalAI: ConversationalAI;
//# sourceMappingURL=ConversationalAI.d.ts.map