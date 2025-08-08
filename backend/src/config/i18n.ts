import i18n from 'i18n';
import path from 'path';

// Configure i18n
i18n.configure({
  locales: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar'],
  defaultLocale: 'en',
  directory: path.join(__dirname, '../locales'),
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

export default i18n;

// Language metadata
export const supportedLanguages = [
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
export function getLanguageInfo(code: string) {
  return supportedLanguages.find(lang => lang.code === code) || supportedLanguages[0];
}

// Validate language code
export function isValidLanguage(code: string): boolean {
  return supportedLanguages.some(lang => lang.code === code);
}