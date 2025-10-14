"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable('organization_members', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        organization_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'organizations',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        role: {
            type: sequelize_1.DataTypes.ENUM('owner', 'admin', 'manager', 'member', 'viewer'),
            allowNull: false,
            defaultValue: 'member',
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
            allowNull: false,
            defaultValue: 'pending',
        },
        permissions: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            defaultValue: [],
        },
        joined_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        invited_by: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
            defaultValue: {},
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    });
    await queryInterface.addConstraint('organization_members', {
        fields: ['organization_id', 'user_id'],
        type: 'unique',
        name: 'unique_organization_user',
    });
    await queryInterface.addIndex('organization_members', {
        fields: ['organization_id', 'status'],
        name: 'org_status_idx',
    });
    await queryInterface.addIndex('organization_members', {
        fields: ['user_id', 'status'],
        name: 'user_status_idx',
    });
    await queryInterface.addIndex('organization_members', {
        fields: ['role'],
        name: 'role_idx',
    });
}
async function down(queryInterface) {
    await queryInterface.dropTable('organization_members');
}
