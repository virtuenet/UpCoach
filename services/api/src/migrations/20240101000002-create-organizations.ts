import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('organizations', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postal_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
      allowNull: false,
      defaultValue: 'active',
    },
    subscription_status: {
      type: DataTypes.ENUM('trial', 'active', 'past_due', 'cancelled', 'expired'),
      allowNull: false,
      defaultValue: 'trial',
    },
    subscription_plan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    member_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add indexes for performance
  await queryInterface.addIndex('organizations', {
    fields: ['slug'],
    unique: true,
    name: 'organizations_slug_unique_idx',
  });

  await queryInterface.addIndex('organizations', {
    fields: ['owner_id'],
    name: 'organizations_owner_idx',
  });

  await queryInterface.addIndex('organizations', {
    fields: ['status'],
    name: 'organizations_status_idx',
  });

  await queryInterface.addIndex('organizations', {
    fields: ['subscription_status'],
    name: 'organizations_subscription_status_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('organizations');
}
