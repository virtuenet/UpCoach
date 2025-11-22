import { QueryInterface, DataTypes } from 'sequelize';

const STATUS_ENUM = ['draft', 'scheduled', 'published', 'archived'];

const commonBlockColumns = () => ({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  locale: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'en-US',
  },
  variant: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default',
  },
  status: {
    type: DataTypes.ENUM(...STATUS_ENUM),
    allowNull: false,
    defaultValue: 'draft',
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  media: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  abTestGroup: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  scheduleStart: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  scheduleEnd: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'SET NULL',
    onDelete: 'SET NULL',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'SET NULL',
    onDelete: 'SET NULL',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

async function createBlockTable(
  queryInterface: QueryInterface,
  tableName: string,
  extraColumns: Record<string, unknown> = {}
) {
  await queryInterface.createTable(tableName, {
    ...commonBlockColumns(),
    ...extraColumns,
  });

  await queryInterface.addIndex(tableName, ['key', 'locale', 'variant'], {
    unique: true,
    name: `${tableName}_key_locale_variant_idx`,
  });

  await queryInterface.addIndex(tableName, ['status'], {
    name: `${tableName}_status_idx`,
  });
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  await createBlockTable(queryInterface, 'landing_blog_cards', {
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  await createBlockTable(queryInterface, 'landing_comparison_tables', {
    layout: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('landing_comparison_tables');
  await queryInterface.dropTable('landing_blog_cards');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_landing_blog_cards_status" CASCADE;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_landing_comparison_tables_status" CASCADE;');
}

