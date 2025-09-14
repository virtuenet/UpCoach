import { Sequelize } from 'sequelize';
import { Content } from './Content';
import { ContentCategory } from './ContentCategory';
import { ContentTag } from './ContentTag';
import { ContentMedia } from './ContentMedia';
import { User } from '../User';

export class ContentModelRegistry {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public initializeModels(): void {
    Content.initialize(this.sequelize);
    ContentCategory.initialize(this.sequelize);
    ContentTag.initialize(this.sequelize);
    ContentMedia.initialize(this.sequelize);
  }

  public setupAssociations(): void {
    const models = {
      User,
      Content,
      ContentCategory,
      ContentTag,
      ContentMedia,
    };

    Content.associate(models);
    ContentCategory.associate();
    ContentTag.associate();
    ContentMedia.associate();
  }
}