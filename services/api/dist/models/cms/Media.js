"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
// Media model class
class Media extends sequelize_1.Model {
    id;
    filename;
    originalName;
    mimeType;
    fileSize;
    url;
    thumbnailUrl;
    alt;
    caption;
    uploadedById;
    folder;
    tags;
    metadata;
    usage;
    status;
    isPublic;
    deletedAt;
    // Instance methods
    getFileType() {
        if (this.mimeType.startsWith('image/'))
            return 'image';
        if (this.mimeType.startsWith('video/'))
            return 'video';
        if (this.mimeType.startsWith('audio/'))
            return 'audio';
        if (this.mimeType.includes('pdf'))
            return 'pdf';
        if (this.mimeType.includes('document') || this.mimeType.includes('text'))
            return 'document';
        return 'file';
    }
    getFileExtension() {
        return this.filename.split('.').pop()?.toLowerCase() || '';
    }
    isImage() {
        return this.mimeType.startsWith('image/');
    }
    isVideo() {
        return this.mimeType.startsWith('video/');
    }
    isAudio() {
        return this.mimeType.startsWith('audio/');
    }
    formatFileSize() {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (this.fileSize === 0)
            return '0 B';
        const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
        return Math.round((this.fileSize / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    }
    async addUsage(contentType, contentId) {
        if (contentType === 'article' && !this.usage.usedInArticles.includes(contentId)) {
            this.usage.usedInArticles.push(contentId);
        }
        else if (contentType === 'course' && !this.usage.usedInCourses.includes(contentId)) {
            this.usage.usedInCourses.push(contentId);
        }
        this.usage.totalUsageCount = this.usage.usedInArticles.length + this.usage.usedInCourses.length;
        this.usage.lastUsedAt = new Date();
        await this.save();
    }
    async removeUsage(contentType, contentId) {
        if (contentType === 'article') {
            this.usage.usedInArticles = this.usage.usedInArticles.filter(id => id !== contentId);
        }
        else if (contentType === 'course') {
            this.usage.usedInCourses = this.usage.usedInCourses.filter(id => id !== contentId);
        }
        this.usage.totalUsageCount = this.usage.usedInArticles.length + this.usage.usedInCourses.length;
        await this.save();
    }
    async updateProcessingStatus(status, metadata) {
        this.status = status;
        if (metadata) {
            this.metadata = { ...this.metadata, ...metadata };
        }
        await this.save();
    }
    // Static methods
    static async getByFolder(folder) {
        return Media.findAll({
            where: { folder },
            order: [['createdAt', 'DESC']],
        });
    }
    static async getByType(mimeType) {
        return Media.findAll({
            where: {
                mimeType: { [sequelize_1.Op.like]: `${mimeType}%` },
            },
            order: [['createdAt', 'DESC']],
        });
    }
    static async searchMedia(query, filters = {}) {
        const whereClause = {};
        if (query) {
            whereClause[sequelize_1.Op.or] = [
                { originalName: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { alt: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { caption: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { tags: { [sequelize_1.Op.contains]: [query] } },
            ];
        }
        if (filters.type) {
            whereClause.mimeType = { [sequelize_1.Op.like]: `${filters.type}%` };
        }
        if (filters.folder !== undefined) {
            whereClause.folder = filters.folder;
        }
        if (filters.uploadedBy) {
            whereClause.uploadedById = filters.uploadedBy;
        }
        if (filters.tags && filters.tags.length > 0) {
            whereClause.tags = { [sequelize_1.Op.overlap]: filters.tags };
        }
        return Media.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });
    }
    static async getUnused() {
        return Media.findAll({
            where: {
                'usage.totalUsageCount': 0,
            },
            order: [['createdAt', 'DESC']],
        });
    }
    static async getRecentUploads(limit = 20) {
        return Media.findAll({
            order: [['createdAt', 'DESC']],
            limit,
        });
    }
    static async getFolders() {
        const result = await Media.findAll({
            attributes: ['folder'],
            where: {
                folder: { [sequelize_1.Op.ne]: null },
            },
            group: ['folder'],
            raw: true,
        });
        return result.map((item) => item.folder).filter(Boolean);
    }
    static async getStorageStats() {
        const media = await Media.findAll({
            attributes: ['mimeType', 'fileSize'],
            raw: true,
        });
        const stats = {
            totalFiles: media.length,
            totalSize: media.reduce((sum, item) => sum + item.fileSize, 0),
            byType: {},
        };
        media.forEach((item) => {
            const type = item.mimeType.split('/')[0];
            if (!stats.byType[type]) {
                stats.byType[type] = { count: 0, size: 0 };
            }
            stats.byType[type].count++;
            stats.byType[type].size += item.fileSize;
        });
        return stats;
    }
    static async cleanupUnused(olderThanDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const unusedMedia = await Media.findAll({
            where: {
                'usage.totalUsageCount': 0,
                createdAt: { [sequelize_1.Op.lt]: cutoffDate },
            },
        });
        // In production, you would delete the actual files from storage here
        const deletedCount = unusedMedia.length;
        for (const media of unusedMedia) {
            await media.destroy();
        }
        return deletedCount;
    }
}
exports.Media = Media;
// Initialize the model
Media.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    filename: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    originalName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    mimeType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    fileSize: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    url: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true,
        },
    },
    thumbnailUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    alt: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 255],
        },
    },
    caption: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000],
        },
    },
    uploadedById: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    folder: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 255],
        },
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    usage: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            usedInArticles: [],
            usedInCourses: [],
            totalUsageCount: 0,
            lastUsedAt: null,
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('processing', 'ready', 'failed'),
        allowNull: false,
        defaultValue: 'processing',
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Media',
    tableName: 'media',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['filename'],
        },
        {
            fields: ['mimeType'],
        },
        {
            fields: ['uploadedById'],
        },
        {
            fields: ['folder'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['isPublic'],
        },
        {
            fields: ['fileSize'],
        },
        {
            using: 'gin',
            fields: ['tags'],
        },
        {
            using: 'gin',
            fields: ['metadata'],
        },
        {
            using: 'gin',
            fields: ['usage'],
        },
    ],
});
exports.default = Media;
//# sourceMappingURL=Media.js.map