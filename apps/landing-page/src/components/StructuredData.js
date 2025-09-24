import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
export default function StructuredData() {
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'UpCoach',
        description: 'AI-powered personal coaching platform for professional development',
        url: 'https://upcoach.ai',
        logo: 'https://upcoach.ai/logo.png',
        sameAs: [
            'https://twitter.com/upcoach',
            'https://facebook.com/upcoach',
            'https://linkedin.com/company/upcoach',
            'https://instagram.com/upcoach',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-123-4567',
            contactType: 'customer support',
            email: 'support@upcoach.ai',
            availableLanguage: ['English'],
        },
    };
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'UpCoach',
        url: 'https://upcoach.ai',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://upcoach.ai/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };
    const mobileAppSchema = {
        '@context': 'https://schema.org',
        '@type': 'MobileApplication',
        name: 'UpCoach - AI Personal Coach',
        operatingSystem: 'iOS, Android',
        applicationCategory: 'HealthApplication',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '2847',
        },
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            priceValidUntil: '2025-12-31',
            availability: 'https://schema.org/InStock',
        },
        description: 'Transform your life with AI-powered coaching. Voice journaling, habit tracking, and personalized insights.',
        screenshot: [
            'https://upcoach.ai/screenshots/voice-journal.png',
            'https://upcoach.ai/screenshots/habit-tracker.png',
            'https://upcoach.ai/screenshots/progress-photos.png',
        ],
        softwareVersion: '2.0.0',
        datePublished: '2024-01-01',
        dateModified: '2024-12-01',
        provider: {
            '@type': 'Organization',
            name: 'UpCoach Inc.',
        },
    };
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is UpCoach?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'UpCoach is an AI-powered personal coaching platform that helps you transform your professional development through voice journaling, habit tracking, progress photos, and personalized AI insights.',
                },
            },
            {
                '@type': 'Question',
                name: 'How much does UpCoach cost?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'UpCoach offers a free 7-day trial. After that, plans start at $9.99/month for Basic, $19.99/month for Pro, and custom pricing for Enterprise teams.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is UpCoach available on both iOS and Android?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, UpCoach is available on both iOS and Android devices. You can download it from the Apple App Store or Google Play Store.',
                },
            },
            {
                '@type': 'Question',
                name: 'Does UpCoach work offline?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: "Yes, UpCoach features an offline-first design. All core features work without an internet connection, and your data automatically syncs when you're back online.",
                },
            },
            {
                '@type': 'Question',
                name: 'How does the AI coaching work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Our AI coach learns from your patterns, habits, and journal entries to provide personalized recommendations, insights, and motivational support tailored to your unique journey.',
                },
            },
        ],
    };
    return (_jsxs(_Fragment, { children: [_jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(organizationSchema) } }), _jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(websiteSchema) } }), _jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(mobileAppSchema) } }), _jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(faqSchema) } })] }));
}
//# sourceMappingURL=StructuredData.js.map