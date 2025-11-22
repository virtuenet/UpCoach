import { QueryInterface, DataTypes } from 'sequelize';

const STATUS_ENUM = ['draft', 'scheduled', 'published', 'archived'];

const commonBlockColumns = (queryInterface: QueryInterface) => ({
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
  extraColumns: Record<string, unknown>
): Promise<void> {
  await queryInterface.createTable(tableName, {
    ...commonBlockColumns(queryInterface),
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
  await createBlockTable(queryInterface, 'landing_sections', {
    sectionType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'generic',
    },
  });

  await createBlockTable(queryInterface, 'landing_cta_blocks', {
    ctaStyle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'primary',
    },
    targetUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  await createBlockTable(queryInterface, 'landing_pricing_tiers', {
    planCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    billingInterval: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'monthly',
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'USD',
    },
  });

  await createBlockTable(queryInterface, 'landing_testimonial_cards', {
    authorName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    authorTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  await queryInterface.createTable('remote_copy_strings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    namespace: {
      type: DataTypes.STRING,
      allowNull: false,
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
    platform: {
      type: DataTypes.ENUM('mobile', 'web', 'shared'),
      allowNull: false,
      defaultValue: 'shared',
    },
    variant: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    richValue: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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

  await queryInterface.addIndex(
    'remote_copy_strings',
    ['namespace', 'key', 'locale', 'variant', 'platform'],
    {
      unique: true,
      name: 'remote_copy_strings_unique_idx',
    }
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('remote_copy_strings');
  await queryInterface.dropTable('landing_testimonial_cards');
  await queryInterface.dropTable('landing_pricing_tiers');
  await queryInterface.dropTable('landing_cta_blocks');
  await queryInterface.dropTable('landing_sections');

  // Drop ENUM types created by Sequelize (Postgres)
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_remote_copy_strings_platform" CASCADE;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_remote_copy_strings_status" CASCADE;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_landing_sections_status" CASCADE;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_landing_cta_blocks_status" CASCADE;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_landing_pricing_tiers_status" CASCADE;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_landing_testimonial_cards_status" CASCADE;');
}

