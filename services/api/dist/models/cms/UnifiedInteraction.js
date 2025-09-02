"use strict";
/**
 * Unified Interaction Model
 * Consolidates ContentInteraction, Comment, ContentComment, and analytics models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedInteraction = void 0;
const sequelize_1 = require("sequelize");
class UnifiedInteraction extends sequelize_1.Model {
    id;
    type;
    contentId;
    userId;
    commentData;
    ratingData;
    shareData;
    reportData;
    metadata;
    static initialize(sequelize) {
        UnifiedInteraction.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('view', 'like', 'share', 'comment', 'rating', 'bookmark', 'report', 'download'),
                allowNull: false,
            },
            contentId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'unified_contents',
                    key: 'id',
                },
            },
            userId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            commentData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            ratingData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            shareData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            reportData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
        }, {
            sequelize,
            modelName: 'UnifiedInteraction',
            tableName: 'unified_interactions',
            timestamps: true,
            indexes: [
                { fields: ['type'] },
                { fields: ['contentId'] },
                { fields: ['userId'] },
                { fields: ['type', 'contentId'] },
                { fields: ['type', 'userId'] },
                { fields: ['createdAt'] },
            ],
        });
    }
}
exports.UnifiedInteraction = UnifiedInteraction;
exports.default = UnifiedInteraction;
//# sourceMappingURL=UnifiedInteraction.js.map