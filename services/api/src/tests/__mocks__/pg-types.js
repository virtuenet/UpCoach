module.exports = {
  getTypeParser: jest.fn().mockReturnValue(() => {}),
  textParsers: {
    getTypeParser: jest.fn().mockReturnValue(() => {})
  }
};