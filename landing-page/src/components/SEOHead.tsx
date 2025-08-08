import Head from "next/head";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  jsonLd?: object;
}

export default function SEOHead({
  title = "UpCoach - AI-Powered Personal Coaching Platform",
  description = "Transform your professional development with UpCoach. Get personalized AI coaching, smart task management, mood tracking, and progress reports to achieve your goals faster.",
  keywords = "AI coaching, personal development, habit tracking, voice journaling, productivity app, goal setting, progress tracking, mental wellness, professional growth, AI-powered coaching",
  ogImage = "/og-image.png",
  ogType = "website",
  canonicalUrl,
  jsonLd,
}: SEOHeadProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://upcoach.ai";
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "UpCoach",
    applicationCategory: "HealthApplication",
    operatingSystem: "iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to start with premium features",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "10000",
      bestRating: "5",
      worstRating: "1",
    },
    description: description,
    screenshot: ogImage,
    author: {
      "@type": "Organization",
      name: "UpCoach Inc.",
      url: siteUrl,
    },
  };

  const structuredData = jsonLd || defaultJsonLd;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="UpCoach Inc." />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5"
      />

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="UpCoach" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:site" content="@upcoachapp" />
      <meta name="twitter:creator" content="@upcoachapp" />

      {/* Apple App Store Meta Tags */}
      <meta name="apple-itunes-app" content="app-id=YOUR_APP_ID" />

      {/* Google Play Store Meta Tags */}
      <meta name="google-play-app" content="app-id=com.upcoach.app" />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#6366F1" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}
