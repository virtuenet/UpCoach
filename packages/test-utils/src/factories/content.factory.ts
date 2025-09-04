import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Content } from '@upcoach/types';

export const ContentFactory = Factory<Content>({
  define() {
    return {
      id: faker.datatype.uuid(),
      type: 'article',
      title: faker.lorem.words(5),
      slug: faker.lorem.slug(),
      content: faker.lorem.paragraphs(3),
      excerpt: faker.lorem.sentences(2),
      status: 'published',
      authorId: faker.datatype.uuid(),
      tags: [faker.lorem.word(), faker.lorem.word()],
      featuredImageUrl: faker.image.url(),
      publishedAt: faker.date.recent(),
      viewCount: faker.datatype.number({ min: 0, max: 1000 }),
      likeCount: faker.datatype.number({ min: 0, max: 500 }),
      isPremium: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent()
    };
  }
});