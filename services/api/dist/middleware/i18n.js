"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nMiddleware = i18nMiddleware;
exports.getLocale = getLocale;
exports.setLocale = setLocale;
exports.translate = translate;
const tslib_1 = require("tslib");
const i18n_1 = tslib_1.__importStar(require("../config/i18n"));
function i18nMiddleware(req, _res, next) {
    let locale = req.query.lang ||
        req.cookies?.locale ||
        req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
        'en';
    if (!(0, i18n_1.isValidLanguage)(locale)) {
        locale = 'en';
    }
    i18n_1.default.setLocale(locale);
    _res.locals.locale = locale;
    _res.locals.__ = _res.__ = (phrase, ...replace) => {
        return i18n_1.default.__(phrase, ...replace);
    };
    _res.locals.__n = _res.__n = (singular, plural, count) => {
        return i18n_1.default.__n(singular, plural, count);
    };
    _res.cookie('locale', locale, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    });
    _res.setHeader('Content-Language', locale);
    next();
}
function getLocale(req) {
    return i18n_1.default.getLocale();
}
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
function translate(key, locale = 'en', ...args) {
    const originalLocale = i18n_1.default.getLocale();
    i18n_1.default.setLocale(locale);
    const translation = i18n_1.default.__(key, ...args);
    i18n_1.default.setLocale(originalLocale);
    return translation;
}
