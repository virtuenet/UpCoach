"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../../utils/logger");
class UploadService {
    uploadDir;
    baseUrl;
    constructor() {
        this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
        this.baseUrl =
            process.env.CDN_URL || `${process.env.API_URL || 'http://localhost:8080'}/uploads`;
    }
    getStorage() {
        return multer_1.default.diskStorage({
            destination: async (_req, file, cb) => {
                const dir = path_1.default.join(this.uploadDir, this.getSubdirectory(file.mimetype));
                await promises_1.default.mkdir(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (_req, file, cb) => {
                const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        });
    }
    getSubdirectory(mimetype) {
        if (mimetype.startsWith('image/'))
            return 'images';
        if (mimetype.startsWith('video/'))
            return 'videos';
        if (mimetype.startsWith('audio/'))
            return 'audio';
        return 'documents';
    }
    getMulter(options) {
        return (0, multer_1.default)({
            storage: this.getStorage(),
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
            fileFilter: (_req, file, cb) => {
                const allowedMimes = [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'video/mp4',
                    'video/webm',
                    'audio/mpeg',
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
            ...options,
        });
    }
    async processImage(filePath, options) {
        const { width, height, quality = 80, format = 'jpeg' } = options;
        const outputPath = filePath.replace(path_1.default.extname(filePath), `-${width || 'auto'}x${height || 'auto'}.${format}`);
        const image = (0, sharp_1.default)(filePath);
        if (width || height) {
            image.resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }
        await image.toFormat(format, { quality }).toFile(outputPath);
        return outputPath;
    }
    async deleteFile(filePath) {
        try {
            await promises_1.default.unlink(filePath);
        }
        catch (error) {
            logger_1.logger.error('Error deleting file:', error);
        }
    }
    getFileUrl(filename, subdirectory) {
        return `${this.baseUrl}/${subdirectory}/${filename}`;
    }
    async createThumbnail(imagePath, width = 300, height = 300) {
        const thumbnailPath = imagePath.replace(path_1.default.extname(imagePath), `-thumb${path_1.default.extname(imagePath)}`);
        await (0, sharp_1.default)(imagePath)
            .resize(width, height, {
            fit: 'cover',
            position: 'center',
        })
            .toFile(thumbnailPath);
        return thumbnailPath;
    }
    async getFileMetadata(filePath) {
        const stats = await promises_1.default.stat(filePath);
        if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const metadata = await (0, sharp_1.default)(filePath).metadata();
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                space: metadata.space,
                channels: metadata.channels,
                depth: metadata.depth,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
            };
        }
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
        };
    }
    async uploadFile(file, options) {
        const subdirectory = this.getSubdirectory(file.mimetype);
        const url = this.getFileUrl(file.filename, subdirectory);
        const result = {
            filename: file.filename,
            url,
            subdirectory,
        };
        // Generate thumbnail if requested and file is an image
        if (options?.generateThumbnail && file.mimetype.startsWith('image/')) {
            const thumbnailPath = await this.createThumbnail(file.path);
            result.thumbnailUrl = this.getFileUrl(path_1.default.basename(thumbnailPath), subdirectory);
        }
        // Get file dimensions if it's an image
        if (file.mimetype.startsWith('image/')) {
            const metadata = await (0, sharp_1.default)(file.path).metadata();
            result.dimensions = {
                width: metadata.width,
                height: metadata.height,
            };
        }
        result.metadata = await this.getFileMetadata(file.path);
        return result;
    }
}
exports.default = new UploadService();
//# sourceMappingURL=UploadService.js.map