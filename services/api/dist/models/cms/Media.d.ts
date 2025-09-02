import { Model, Optional } from 'sequelize';
export interface MediaAttributes {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    url: string;
    thumbnailUrl: string | null;
    alt: string | null;
    caption: string | null;
    uploadedById: string;
    folder: string | null;
    tags: string[];
    metadata: {
        width?: number;
        height?: number;
        duration?: number;
        quality?: string;
        format?: string;
        exifData?: any;
        processedVersions?: {
            thumbnail?: string;
            small?: string;
            medium?: string;
            large?: string;
        };
    };
    usage: {
        usedInArticles: string[];
        usedInCourses: string[];
        totalUsageCount: number;
        lastUsedAt: Date | null;
    };
    status: 'processing' | 'ready' | 'failed';
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export interface MediaCreationAttributes extends Optional<MediaAttributes, 'id' | 'thumbnailUrl' | 'alt' | 'caption' | 'folder' | 'tags' | 'metadata' | 'usage' | 'status' | 'isPublic' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    url: string;
    thumbnailUrl: string | null;
    alt: string | null;
    caption: string | null;
    uploadedById: string;
    folder: string | null;
    tags: string[];
    metadata: MediaAttributes['metadata'];
    usage: MediaAttributes['usage'];
    status: 'processing' | 'ready' | 'failed';
    isPublic: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    getFileType(): string;
    getFileExtension(): string;
    isImage(): boolean;
    isVideo(): boolean;
    isAudio(): boolean;
    formatFileSize(): string;
    addUsage(contentType: 'article' | 'course', contentId: string): Promise<void>;
    removeUsage(contentType: 'article' | 'course', contentId: string): Promise<void>;
    updateProcessingStatus(status: 'processing' | 'ready' | 'failed', metadata?: any): Promise<void>;
    static getByFolder(folder: string | null): Promise<Media[]>;
    static getByType(mimeType: string): Promise<Media[]>;
    static searchMedia(query: string, filters?: {
        type?: string;
        folder?: string;
        uploadedBy?: string;
        tags?: string[];
    }): Promise<Media[]>;
    static getUnused(): Promise<Media[]>;
    static getRecentUploads(limit?: number): Promise<Media[]>;
    static getFolders(): Promise<string[]>;
    static getStorageStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        byType: {
            [key: string]: {
                count: number;
                size: number;
            };
        };
    }>;
    static cleanupUnused(olderThanDays?: number): Promise<number>;
}
export default Media;
//# sourceMappingURL=Media.d.ts.map