export interface PersonalityProfile {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    traits: {
        empathy: number;
        directness: number;
        motivation: number;
        analytical: number;
        warmth: number;
        formality: number;
    };
    communicationStyle: {
        greetings: string[];
        encouragements: string[];
        acknowledgments: string[];
        transitions: string[];
        closings: string[];
    };
    responsePatterns: {
        questionStyle: 'open' | 'directed' | 'socratic';
        feedbackStyle: 'supportive' | 'constructive' | 'balanced';
        suggestionStyle: 'gentle' | 'direct' | 'collaborative';
    };
}
export declare class PersonalityEngine {
    private personalities;
    private activePersonality;
    constructor();
    private initializePersonalities;
    private addPersonality;
    getSystemPrompt(personalityId?: string): string;
    getPersonality(personalityId?: string): PersonalityProfile;
    selectOptimalPersonality(userContext: any): string;
    enhanceResponse(response: string, personalityId: string, responseType: 'greeting' | 'encouragement' | 'acknowledgment' | 'transition' | 'closing'): string;
    adjustTone(message: string, personalityId: string): string;
    private makeInformal;
    private makeFormal;
    private addWarmth;
    private makeDirect;
    trackPersonalityEffectiveness(personalityId: string, userId: string, metrics: {
        userSatisfaction?: number;
        goalProgress?: number;
        engagementLevel?: number;
        sessionDuration?: number;
    }): Promise<void>;
    getPersonalityRecommendation(userId: string, userHistory?: any): Promise<string>;
}
export declare const personalityEngine: PersonalityEngine;
//# sourceMappingURL=PersonalityEngine.d.ts.map