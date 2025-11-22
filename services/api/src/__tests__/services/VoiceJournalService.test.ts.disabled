import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VoiceJournalService } from '../../services/VoiceJournalService';
import { VoiceJournal } from '../../models/VoiceJournal';
import { User } from '../../models/User';
import { StorageService } from '../../services/storage/StorageService';
import { AIService } from '../../services/ai/AIService';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('../../models/VoiceJournal');
jest.mock('../../models/User');
jest.mock('../../services/storage/StorageService');
jest.mock('../../services/ai/AIService');
jest.mock('fs/promises');

const mockVoiceJournal = VoiceJournal as jest.Mocked<typeof VoiceJournal>;
const mockUser = User as jest.Mocked<typeof User>;
const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;
const mockAIService = AIService as jest.Mocked<typeof AIService>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('VoiceJournalService', () => {
  let voiceJournalService: VoiceJournalService;
  const testUserId = 'test-user-123';
  const testJournalId = 'journal-456';
  const testFilePath = '/tmp/test-audio.wav';
  const mockAudioBuffer = Buffer.from('mock-audio-data');

  beforeEach(() => {
    voiceJournalService = new VoiceJournalService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('uploadVoiceJournal', () => {
    it('should upload and process voice journal successfully', async () => {
      // Mock user
      const mockUserInstance = {
        id: testUserId,
        name: 'Test User',
        email: 'test@upcoach.ai'
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      // Mock file operations
      mockFs.readFile = jest.fn().mockResolvedValue(mockAudioBuffer);
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);

      // Mock storage service
      const mockStorageInstance = {
        uploadFile: jest.fn().mockResolvedValue({
          fileUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
          fileName: 'voice-journal-123.wav'
        })
      };
      StorageService.getInstance = jest.fn().mockReturnValue(mockStorageInstance);

      // Mock AI service
      const mockAIInstance = {
        transcribeAudio: jest.fn().mockResolvedValue({
          text: 'This is my voice journal entry for today.',
          confidence: 0.95,
          duration: 30.5
        }),
        analyzeSentiment: jest.fn().mockResolvedValue({
          sentiment: 'positive',
          score: 0.8,
          emotions: ['joy', 'optimism']
        }),
        extractKeywords: jest.fn().mockResolvedValue(['goals', 'progress', 'motivation'])
      };
      AIService.getInstance = jest.fn().mockReturnValue(mockAIInstance);

      // Mock voice journal creation
      const mockJournalInstance = {
        id: testJournalId,
        userId: testUserId,
        audioUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
        transcript: 'This is my voice journal entry for today.',
        sentiment: 'positive',
        emotions: ['joy', 'optimism'],
        keywords: ['goals', 'progress', 'motivation'],
        duration: 30.5,
        createdAt: new Date()
      };
      mockVoiceJournal.create = jest.fn().mockResolvedValue(mockJournalInstance);

      const result = await voiceJournalService.uploadVoiceJournal(
        testUserId,
        testFilePath,
        'Test Journal Entry'
      );

      expect(result).toEqual(mockJournalInstance);
      expect(mockFs.readFile).toHaveBeenCalledWith(testFilePath);
      expect(mockStorageInstance.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringContaining('voice-journals/'),
        'audio/wav'
      );
      expect(mockAIInstance.transcribeAudio).toHaveBeenCalledWith(mockAudioBuffer);
      expect(mockAIInstance.analyzeSentiment).toHaveBeenCalledWith('This is my voice journal entry for today.');
      expect(mockAIInstance.extractKeywords).toHaveBeenCalledWith('This is my voice journal entry for today.');
      expect(mockVoiceJournal.create).toHaveBeenCalledWith({
        userId: testUserId,
        title: 'Test Journal Entry',
        audioUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
        transcript: 'This is my voice journal entry for today.',
        sentiment: 'positive',
        sentimentScore: 0.8,
        emotions: ['joy', 'optimism'],
        keywords: ['goals', 'progress', 'motivation'],
        duration: 30.5,
        processingStatus: 'completed'
      });
      expect(mockFs.unlink).toHaveBeenCalledWith(testFilePath);
    });

    it('should handle file upload failure', async () => {
      const mockUserInstance = {
        id: testUserId,
        name: 'Test User'
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockFs.readFile = jest.fn().mockResolvedValue(mockAudioBuffer);

      const mockStorageInstance = {
        uploadFile: jest.fn().mockRejectedValue(new Error('Upload failed'))
      };
      StorageService.getInstance = jest.fn().mockReturnValue(mockStorageInstance);

      await expect(voiceJournalService.uploadVoiceJournal(
        testUserId,
        testFilePath,
        'Test Journal Entry'
      )).rejects.toThrow('Failed to upload voice journal');

      expect(mockFs.unlink).toHaveBeenCalledWith(testFilePath);
    });

    it('should handle transcription failure gracefully', async () => {
      const mockUserInstance = {
        id: testUserId,
        name: 'Test User'
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockFs.readFile = jest.fn().mockResolvedValue(mockAudioBuffer);
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);

      const mockStorageInstance = {
        uploadFile: jest.fn().mockResolvedValue({
          fileUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
          fileName: 'voice-journal-123.wav'
        })
      };
      StorageService.getInstance = jest.fn().mockReturnValue(mockStorageInstance);

      const mockAIInstance = {
        transcribeAudio: jest.fn().mockRejectedValue(new Error('Transcription failed'))
      };
      AIService.getInstance = jest.fn().mockReturnValue(mockAIInstance);

      const mockJournalInstance = {
        id: testJournalId,
        userId: testUserId,
        audioUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
        transcript: null,
        processingStatus: 'failed'
      };
      mockVoiceJournal.create = jest.fn().mockResolvedValue(mockJournalInstance);

      const result = await voiceJournalService.uploadVoiceJournal(
        testUserId,
        testFilePath,
        'Test Journal Entry'
      );

      expect(result.processingStatus).toBe('failed');
      expect(result.transcript).toBeNull();
    });

    it('should throw error if user not found', async () => {
      mockUser.findByPk = jest.fn().mockResolvedValue(null);

      await expect(voiceJournalService.uploadVoiceJournal(
        'invalid-user',
        testFilePath,
        'Test Journal Entry'
      )).rejects.toThrow('User not found');
    });

    it('should validate audio file format', async () => {
      const mockUserInstance = {
        id: testUserId,
        name: 'Test User'
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockFs.readFile = jest.fn().mockResolvedValue(Buffer.from('invalid-audio'));

      await expect(voiceJournalService.uploadVoiceJournal(
        testUserId,
        '/tmp/invalid.txt',
        'Test Journal Entry'
      )).rejects.toThrow('Invalid audio file format');
    });
  });

  describe('getVoiceJournals', () => {
    it('should retrieve voice journals with pagination', async () => {
      const mockJournals = [
        {
          id: 'journal-1',
          userId: testUserId,
          title: 'Journal 1',
          createdAt: new Date('2024-01-01'),
          sentiment: 'positive'
        },
        {
          id: 'journal-2',
          userId: testUserId,
          title: 'Journal 2',
          createdAt: new Date('2024-01-02'),
          sentiment: 'neutral'
        }
      ];

      mockVoiceJournal.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockJournals,
        count: 2
      });

      const result = await voiceJournalService.getVoiceJournals(testUserId, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(result).toEqual({
        journals: mockJournals,
        totalCount: 2,
        currentPage: 1,
        totalPages: 1
      });
      expect(mockVoiceJournal.findAndCountAll).toHaveBeenCalledWith({
        where: { userId: testUserId },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
        attributes: {
          exclude: ['audioData']
        }
      });
    });

    it('should filter journals by sentiment', async () => {
      const mockJournals = [
        {
          id: 'journal-1',
          userId: testUserId,
          sentiment: 'positive'
        }
      ];

      mockVoiceJournal.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockJournals,
        count: 1
      });

      await voiceJournalService.getVoiceJournals(testUserId, {
        sentiment: 'positive',
        page: 1,
        limit: 10
      });

      expect(mockVoiceJournal.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          sentiment: 'positive'
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
        attributes: {
          exclude: ['audioData']
        }
      });
    });

    it('should filter journals by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockVoiceJournal.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0
      });

      await voiceJournalService.getVoiceJournals(testUserId, {
        startDate,
        endDate,
        page: 1,
        limit: 10
      });

      expect(mockVoiceJournal.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          createdAt: {
            [expect.any(Symbol)]: new Date(startDate),
            [expect.any(Symbol)]: new Date(endDate)
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
        attributes: {
          exclude: ['audioData']
        }
      });
    });
  });

  describe('getVoiceJournalById', () => {
    it('should retrieve specific voice journal', async () => {
      const mockJournal = {
        id: testJournalId,
        userId: testUserId,
        title: 'Test Journal',
        transcript: 'This is a test journal entry.',
        sentiment: 'positive',
        emotions: ['joy', 'optimism'],
        keywords: ['test', 'journal'],
        duration: 30.5,
        createdAt: new Date()
      };

      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(mockJournal);

      const result = await voiceJournalService.getVoiceJournalById(testJournalId, testUserId);

      expect(result).toEqual(mockJournal);
      expect(mockVoiceJournal.findOne).toHaveBeenCalledWith({
        where: {
          id: testJournalId,
          userId: testUserId
        }
      });
    });

    it('should return null if journal not found', async () => {
      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(null);

      const result = await voiceJournalService.getVoiceJournalById('invalid-id', testUserId);

      expect(result).toBeNull();
    });

    it('should not return journal for different user', async () => {
      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(null);

      const result = await voiceJournalService.getVoiceJournalById(testJournalId, 'different-user');

      expect(result).toBeNull();
      expect(mockVoiceJournal.findOne).toHaveBeenCalledWith({
        where: {
          id: testJournalId,
          userId: 'different-user'
        }
      });
    });
  });

  describe('updateVoiceJournal', () => {
    it('should update journal title and notes', async () => {
      const mockJournal = {
        id: testJournalId,
        userId: testUserId,
        title: 'Old Title',
        notes: 'Old notes',
        update: jest.fn().mockResolvedValue(true)
      };

      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(mockJournal);

      const updateData = {
        title: 'New Title',
        notes: 'New notes'
      };

      const result = await voiceJournalService.updateVoiceJournal(
        testJournalId,
        testUserId,
        updateData
      );

      expect(result).toBe(true);
      expect(mockJournal.update).toHaveBeenCalledWith(updateData);
    });

    it('should throw error if journal not found', async () => {
      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(null);

      await expect(voiceJournalService.updateVoiceJournal(
        'invalid-id',
        testUserId,
        { title: 'New Title' }
      )).rejects.toThrow('Voice journal not found');
    });

    it('should validate update data', async () => {
      const mockJournal = {
        id: testJournalId,
        userId: testUserId
      };
      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(mockJournal);

      await expect(voiceJournalService.updateVoiceJournal(
        testJournalId,
        testUserId,
        { title: '' } // Invalid empty title
      )).rejects.toThrow('Title cannot be empty');
    });
  });

  describe('deleteVoiceJournal', () => {
    it('should delete voice journal and associated files', async () => {
      const mockJournal = {
        id: testJournalId,
        userId: testUserId,
        audioUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
        destroy: jest.fn().mockResolvedValue(true)
      };

      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(mockJournal);

      const mockStorageInstance = {
        deleteFile: jest.fn().mockResolvedValue(true)
      };
      StorageService.getInstance = jest.fn().mockReturnValue(mockStorageInstance);

      const result = await voiceJournalService.deleteVoiceJournal(testJournalId, testUserId);

      expect(result).toBe(true);
      expect(mockStorageInstance.deleteFile).toHaveBeenCalledWith(
        'voice-journals/123.wav'
      );
      expect(mockJournal.destroy).toHaveBeenCalled();
    });

    it('should throw error if journal not found', async () => {
      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(null);

      await expect(voiceJournalService.deleteVoiceJournal(
        'invalid-id',
        testUserId
      )).rejects.toThrow('Voice journal not found');
    });

    it('should handle storage deletion failure gracefully', async () => {
      const mockJournal = {
        id: testJournalId,
        userId: testUserId,
        audioUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
        destroy: jest.fn().mockResolvedValue(true)
      };

      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(mockJournal);

      const mockStorageInstance = {
        deleteFile: jest.fn().mockRejectedValue(new Error('Storage deletion failed'))
      };
      StorageService.getInstance = jest.fn().mockReturnValue(mockStorageInstance);

      // Should still delete the database record even if file deletion fails
      const result = await voiceJournalService.deleteVoiceJournal(testJournalId, testUserId);
      expect(result).toBe(true);
      expect(mockJournal.destroy).toHaveBeenCalled();
    });
  });

  describe('getJournalAnalytics', () => {
    it('should return journal analytics for user', async () => {
      const mockAnalytics = {
        totalJournals: 25,
        totalDuration: 1500, // seconds
        averageDuration: 60,
        sentimentDistribution: {
          positive: 15,
          neutral: 7,
          negative: 3
        },
        frequencyByDay: {
          Monday: 4,
          Tuesday: 3,
          Wednesday: 5,
          Thursday: 4,
          Friday: 3,
          Saturday: 3,
          Sunday: 3
        },
        topEmotions: ['joy', 'gratitude', 'optimism'],
        topKeywords: ['goals', 'progress', 'motivation']
      };

      // Mock the analytics query
      mockVoiceJournal.findAll = jest.fn().mockResolvedValue([
        { sentiment: 'positive', duration: 60, emotions: ['joy'], keywords: ['goals'] },
        { sentiment: 'positive', duration: 45, emotions: ['gratitude'], keywords: ['progress'] },
        { sentiment: 'neutral', duration: 30, emotions: ['calm'], keywords: ['reflection'] }
      ]);

      mockVoiceJournal.count = jest.fn().mockResolvedValue(25);

      const result = await voiceJournalService.getJournalAnalytics(testUserId, {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(result).toHaveProperty('totalJournals');
      expect(result).toHaveProperty('sentimentDistribution');
      expect(result).toHaveProperty('topEmotions');
      expect(result).toHaveProperty('topKeywords');
    });
  });

  describe('retryProcessing', () => {
    it('should retry processing failed voice journal', async () => {
      const mockJournal = {
        id: testJournalId,
        userId: testUserId,
        audioUrl: 'https://storage.upcoach.ai/voice-journals/123.wav',
        processingStatus: 'failed',
        update: jest.fn().mockResolvedValue(true)
      };

      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(mockJournal);

      const mockAIInstance = {
        transcribeAudioFromUrl: jest.fn().mockResolvedValue({
          text: 'Retried transcription successful.',
          confidence: 0.9
        }),
        analyzeSentiment: jest.fn().mockResolvedValue({
          sentiment: 'positive',
          score: 0.85
        }),
        extractKeywords: jest.fn().mockResolvedValue(['retry', 'success'])
      };
      AIService.getInstance = jest.fn().mockReturnValue(mockAIInstance);

      const result = await voiceJournalService.retryProcessing(testJournalId, testUserId);

      expect(result).toBe(true);
      expect(mockAIInstance.transcribeAudioFromUrl).toHaveBeenCalledWith(
        'https://storage.upcoach.ai/voice-journals/123.wav'
      );
      expect(mockJournal.update).toHaveBeenCalledWith({
        transcript: 'Retried transcription successful.',
        sentiment: 'positive',
        sentimentScore: 0.85,
        keywords: ['retry', 'success'],
        processingStatus: 'completed'
      });
    });

    it('should throw error if journal is not in failed status', async () => {
      const mockJournal = {
        id: testJournalId,
        userId: testUserId,
        processingStatus: 'completed'
      };

      mockVoiceJournal.findOne = jest.fn().mockResolvedValue(mockJournal);

      await expect(voiceJournalService.retryProcessing(testJournalId, testUserId))
        .rejects.toThrow('Journal is not in failed status');
    });
  });
});
