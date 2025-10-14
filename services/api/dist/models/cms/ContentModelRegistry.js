"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModelRegistry = void 0;
const Content_1 = require("./Content");
const ContentCategory_1 = require("./ContentCategory");
const ContentTag_1 = require("./ContentTag");
const ContentMedia_1 = require("./ContentMedia");
const User_1 = require("../User");
class ContentModelRegistry {
    sequelize;
    constructor(sequelize) {
        this.sequelize = sequelize;
    }
    initializeModels() {
        Content_1.Content.initialize(this.sequelize);
        ContentCategory_1.ContentCategory.initialize(this.sequelize);
        ContentTag_1.ContentTag.initialize(this.sequelize);
        ContentMedia_1.ContentMedia.initialize(this.sequelize);
    }
    setupAssociations() {
        const models = {
            User: User_1.User,
            Content: Content_1.Content,
            ContentCategory: ContentCategory_1.ContentCategory,
            ContentTag: ContentTag_1.ContentTag,
            ContentMedia: ContentMedia_1.ContentMedia,
        };
        Content_1.Content.associate(models);
        ContentCategory_1.ContentCategory.associate();
        ContentTag_1.ContentTag.associate();
        ContentMedia_1.ContentMedia.associate();
    }
}
exports.ContentModelRegistry = ContentModelRegistry;
