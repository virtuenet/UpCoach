"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityGroup = void 0;
const sequelize_1 = require("sequelize");
class CommunityGroup extends sequelize_1.Model {
    id;
    name;
    slug;
    description;
    category;
    tags;
    coverImage;
    avatarUrl;
    isPrivate;
    requiresApproval;
    memberCount;
    postCount;
    rules;
    welcomeMessage;
    createdBy;
    // Associations
    creator;
    members;
    posts;
    static associate(models) {
        CommunityGroup.belongsTo(models.User, {
            foreignKey: 'createdBy',
            as: 'creator',
        });
        CommunityGroup.hasMany(models.GroupMember, {
            foreignKey: 'groupId',
            as: 'members',
        });
        CommunityGroup.hasMany(models.GroupPost, {
            foreignKey: 'groupId',
            as: 'posts',
        });
    }
}
exports.CommunityGroup = CommunityGroup;
exports.default = (sequelize) => {
    CommunityGroup.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        slug: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        category: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        tags: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
            defaultValue: [],
        },
        coverImage: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
            field: 'cover_image',
        },
        avatarUrl: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
            field: 'avatar_url',
        },
        isPrivate: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_private',
        },
        requiresApproval: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'requires_approval',
        },
        memberCount: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
            field: 'member_count',
        },
        postCount: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
            field: 'post_count',
        },
        rules: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        welcomeMessage: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            field: 'welcome_message',
        },
        createdBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'created_by',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            field: 'updated_at',
        },
    }, {
        sequelize,
        modelName: 'CommunityGroup',
        tableName: 'community_groups',
        timestamps: true,
        underscored: true,
    });
    return CommunityGroup;
};
//# sourceMappingURL=CommunityGroup.js.map