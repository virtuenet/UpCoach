"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedLanguages = void 0;
exports.getLanguageInfo = getLanguageInfo;
exports.isValidLanguage = isValidLanguage;
const i18n_1 = __importDefault(require("i18n"));
const path_1 = __importDefault(require("path"));
// Configure i18n
i18n_1.default.configure({
    locales: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar'],
    defaultLocale: 'en',
    directory: path_1.default.join(__dirname, '../locales'),
    objectNotation: true,
    updateFiles: false,
    syncFiles: false,
    autoReload: true,
    cookie: 'locale',
    queryParameter: 'lang',
    register: global,
    api: {
        __: 'translate',
        __n: 'translateN',
    },
});
exports.default = i18n_1.default;
// Language metadata
exports.supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
];
// Get language info
function getLanguageInfo(code) {
    return exports.supportedLanguages.find(lang => lang.code === code) || exports.supportedLanguages[0];
}
// Validate language code
function isValidLanguage(code) {
    return exports.supportedLanguages.some(lang => lang.code === code);
}
//# sourceMappingURL=i18n.js.map