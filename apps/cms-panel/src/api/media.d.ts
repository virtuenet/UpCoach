export interface MediaItem {
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
        lastUsedAt: string | null;
    };
    status: 'processing' | 'ready' | 'failed';
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface GetMediaParams {
    page?: number;
    limit?: number;
    type?: string;
    folder?: string;
    search?: string;
    tags?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface MediaResponse {
    data: MediaItem[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}
export interface UploadResponse {
    data: MediaItem[];
    message: string;
}
export interface StorageStats {
    totalFiles: number;
    totalSize: number;
    byType: {
        [key: string]: {
            count: number;
            size: number;
        };
    };
}
export declare const mediaApi: {
    /**
     * Upload files to media library
     */
    uploadFiles: (files: FileList | File[], options?: {
        folder?: string;
        alt?: string;
        caption?: string;
        tags?: string;
    }) => Promise<UploadResponse>;
    /**
     * Get media library with filtering and pagination
     */
    getMedia: (params?: GetMediaParams) => Promise<MediaResponse>;
    /**
     * Get a single media item
     */
    getMediaItem: (id: string) => Promise<MediaItem>;
    /**
     * Update media metadata
     */
    updateMedia: (id: string, data: {
        alt?: string;
        caption?: string;
        tags?: string;
        folder?: string;
        isPublic?: boolean;
    }) => Promise<MediaItem>;
    /**
     * Delete media item
     */
    deleteMedia: (id: string) => Promise<void>;
    /**
     * Get media folders
     */
    getFolders: () => Promise<string[]>;
    /**
     * Create a new folder
     */
    createFolder: (name: string) => Promise<{
        name: string;
    }>;
    /**
     * Move media to folder
     */
    moveToFolder: (mediaIds: string[], folder: string | null) => Promise<void>;
    /**
     * Get storage statistics
     */
    getStorageStats: () => Promise<StorageStats>;
    /**
     * Clean up unused media (admin only)
     */
    cleanupUnused: (olderThanDays?: number) => Promise<{
        deletedCount: number;
    }>;
    /**
     * Format file size for display
     */
    formatFileSize: (bytes: number) => string;
    /**
     * Get file type category
     */
    getFileType: (mimeType: string) => string;
    /**
     * Get file icon based on type
     */
    getFileIcon: (mimeType: string) => string;
    /**
     * Validate file before upload
     */
    validateFile: (file: File) => {
        valid: boolean;
        error?: string;
    };
};
//# sourceMappingURL=media.d.ts.map