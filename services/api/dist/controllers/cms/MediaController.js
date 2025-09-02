"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const ContentMedia_1 = require("../../models/cms/ContentMedia");
const User_1 = require("../../models/User");
const Content_1 = require("../../models/cms/Content");
const sequelize_1 = require("sequelize");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: async (_req, _file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'media');
        await promises_1.default.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = crypto_1.default.randomBytes(6).toString('hex');
        const ext = path_1.default.extname(file.originalname);
        const name = path_1.default.basename(file.originalname, ext);
        const safeName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({
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
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
});
class MediaController {
    // Upload single file
    static uploadSingle = upload.single('file');
    // Upload multiple files
    static uploadMultiple = upload.array('files', 10);
    // Process uploaded file
    static async processUpload(req, _res) {
        try {
            if (!req.file) {
                return _res.status(400).json({ error: 'No file uploaded' });
            }
            const file = req.file;
            const { contentId, alt, caption, credit } = req.body;
            // Determine media type
            let mediaType = 'other';
            if (file.mimetype.startsWith('image/'))
                mediaType = 'image';
            else if (file.mimetype.startsWith('video/'))
                mediaType = 'video';
            else if (file.mimetype.startsWith('audio/'))
                mediaType = 'audio';
            else if (file.mimetype.includes('pdf') || file.mimetype.includes('document'))
                mediaType = 'document';
            // Process image files
            let width, height, thumbnailUrl;
            if (mediaType === 'image') {
                try {
                    const metadata = await (0, sharp_1.default)(file.path).metadata();
                    width = metadata.width;
                    height = metadata.height;
                    // Generate thumbnail
                    const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '-thumb$1');
                    await (0, sharp_1.default)(file.path)
                        .resize(300, 300, { fit: 'cover' })
                        .jpeg({ quality: 80 })
                        .toFile(thumbnailPath);
                    thumbnailUrl = `/uploads/media/${path_1.default.basename(thumbnailPath)}`;
                }
                catch (error) {
                    logger_1.logger.error('Error processing image:', error);
                }
            }
            // Create media record
            const media = await ContentMedia_1.ContentMedia.create({
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
                uploadedBy: req.user.id,
                isPublic: true,
            });
            _res.json(media);
        }
        catch (error) {
            logger_1.logger.error('Error processing upload:', error);
            _res.status(500).json({ error: 'Failed to process upload' });
        }
    }
    // Process multiple uploads
    static async processMultipleUploads(req, _res) {
        try {
            if (!req.files || !Array.isArray(req.files)) {
                return _res.status(400).json({ error: 'No files uploaded' });
            }
            const { contentId } = req.body;
            const mediaItems = [];
            for (const file of req.files) {
                let mediaType = 'other';
                if (file.mimetype.startsWith('image/'))
                    mediaType = 'image';
                else if (file.mimetype.startsWith('video/'))
                    mediaType = 'video';
                else if (file.mimetype.startsWith('audio/'))
                    mediaType = 'audio';
                else if (file.mimetype.includes('pdf') || file.mimetype.includes('document'))
                    mediaType = 'document';
                let width, height, thumbnailUrl;
                if (mediaType === 'image') {
                    try {
                        const metadata = await (0, sharp_1.default)(file.path).metadata();
                        width = metadata.width;
                        height = metadata.height;
                        const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '-thumb$1');
                        await (0, sharp_1.default)(file.path)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toFile(thumbnailPath);
                        thumbnailUrl = `/uploads/media/${path_1.default.basename(thumbnailPath)}`;
                    }
                    catch (error) {
                        logger_1.logger.error('Error processing image:', error);
                    }
                }
                const media = await ContentMedia_1.ContentMedia.create({
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
                    uploadedBy: req.user.id,
                    isPublic: true,
                });
                mediaItems.push(media);
            }
            _res.json(mediaItems);
        }
        catch (error) {
            logger_1.logger.error('Error processing multiple uploads:', error);
            _res.status(500).json({ error: 'Failed to process uploads' });
        }
    }
    // Get all media with filters
    static async getAll(req, _res) {
        try {
            const { page = 1, limit = 20, type, contentId, uploadedBy, search, sortBy = 'createdAt', sortOrder = 'DESC', } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const where = {};
            if (type)
                where.type = type;
            if (contentId)
                where.contentId = contentId;
            if (uploadedBy)
                where.uploadedBy = uploadedBy;
            if (search) {
                where[sequelize_1.Op.or] = [
                    { filename: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { originalFilename: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { 'metadata.alt': { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { 'metadata.caption': { [sequelize_1.Op.iLike]: `%${search}%` } },
                ];
            }
            const { rows: media, count } = await ContentMedia_1.ContentMedia.findAndCountAll({
                where,
                order: [[sortBy, sortOrder]],
                limit: Number(limit),
                offset,
                include: [
                    {
                        model: User_1.User,
                        as: 'uploader',
                        attributes: ['id', 'name', 'email', 'avatar'],
                    },
                ],
            });
            _res.json({
                media,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count,
                    totalPages: Math.ceil(count / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching media:', error);
            _res.status(500).json({ error: 'Failed to fetch media' });
        }
    }
    // Get single media item
    static async getOne(req, _res) {
        try {
            const { id } = req.params;
            const media = await ContentMedia_1.ContentMedia.findByPk(id, {
                include: [
                    {
                        model: User_1.User,
                        as: 'uploader',
                        attributes: ['id', 'name', 'email', 'avatar'],
                    },
                    {
                        model: Content_1.Content,
                        as: 'content',
                        attributes: ['id', 'title', 'slug'],
                    },
                ],
            });
            if (!media) {
                return _res.status(404).json({ error: 'Media not found' });
            }
            _res.json(media);
        }
        catch (error) {
            logger_1.logger.error('Error fetching media:', error);
            _res.status(500).json({ error: 'Failed to fetch media' });
        }
    }
    // Update media metadata
    static async update(req, _res) {
        try {
            const { id } = req.params;
            const { metadata, isPublic } = req.body;
            const media = await ContentMedia_1.ContentMedia.findByPk(id);
            if (!media) {
                return _res.status(404).json({ error: 'Media not found' });
            }
            // Check permissions
            if (media.uploadedBy !== req.user.id && req.user.role !== 'admin') {
                return _res.status(403).json({ error: 'Unauthorized to update this media' });
            }
            await media.update({
                metadata: { ...media.metadata, ...metadata },
                isPublic: isPublic !== undefined ? isPublic : media.isPublic,
            });
            _res.json(media);
        }
        catch (error) {
            logger_1.logger.error('Error updating media:', error);
            _res.status(500).json({ error: 'Failed to update media' });
        }
    }
    // Delete media
    static async delete(req, _res) {
        try {
            const { id } = req.params;
            const media = await ContentMedia_1.ContentMedia.findByPk(id);
            if (!media) {
                return _res.status(404).json({ error: 'Media not found' });
            }
            // Check permissions
            if (media.uploadedBy !== req.user.id && req.user.role !== 'admin') {
                return _res.status(403).json({ error: 'Unauthorized to delete this media' });
            }
            // Delete files from disk
            try {
                await promises_1.default.unlink(path_1.default.join(process.cwd(), media.url));
                if (media.thumbnailUrl) {
                    await promises_1.default.unlink(path_1.default.join(process.cwd(), media.thumbnailUrl));
                }
            }
            catch (error) {
                logger_1.logger.error('Error deleting files:', error);
            }
            await media.destroy();
            _res.json({ message: 'Media deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error('Error deleting media:', error);
            _res.status(500).json({ error: 'Failed to delete media' });
        }
    }
    // Get media library stats
    static async getStats(req, res) {
        try {
            const totalCount = await ContentMedia_1.ContentMedia.count();
            const totalSize = await ContentMedia_1.ContentMedia.sum('size');
            const typeStats = await ContentMedia_1.ContentMedia.findAll({
                attributes: [
                    'type',
                    [require('sequelize').fn('COUNT', '*'), 'count'],
                    [require('sequelize').fn('SUM', require('sequelize').col('size')), 'totalSize'],
                ],
                group: ['type'],
            });
            const recentUploads = await ContentMedia_1.ContentMedia.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: User_1.User,
                        as: 'uploader',
                        attributes: ['id', 'name', 'avatar'],
                    },
                ],
            });
            res.json({
                totalCount,
                totalSize,
                typeStats,
                recentUploads,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching media stats:', error);
            res.status(500).json({ error: 'Failed to fetch media stats' });
        }
    }
}
exports.MediaController = MediaController;
exports.default = MediaController;
//# sourceMappingURL=MediaController.js.map