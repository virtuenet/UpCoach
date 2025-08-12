// SEO Configuration and Optimization
export const seoConfig = {
  // Site-wide defaults
  default: {
    title: 'UpCoach - AI-Powered Personal Coaching Platform',
    titleTemplate: '%s | UpCoach',
    description: 'Transform your life with UpCoach\'s AI-powered coaching platform. Track habits, set goals, journal your thoughts, and get personalized insights to achieve your full potential.',
    canonical: 'https://upcoach.ai',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://upcoach.ai',
      site_name: 'UpCoach',
      images: [
        {
          url: 'https://upcoach.ai/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'UpCoach - AI-Powered Personal Coaching',
        },
      ],
    },
    twitter: {
      handle: '@upcoach',
      site: '@upcoach',
      cardType: 'summary_large_image',
    },
    additionalMetaTags: [
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'robots',
        content: 'index, follow, max-image-preview:large',
      },
      {
        name: 'googlebot',
        content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      },
      {
        name: 'theme-color',
        content: '#4F46E5',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
    ],
    additionalLinkTags: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'dns-prefetch',
        href: 'https://www.google-analytics.com',
      },
    ],
  },

  // Page-specific SEO
  pages: {
    home: {
      title: 'AI-Powered Personal Coaching Platform',
      description: 'Transform your life with personalized AI coaching. Track habits, achieve goals, and unlock your potential with UpCoach\'s intelligent coaching platform.',
      keywords: 'ai coaching, personal development, habit tracking, goal setting, productivity app, life coach app, wellness platform',
    },
    pricing: {
      title: 'Pricing & Plans - Start Your Transformation',
      description: 'Choose the perfect UpCoach plan for your journey. Free trial available. No credit card required. Cancel anytime.',
      keywords: 'upcoach pricing, coaching app cost, ai coach subscription, personal development app pricing',
    },
    features: {
      title: 'Features - Everything You Need to Succeed',
      description: 'Discover UpCoach\'s powerful features: AI coaching, habit tracking, voice journaling, progress photos, goal setting, and personalized insights.',
      keywords: 'ai coaching features, habit tracker, voice journal app, progress tracking, goal achievement tools',
    },
    about: {
      title: 'About Us - Our Mission to Empower You',
      description: 'Learn about UpCoach\'s mission to democratize personal coaching through AI technology. Meet our team and discover our story.',
      keywords: 'about upcoach, coaching platform story, ai coaching company, personal development mission',
    },
    contact: {
      title: 'Contact Us - Get in Touch',
      description: 'Have questions about UpCoach? Contact our support team for help with your coaching journey.',
      keywords: 'contact upcoach, coaching support, customer service, help center',
    },
    blog: {
      title: 'Blog - Insights for Personal Growth',
      description: 'Expert advice, tips, and strategies for personal development, productivity, and achieving your goals with AI coaching.',
      keywords: 'personal development blog, coaching tips, productivity advice, goal achievement strategies',
    },
  },

  // Structured data schemas
  schemas: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'UpCoach',
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
        contactType: 'customer service',
        availableLanguage: ['English', 'Spanish'],
      },
    },
    mobileApp: {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'UpCoach',
      operatingSystem: 'iOS, Android',
      applicationCategory: 'HealthApplication',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '10000',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    faq: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is UpCoach?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'UpCoach is an AI-powered personal coaching platform that helps you track habits, achieve goals, and transform your life through personalized insights and guidance.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does UpCoach cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'UpCoach offers a free plan with basic features, a Pro plan at $9.99/month, and an annual plan at $99/year. All paid plans include a 7-day free trial.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is UpCoach available on mobile?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, UpCoach is available as a mobile app for both iOS and Android devices, as well as a web application.',
          },
        },
      ],
    },
  },

  // Performance optimization settings
  performance: {
    // Image optimization
    images: {
      formats: ['webp', 'avif'],
      sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      loader: 'default',
      domains: ['upcoach.ai', 'cdn.upcoach.ai'],
    },

    // Resource hints
    resourceHints: {
      dns: [
        'https://fonts.googleapis.com',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
      ],
      preconnect: [
        'https://fonts.gstatic.com',
        'https://cdn.upcoach.ai',
      ],
      prefetch: [
        '/api/config',
        '/api/experiments',
      ],
    },

    // Critical CSS
    criticalCSS: {
      enable: true,
      inline: true,
      minify: true,
    },

    // Bundle optimization
    bundleOptimization: {
      splitChunks: true,
      minify: true,
      treeshake: true,
      compression: 'gzip',
    },
  },

  // Sitemap configuration
  sitemap: {
    hostname: 'https://upcoach.ai',
    generateRobotsTxt: true,
    exclude: ['/admin/*', '/api/*', '/auth/*'],
    changefreq: {
      '/': 'daily',
      '/pricing': 'weekly',
      '/features': 'weekly',
      '/blog/*': 'weekly',
      '/about': 'monthly',
      '/contact': 'monthly',
    },
    priority: {
      '/': 1.0,
      '/pricing': 0.9,
      '/features': 0.9,
      '/blog': 0.8,
      '/blog/*': 0.7,
      '/about': 0.6,
      '/contact': 0.5,
    },
  },

  // Internationalization
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'pt'],
    defaultLocale: 'en',
    localizedUrls: {
      en: 'https://upcoach.ai',
      es: 'https://es.upcoach.ai',
      fr: 'https://fr.upcoach.ai',
      de: 'https://de.upcoach.ai',
      pt: 'https://pt.upcoach.ai',
    },
  },
};

// Helper functions for SEO
export function generateMetaTags(page: string) {
  const pageConfig = seoConfig.pages[page as keyof typeof seoConfig.pages];
  const defaultConfig = seoConfig.default;

  return {
    title: pageConfig?.title || defaultConfig.title,
    description: pageConfig?.description || defaultConfig.description,
    keywords: pageConfig?.keywords || '',
    openGraph: {
      ...defaultConfig.openGraph,
      title: pageConfig?.title || defaultConfig.title,
      description: pageConfig?.description || defaultConfig.description,
    },
    twitter: {
      ...defaultConfig.twitter,
      title: pageConfig?.title || defaultConfig.title,
      description: pageConfig?.description || defaultConfig.description,
    },
  };
}

export function generateStructuredData(type: keyof typeof seoConfig.schemas) {
  return JSON.stringify(seoConfig.schemas[type]);
}

export function generateCanonicalUrl(path: string) {
  return `${seoConfig.default.canonical}${path}`;
}

export function generateAlternateUrls(path: string) {
  return Object.entries(seoConfig.i18n.localizedUrls).map(([locale, domain]) => ({
    hrefLang: locale,
    href: `${domain}${path}`,
  }));
}