import { Request, Response } from 'express';
import { Media } from '../../models';
import { validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

/**
 * MediaController
 * Handles file uploads, media management, and organization
 */
export class MediaController {
  /**
   * Upload files to media library
   */
  static async uploadFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
        return;
      }

      const { folder = null, alt = '', caption = '', tags = '' } = req.body;
      const uploadedMedia: any[] = [];

      for (const file of files) {
        try {
          // Generate unique filename
          const fileExtension = path.extname(file.originalname);
          const filename = `${uuidv4()}${fileExtension}`;
          const uploadPath = path.join(process.cwd(), 'uploads', filename);

          // Ensure uploads directory exists
          await fs.mkdir(path.dirname(uploadPath), { recursive: true });

          // Move file to uploads directory
          await fs.writeFile(uploadPath, file.buffer);

          let thumbnailUrl = null;
          let metadata: any = {
            originalName: file.originalname,
            encoding: file.encoding,
          };

          // Process image files
          if (file.mimetype.startsWith('image/')) {
            try {
              const imageInfo = await sharp(file.buffer).metadata();
              metadata = {
                ...metadata,
                width: imageInfo.width,
                height: imageInfo.height,
                format: imageInfo.format,
                space: imageInfo.space,
                channels: imageInfo.channels,
                density: imageInfo.density,
              };

              // Create thumbnail for images
              const thumbnailFilename = `thumb_${filename}`;
              const thumbnailPath = path.join(process.cwd(), 'uploads', 'thumbnails', thumbnailFilename);
              
              await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });
              await sharp(file.buffer)
                .resize(300, 300, { 
                  fit: 'inside', 
                  withoutEnlargement: true 
                })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);

              thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;

              // Create additional sizes for responsive images
              const sizes = [
                { name: 'small', width: 400 },
                { name: 'medium', width: 800 },
                { name: 'large', width: 1200 },
              ];

              const processedVersions: any = {};
              for (const size of sizes) {
                const sizedFilename = `${size.name}_${filename}`;
                const sizedPath = path.join(process.cwd(), 'uploads', 'sizes', sizedFilename);
                
                await fs.mkdir(path.dirname(sizedPath), { recursive: true });
                await sharp(file.buffer)
                  .resize(size.width, null, { 
                    fit: 'inside', 
                    withoutEnlargement: true 
                  })
                  .jpeg({ quality: 85 })
                  .toFile(sizedPath);

                processedVersions[size.name] = `/uploads/sizes/${sizedFilename}`;
              }

              metadata.processedVersions = processedVersions;
            } catch (imageError) {
              console.error('Error processing image:', imageError);
            }
          }

          // Handle video files
          if (file.mimetype.startsWith('video/')) {
            // Video processing would go here (ffmpeg, etc.)
            metadata.duration = 0; // Placeholder
          }

          // Parse tags
          const tagArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];

          // Create media record
          const media = await Media.create({
            filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            url: `/uploads/${filename}`,
            thumbnailUrl,
            alt: alt || null,
            caption: caption || null,
            uploadedById: req.user!.id,
            folder: folder || null,
            tags: tagArray,
            metadata,
            usage: {
              usedInArticles: [],
              usedInCourses: [],
              totalUsageCount: 0,
              lastUsedAt: null,
            },
            status: 'ready',
            isPublic: false,
          });

          uploadedMedia.push(media);
        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          // Continue with other files
        }
      }

      res.status(201).json({
        success: true,
        data: uploadedMedia,
        message: `${uploadedMedia.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get media library with filtering and pagination
   */
  static async getMediaLibrary(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        folder,
        search,
        tags,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (type) {
        whereClause.mimeType = { [Media.sequelize!.Op.like]: `${type}%` };
      }

      if (folder !== undefined) {
        whereClause.folder = folder === 'null' ? null : folder;
      }

      if (search) {
        whereClause[Media.sequelize!.Op.or] = [
          { originalName: { [Media.sequelize!.Op.iLike]: `%${search}%` } },
          { alt: { [Media.sequelize!.Op.iLike]: `%${search}%` } },
          { caption: { [Media.sequelize!.Op.iLike]: `%${search}%` } },
        ];
      }

      if (tags) {
        const tagArray = (tags as string).split(',').map(tag => tag.trim());
        whereClause.tags = { [Media.sequelize!.Op.overlap]: tagArray };
      }

      const media = await Media.findAndCountAll({
        where: whereClause,
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: media.rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(media.count / Number(limit)),
          totalItems: media.count,
          itemsPerPage: Number(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get a single media item
   */
  static async getMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const media = await Media.findByPk(id);
      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      res.json({
        success: true,
        data: media,
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update media metadata
   */
  static async updateMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { alt, caption, tags, folder, isPublic } = req.body;

      const media = await Media.findByPk(id);
      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      // Check if user can edit this media
      if (media.uploadedById !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to edit this media',
        });
        return;
      }

      // Parse tags
      const tagArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : media.tags;

      await media.update({
        alt: alt !== undefined ? alt : media.alt,
        caption: caption !== undefined ? caption : media.caption,
        tags: tagArray,
        folder: folder !== undefined ? folder : media.folder,
        isPublic: isPublic !== undefined ? isPublic : media.isPublic,
      });

      res.json({
        success: true,
        data: media,
        message: 'Media updated successfully',
      });
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update media',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Delete media
   */
  static async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const media = await Media.findByPk(id);
      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      // Check if user can delete this media
      if (media.uploadedById !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to delete this media',
        });
        return;
      }

      // Check if media is in use
      if (media.usage.totalUsageCount > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete media that is currently in use',
          usage: media.usage,
        });
        return;
      }

      try {
        // Delete physical files
        const filePath = path.join(process.cwd(), 'uploads', media.filename);
        await fs.unlink(filePath).catch(() => {}); // Ignore if file doesn't exist

        // Delete thumbnail if exists
        if (media.thumbnailUrl) {
          const thumbnailPath = path.join(process.cwd(), media.thumbnailUrl.replace('/uploads/', 'uploads/'));
          await fs.unlink(thumbnailPath).catch(() => {});
        }

        // Delete processed versions if they exist
        if (media.metadata?.processedVersions) {
          for (const version of Object.values(media.metadata.processedVersions)) {
            const versionPath = path.join(process.cwd(), (version as string).replace('/uploads/', 'uploads/'));
            await fs.unlink(versionPath).catch(() => {});
          }
        }
      } catch (fileError) {
        console.error('Error deleting files:', fileError);
        // Continue with database deletion even if file deletion fails
      }

      await media.destroy();

      res.json({
        success: true,
        message: 'Media deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete media',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get media folders
   */
  static async getFolders(req: Request, res: Response): Promise<void> {
    try {
      const folders = await Media.getFolders();

      res.json({
        success: true,
        data: folders,
      });
    } catch (error) {
      console.error('Error fetching folders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch folders',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Create a new folder
   */
  static async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Folder name is required',
        });
        return;
      }

      // Check if folder already exists
      const existingFolders = await Media.getFolders();
      if (existingFolders.includes(name.trim())) {
        res.status(400).json({
          success: false,
          message: 'Folder already exists',
        });
        return;
      }

      res.json({
        success: true,
        data: { name: name.trim() },
        message: 'Folder created successfully',
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create folder',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Move media to folder
   */
  static async moveToFolder(req: Request, res: Response): Promise<void> {
    try {
      const { mediaIds, folder } = req.body;

      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Media IDs array is required',
        });
        return;
      }

      await Media.update(
        { folder: folder || null },
        { where: { id: mediaIds } }
      );

      res.json({
        success: true,
        message: `${mediaIds.length} media items moved successfully`,
      });
    } catch (error) {
      console.error('Error moving media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move media',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await Media.getStorageStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch storage statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Clean up unused media
   */
  static async cleanupUnused(req: Request, res: Response): Promise<void> {
    try {
      const { olderThanDays = 30 } = req.query;

      // Only admins can cleanup
      if (req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Only administrators can cleanup unused media',
        });
        return;
      }

      const deletedCount = await Media.cleanupUnused(Number(olderThanDays));

      res.json({
        success: true,
        data: { deletedCount },
        message: `${deletedCount} unused media items cleaned up`,
      });
    } catch (error) {
      console.error('Error cleaning up media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup unused media',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default MediaController; 