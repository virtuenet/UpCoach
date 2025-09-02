import { Model, Sequelize, Association, Optional } from 'sequelize';
import { Content } from './Content';
import { User } from '../User';
export interface ContentMediaAttributes {
    id: string;
    contentId?: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
    url: string;
    thumbnailUrl?: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    metadata?: {
        alt?: string;
        caption?: string;
        credit?: string;
        tags?: string[];
        [key: string]: any;
    };
    uploadedBy: string;
    isPublic: boolean;
    usageCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentMediaCreationAttributes extends Optional<ContentMediaAttributes, 'id' | 'contentId' | 'thumbnailUrl' | 'width' | 'height' | 'duration' | 'metadata' | 'usageCount' | 'createdAt' | 'updatedAt'> {
}
export declare class ContentMedia extends Model<ContentMediaAttributes, ContentMediaCreationAttributes> implements ContentMediaAttributes {
    id: string;
    contentId?: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
    url: string;
    thumbnailUrl?: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    metadata?: {
        alt?: string;
        caption?: string;
        credit?: string;
        tags?: string[];
        [key: string]: any;
    };
    uploadedBy: string;
    isPublic: boolean;
    usageCount: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly content?: Content;
    readonly uploader?: User;
    static associations: {
        content: Association<ContentMedia, Content>;
        uploader: Association<ContentMedia, User>;
    };
    static initialize(sequelize: Sequelize): void;
    static associate(): void;
}
//# sourceMappingURL=ContentMedia.d.ts.map