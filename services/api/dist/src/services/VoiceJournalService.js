"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceJournalService = void 0;
const VoiceJournalEntry_1 = require("../models/VoiceJournalEntry");
const logger_1 = require("../utils/logger");
const apiError_1 = require("../utils/apiError");
class VoiceJournalService {
    async getEntries(userId, options) {
        try {
            const queryOptions = {
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
            const entries = await VoiceJournalEntry_1.VoiceJournalEntry.findAll(queryOptions);
            return entries;
        }
        catch (error) {
            logger_1.logger.error('Error getting voice journal entries:', error);
            throw new apiError_1.ApiError(500, 'Failed to retrieve entries');
        }
    }
    async getEntry(id, userId) {
        try {
            const entry = await VoiceJournalEntry_1.VoiceJournalEntry.findOne({
                where: { id, userId },
            });
            return entry;
        }
        catch (error) {
            logger_1.logger.error('Error getting voice journal entry:', error);
            throw new apiError_1.ApiError(500, 'Failed to retrieve entry');
        }
    }
    async createEntry(data) {
        try {
            const entry = await VoiceJournalEntry_1.VoiceJournalEntry.create(data);
            logger_1.logger.info('Created voice journal entry:', { entryId: entry.id, userId: data.userId });
            return entry;
        }
        catch (error) {
            logger_1.logger.error('Error creating voice journal entry:', error);
            throw new apiError_1.ApiError(500, 'Failed to create entry');
        }
    }
    async updateEntry(id, userId, data) {
        try {
            const [updatedRows] = await VoiceJournalEntry_1.VoiceJournalEntry.update(data, {
                where: { id, userId },
                returning: true,
            });
            if (updatedRows === 0) {
                return null;
            }
            const entry = await VoiceJournalEntry_1.VoiceJournalEntry.findOne({
                where: { id, userId },
            });
            logger_1.logger.info('Updated voice journal entry:', { entryId: id, userId });
            return entry;
        }
        catch (error) {
            logger_1.logger.error('Error updating voice journal entry:', error);
            throw new apiError_1.ApiError(500, 'Failed to update entry');
        }
    }
    async deleteEntry(id, userId) {
        try {
            const deletedRows = await VoiceJournalEntry_1.VoiceJournalEntry.destroy({
                where: { id, userId },
            });
            const deleted = deletedRows > 0;
            if (deleted) {
                logger_1.logger.info('Deleted voice journal entry:', { entryId: id, userId });
            }
            return deleted;
        }
        catch (error) {
            logger_1.logger.error('Error deleting voice journal entry:', error);
            throw new apiError_1.ApiError(500, 'Failed to delete entry');
        }
    }
    async batchCreateEntries(entries) {
        try {
            const createdEntries = await VoiceJournalEntry_1.VoiceJournalEntry.bulkCreate(entries, {
                returning: true,
            });
            logger_1.logger.info('Batch created voice journal entries:', {
                count: createdEntries.length,
                userId: entries[0]?.userId
            });
            return createdEntries;
        }
        catch (error) {
            logger_1.logger.error('Error batch creating voice journal entries:', error);
            throw new apiError_1.ApiError(500, 'Failed to create entries');
        }
    }
    async batchUpdateEntries(userId, entries) {
        try {
            const updatedEntries = [];
            for (const entryData of entries) {
                if (entryData.id) {
                    const updated = await this.updateEntry(entryData.id, userId, entryData);
                    if (updated) {
                        updatedEntries.push(updated);
                    }
                }
            }
            logger_1.logger.info('Batch updated voice journal entries:', {
                count: updatedEntries.length,
                userId
            });
            return updatedEntries;
        }
        catch (error) {
            logger_1.logger.error('Error batch updating voice journal entries:', error);
            throw new apiError_1.ApiError(500, 'Failed to update entries');
        }
    }
    async storeAudioFile(entryId, userId, file) {
        try {
            const audioUrl = `audio/${userId}/${entryId}/${file.originalname}`;
            await this.updateEntry(entryId, userId, { audioFilePath: audioUrl });
            logger_1.logger.info('Stored audio file:', { entryId, userId, audioUrl });
            return audioUrl;
        }
        catch (error) {
            logger_1.logger.error('Error storing audio file:', error);
            throw new apiError_1.ApiError(500, 'Failed to store audio file');
        }
    }
    async getAudioPath(entryId, userId) {
        try {
            const entry = await this.getEntry(entryId, userId);
            return entry?.audioFilePath || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting audio path:', error);
            return null;
        }
    }
    async deleteAudioFile(entryId, userId) {
        try {
            const entry = await this.getEntry(entryId, userId);
            if (!entry?.audioPath) {
                return false;
            }
            await this.updateEntry(entryId, userId, { audioPath: '' });
            logger_1.logger.info('Deleted audio file reference:', { entryId, userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting audio file:', error);
            return false;
        }
    }
    async performSync(userId, options) {
        try {
            return {
                uploaded: 0,
                downloaded: 0,
                conflicts: 0,
                resolved: 0,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error performing sync:', error);
            throw new apiError_1.ApiError(500, 'Sync operation failed');
        }
    }
    async getChangesSince(userId, since, deviceId) {
        try {
            const entries = await this.getEntries(userId, { modifiedSince: since });
            return {
                entries,
                deletions: [],
                lastModified: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting changes since:', error);
            throw new apiError_1.ApiError(500, 'Failed to get changes');
        }
    }
    async resolveConflict(userId, entryId, resolution, resolvedEntry) {
        try {
            const entry = await this.updateEntry(entryId, userId, resolvedEntry || {});
            if (!entry) {
                throw new apiError_1.ApiError(404, 'Entry not found');
            }
            return entry;
        }
        catch (error) {
            logger_1.logger.error('Error resolving conflict:', error);
            throw error;
        }
    }
    async updateSyncMetadata(userId, metadata) {
        try {
            logger_1.logger.info('Updated sync metadata:', { userId, metadata });
        }
        catch (error) {
            logger_1.logger.error('Error updating sync metadata:', error);
            throw new apiError_1.ApiError(500, 'Failed to update sync metadata');
        }
    }
    async getAnalytics(userId, options) {
        try {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting analytics:', error);
            throw new apiError_1.ApiError(500, 'Failed to get analytics');
        }
    }
    async generateInsights(userId) {
        try {
            return {
                patterns: [],
                recommendations: [],
                emotionalInsights: [],
                growthAreas: [],
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating insights:', error);
            throw new apiError_1.ApiError(500, 'Failed to generate insights');
        }
    }
    async analyzeEntry(entryId, userId) {
        try {
            const entry = await this.getEntry(entryId, userId);
            if (!entry) {
                return null;
            }
            return {
                sentiment: 'neutral',
                topics: [],
                emotions: [],
                keyPhrases: [],
                summary: entry.notes || 'No summary available',
            };
        }
        catch (error) {
            logger_1.logger.error('Error analyzing entry:', error);
            return null;
        }
    }
    async searchEntries(userId, options) {
        try {
            const queryOptions = {
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
            const entries = await VoiceJournalEntry_1.VoiceJournalEntry.findAll(queryOptions);
            return entries;
        }
        catch (error) {
            logger_1.logger.error('Error searching entries:', error);
            throw new apiError_1.ApiError(500, 'Failed to search entries');
        }
    }
    async getAllTags(userId) {
        try {
            const entries = await VoiceJournalEntry_1.VoiceJournalEntry.findAll({
                where: { userId },
                attributes: ['tags'],
            });
            const allTags = entries
                .flatMap(entry => entry.tags || [])
                .filter((tag, index, array) => array.indexOf(tag) === index);
            return allTags;
        }
        catch (error) {
            logger_1.logger.error('Error getting all tags:', error);
            throw new apiError_1.ApiError(500, 'Failed to get tags');
        }
    }
    async getFavoriteEntries(userId, options) {
        try {
            const entries = await VoiceJournalEntry_1.VoiceJournalEntry.findAll({
                where: {
                    userId,
                    isFavorite: true,
                },
                order: [['createdAt', 'DESC']],
                limit: options.limit,
                offset: options.offset,
            });
            return entries;
        }
        catch (error) {
            logger_1.logger.error('Error getting favorite entries:', error);
            throw new apiError_1.ApiError(500, 'Failed to get favorites');
        }
    }
    async exportEntries(userId, options) {
        try {
            const entries = await this.getEntries(userId);
            if (options.format === 'json') {
                return {
                    entries,
                    exportedAt: new Date(),
                    includeAudio: options.includeAudio,
                };
            }
            return entries;
        }
        catch (error) {
            logger_1.logger.error('Error exporting entries:', error);
            throw new apiError_1.ApiError(500, 'Failed to export entries');
        }
    }
    async importEntries(userId, data) {
        try {
            if (!Array.isArray(data.entries)) {
                throw new apiError_1.ApiError(400, 'Invalid import data format');
            }
            const entries = data.entries.map((entry) => ({
                ...entry,
                userId,
                id: undefined,
            }));
            return await this.batchCreateEntries(entries);
        }
        catch (error) {
            logger_1.logger.error('Error importing entries:', error);
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(500, 'Failed to import entries');
        }
    }
}
exports.VoiceJournalService = VoiceJournalService;
//# sourceMappingURL=VoiceJournalService.js.map