import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('organization_members', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'manager', 'member', 'viewer'),
      allowNull: false,
      defaultValue: 'member',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
      allowNull: false,
      defaultValue: 'pending',
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invited_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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

  // Add unique constraint
  await queryInterface.addConstraint('organization_members', {
    fields: ['organization_id', 'user_id'],
    type: 'unique',
    name: 'unique_organization_user',
  });

  // Add indexes for performance
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

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('organization_members');
}
