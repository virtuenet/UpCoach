"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentMedia = void 0;
const sequelize_1 = require("sequelize");
const Content_1 = require("./Content");
const User_1 = require("../User");
class ContentMedia extends sequelize_1.Model {
    id;
    contentId;
    type;
    url;
    thumbnailUrl;
    filename;
    originalFilename;
    mimeType;
    size;
    width;
    height;
    duration;
    metadata;
    uploadedBy;
    isPublic;
    usageCount;
    // Associations
    content;
    uploader;
    static associations;
    static initialize(sequelize) {
        ContentMedia.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            contentId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'contents',
                    key: 'id',
                },
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('image', 'video', 'audio', 'document', 'other'),
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
            filename: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            originalFilename: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            mimeType: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            size: {
                type: sequelize_1.DataTypes.INTEGER,
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
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            uploadedBy: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            isPublic: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            usageCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        }, {
            sequelize,
            modelName: 'ContentMedia',
            tableName: 'content_media',
            timestamps: true,
            indexes: [
                { fields: ['contentId'] },
                { fields: ['type'] },
                { fields: ['uploadedBy'] },
                { fields: ['isPublic'] },
                { fields: ['filename'] },
            ],
        });
    }
    static associate() {
        ContentMedia.belongsTo(Content_1.Content, {
            foreignKey: 'contentId',
            as: 'content',
        });
        ContentMedia.belongsTo(User_1.User, {
            foreignKey: 'uploadedBy',
            as: 'uploader',
        });
    }
}
exports.ContentMedia = ContentMedia;
//# sourceMappingURL=ContentMedia.js.map