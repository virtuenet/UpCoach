/**
 * Generate responsive image sizes for Next.js Image component
 */
export declare function generateImageSizes(viewportPercentage?: number): string;
/**
 * Generate blur data URL for placeholder
 */
export declare function generateBlurDataURL(imagePath: string): Promise<string>;
/**
 * Optimize image loading based on viewport
 */
export declare function getImagePriority(position: 'above-fold' | 'below-fold'): boolean;
/**
 * Get optimized image format based on browser support
 */
export declare function getOptimizedFormat(originalFormat: string): string;
/**
 * Preload critical images
 */
export declare function preloadImage(src: string, as?: 'image'): void;
/**
 * Lazy load images with Intersection Observer
 */
export declare function lazyLoadImages(): void;
//# sourceMappingURL=imageOptimization.d.ts.map