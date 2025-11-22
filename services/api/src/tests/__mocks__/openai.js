module.exports = {
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'test-response-id',
          choices: [{
            message: {
              content: 'Test AI response',
              role: 'assistant',
            },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
          model: 'gpt-4',
        }),
      },
    },
  })),
};