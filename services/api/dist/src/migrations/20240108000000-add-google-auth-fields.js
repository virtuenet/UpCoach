"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    async up(queryInterface) {
        await queryInterface.addColumn('users', 'google_id', {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            unique: true,
            comment: 'Google OAuth user ID'
        });
        await queryInterface.addColumn('users', 'google_email', {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            comment: 'Google account email address'
        });
        await queryInterface.addColumn('users', 'auth_provider', {
            type: sequelize_1.DataTypes.ENUM('local', 'google', 'apple', 'microsoft'),
            allowNull: false,
            defaultValue: 'local',
            comment: 'Primary authentication provider'
        });
        await queryInterface.addColumn('users', 'provider_data', {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional provider-specific user data'
        });
        await queryInterface.addColumn('users', 'last_provider_sync', {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            comment: 'Last time user data was synced from provider'
        });
        await queryInterface.addIndex('users', ['google_id'], {
            name: 'idx_users_google_id',
            unique: true,
            where: {
                google_id: {
                    [Symbol.for('not')]: null
                }
            }
        });
        await queryInterface.addIndex('users', ['auth_provider']);
        await queryInterface.addIndex('users', ['google_email']);
        await queryInterface.addConstraint('users', {
            fields: ['auth_provider', 'google_id'],
            type: 'check',
            name: 'check_google_auth_provider',
            where: {
                [Symbol.for('or')]: [
                    {
                        auth_provider: {
                            [Symbol.for('ne')]: 'google'
                        }
                    },
                    {
                        google_id: {
                            [Symbol.for('not')]: null
                        }
                    }
                ]
            }
        });
    },
    async down(queryInterface) {
        await queryInterface.removeConstraint('users', 'check_google_auth_provider');
        await queryInterface.removeIndex('users', 'idx_users_google_id');
        await queryInterface.removeIndex('users', ['auth_provider']);
        await queryInterface.removeIndex('users', ['google_email']);
        await queryInterface.removeColumn('users', 'last_provider_sync');
        await queryInterface.removeColumn('users', 'provider_data');
        await queryInterface.removeColumn('users', 'auth_provider');
        await queryInterface.removeColumn('users', 'google_email');
        await queryInterface.removeColumn('users', 'google_id');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_auth_provider";');
    }
};
//# sourceMappingURL=20240108000000-add-google-auth-fields.js.map