"use strict";
/**
 * Unified Media Model
 * Consolidates Media, ContentMedia, and attachment models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedMedia = void 0;
const sequelize_1 = require("sequelize");
class UnifiedMedia extends sequelize_1.Model {
    id;
    type;
    name;
    url;
    thumbnailUrl;
    mimeType;
    size;
    width;
    height;
    duration;
    contentId;
    uploadedBy;
    folder;
    alt;
    caption;
    metadata;
    processing;
    usage;
    isPublic;
    isArchived;
    static initialize(sequelize) {
        UnifiedMedia.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('image', 'video', 'audio', 'document', 'file'),
                allowNull: false,
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            url: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            thumbnailUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            mimeType: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            size: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
            },
            width: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            height: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            duration: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            contentId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'unified_contents',
                    key: 'id',
                },
            },
            uploadedBy: {
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
            },
            alt: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            caption: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            processing: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {
                    status: 'pending',
                },
            },
            usage: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {
                    viewCount: 0,
                    downloadCount: 0,
                },
            },
            isPublic: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            isArchived: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        }, {
            sequelize,
            modelName: 'UnifiedMedia',
            tableName: 'unified_media',
            timestamps: true,
            indexes: [
                { fields: ['type'] },
                { fields: ['contentId'] },
                { fields: ['uploadedBy'] },
                { fields: ['folder'] },
                { fields: ['isPublic'] },
                { fields: ['isArchived'] },
            ],
        });
    }
}
exports.UnifiedMedia = UnifiedMedia;
exports.default = UnifiedMedia;
//# sourceMappingURL=UnifiedMedia.js.map