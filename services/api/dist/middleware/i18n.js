"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nMiddleware = i18nMiddleware;
exports.getLocale = getLocale;
exports.setLocale = setLocale;
exports.translate = translate;
const i18n_1 = __importStar(require("../config/i18n"));
// import { logger } from '../utils/logger';
function i18nMiddleware(req, _res, next) {
    // Get language from multiple sources
    let locale = req.query.lang ||
        req.cookies?.locale ||
        req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
        'en';
    // Validate and fallback to default if invalid
    if (!(0, i18n_1.isValidLanguage)(locale)) {
        locale = 'en';
    }
    // Set locale for this request
    i18n_1.default.setLocale(locale);
    // Store locale in response locals for views
    _res.locals.locale = locale;
    _res.locals.__ = _res.__ = (phrase, ...replace) => {
        return i18n_1.default.__(phrase, ...replace);
    };
    _res.locals.__n = _res.__n = (singular, plural, count) => {
        return i18n_1.default.__n(singular, plural, count);
    };
    // Set locale cookie
    _res.cookie('locale', locale, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        sameSite: 'lax',
    });
    // Set content-language header
    _res.setHeader('Content-Language', locale);
    next();
}
// API to get current locale
function getLocale(req) {
    return i18n_1.default.getLocale();
}
// API to set locale
function setLocale(req, _res, locale) {
    if (!(0, i18n_1.isValidLanguage)(locale)) {
        return false;
    }
    i18n_1.default.setLocale(locale);
    _res.cookie('locale', locale, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    });
    return true;
}
// Helper to translate in services
function translate(key, locale = 'en', ...args) {
    const originalLocale = i18n_1.default.getLocale();
    i18n_1.default.setLocale(locale);
    const translation = i18n_1.default.__(key, ...args);
    i18n_1.default.setLocale(originalLocale);
    return translation;
}
//# sourceMappingURL=i18n.js.map