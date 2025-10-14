"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWorkerMiddleware = exports.preloadMiddleware = exports.imageOptimizationMiddleware = exports.staticCacheMiddleware = exports.cdnMiddleware = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const environment_1 = require("../config/environment");
const cdnConfig = {
    enabled: environment_1.config.cdn?.enabled || process.env.NODE_ENV === 'production',
    baseUrl: environment_1.config.cdn?.url || process.env.CDN_URL || 'https://cdn.upcoach.ai',
    staticPaths: ['/images', '/css', '/js', '/fonts', '/media'],
    maxAge: {
        images: 31536000,
        css: 31536000,
        js: 31536000,
        fonts: 31536000,
        default: 86400,
    },
};
const cdnMiddleware = (req, _res, next) => {
    if (!cdnConfig.enabled) {
        return next();
    }
    _res.locals.cdn = (path) => {
        if (!path)
            return '';
        const shouldUseCDN = cdnConfig.staticPaths.some(staticPath => path.startsWith(staticPath));
        if (shouldUseCDN) {
            return `${cdnConfig.baseUrl}${path}`;
        }
        return path;
    };
    const originalJson = _res.json.bind(_res);
    _res.json = function (data) {
        if (cdnConfig.enabled && data) {
            data = rewriteUrls(data);
        }
        return originalJson(data);
    };
    next();
};
exports.cdnMiddleware = cdnMiddleware;
const staticCacheMiddleware = (req, res, next) => {
    const ext = path_1.default.extname(req.path).toLowerCase();
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
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('ETag', `"${req.path}-${Date.now()}"`);
    next();
};
exports.staticCacheMiddleware = staticCacheMiddleware;
function rewriteUrls(obj) {
    if (!obj)
        return obj;
    if (typeof obj === 'string') {
        if (obj.startsWith('/') && cdnConfig.staticPaths.some(path => obj.startsWith(path))) {
            return `${cdnConfig.baseUrl}${obj}`;
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => rewriteUrls(item));
    }
    if (typeof obj === 'object') {
        const rewritten = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (['url', 'imageUrl', 'thumbnailUrl', 'avatarUrl', 'featuredImage'].includes(key)) {
                    rewritten[key] = rewriteUrls(obj[key]);
                }
                else {
                    rewritten[key] = rewriteUrls(obj[key]);
                }
            }
        }
        return rewritten;
    }
    return obj;
}
const imageOptimizationMiddleware = (req, res, next) => {
    const { w, h, q, format } = req.query;
    if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const transforms = [];
        if (w)
            transforms.push(`w_${w}`);
        if (h)
            transforms.push(`h_${h}`);
        if (q)
            transforms.push(`q_${q}`);
        if (format)
            transforms.push(`f_${format}`);
        if (transforms.length > 0) {
            res.setHeader('X-Image-Transform', transforms.join(','));
        }
        res.setHeader('Accept-CH', 'DPR, Width, Viewport-Width');
        res.setHeader('Vary', 'Accept, DPR, Width');
    }
    next();
};
exports.imageOptimizationMiddleware = imageOptimizationMiddleware;
const preloadMiddleware = (req, res, next) => {
    const preloads = [];
    preloads.push(`<${cdnConfig.baseUrl}/fonts/Inter-Regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin`);
    preloads.push(`<${cdnConfig.baseUrl}/fonts/Inter-Bold.woff2>; rel=preload; as=font; type=font/woff2; crossorigin`);
    preloads.push(`<${cdnConfig.baseUrl}/css/critical.css>; rel=preload; as=style`);
    preloads.push(`<${cdnConfig.baseUrl}/js/app.js>; rel=preload; as=script`);
    if (preloads.length > 0) {
        res.setHeader('Link', preloads.join(', '));
    }
    next();
};
exports.preloadMiddleware = preloadMiddleware;
const serviceWorkerMiddleware = (req, res, next) => {
    if (req.path === '/service-worker.js') {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache');
    }
    next();
};
exports.serviceWorkerMiddleware = serviceWorkerMiddleware;
