import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Head from 'next/head';
export default function SEOHead({ title = 'UpCoach - AI-Powered Personal Coaching Platform', description = 'Transform your professional development with UpCoach. Get personalized AI coaching, smart task management, mood tracking, and progress reports to achieve your goals faster.', keywords = 'AI coaching, personal development, habit tracking, voice journaling, productivity app, goal setting, progress tracking, mental wellness, professional growth, AI-powered coaching', ogImage = '/og-image.png', ogType = 'website', canonicalUrl, jsonLd, }) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://upcoach.ai';
    const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
    const defaultJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'UpCoach',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'iOS, Android',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free to start with premium features',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '10000',
            bestRating: '5',
            worstRating: '1',
        },
        description: description,
        screenshot: ogImage,
        author: {
            '@type': 'Organization',
            name: 'UpCoach Inc.',
            url: siteUrl,
        },
    };
    const structuredData = jsonLd || defaultJsonLd;
    return (_jsxs(Head, { children: [_jsx("title", { children: title }), _jsx("meta", { name: "description", content: description }), _jsx("meta", { name: "keywords", content: keywords }), _jsx("meta", { name: "author", content: "UpCoach Inc." }), _jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" }), _jsx("link", { rel: "canonical", href: fullCanonicalUrl }), _jsx("meta", { property: "og:title", content: title }), _jsx("meta", { property: "og:description", content: description }), _jsx("meta", { property: "og:type", content: ogType }), _jsx("meta", { property: "og:url", content: fullCanonicalUrl }), _jsx("meta", { property: "og:image", content: `${siteUrl}${ogImage}` }), _jsx("meta", { property: "og:image:width", content: "1200" }), _jsx("meta", { property: "og:image:height", content: "630" }), _jsx("meta", { property: "og:site_name", content: "UpCoach" }), _jsx("meta", { property: "og:locale", content: "en_US" }), _jsx("meta", { name: "twitter:card", content: "summary_large_image" }), _jsx("meta", { name: "twitter:title", content: title }), _jsx("meta", { name: "twitter:description", content: description }), _jsx("meta", { name: "twitter:image", content: `${siteUrl}${ogImage}` }), _jsx("meta", { name: "twitter:site", content: "@upcoachapp" }), _jsx("meta", { name: "twitter:creator", content: "@upcoachapp" }), _jsx("meta", { name: "apple-itunes-app", content: "app-id=YOUR_APP_ID" }), _jsx("meta", { name: "google-play-app", content: "app-id=com.upcoach.app" }), _jsx("meta", { name: "robots", content: "index, follow" }), _jsx("meta", { name: "googlebot", content: "index, follow" }), _jsx("meta", { name: "theme-color", content: "#6366F1" }), _jsx("meta", { name: "mobile-web-app-capable", content: "yes" }), _jsx("meta", { name: "apple-mobile-web-app-capable", content: "yes" }), _jsx("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }), _jsx("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }), _jsx("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }), _jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) } })] }));
}
//# sourceMappingURL=SEOHead.js.map