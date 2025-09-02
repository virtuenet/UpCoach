export interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface ClaudeResponse {
    content: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}
export declare class ClaudeService {
    generateResponse(messages: ClaudeMessage[], options?: {
        maxTokens?: number;
        temperature?: number;
        model?: string;
    }): Promise<ClaudeResponse>;
    generateCoachingResponse(userMessage: string, conversationHistory?: ClaudeMessage[]): Promise<string>;
}
export declare const claudeService: ClaudeService;
//# sourceMappingURL=claude.d.ts.map