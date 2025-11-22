export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/dashboard/', '/_next/', '/static/'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                crawlDelay: 0,
            },
        ],
        sitemap: 'https://upcoach.ai/sitemap.xml',
    };
}
//# sourceMappingURL=robots.js.map