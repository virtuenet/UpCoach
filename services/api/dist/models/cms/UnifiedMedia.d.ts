/**
 * Unified Media Model
 * Consolidates Media, ContentMedia, and attachment models
 */
import { Model, Sequelize, Optional } from 'sequelize';
export interface UnifiedMediaAttributes {
    id: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'file';
    name: string;
    url: string;
    thumbnailUrl?: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    contentId?: string;
    uploadedBy: string;
    folder?: string;
    alt?: string;
    caption?: string;
    metadata?: {
        originalName?: string;
        encoding?: string;
        bitrate?: number;
        framerate?: number;
        codec?: string;
        pages?: number;
        exif?: any;
        tags?: string[];
        description?: string;
    };
    processing?: {
        status: 'pending' | 'processing' | 'completed' | 'failed';
        error?: string;
        versions?: Array<{
            name: string;
            url: string;
            width?: number;
            height?: number;
            size: number;
        }>;
    };
    usage?: {
        viewCount: number;
        downloadCount: number;
        lastAccessedAt?: Date;
    };
    isPublic: boolean;
    isArchived: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UnifiedMediaCreationAttributes extends Optional<UnifiedMediaAttributes, 'id' | 'thumbnailUrl' | 'width' | 'height' | 'duration' | 'contentId' | 'folder' | 'alt' | 'caption' | 'metadata' | 'processing' | 'usage' | 'isPublic' | 'isArchived' | 'createdAt' | 'updatedAt'> {
}
export declare class UnifiedMedia extends Model<UnifiedMediaAttributes, UnifiedMediaCreationAttributes> implements UnifiedMediaAttributes {
    id: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'file';
    name: string;
    url: string;
    thumbnailUrl?: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    contentId?: string;
    uploadedBy: string;
    folder?: string;
    alt?: string;
    caption?: string;
    metadata?: UnifiedMediaAttributes['metadata'];
    processing?: UnifiedMediaAttributes['processing'];
    usage?: UnifiedMediaAttributes['usage'];
    isPublic: boolean;
    isArchived: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initialize(sequelize: Sequelize): void;
}
export default UnifiedMedia;
//# sourceMappingURL=UnifiedMedia.d.ts.map