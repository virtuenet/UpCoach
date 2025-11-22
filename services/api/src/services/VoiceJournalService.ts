import { VoiceJournalEntry } from '../models/VoiceJournalEntry';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

export interface VoiceJournalEntryData {
  id?: string;
  title: string;
  transcriptionText?: string;
  audioFilePath?: string;
  duration?: number;
  summary?: string;
  tags?: string[];
  emotionalTone?: string;
  isTranscribed?: boolean;
  isAnalyzed?: boolean;
  isFavorite?: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GetEntriesOptions {
  modifiedSince?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchOptions {
  query?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
}

export interface SyncOptions {
  lastSync?: Date;
  entries?: unknown[];
  deviceId?: string;
}

export interface ExportOptions {
  format: string;
  includeAudio: boolean;
}

export class VoiceJournalService {
  async getEntries(userId: string, options?: GetEntriesOptions): Promise<VoiceJournalEntry[]> {
    try {
      const queryOptions: unknown = {
        where: { userId },
        order: [['createdAt', 'DESC']],
      };

      if (options?.modifiedSince) {
        queryOptions.where.updatedAt = {
          [require('sequelize').Op.gte]: options.modifiedSince,
        };
      }

      if (options?.limit) {
        queryOptions.limit = options.limit;
      }

      if (options?.offset) {
        queryOptions.offset = options.offset;
      }

      const entries = await VoiceJournalEntry.findAll(queryOptions);
      return entries;
    } catch (error) {
      logger.error('Error getting voice journal entries:', error);
      throw new ApiError(500, 'Failed to retrieve entries');
    }
  }

  async getEntry(id: string, userId: string): Promise<VoiceJournalEntry | null> {
    try {
      const entry = await VoiceJournalEntry.findOne({
        where: { id, userId },
      });
      return entry;
    } catch (error) {
      logger.error('Error getting voice journal entry:', error);
      throw new ApiError(500, 'Failed to retrieve entry');
    }
  }

  async createEntry(data: VoiceJournalEntryData): Promise<VoiceJournalEntry> {
    try {
      const entry = await VoiceJournalEntry.create(data);
      logger.info('Created voice journal entry:', { entryId: entry.id, userId: data.userId });
      return entry;
    } catch (error) {
      logger.error('Error creating voice journal entry:', error);
      throw new ApiError(500, 'Failed to create entry');
    }
  }

  async updateEntry(id: string, userId: string, data: Partial<VoiceJournalEntryData>): Promise<VoiceJournalEntry | null> {
    try {
      const [updatedRows] = await VoiceJournalEntry.update(data, {
        where: { id, userId },
        returning: true,
      });

      if (updatedRows === 0) {
        return null;
      }

      const entry = await VoiceJournalEntry.findOne({
        where: { id, userId },
      });

      logger.info('Updated voice journal entry:', { entryId: id, userId });
      return entry;
    } catch (error) {
      logger.error('Error updating voice journal entry:', error);
      throw new ApiError(500, 'Failed to update entry');
    }
  }

  async deleteEntry(id: string, userId: string): Promise<boolean> {
    try {
      const deletedRows = await VoiceJournalEntry.destroy({
        where: { id, userId },
      });

      const deleted = deletedRows > 0;
      if (deleted) {
        logger.info('Deleted voice journal entry:', { entryId: id, userId });
      }
      return deleted;
    } catch (error) {
      logger.error('Error deleting voice journal entry:', error);
      throw new ApiError(500, 'Failed to delete entry');
    }
  }

  async batchCreateEntries(entries: VoiceJournalEntryData[]): Promise<VoiceJournalEntry[]> {
    try {
      const createdEntries = await VoiceJournalEntry.bulkCreate(entries, {
        returning: true,
      });
      
      logger.info('Batch created voice journal entries:', { 
        count: createdEntries.length,
        userId: entries[0]?.userId 
      });
      
      return createdEntries;
    } catch (error) {
      logger.error('Error batch creating voice journal entries:', error);
      throw new ApiError(500, 'Failed to create entries');
    }
  }

  async batchUpdateEntries(userId: string, entries: unknown[]): Promise<VoiceJournalEntry[]> {
    try {
      const updatedEntries: VoiceJournalEntry[] = [];

      for (const entryData of entries) {
        if (entryData.id) {
          const updated = await this.updateEntry(entryData.id, userId, entryData);
          if (updated) {
            updatedEntries.push(updated);
          }
        }
      }

      logger.info('Batch updated voice journal entries:', { 
        count: updatedEntries.length,
        userId 
      });

      return updatedEntries;
    } catch (error) {
      logger.error('Error batch updating voice journal entries:', error);
      throw new ApiError(500, 'Failed to update entries');
    }
  }

  async storeAudioFile(entryId: string, userId: string, file: unknown): Promise<string> {
    try {
      // In a real implementation, this would upload to cloud storage
      // For now, return a mock URL
      const audioUrl = `audio/${userId}/${entryId}/${file.originalname}`;
      
      // Update the entry with the audio URL
      await this.updateEntry(entryId, userId, { audioFilePath: audioUrl });
      
      logger.info('Stored audio file:', { entryId, userId, audioUrl });
      return audioUrl;
    } catch (error) {
      logger.error('Error storing audio file:', error);
      throw new ApiError(500, 'Failed to store audio file');
    }
  }

  async getAudioPath(entryId: string, userId: string): Promise<string | null> {
    try {
      const entry = await this.getEntry(entryId, userId);
      return entry?.audioFilePath || null;
    } catch (error) {
      logger.error('Error getting audio path:', error);
      return null;
    }
  }

  async deleteAudioFile(entryId: string, userId: string): Promise<boolean> {
    try {
      const entry = await this.getEntry(entryId, userId);
      if (!entry?.audioPath) {
        return false;
      }

      // Clear the audio file path from the entry
      await this.updateEntry(entryId, userId, { audioPath: '' });
      
      logger.info('Deleted audio file reference:', { entryId, userId });
      return true;
    } catch (error) {
      logger.error('Error deleting audio file:', error);
      return false;
    }
  }

  async performSync(userId: string, options: SyncOptions): Promise<unknown> {
    try {
      // Implementation would handle sync logic
      return {
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        resolved: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Error performing sync:', error);
      throw new ApiError(500, 'Sync operation failed');
    }
  }

  async getChangesSince(userId: string, since: Date, deviceId?: string): Promise<unknown> {
    try {
      const entries = await this.getEntries(userId, { modifiedSince: since });
      return {
        entries,
        deletions: [], // Would track deletions in a real implementation
        lastModified: new Date(),
      };
    } catch (error) {
      logger.error('Error getting changes since:', error);
      throw new ApiError(500, 'Failed to get changes');
    }
  }

  async resolveConflict(userId: string, entryId: string, resolution: string, resolvedEntry?: unknown): Promise<VoiceJournalEntry> {
    try {
      const entry = await this.updateEntry(entryId, userId, resolvedEntry || {});
      if (!entry) {
        throw new ApiError(404, 'Entry not found');
      }
      return entry;
    } catch (error) {
      logger.error('Error resolving conflict:', error);
      throw error;
    }
  }

  async updateSyncMetadata(userId: string, metadata: unknown): Promise<void> {
    try {
      // Store sync metadata - in a real implementation this would be in a separate table
      logger.info('Updated sync metadata:', { userId, metadata });
    } catch (error) {
      logger.error('Error updating sync metadata:', error);
      throw new ApiError(500, 'Failed to update sync metadata');
    }
  }

  async getAnalytics(userId: string, options?: AnalyticsOptions): Promise<unknown> {
    try {
      // Return mock analytics data
      return {
        totalEntries: 0,
        totalDuration: 0,
        averageDuration: 0,
        topTags: [],
        emotionalTrends: [],
        period: {
          start: options?.startDate || new Date(),
          end: options?.endDate || new Date(),
        },
      };
    } catch (error) {
      logger.error('Error getting analytics:', error);
      throw new ApiError(500, 'Failed to get analytics');
    }
  }

  async generateInsights(userId: string): Promise<unknown> {
    try {
      // Generate AI-powered insights
      return {
        patterns: [],
        recommendations: [],
        emotionalInsights: [],
        growthAreas: [],
      };
    } catch (error) {
      logger.error('Error generating insights:', error);
      throw new ApiError(500, 'Failed to generate insights');
    }
  }

  async analyzeEntry(entryId: string, userId: string): Promise<any | null> {
    try {
      const entry = await this.getEntry(entryId, userId);
      if (!entry) {
        return null;
      }

      // Mock analysis result
      return {
        sentiment: 'neutral',
        topics: [],
        emotions: [],
        keyPhrases: [],
        summary: entry.notes || 'No summary available',
      };
    } catch (error) {
      logger.error('Error analyzing entry:', error);
      return null;
    }
  }

  async searchEntries(userId: string, options: SearchOptions): Promise<VoiceJournalEntry[]> {
    try {
      const queryOptions: unknown = {
        where: { userId },
        order: [['createdAt', 'DESC']],
      };

      if (options.query) {
        queryOptions.where[require('sequelize').Op.or] = [
          { title: { [require('sequelize').Op.iLike]: `%${options.query}%` } },
          { transcriptionText: { [require('sequelize').Op.iLike]: `%${options.query}%` } },
          { summary: { [require('sequelize').Op.iLike]: `%${options.query}%` } },
        ];
      }

      if (options.startDate || options.endDate) {
        queryOptions.where.createdAt = {};
        if (options.startDate) {
          queryOptions.where.createdAt[require('sequelize').Op.gte] = options.startDate;
        }
        if (options.endDate) {
          queryOptions.where.createdAt[require('sequelize').Op.lte] = options.endDate;
        }
      }

      if (options.limit) {
        queryOptions.limit = options.limit;
      }

      const entries = await VoiceJournalEntry.findAll(queryOptions);
      return entries;
    } catch (error) {
      logger.error('Error searching entries:', error);
      throw new ApiError(500, 'Failed to search entries');
    }
  }

  async getAllTags(userId: string): Promise<string[]> {
    try {
      const entries = await VoiceJournalEntry.findAll({
        where: { userId },
        attributes: ['tags'],
      });

      const allTags = entries
        .flatMap(entry => entry.tags || [])
        .filter((tag, index, array) => array.indexOf(tag) === index);

      return allTags;
    } catch (error) {
      logger.error('Error getting all tags:', error);
      throw new ApiError(500, 'Failed to get tags');
    }
  }

  async getFavoriteEntries(userId: string, options: { limit: number; offset: number }): Promise<VoiceJournalEntry[]> {
    try {
      const entries = await VoiceJournalEntry.findAll({
        where: { 
          userId,
          isFavorite: true,
        },
        order: [['createdAt', 'DESC']],
        limit: options.limit,
        offset: options.offset,
      });

      return entries;
    } catch (error) {
      logger.error('Error getting favorite entries:', error);
      throw new ApiError(500, 'Failed to get favorites');
    }
  }

  async exportEntries(userId: string, options: ExportOptions): Promise<unknown> {
    try {
      const entries = await this.getEntries(userId);
      
      if (options.format === 'json') {
        return {
          entries,
          exportedAt: new Date(),
          includeAudio: options.includeAudio,
        };
      }

      // For other formats, would implement specific serializers
      return entries;
    } catch (error) {
      logger.error('Error exporting entries:', error);
      throw new ApiError(500, 'Failed to export entries');
    }
  }

  async importEntries(userId: string, data: unknown): Promise<VoiceJournalEntry[]> {
    try {
      if (!Array.isArray(data.entries)) {
        throw new ApiError(400, 'Invalid import data format');
      }

      const entries = data.entries.map((entry: unknown) => ({
        ...entry,
        userId,
        id: undefined, // Generate new IDs
      }));

      return await this.batchCreateEntries(entries);
    } catch (error) {
      logger.error('Error importing entries:', error);
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to import entries');
    }
  }
}