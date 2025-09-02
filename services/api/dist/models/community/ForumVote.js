"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumVote = void 0;
const sequelize_1 = require("sequelize");
class ForumVote extends sequelize_1.Model {
    id;
    userId;
    postId;
    voteType;
    // Associations
    user;
    post;
    static associate(models) {
        ForumVote.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
        });
        ForumVote.belongsTo(models.ForumPost, {
            foreignKey: 'postId',
            as: 'post',
        });
    }
}
exports.ForumVote = ForumVote;
exports.default = (sequelize) => {
    ForumVote.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        postId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'post_id',
            references: {
                model: 'forum_posts',
                key: 'id',
            },
        },
        voteType: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'vote_type',
            validate: {
                isIn: [[1, -1]],
            },
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            field: 'created_at',
        },
    }, {
        sequelize,
        modelName: 'ForumVote',
        tableName: 'forum_votes',
        timestamps: false,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'post_id'],
            },
        ],
    });
    return ForumVote;
};
//# sourceMappingURL=ForumVote.js.map