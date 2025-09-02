import i18n from 'i18n';
export default i18n;
export declare const supportedLanguages: {
    code: string;
    name: string;
    nativeName: string;
    direction: string;
}[];
export declare function getLanguageInfo(code: string): {
    code: string;
    name: string;
    nativeName: string;
    direction: string;
};
export declare function isValidLanguage(code: string): boolean;
//# sourceMappingURL=i18n.d.ts.map