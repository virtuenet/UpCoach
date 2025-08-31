/**
 * Unified CMS Models Export
 * Provides backward compatibility aliases for old model names
 */

// Import unified models
import { UnifiedContent } from './UnifiedContent';
import { UnifiedCategory } from './UnifiedCategory';
import { UnifiedTag } from './UnifiedTag';
import { UnifiedMedia } from './UnifiedMedia';
import { UnifiedInteraction } from './UnifiedInteraction';

// ==================== Backward Compatibility Aliases ====================

// Content aliases
export { UnifiedContent as Article } from './UnifiedContent';
export { UnifiedContent as Content } from './UnifiedContent';
export { UnifiedContent as ContentArticle } from './UnifiedContent';
export { UnifiedContent as Course } from './UnifiedContent';
export { UnifiedContent as Template } from './UnifiedContent';

// Category aliases
export { UnifiedCategory as Category } from './UnifiedCategory';
export { UnifiedCategory as ContentCategory } from './UnifiedCategory';

// Tag aliases
export { UnifiedTag as ContentTag } from './UnifiedTag';

// Media aliases
export { UnifiedMedia as Media } from './UnifiedMedia';
export { UnifiedMedia as ContentMedia } from './UnifiedMedia';

// Interaction aliases
export { UnifiedInteraction as Comment } from './UnifiedInteraction';
export { UnifiedInteraction as ContentComment } from './UnifiedInteraction';
export { UnifiedInteraction as ContentInteraction } from './UnifiedInteraction';

// ==================== Primary Exports ====================

export { UnifiedContent, UnifiedCategory, UnifiedTag, UnifiedMedia, UnifiedInteraction };

// ==================== Helper Types ====================

export type ContentType = UnifiedContent['type'];
export type ContentStatus = UnifiedContent['status'];
export type ContentFormat = UnifiedContent['format'];
export type InteractionType = UnifiedInteraction['type'];
export type MediaType = UnifiedMedia['type'];

// ==================== Model Initialization ====================

import { Sequelize } from 'sequelize';

export function initializeCMSModels(sequelize: Sequelize): void {
  // Initialize all unified models
  UnifiedContent.initialize(sequelize);
  UnifiedCategory.initialize(sequelize);
  UnifiedTag.initialize(sequelize);
  UnifiedMedia.initialize(sequelize);
  UnifiedInteraction.initialize(sequelize);

  // Set up associations
  UnifiedContent.associate();
  UnifiedCategory.associate();

  // Additional associations
  UnifiedContent.belongsTo(UnifiedCategory, {
    foreignKey: 'categoryId',
    as: 'category',
  });

  UnifiedContent.belongsToMany(UnifiedTag, {
    through: 'content_tag_relations',
    foreignKey: 'contentId',
    otherKey: 'tagId',
    as: 'tags',
  });

  UnifiedContent.hasMany(UnifiedMedia, {
    foreignKey: 'contentId',
    as: 'media',
  });

  UnifiedContent.hasMany(UnifiedInteraction, {
    foreignKey: 'contentId',
    as: 'interactions',
  });

  UnifiedTag.belongsToMany(UnifiedContent, {
    through: 'content_tag_relations',
    foreignKey: 'tagId',
    otherKey: 'contentId',
    as: 'contents',
  });

  UnifiedMedia.belongsTo(UnifiedContent, {
    foreignKey: 'contentId',
    as: 'content',
  });

  UnifiedInteraction.belongsTo(UnifiedContent, {
    foreignKey: 'contentId',
    as: 'content',
  });

  logger.info('✅ CMS models initialized with unified structure');
}

// Default export
export default {
  UnifiedContent,
  UnifiedCategory,
  UnifiedTag,
  UnifiedMedia,
  UnifiedInteraction,
  initializeCMSModels,
};
