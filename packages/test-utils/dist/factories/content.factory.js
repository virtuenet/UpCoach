const { Factory } = require('fishery');
import { faker } from '../faker-fix';
export const ContentFactory = Factory.define(() => ({
    id: faker.string.uuid(),
    type: 'article',
    title: faker.lorem.words(5),
    slug: faker.lorem.slug(),
    content: faker.lorem.paragraphs(3),
    excerpt: faker.lorem.sentences(2),
    status: 'published',
    authorId: faker.string.uuid(),
    tags: [faker.lorem.word(), faker.lorem.word()],
    featuredImageUrl: faker.image.url(),
    publishedAt: faker.date.recent(),
    viewCount: faker.number.int({ min: 0, max: 1000 }),
    likeCount: faker.number.int({ min: 0, max: 500 }),
    isPremium: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
}));
//# sourceMappingURL=content.factory.js.map