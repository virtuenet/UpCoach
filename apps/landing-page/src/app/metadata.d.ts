import { Metadata } from 'next';
export declare const siteConfig: {
    name: string;
    description: string;
    url: string;
    ogImage: string;
    links: {
        twitter: string;
        github: string;
        appStore: string;
        playStore: string;
    };
};
export declare const defaultMetadata: Metadata;
export declare function generatePageMetadata(title: string, description: string, path?: string): Metadata;
//# sourceMappingURL=metadata.d.ts.map