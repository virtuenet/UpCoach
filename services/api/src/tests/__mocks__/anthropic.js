module.exports = jest.fn().mockImplementation(() => ({
  messages: {
    create: jest.fn().mockResolvedValue({
      id: 'test-claude-id',
      content: [{
        type: 'text',
        text: 'Test Claude response',
      }],
      usage: {
        input_tokens: 12,
        output_tokens: 8,
      },
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
    }),
  },
}));