import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { config } from '../config/environment';

interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  staticPaths: string[];
  maxAge: {
    images: number;
    css: number;
    js: number;
    fonts: number;
    default: number;
  };
}

const cdnConfig: CDNConfig = {
  enabled: config.cdn?.enabled || process.env.NODE_ENV === 'production',
  baseUrl: config.cdn?.url || process.env.CDN_URL || 'https://cdn.upcoach.ai',
  staticPaths: ['/images', '/css', '/js', '/fonts', '/media'],
  maxAge: {
    images: 31536000, // 1 year
    css: 31536000, // 1 year
    js: 31536000, // 1 year
    fonts: 31536000, // 1 year
    default: 86400, // 1 day
  },
};

// CDN URL rewriter middleware
export const cdnMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!cdnConfig.enabled) {
    return next();
  }

  // Add CDN helper to response locals
  _res.locals.cdn = (path: string): string => {
    if (!path) return '';

    // Check if path should use CDN
    const shouldUseCDN = cdnConfig.staticPaths.some(staticPath => path.startsWith(staticPath));

    if (shouldUseCDN) {
      // Remove leading slash and append to CDN URL
      return `${cdnConfig.baseUrl}${path}`;
    }

    return path;
  };

  // Override _res.json to rewrite URLs in JSON responses
  const originalJson = _res.json.bind(_res);
  _res.json = function (data: any) {
    if (cdnConfig.enabled && data) {
      data = rewriteUrls(data);
    }
    return originalJson(data);
  };

  next();
};

// Static file caching headers
export const staticCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ext = path.extname(req.path).toLowerCase();
  let maxAge = cdnConfig.maxAge.default;

  switch (ext) {
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.webp':
    case '.svg':
      maxAge = cdnConfig.maxAge.images;
      break;
    case '.css':
      maxAge = cdnConfig.maxAge.css;
      break;
    case '.js':
      maxAge = cdnConfig.maxAge.js;
      break;
    case '.woff':
    case '.woff2':
    case '.ttf':
    case '.eot':
      maxAge = cdnConfig.maxAge.fonts;
      break;
  }

  // Set cache headers
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Add ETag support
  res.setHeader('ETag', `"${req.path}-${Date.now()}"`);

  next();
};

// Recursive URL rewriter for JSON responses
function rewriteUrls(obj: any): any {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    // Check if string is a URL that should use CDN
    if (obj.startsWith('/') && cdnConfig.staticPaths.some(path => obj.startsWith(path))) {
      return `${cdnConfig.baseUrl}${obj}`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => rewriteUrls(item));
  }

  if (typeof obj === 'object') {
    const rewritten: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Special handling for common URL fields
        if (['url', 'imageUrl', 'thumbnailUrl', 'avatarUrl', 'featuredImage'].includes(key)) {
          rewritten[key] = rewriteUrls(obj[key]);
        } else {
          rewritten[key] = rewriteUrls(obj[key]);
        }
      }
    }
    return rewritten;
  }

  return obj;
}

// Image optimization middleware
export const imageOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Parse query parameters for image transformation
  const { w, h, q, format } = req.query;

  if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    // Add image transformation headers for CDN
    const transforms: string[] = [];

    if (w) transforms.push(`w_${w}`);
    if (h) transforms.push(`h_${h}`);
    if (q) transforms.push(`q_${q}`);
    if (format) transforms.push(`f_${format}`);

    if (transforms.length > 0) {
      res.setHeader('X-Image-Transform', transforms.join(','));
    }

    // Add responsive image hints
    res.setHeader('Accept-CH', 'DPR, Width, Viewport-Width');
    res.setHeader('Vary', 'Accept, DPR, Width');
  }

  next();
};

// Preload critical resources
export const preloadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add preload headers for critical resources
  const preloads: string[] = [];

  // Preload fonts
  preloads.push(
    `<${cdnConfig.baseUrl}/fonts/Inter-Regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin`
  );
  preloads.push(
    `<${cdnConfig.baseUrl}/fonts/Inter-Bold.woff2>; rel=preload; as=font; type=font/woff2; crossorigin`
  );

  // Preload critical CSS
  preloads.push(`<${cdnConfig.baseUrl}/css/critical.css>; rel=preload; as=style`);

  // Preload critical JS
  preloads.push(`<${cdnConfig.baseUrl}/js/app.js>; rel=preload; as=script`);

  if (preloads.length > 0) {
    res.setHeader('Link', preloads.join(', '));
  }

  next();
};

// Service Worker for offline support
export const serviceWorkerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/service-worker.js') {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
};
