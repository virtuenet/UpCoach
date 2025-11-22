import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Add Google authentication fields to users table
    await queryInterface.addColumn('users', 'google_id', {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Google OAuth user ID'
    });

    await queryInterface.addColumn('users', 'google_email', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Google account email address'
    });

    await queryInterface.addColumn('users', 'auth_provider', {
      type: DataTypes.ENUM('local', 'google', 'apple', 'microsoft'),
      allowNull: false,
      defaultValue: 'local',
      comment: 'Primary authentication provider'
    });

    await queryInterface.addColumn('users', 'provider_data', {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional provider-specific user data'
    });

    await queryInterface.addColumn('users', 'last_provider_sync', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time user data was synced from provider'
    });

    // Add indexes for performance
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

    // Create constraint to ensure Google users have Google ID
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

  async down(queryInterface: QueryInterface): Promise<void> {
    // Remove constraints first
    await queryInterface.removeConstraint('users', 'check_google_auth_provider');
    
    // Remove indexes
    await queryInterface.removeIndex('users', 'idx_users_google_id');
    await queryInterface.removeIndex('users', ['auth_provider']);
    await queryInterface.removeIndex('users', ['google_email']);

    // Remove columns
    await queryInterface.removeColumn('users', 'last_provider_sync');
    await queryInterface.removeColumn('users', 'provider_data');
    await queryInterface.removeColumn('users', 'auth_provider');
    await queryInterface.removeColumn('users', 'google_email');
    await queryInterface.removeColumn('users', 'google_id');

    // Remove the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_auth_provider";');
  }
};