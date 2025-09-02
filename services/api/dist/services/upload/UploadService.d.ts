import multer from 'multer';
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
declare class UploadService {
    private uploadDir;
    private baseUrl;
    constructor();
    private getStorage;
    private getSubdirectory;
    getMulter(options?: multer.Options): multer.Multer;
    processImage(filePath: string, options: ImageTransformOptions): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
    getFileUrl(filename: string, subdirectory: string): string;
    createThumbnail(imagePath: string, width?: number, height?: number): Promise<string>;
    getFileMetadata(filePath: string): Promise<any>;
    uploadFile(file: Express.Multer.File, options?: any): Promise<any>;
}
declare const _default: UploadService;
export default _default;
//# sourceMappingURL=UploadService.d.ts.map