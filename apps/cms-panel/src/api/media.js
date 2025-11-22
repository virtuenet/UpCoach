import { apiClient } from './client';
// import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { validateFile, escapeHTML } from '../utils/inputValidation';
import { withRateLimit, RATE_LIMITS } from '../utils/rateLimiter';
export const mediaApi = {
    /**
     * Upload files to media library
     */
    uploadFiles: async (files, options = {}) => {
        // Validate files before upload
        const fileArray = Array.from(files);
        const validationErrors = [];
        for (const file of fileArray) {
            const validation = validateFile(file, {
                maxSize: 50 * 1024 * 1024, // 50MB
                allowedTypes: [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'image/svg+xml',
                    'video/mp4',
                    'video/webm',
                    'video/ogg',
                    'audio/mpeg',
                    'audio/ogg',
                    'audio/wav',
                    'application/pdf',
                    'text/plain',
                    'text/csv',
                ],
                allowedExtensions: [
                    'jpg',
                    'jpeg',
                    'png',
                    'gif',
                    'webp',
                    'svg',
                    'mp4',
                    'webm',
                    'ogg',
                    'mp3',
                    'wav',
                    'pdf',
                    'txt',
                    'csv',
                ],
            });
            if (!validation.valid) {
                validationErrors.push(`${file.name}: ${validation.errors.join(', ')}`);
            }
        }
        if (validationErrors.length > 0) {
            throw new Error(`File validation failed: ${validationErrors.join('; ')}`);
        }
        return withRateLimit(async () => {
            const formData = new FormData();
            fileArray.forEach(file => {
                formData.append('files', file);
            });
            // Sanitize and validate folder path
            if (options.folder) {
                const sanitizedFolder = options.folder.replace(/[^a-zA-Z0-9-_/]/g, '').replace(/\.\./, '');
                if (sanitizedFolder.length > 0) {
                    formData.append('folder', sanitizedFolder);
                }
            }
            // Escape HTML in text fields
            if (options.alt)
                formData.append('alt', escapeHTML(options.alt));
            if (options.caption)
                formData.append('caption', escapeHTML(options.caption));
            if (options.tags)
                formData.append('tags', escapeHTML(options.tags));
            const response = await apiClient.post('/cms/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        }, RATE_LIMITS.MEDIA_UPLOAD);
    },
    /**
     * Get media library with filtering and pagination
     */
    getMedia: async (params = {}) => {
        const response = await apiClient.get('/cms/media', { params });
        return {
            data: response.data.data || response.data,
            pagination: response.data.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: response.data?.length || 0,
                itemsPerPage: params.limit || 20,
            },
        };
    },
    /**
     * Get a single media item
     */
    getMediaItem: async (id) => {
        const response = await apiClient.get(`/cms/media/${id}`);
        return response.data;
    },
    /**
     * Update media metadata
     */
    updateMedia: async (id, data) => {
        const response = await apiClient.put(`/cms/media/${id}`, data);
        return response.data;
    },
    /**
     * Delete media item
     */
    deleteMedia: async (id) => {
        await apiClient.delete(`/cms/media/${id}`);
    },
    /**
     * Get media folders
     */
    getFolders: async () => {
        const response = await apiClient.get('/cms/media/folders');
        return response.data;
    },
    /**
     * Create a new folder
     */
    createFolder: async (name) => {
        const response = await apiClient.post('/cms/media/folders', { name });
        return response.data;
    },
    /**
     * Move media to folder
     */
    moveToFolder: async (mediaIds, folder) => {
        await apiClient.post('/cms/media/move', { mediaIds, folder });
    },
    /**
     * Get storage statistics
     */
    getStorageStats: async () => {
        const response = await apiClient.get('/cms/media/stats');
        return response.data;
    },
    /**
     * Clean up unused media (admin only)
     */
    cleanupUnused: async (olderThanDays = 30) => {
        const response = await apiClient.delete('/cms/media/cleanup', {
            params: { olderThanDays },
        });
        return response.data;
    },
    /**
     * Format file size for display
     */
    formatFileSize: (bytes) => {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    },
    /**
     * Get file type category
     */
    getFileType: (mimeType) => {
        if (mimeType.startsWith('image/'))
            return 'image';
        if (mimeType.startsWith('video/'))
            return 'video';
        if (mimeType.startsWith('audio/'))
            return 'audio';
        if (mimeType.includes('pdf'))
            return 'pdf';
        if (mimeType.includes('document') || mimeType.includes('text'))
            return 'document';
        return 'file';
    },
    /**
     * Get file icon based on type
     */
    getFileIcon: (mimeType) => {
        const type = mediaApi.getFileType(mimeType);
        switch (type) {
            case 'image':
                return '🖼️';
            case 'video':
                return '🎥';
            case 'audio':
                return '🎵';
            case 'pdf':
                return '📄';
            case 'document':
                return '📝';
            default:
                return '📎';
        }
    },
    /**
     * Validate file before upload
     */
    validateFile: (file) => {
        // Check file size
        const maxSizes = {
            image: 10 * 1024 * 1024, // 10MB
            video: 100 * 1024 * 1024, // 100MB
            audio: 50 * 1024 * 1024, // 50MB
            document: 25 * 1024 * 1024, // 25MB
        };
        const fileType = mediaApi.getFileType(file.type);
        const maxSize = maxSizes[fileType] || maxSizes.document;
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File too large. Maximum size for ${fileType} files is ${Math.round(maxSize / 1024 / 1024)}MB.`,
            };
        }
        // Check file type
        const allowedTypes = [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Videos
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/webm',
            'video/x-msvideo',
            // Audio
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/mp3',
            'audio/x-m4a',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
        ];
        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type "${file.type}" is not allowed.`,
            };
        }
        return { valid: true };
    },
};
//# sourceMappingURL=media.js.map