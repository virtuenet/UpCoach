import { Model, Sequelize } from 'sequelize';
export interface ForumVoteAttributes {
    id: string;
    userId: string;
    postId: string;
    voteType: number;
    createdAt: Date;
}
export interface ForumVoteCreationAttributes extends Omit<ForumVoteAttributes, 'id' | 'createdAt'> {
}
export declare class ForumVote extends Model<ForumVoteAttributes, ForumVoteCreationAttributes> implements ForumVoteAttributes {
    id: string;
    userId: string;
    postId: string;
    voteType: number;
    readonly createdAt: Date;
    readonly user?: any;
    readonly post?: any;
    static associate(models: any): void;
}
declare const _default: (sequelize: Sequelize) => typeof ForumVote;
export default _default;
//# sourceMappingURL=ForumVote.d.ts.map