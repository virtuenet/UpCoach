export declare const seoConfig: {
    default: {
        title: string;
        titleTemplate: string;
        description: string;
        canonical: string;
        openGraph: {
            type: string;
            locale: string;
            url: string;
            site_name: string;
            images: {
                url: string;
                width: number;
                height: number;
                alt: string;
            }[];
        };
        twitter: {
            handle: string;
            site: string;
            cardType: string;
        };
        additionalMetaTags: {
            name: string;
            content: string;
        }[];
        additionalLinkTags: ({
            rel: string;
            href: string;
            sizes?: undefined;
        } | {
            rel: string;
            href: string;
            sizes: string;
        })[];
    };
    pages: {
        home: {
            title: string;
            description: string;
            keywords: string;
        };
        pricing: {
            title: string;
            description: string;
            keywords: string;
        };
        features: {
            title: string;
            description: string;
            keywords: string;
        };
        about: {
            title: string;
            description: string;
            keywords: string;
        };
        contact: {
            title: string;
            description: string;
            keywords: string;
        };
        blog: {
            title: string;
            description: string;
            keywords: string;
        };
    };
    schemas: {
        organization: {
            '@context': string;
            '@type': string;
            name: string;
            url: string;
            logo: string;
            sameAs: string[];
            contactPoint: {
                '@type': string;
                telephone: string;
                contactType: string;
                availableLanguage: string[];
            };
        };
        mobileApp: {
            '@context': string;
            '@type': string;
            name: string;
            operatingSystem: string;
            applicationCategory: string;
            aggregateRating: {
                '@type': string;
                ratingValue: string;
                ratingCount: string;
            };
            offers: {
                '@type': string;
                price: string;
                priceCurrency: string;
            };
        };
        faq: {
            '@context': string;
            '@type': string;
            mainEntity: {
                '@type': string;
                name: string;
                acceptedAnswer: {
                    '@type': string;
                    text: string;
                };
            }[];
        };
    };
    performance: {
        images: {
            formats: string[];
            sizes: number[];
            deviceSizes: number[];
            loader: string;
            domains: string[];
        };
        resourceHints: {
            dns: string[];
            preconnect: string[];
            prefetch: string[];
        };
        criticalCSS: {
            enable: boolean;
            inline: boolean;
            minify: boolean;
        };
        bundleOptimization: {
            splitChunks: boolean;
            minify: boolean;
            treeshake: boolean;
            compression: string;
        };
    };
    sitemap: {
        hostname: string;
        generateRobotsTxt: boolean;
        exclude: string[];
        changefreq: {
            '/': string;
            '/pricing': string;
            '/features': string;
            '/blog/*': string;
            '/about': string;
            '/contact': string;
        };
        priority: {
            '/': number;
            '/pricing': number;
            '/features': number;
            '/blog': number;
            '/blog/*': number;
            '/about': number;
            '/contact': number;
        };
    };
    i18n: {
        locales: string[];
        defaultLocale: string;
        localizedUrls: {
            en: string;
            es: string;
            fr: string;
            de: string;
            pt: string;
        };
    };
};
export declare function generateMetaTags(page: string): {
    title: string;
    description: string;
    keywords: string;
    openGraph: {
        title: string;
        description: string;
        type: string;
        locale: string;
        url: string;
        site_name: string;
        images: {
            url: string;
            width: number;
            height: number;
            alt: string;
        }[];
    };
    twitter: {
        title: string;
        description: string;
        handle: string;
        site: string;
        cardType: string;
    };
};
export declare function generateStructuredData(type: keyof typeof seoConfig.schemas): string;
export declare function generateCanonicalUrl(path: string): string;
export declare function generateAlternateUrls(path: string): {
    hrefLang: string;
    href: string;
}[];
//# sourceMappingURL=seo.d.ts.map