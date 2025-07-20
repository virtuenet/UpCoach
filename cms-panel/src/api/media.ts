import { apiClient } from './client'

export interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  url: string
  thumbnailUrl: string | null
  alt: string | null
  caption: string | null
  uploadedById: string
  folder: string | null
  tags: string[]
  metadata: {
    width?: number
    height?: number
    duration?: number
    quality?: string
    format?: string
    processedVersions?: {
      thumbnail?: string
      small?: string
      medium?: string
      large?: string
    }
  }
  usage: {
    usedInArticles: string[]
    usedInCourses: string[]
    totalUsageCount: number
    lastUsedAt: string | null
  }
  status: 'processing' | 'ready' | 'failed'
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface GetMediaParams {
  page?: number
  limit?: number
  type?: string
  folder?: string
  search?: string
  tags?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface MediaResponse {
  data: MediaItem[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export interface UploadResponse {
  data: MediaItem[]
  message: string
}

export interface StorageStats {
  totalFiles: number
  totalSize: number
  byType: {
    [key: string]: {
      count: number
      size: number
    }
  }
}

export const mediaApi = {
  /**
   * Upload files to media library
   */
  uploadFiles: async (files: FileList | File[], options: {
    folder?: string
    alt?: string
    caption?: string
    tags?: string
  } = {}): Promise<UploadResponse> => {
    const formData = new FormData()
    
    const fileArray = Array.from(files)
    fileArray.forEach((file) => {
      formData.append('files', file)
    })
    
    if (options.folder) formData.append('folder', options.folder)
    if (options.alt) formData.append('alt', options.alt)
    if (options.caption) formData.append('caption', options.caption)
    if (options.tags) formData.append('tags', options.tags)

    const response = await apiClient.post('/cms/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Get media library with filtering and pagination
   */
  getMedia: async (params: GetMediaParams = {}): Promise<MediaResponse> => {
    const response = await apiClient.get('/cms/media', { params })
    return {
      data: response.data,
      pagination: response.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: response.data?.length || 0,
        itemsPerPage: params.limit || 20
      }
    }
  },

  /**
   * Get a single media item
   */
  getMediaItem: async (id: string): Promise<MediaItem> => {
    const response = await apiClient.get(`/cms/media/${id}`)
    return response.data
  },

  /**
   * Update media metadata
   */
  updateMedia: async (id: string, data: {
    alt?: string
    caption?: string
    tags?: string
    folder?: string
    isPublic?: boolean
  }): Promise<MediaItem> => {
    const response = await apiClient.put(`/cms/media/${id}`, data)
    return response.data
  },

  /**
   * Delete media item
   */
  deleteMedia: async (id: string): Promise<void> => {
    await apiClient.delete(`/cms/media/${id}`)
  },

  /**
   * Get media folders
   */
  getFolders: async (): Promise<string[]> => {
    const response = await apiClient.get('/cms/media/folders')
    return response.data
  },

  /**
   * Create a new folder
   */
  createFolder: async (name: string): Promise<{ name: string }> => {
    const response = await apiClient.post('/cms/media/folders', { name })
    return response.data
  },

  /**
   * Move media to folder
   */
  moveToFolder: async (mediaIds: string[], folder: string | null): Promise<void> => {
    await apiClient.post('/cms/media/move', { mediaIds, folder })
  },

  /**
   * Get storage statistics
   */
  getStorageStats: async (): Promise<StorageStats> => {
    const response = await apiClient.get('/cms/media/stats')
    return response.data
  },

  /**
   * Clean up unused media (admin only)
   */
  cleanupUnused: async (olderThanDays: number = 30): Promise<{ deletedCount: number }> => {
    const response = await apiClient.delete('/cms/media/cleanup', {
      params: { olderThanDays }
    })
    return response.data
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  },

  /**
   * Get file type category
   */
  getFileType: (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('document') || mimeType.includes('text')) return 'document'
    return 'file'
  },

  /**
   * Get file icon based on type
   */
  getFileIcon: (mimeType: string): string => {
    const type = mediaApi.getFileType(mimeType)
    
    switch (type) {
      case 'image':
        return '🖼️'
      case 'video':
        return '🎥'
      case 'audio':
        return '🎵'
      case 'pdf':
        return '📄'
      case 'document':
        return '📝'
      default:
        return '📎'
    }
  },

  /**
   * Validate file before upload
   */
  validateFile: (file: File): { valid: boolean; error?: string } => {
    // Check file size
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
      document: 25 * 1024 * 1024, // 25MB
    }

    const fileType = mediaApi.getFileType(file.type)
    const maxSize = maxSizes[fileType as keyof typeof maxSizes] || maxSizes.document

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size for ${fileType} files is ${Math.round(maxSize / 1024 / 1024)}MB.`
      }
    }

    // Check file type
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-m4a',
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
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed.`
      }
    }

    return { valid: true }
  },
} 