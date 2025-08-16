import { Request, Response } from 'express';
import { ContentMedia } from '../../models/cms/ContentMedia';
import { User } from '../../models/User';
import { Content } from '../../models/cms/Content';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import crypto from 'crypto';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'media');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const safeName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export class MediaController {
  // Upload single file
  static uploadSingle = upload.single('file');

  // Upload multiple files
  static uploadMultiple = upload.array('files', 10);

  // Process uploaded file
  static async processUpload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const { contentId, alt, caption, credit } = req.body;

      // Determine media type
      let mediaType: 'image' | 'video' | 'audio' | 'document' | 'other' = 'other';
      if (file.mimetype.startsWith('image/')) mediaType = 'image';
      else if (file.mimetype.startsWith('video/')) mediaType = 'video';
      else if (file.mimetype.startsWith('audio/')) mediaType = 'audio';
      else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) mediaType = 'document';

      // Process image files
      let width, height, thumbnailUrl;
      if (mediaType === 'image') {
        try {
          const metadata = await sharp(file.path).metadata();
          width = metadata.width;
          height = metadata.height;

          // Generate thumbnail
          const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '-thumb$1');
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          
          thumbnailUrl = `/uploads/media/${path.basename(thumbnailPath)}`;
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }

      // Create media record
      const media = await ContentMedia.create({
        contentId,
        type: mediaType,
        url: `/uploads/media/${file.filename}`,
        thumbnailUrl,
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        metadata: {
          alt,
          caption,
          credit,
        },
        uploadedBy: req.user!.id,
        isPublic: true,
      });

      res.json(media);
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ error: 'Failed to process upload' });
    }
  }

  // Process multiple uploads
  static async processMultipleUploads(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { contentId } = req.body;
      const mediaItems = [];

      for (const file of req.files) {
        let mediaType: 'image' | 'video' | 'audio' | 'document' | 'other' = 'other';
        if (file.mimetype.startsWith('image/')) mediaType = 'image';
        else if (file.mimetype.startsWith('video/')) mediaType = 'video';
        else if (file.mimetype.startsWith('audio/')) mediaType = 'audio';
        else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) mediaType = 'document';

        let width, height, thumbnailUrl;
        if (mediaType === 'image') {
          try {
            const metadata = await sharp(file.path).metadata();
            width = metadata.width;
            height = metadata.height;

            const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '-thumb$1');
            await sharp(file.path)
              .resize(300, 300, { fit: 'cover' })
              .jpeg({ quality: 80 })
              .toFile(thumbnailPath);
            
            thumbnailUrl = `/uploads/media/${path.basename(thumbnailPath)}`;
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }

        const media = await ContentMedia.create({
          contentId,
          type: mediaType,
          url: `/uploads/media/${file.filename}`,
          thumbnailUrl,
          filename: file.filename,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width,
          height,
          uploadedBy: req.user!.id,
          isPublic: true,
        });

        mediaItems.push(media);
      }

      res.json(mediaItems);
    } catch (error) {
      console.error('Error processing multiple uploads:', error);
      res.status(500).json({ error: 'Failed to process uploads' });
    }
  }

  // Get all media with filters
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        contentId,
        uploadedBy,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      
      const where: any = {};
      
      if (type) where.type = type;
      if (contentId) where.contentId = contentId;
      if (uploadedBy) where.uploadedBy = uploadedBy;
      
      if (search) {
        where[Op.or] = [
          { filename: { [Op.iLike]: `%${search}%` } },
          { originalFilename: { [Op.iLike]: `%${search}%` } },
          { 'metadata.alt': { [Op.iLike]: `%${search}%` } },
          { 'metadata.caption': { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { rows: media, count } = await ContentMedia.findAndCountAll({
        where,
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset,
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'name', 'email', 'avatar']
          }
        ]
      });

      res.json({
        media,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  // Get single media item
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const media = await ContentMedia.findByPk(id, {
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'name', 'email', 'avatar']
          },
          {
            model: Content,
            as: 'content',
            attributes: ['id', 'title', 'slug']
          }
        ]
      });

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  // Update media metadata
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { metadata, isPublic } = req.body;

      const media = await ContentMedia.findByPk(id);
      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Check permissions
      if (media.uploadedBy !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to update this media' });
      }

      await media.update({
        metadata: { ...media.metadata, ...metadata },
        isPublic: isPublic !== undefined ? isPublic : media.isPublic
      });

      res.json(media);
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({ error: 'Failed to update media' });
    }
  }

  // Delete media
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const media = await ContentMedia.findByPk(id);
      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Check permissions
      if (media.uploadedBy !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this media' });
      }

      // Delete files from disk
      try {
        await fs.unlink(path.join(process.cwd(), media.url));
        if (media.thumbnailUrl) {
          await fs.unlink(path.join(process.cwd(), media.thumbnailUrl));
        }
      } catch (error) {
        console.error('Error deleting files:', error);
      }

      await media.destroy();
      res.json({ message: 'Media deleted successfully' });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ error: 'Failed to delete media' });
    }
  }

  // Get media library stats
  static async getStats(_req: Request, res: Response) {
    try {
      const totalCount = await ContentMedia.count();
      const totalSize = await ContentMedia.sum('size');
      
      const typeStats = await ContentMedia.findAll({
        attributes: [
          'type',
          [require('sequelize').fn('COUNT', '*'), 'count'],
          [require('sequelize').fn('SUM', require('sequelize').col('size')), 'totalSize']
        ],
        group: ['type']
      });

      const recentUploads = await ContentMedia.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'name', 'avatar']
          }
        ]
      });

      res.json({
        totalCount,
        totalSize,
        typeStats,
        recentUploads
      });
    } catch (error) {
      console.error('Error fetching media stats:', error);
      res.status(500).json({ error: 'Failed to fetch media stats' });
    }
  }
}

export default MediaController;