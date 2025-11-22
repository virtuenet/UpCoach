/**
 * Mock for csv-writer module
 * Provides minimal implementation for testing
 */

const mockWriter = {
  writeRecords: jest.fn().mockResolvedValue(undefined),
  writeHeader: jest.fn().mockResolvedValue(undefined),
};

module.exports = {
  createObjectCsvWriter: jest.fn().mockReturnValue(mockWriter),
  createArrayCsvWriter: jest.fn().mockReturnValue(mockWriter),
  createObjectCsvStringifier: jest.fn().mockReturnValue({
    getHeaderString: jest.fn().mockReturnValue(''),
    stringifyRecords: jest.fn().mockReturnValue(''),
  }),
  createArrayCsvStringifier: jest.fn().mockReturnValue({
    getHeaderString: jest.fn().mockReturnValue(''),
    stringifyRecords: jest.fn().mockReturnValue(''),
  }),
};
