"use strict";
/**
 * Unified CMS Models Export
 * Provides backward compatibility aliases for old model names
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedInteraction = exports.UnifiedMedia = exports.UnifiedTag = exports.UnifiedCategory = exports.UnifiedContent = exports.ContentInteraction = exports.ContentComment = exports.Comment = exports.ContentMedia = exports.Media = exports.ContentTag = exports.ContentCategory = exports.Category = exports.Template = exports.Course = exports.ContentArticle = exports.Content = exports.Article = void 0;
exports.initializeCMSModels = initializeCMSModels;
// Import unified models
const UnifiedContent_1 = require("./UnifiedContent");
Object.defineProperty(exports, "UnifiedContent", { enumerable: true, get: function () { return UnifiedContent_1.UnifiedContent; } });
const UnifiedCategory_1 = require("./UnifiedCategory");
Object.defineProperty(exports, "UnifiedCategory", { enumerable: true, get: function () { return UnifiedCategory_1.UnifiedCategory; } });
const UnifiedTag_1 = require("./UnifiedTag");
Object.defineProperty(exports, "UnifiedTag", { enumerable: true, get: function () { return UnifiedTag_1.UnifiedTag; } });
const UnifiedMedia_1 = require("./UnifiedMedia");
Object.defineProperty(exports, "UnifiedMedia", { enumerable: true, get: function () { return UnifiedMedia_1.UnifiedMedia; } });
const UnifiedInteraction_1 = require("./UnifiedInteraction");
Object.defineProperty(exports, "UnifiedInteraction", { enumerable: true, get: function () { return UnifiedInteraction_1.UnifiedInteraction; } });
const logger_1 = require("../../utils/logger");
// ==================== Backward Compatibility Aliases ====================
// Content aliases
var UnifiedContent_2 = require("./UnifiedContent");
Object.defineProperty(exports, "Article", { enumerable: true, get: function () { return UnifiedContent_2.UnifiedContent; } });
var UnifiedContent_3 = require("./UnifiedContent");
Object.defineProperty(exports, "Content", { enumerable: true, get: function () { return UnifiedContent_3.UnifiedContent; } });
var UnifiedContent_4 = require("./UnifiedContent");
Object.defineProperty(exports, "ContentArticle", { enumerable: true, get: function () { return UnifiedContent_4.UnifiedContent; } });
var UnifiedContent_5 = require("./UnifiedContent");
Object.defineProperty(exports, "Course", { enumerable: true, get: function () { return UnifiedContent_5.UnifiedContent; } });
var UnifiedContent_6 = require("./UnifiedContent");
Object.defineProperty(exports, "Template", { enumerable: true, get: function () { return UnifiedContent_6.UnifiedContent; } });
// Category aliases
var UnifiedCategory_2 = require("./UnifiedCategory");
Object.defineProperty(exports, "Category", { enumerable: true, get: function () { return UnifiedCategory_2.UnifiedCategory; } });
var UnifiedCategory_3 = require("./UnifiedCategory");
Object.defineProperty(exports, "ContentCategory", { enumerable: true, get: function () { return UnifiedCategory_3.UnifiedCategory; } });
// Tag aliases
var UnifiedTag_2 = require("./UnifiedTag");
Object.defineProperty(exports, "ContentTag", { enumerable: true, get: function () { return UnifiedTag_2.UnifiedTag; } });
// Media aliases
var UnifiedMedia_2 = require("./UnifiedMedia");
Object.defineProperty(exports, "Media", { enumerable: true, get: function () { return UnifiedMedia_2.UnifiedMedia; } });
var UnifiedMedia_3 = require("./UnifiedMedia");
Object.defineProperty(exports, "ContentMedia", { enumerable: true, get: function () { return UnifiedMedia_3.UnifiedMedia; } });
// Interaction aliases
var UnifiedInteraction_2 = require("./UnifiedInteraction");
Object.defineProperty(exports, "Comment", { enumerable: true, get: function () { return UnifiedInteraction_2.UnifiedInteraction; } });
var UnifiedInteraction_3 = require("./UnifiedInteraction");
Object.defineProperty(exports, "ContentComment", { enumerable: true, get: function () { return UnifiedInteraction_3.UnifiedInteraction; } });
var UnifiedInteraction_4 = require("./UnifiedInteraction");
Object.defineProperty(exports, "ContentInteraction", { enumerable: true, get: function () { return UnifiedInteraction_4.UnifiedInteraction; } });
function initializeCMSModels(sequelize) {
    // Initialize all unified models
    UnifiedContent_1.UnifiedContent.initialize(sequelize);
    UnifiedCategory_1.UnifiedCategory.initialize(sequelize);
    UnifiedTag_1.UnifiedTag.initialize(sequelize);
    UnifiedMedia_1.UnifiedMedia.initialize(sequelize);
    UnifiedInteraction_1.UnifiedInteraction.initialize(sequelize);
    // Set up associations
    UnifiedContent_1.UnifiedContent.associate();
    UnifiedCategory_1.UnifiedCategory.associate();
    // Additional associations
    UnifiedContent_1.UnifiedContent.belongsTo(UnifiedCategory_1.UnifiedCategory, {
        foreignKey: 'categoryId',
        as: 'category',
    });
    UnifiedContent_1.UnifiedContent.belongsToMany(UnifiedTag_1.UnifiedTag, {
        through: 'content_tag_relations',
        foreignKey: 'contentId',
        otherKey: 'tagId',
        as: 'tags',
    });
    UnifiedContent_1.UnifiedContent.hasMany(UnifiedMedia_1.UnifiedMedia, {
        foreignKey: 'contentId',
        as: 'media',
    });
    UnifiedContent_1.UnifiedContent.hasMany(UnifiedInteraction_1.UnifiedInteraction, {
        foreignKey: 'contentId',
        as: 'interactions',
    });
    UnifiedTag_1.UnifiedTag.belongsToMany(UnifiedContent_1.UnifiedContent, {
        through: 'content_tag_relations',
        foreignKey: 'tagId',
        otherKey: 'contentId',
        as: 'contents',
    });
    UnifiedMedia_1.UnifiedMedia.belongsTo(UnifiedContent_1.UnifiedContent, {
        foreignKey: 'contentId',
        as: 'content',
    });
    UnifiedInteraction_1.UnifiedInteraction.belongsTo(UnifiedContent_1.UnifiedContent, {
        foreignKey: 'contentId',
        as: 'content',
    });
    logger_1.logger.info('✅ CMS models initialized with unified structure');
}
// Default export
exports.default = {
    UnifiedContent: UnifiedContent_1.UnifiedContent,
    UnifiedCategory: UnifiedCategory_1.UnifiedCategory,
    UnifiedTag: UnifiedTag_1.UnifiedTag,
    UnifiedMedia: UnifiedMedia_1.UnifiedMedia,
    UnifiedInteraction: UnifiedInteraction_1.UnifiedInteraction,
    initializeCMSModels,
};
//# sourceMappingURL=index.js.map