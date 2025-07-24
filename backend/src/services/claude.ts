import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: config.claude?.apiKey || process.env.CLAUDE_API_KEY,
});

// System prompt for Claude coaching
const CLAUDE_SYSTEM_PROMPT = `You are UpCoach, an AI personal development coach. Your role is to help users achieve their goals, improve their well-being, and develop personally and professionally.

Key characteristics:
- Be supportive, empathetic, and encouraging
- Provide practical, actionable advice
- Ask thoughtful questions to help users reflect
- Draw from evidence-based practices in psychology, productivity, and personal development
- Be concise but thorough in your responses
- Maintain a positive but realistic outlook
- Respect user privacy and maintain confidentiality

You can help with:
- Goal setting and achievement
- Task management and productivity
- Stress management and well-being
- Career development
- Habit formation
- Time management
- Motivation and accountability
- Personal reflection and growth

Always remember to be respectful, non-judgmental, and supportive. If users share sensitive information, acknowledge it appropriately and provide resources if needed.`;

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

export class ClaudeService {
  async generateResponse(
    messages: ClaudeMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<ClaudeResponse> {
    try {
      const {
        maxTokens = 1000,
        temperature = 0.7,
        model = 'claude-3-sonnet-20240229'
      } = options;

      // Format messages for Claude
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: CLAUDE_SYSTEM_PROMPT,
        messages: formattedMessages
      });

      // Extract text content from Claude's response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      return {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }
      };

    } catch (error) {
      logger.error('Claude API error:', error);
      throw new Error('Failed to generate Claude response');
    }
  }

  async generateCoachingResponse(
    userMessage: string,
    conversationHistory: ClaudeMessage[] = []
  ): Promise<string> {
    try {
      const messages: ClaudeMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await this.generateResponse(messages, {
        maxTokens: 1000,
        temperature: 0.7
      });

      return response.content;

    } catch (error) {
      logger.error('Error generating coaching response:', error);
      throw error;
    }
  }
}

export const claudeService = new ClaudeService(); 