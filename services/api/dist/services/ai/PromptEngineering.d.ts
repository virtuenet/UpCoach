export interface PromptTemplate {
    id: string;
    name: string;
    template: string;
    variables: string[];
    category: string;
    effectiveness?: number;
}
export declare class PromptEngineering {
    private templates;
    constructor();
    private initializeTemplates;
    private addTemplate;
    optimizeMessages(messages: any[], options: any): any[];
    generatePersonalizedPrompt(basePrompt: string, userContext: any, promptType: string): string;
    private summarizeEarlyMessages;
    private applyPersonalityTone;
    private formatContext;
    private enhanceBasePrompt;
    private extractContextValue;
    private addPersonalizationLayers;
    trackPromptEffectiveness(templateId: string, userFeedback: number, completionRate: number): Promise<void>;
    getBestPromptTemplate(category: string, userContext: any): PromptTemplate | null;
    private getContextualRelevance;
}
export declare const promptEngineering: PromptEngineering;
//# sourceMappingURL=PromptEngineering.d.ts.map