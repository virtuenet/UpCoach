import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

class UploadService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.baseUrl = process.env.CDN_URL || `${process.env.API_URL || 'http://localhost:8080'}/uploads`;
  }

  private getStorage() {
    return multer.diskStorage({
      destination: async (_req, file, cb) => {
        const dir = path.join(this.uploadDir, this.getSubdirectory(file.mimetype));
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  private getSubdirectory(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  public getMulter(options?: multer.Options) {
    return multer({
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
        } else {
          cb(new Error('Invalid file type'));
        }
      },
      ...options,
    });
  }

  public async processImage(
    filePath: string,
    options: ImageTransformOptions
  ): Promise<string> {
    const { width, height, quality = 80, format = 'jpeg' } = options;
    const outputPath = filePath.replace(
      path.extname(filePath),
      `-${width || 'auto'}x${height || 'auto'}.${format}`
    );

    const image = sharp(filePath);
    
    if (width || height) {
      image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    await image
      .toFormat(format, { quality })
      .toFile(outputPath);

    return outputPath;
  }

  public async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  public getFileUrl(filename: string, subdirectory: string): string {
    return `${this.baseUrl}/${subdirectory}/${filename}`;
  }

  public async createThumbnail(
    imagePath: string,
    width: number = 300,
    height: number = 300
  ): Promise<string> {
    const thumbnailPath = imagePath.replace(
      path.extname(imagePath),
      `-thumb${path.extname(imagePath)}`
    );

    await sharp(imagePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  public async getFileMetadata(filePath: string): Promise<any> {
    const stats = await fs.stat(filePath);
    
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const metadata = await sharp(filePath).metadata();
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

  public async uploadFile(file: Express.Multer.File, options?: any): Promise<any> {
    const subdirectory = this.getSubdirectory(file.mimetype);
    const url = this.getFileUrl(file.filename, subdirectory);
    
    const result: any = {
      filename: file.filename,
      url,
      subdirectory,
    };

    // Generate thumbnail if requested and file is an image
    if (options?.generateThumbnail && file.mimetype.startsWith('image/')) {
      const thumbnailPath = await this.createThumbnail(file.path);
      result.thumbnailUrl = this.getFileUrl(path.basename(thumbnailPath), subdirectory);
    }

    // Get file dimensions if it's an image
    if (file.mimetype.startsWith('image/')) {
      const metadata = await sharp(file.path).metadata();
      result.dimensions = {
        width: metadata.width,
        height: metadata.height,
      };
    }

    result.metadata = await this.getFileMetadata(file.path);
    
    return result;
  }
}

export default new UploadService();