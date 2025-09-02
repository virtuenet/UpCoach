/**
 * Unified CMS Models Export
 * Provides backward compatibility aliases for old model names
 */
import { UnifiedContent } from './UnifiedContent';
import { UnifiedCategory } from './UnifiedCategory';
import { UnifiedTag } from './UnifiedTag';
import { UnifiedMedia } from './UnifiedMedia';
import { UnifiedInteraction } from './UnifiedInteraction';
export { UnifiedContent as Article } from './UnifiedContent';
export { UnifiedContent as Content } from './UnifiedContent';
export { UnifiedContent as ContentArticle } from './UnifiedContent';
export { UnifiedContent as Course } from './UnifiedContent';
export { UnifiedContent as Template } from './UnifiedContent';
export { UnifiedCategory as Category } from './UnifiedCategory';
export { UnifiedCategory as ContentCategory } from './UnifiedCategory';
export { UnifiedTag as ContentTag } from './UnifiedTag';
export { UnifiedMedia as Media } from './UnifiedMedia';
export { UnifiedMedia as ContentMedia } from './UnifiedMedia';
export { UnifiedInteraction as Comment } from './UnifiedInteraction';
export { UnifiedInteraction as ContentComment } from './UnifiedInteraction';
export { UnifiedInteraction as ContentInteraction } from './UnifiedInteraction';
export { UnifiedContent, UnifiedCategory, UnifiedTag, UnifiedMedia, UnifiedInteraction };
export type ContentType = UnifiedContent['type'];
export type ContentStatus = UnifiedContent['status'];
export type ContentFormat = UnifiedContent['format'];
export type InteractionType = UnifiedInteraction['type'];
export type MediaType = UnifiedMedia['type'];
import { Sequelize } from 'sequelize';
export declare function initializeCMSModels(sequelize: Sequelize): void;
declare const _default: {
    UnifiedContent: typeof UnifiedContent;
    UnifiedCategory: typeof UnifiedCategory;
    UnifiedTag: typeof UnifiedTag;
    UnifiedMedia: typeof UnifiedMedia;
    UnifiedInteraction: typeof UnifiedInteraction;
    initializeCMSModels: typeof initializeCMSModels;
};
export default _default;
//# sourceMappingURL=index.d.ts.map