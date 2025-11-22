/**
 * Mock for puppeteer module
 * Provides minimal implementation for testing
 */

const mockPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  setViewport: jest.fn().mockResolvedValue(undefined),
  screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
  pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
  evaluate: jest.fn().mockResolvedValue({}),
  waitForSelector: jest.fn().mockResolvedValue(undefined),
  waitForNavigation: jest.fn().mockResolvedValue(undefined),
  click: jest.fn().mockResolvedValue(undefined),
  type: jest.fn().mockResolvedValue(undefined),
  select: jest.fn().mockResolvedValue([]),
  close: jest.fn().mockResolvedValue(undefined),
  content: jest.fn().mockResolvedValue('<html></html>'),
  $: jest.fn().mockResolvedValue(null),
  $$: jest.fn().mockResolvedValue([]),
  $eval: jest.fn().mockResolvedValue(null),
  $$eval: jest.fn().mockResolvedValue([]),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
  pages: jest.fn().mockResolvedValue([mockPage]),
  version: jest.fn().mockReturnValue('mock-version'),
  userAgent: jest.fn().mockResolvedValue('mock-user-agent'),
};

const puppeteer = {
  launch: jest.fn().mockResolvedValue(mockBrowser),
  connect: jest.fn().mockResolvedValue(mockBrowser),
  executablePath: jest.fn().mockReturnValue('/mock/path/to/chrome'),
  defaultArgs: jest.fn().mockReturnValue([]),
};

module.exports = puppeteer;
module.exports.default = puppeteer;
