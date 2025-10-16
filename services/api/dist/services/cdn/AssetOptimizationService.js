"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetUtils = exports.assetOptimizationService = exports.AssetOptimizationService = exports.ImageFormat = exports.AssetType = void 0;
const tslib_1 = require("tslib");
const sharp_1 = tslib_1.__importDefault(require("sharp"));
const client_s3_1 = require("@aws-sdk/client-s3");
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = tslib_1.__importDefault(require("path"));
const logger_1 = require("../../utils/logger");
const PerformanceCacheService_1 = require("../cache/PerformanceCacheService");
var AssetType;
(function (AssetType) {
    AssetType["IMAGE"] = "image";
    AssetType["VIDEO"] = "video";
    AssetType["DOCUMENT"] = "document";
    AssetType["AUDIO"] = "audio";
    AssetType["STATIC"] = "static";
})(AssetType || (exports.AssetType = AssetType = {}));
var ImageFormat;
(function (ImageFormat) {
    ImageFormat["WEBP"] = "webp";
    ImageFormat["AVIF"] = "avif";
    ImageFormat["JPEG"] = "jpeg";
    ImageFormat["PNG"] = "png";
})(ImageFormat || (exports.ImageFormat = ImageFormat = {}));
class AssetOptimizationService {
    s3Client;
    cloudFrontClient;
    bucketName;
    cdnConfig;
    processingQueue = new Map();
    breakpoints = [320, 640, 768, 1024, 1280, 1920];
    supportedFormats = {
        'image/jpeg': ImageFormat.JPEG,
        'image/jpg': ImageFormat.JPEG,
        'image/png': ImageFormat.PNG,
        'image/webp': ImageFormat.WEBP,
        'image/avif': ImageFormat.AVIF
    };
    constructor() {
        this.initializeServices();
    }
    initializeServices() {
        const region = process.env.AWS_REGION || 'us-east-1';
        this.s3Client = new client_s3_1.S3Client({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        this.cloudFrontClient = new client_cloudfront_1.CloudFrontClient({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        this.bucketName = process.env.S3_BUCKET_NAME || 'upcoach-assets';
        this.cdnConfig = {
            domain: process.env.CDN_DOMAIN || 'cdn.upcoach.ai',
            distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
            cacheBehaviors: {
                images: { TTL: 31536000, compress: true },
                videos: { TTL: 86400, compress: false },
                documents: { TTL: 3600, compress: true },
                static: { TTL: 31536000, compress: true }
            },
            headers: {
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'X-Content-Type-Options': 'nosniff'
            }
        };
    }
    async optimizeAsset(file, originalName, config) {
        const assetId = this.generateAssetId(originalName, file);
        if (this.processingQueue.has(assetId)) {
            return await this.processingQueue.get(assetId);
        }
        const cached = await this.getCachedAsset(assetId);
        if (cached) {
            return cached;
        }
        const processingPromise = this.processAsset(file, originalName, config, assetId);
        this.processingQueue.set(assetId, processingPromise);
        try {
            const result = await processingPromise;
            await this.cacheAsset(assetId, result);
            return result;
        }
        finally {
            this.processingQueue.delete(assetId);
        }
    }
    async processAsset(file, originalName, config, assetId) {
        let buffer;
        if (typeof file === 'string') {
            buffer = await fs_1.promises.readFile(file);
        }
        else {
            buffer = file;
        }
        const originalSize = buffer.length;
        const fileExtension = path_1.default.extname(originalName).toLowerCase();
        let optimizedBuffer;
        let format;
        let dimensions;
        let variants = [];
        switch (config.type) {
            case AssetType.IMAGE:
                const imageResult = await this.optimizeImage(buffer, config);
                optimizedBuffer = imageResult.buffer;
                format = imageResult.format;
                dimensions = imageResult.dimensions;
                if (config.responsive) {
                    variants = await this.generateResponsiveVariants(buffer, config);
                }
                break;
            case AssetType.VIDEO:
                optimizedBuffer = await this.compressVideo(buffer, config);
                format = fileExtension.substring(1);
                break;
            case AssetType.DOCUMENT:
                optimizedBuffer = await this.compressDocument(buffer, config);
                format = fileExtension.substring(1);
                break;
            case AssetType.AUDIO:
                optimizedBuffer = await this.compressAudio(buffer, config);
                format = fileExtension.substring(1);
                break;
            default:
                optimizedBuffer = buffer;
                format = fileExtension.substring(1);
        }
        const optimizedKey = this.generateS3Key(assetId, format);
        const etag = this.generateETag(optimizedBuffer);
        await this.uploadToS3(optimizedKey, optimizedBuffer, format, config);
        const optimizedUrl = `s3://${this.bucketName}/${optimizedKey}`;
        const cdnUrl = `https://${this.cdnConfig.domain}/${optimizedKey}`;
        const result = {
            originalUrl: originalName,
            optimizedUrl,
            cdnUrl,
            format,
            size: optimizedBuffer.length,
            originalSize,
            compressionRatio: ((originalSize - optimizedBuffer.length) / originalSize) * 100,
            dimensions,
            variants,
            etag,
            lastModified: new Date()
        };
        logger_1.logger.info('Asset optimized', {
            assetId,
            originalSize,
            optimizedSize: optimizedBuffer.length,
            compressionRatio: result.compressionRatio,
            format
        });
        return result;
    }
    async optimizeImage(buffer, config) {
        let processor = (0, sharp_1.default)(buffer);
        const metadata = await processor.metadata();
        const dimensions = {
            width: metadata.width || 0,
            height: metadata.height || 0
        };
        if (config.maxSize) {
            const maxDimension = Math.sqrt(config.maxSize);
            processor = processor.resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }
        const targetFormat = config.format || this.selectOptimalFormat(metadata.format);
        const quality = config.quality || this.getOptimalQuality(targetFormat);
        let optimizedBuffer;
        switch (targetFormat) {
            case ImageFormat.WEBP:
                optimizedBuffer = await processor
                    .webp({ quality, effort: 6, smartSubsample: true })
                    .toBuffer();
                break;
            case ImageFormat.AVIF:
                optimizedBuffer = await processor
                    .avif({ quality, effort: 9, chromaSubsampling: '4:2:0' })
                    .toBuffer();
                break;
            case ImageFormat.JPEG:
                optimizedBuffer = await processor
                    .jpeg({ quality, progressive: true, mozjpeg: true })
                    .toBuffer();
                break;
            case ImageFormat.PNG:
                optimizedBuffer = await processor
                    .png({ quality, progressive: true, compressionLevel: 9 })
                    .toBuffer();
                break;
            default:
                optimizedBuffer = await processor.toBuffer();
        }
        return {
            buffer: optimizedBuffer,
            format: targetFormat,
            dimensions
        };
    }
    async generateResponsiveVariants(originalBuffer, config) {
        const variants = [];
        for (const width of this.breakpoints) {
            try {
                const processor = (0, sharp_1.default)(originalBuffer);
                const resizedBuffer = await processor
                    .resize(width, undefined, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                    .webp({ quality: config.quality || 85 })
                    .toBuffer();
                const metadata = await (0, sharp_1.default)(resizedBuffer).metadata();
                const variantKey = this.generateS3Key(`${this.generateAssetId(config.toString(), originalBuffer)}_${width}w`, 'webp');
                await this.uploadToS3(variantKey, resizedBuffer, 'webp', config);
                variants.push({
                    originalUrl: '',
                    optimizedUrl: `s3://${this.bucketName}/${variantKey}`,
                    cdnUrl: `https://${this.cdnConfig.domain}/${variantKey}`,
                    format: 'webp',
                    size: resizedBuffer.length,
                    originalSize: originalBuffer.length,
                    compressionRatio: 0,
                    dimensions: { width: metadata.width || 0, height: metadata.height || 0 },
                    etag: this.generateETag(resizedBuffer),
                    lastModified: new Date()
                });
            }
            catch (error) {
                logger_1.logger.error(`Failed to generate ${width}w variant`, error);
            }
        }
        return variants;
    }
    async compressVideo(buffer, config) {
        logger_1.logger.info('Video compression not yet implemented, returning original');
        return buffer;
    }
    async compressDocument(buffer, config) {
        return buffer;
    }
    async compressAudio(buffer, config) {
        return buffer;
    }
    async uploadToS3(key, buffer, format, config) {
        const contentType = this.getContentType(format);
        const cacheControl = this.getCacheControl(config.type, config.cacheTTL);
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: cacheControl,
            ...this.cdnConfig.headers,
            Metadata: {
                originalFormat: format,
                optimized: 'true',
                timestamp: Date.now().toString()
            }
        });
        await this.s3Client.send(command);
    }
    generateSrcSet(asset) {
        if (!asset.variants || asset.variants.length === 0) {
            return asset.cdnUrl;
        }
        const srcSetEntries = asset.variants.map(variant => {
            const width = variant.dimensions?.width;
            return `${variant.cdnUrl} ${width}w`;
        });
        return srcSetEntries.join(', ');
    }
    generatePictureElement(asset, alt = '') {
        const webpVariants = asset.variants?.filter(v => v.format === 'webp') || [];
        const avifVariants = asset.variants?.filter(v => v.format === 'avif') || [];
        let pictureHtml = '<picture>';
        if (avifVariants.length > 0) {
            const avifSrcSet = avifVariants.map(v => `${v.cdnUrl} ${v.dimensions?.width}w`).join(', ');
            pictureHtml += `<source srcset="${avifSrcSet}" type="image/avif">`;
        }
        if (webpVariants.length > 0) {
            const webpSrcSet = webpVariants.map(v => `${v.cdnUrl} ${v.dimensions?.width}w`).join(', ');
            pictureHtml += `<source srcset="${webpSrcSet}" type="image/webp">`;
        }
        pictureHtml += `<img src="${asset.cdnUrl}" alt="${alt}" loading="lazy">`;
        pictureHtml += '</picture>';
        return pictureHtml;
    }
    async invalidateCache(paths) {
        if (!this.cdnConfig.distributionId) {
            logger_1.logger.warn('CloudFront distribution ID not configured');
            return;
        }
        const command = new client_cloudfront_1.CreateInvalidationCommand({
            DistributionId: this.cdnConfig.distributionId,
            InvalidationBatch: {
                Paths: {
                    Quantity: paths.length,
                    Items: paths.map(path => path.startsWith('/') ? path : `/${path}`)
                },
                CallerReference: Date.now().toString()
            }
        });
        try {
            await this.cloudFrontClient.send(command);
            logger_1.logger.info('CDN cache invalidated', { paths });
        }
        catch (error) {
            logger_1.logger.error('CDN cache invalidation failed', error);
        }
    }
    generateAssetId(name, content) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(name);
        hash.update(typeof content === 'string' ? content : content.toString());
        return hash.digest('hex').substring(0, 16);
    }
    generateS3Key(assetId, format) {
        const date = new Date().toISOString().split('T')[0];
        return `assets/${date}/${assetId}.${format}`;
    }
    generateETag(buffer) {
        return (0, crypto_1.createHash)('md5').update(buffer).digest('hex');
    }
    selectOptimalFormat(originalFormat) {
        if (originalFormat === 'png') {
            return ImageFormat.WEBP;
        }
        return ImageFormat.WEBP;
    }
    getOptimalQuality(format) {
        switch (format) {
            case ImageFormat.WEBP:
                return 85;
            case ImageFormat.AVIF:
                return 80;
            case ImageFormat.JPEG:
                return 85;
            case ImageFormat.PNG:
                return 90;
            default:
                return 85;
        }
    }
    getContentType(format) {
        const contentTypes = {
            webp: 'image/webp',
            avif: 'image/avif',
            jpeg: 'image/jpeg',
            jpg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            pdf: 'application/pdf',
            mp4: 'video/mp4',
            mp3: 'audio/mpeg',
            wav: 'audio/wav'
        };
        return contentTypes[format.toLowerCase()] || 'application/octet-stream';
    }
    getCacheControl(assetType, customTTL) {
        if (customTTL) {
            return `public, max-age=${customTTL}, immutable`;
        }
        const ttl = this.cdnConfig.cacheBehaviors[assetType]?.TTL || 3600;
        return `public, max-age=${ttl}, immutable`;
    }
    async getCachedAsset(assetId) {
        try {
            return await PerformanceCacheService_1.performanceCacheService.get(`asset:${assetId}`);
        }
        catch (error) {
            return null;
        }
    }
    async cacheAsset(assetId, asset) {
        try {
            await PerformanceCacheService_1.performanceCacheService.set(`asset:${assetId}`, asset, 86400);
        }
        catch (error) {
            logger_1.logger.error('Failed to cache asset', error);
        }
    }
    async cleanup() {
        this.processingQueue.clear();
        logger_1.logger.info('Asset optimization service cleaned up');
    }
}
exports.AssetOptimizationService = AssetOptimizationService;
exports.assetOptimizationService = new AssetOptimizationService();
exports.AssetUtils = {
    getAssetType(filename) {
        const ext = path_1.default.extname(filename).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'].includes(ext)) {
            return AssetType.IMAGE;
        }
        if (['.mp4', '.avi', '.mov', '.webm', '.mkv'].includes(ext)) {
            return AssetType.VIDEO;
        }
        if (['.mp3', '.wav', '.ogg', '.aac', '.flac'].includes(ext)) {
            return AssetType.AUDIO;
        }
        if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) {
            return AssetType.DOCUMENT;
        }
        return AssetType.STATIC;
    },
    createResponsiveImageConfig(quality = 85) {
        return {
            type: AssetType.IMAGE,
            quality,
            format: ImageFormat.WEBP,
            responsive: true,
            compression: true,
            cacheTTL: 31536000
        };
    },
    createStandardImageConfig(maxSize) {
        return {
            type: AssetType.IMAGE,
            maxSize,
            quality: 85,
            format: ImageFormat.WEBP,
            compression: true,
            cacheTTL: 31536000
        };
    }
};
exports.default = AssetOptimizationService;
