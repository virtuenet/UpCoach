import { Metadata } from "next";

export const siteConfig = {
  name: "UpCoach",
  description:
    "Transform your professional development with UpCoach. Get personalized AI coaching, smart task management, mood tracking, and progress reports to achieve your goals faster.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://upcoach.ai",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/upcoachapp",
    github: "https://github.com/upcoach",
    appStore: "https://apps.apple.com/app/upcoach",
    playStore: "https://play.google.com/store/apps/details?id=com.upcoach.app",
  },
};

export const defaultMetadata: Metadata = {
  title: {
    default: "UpCoach - AI-Powered Personal Coaching Platform",
    template: "%s | UpCoach",
  },
  description: siteConfig.description,
  keywords: [
    "AI coaching",
    "personal development",
    "habit tracking",
    "voice journaling",
    "productivity app",
    "goal setting",
    "progress tracking",
    "mental wellness",
    "professional growth",
    "AI-powered coaching",
    "personal coach app",
    "self improvement app",
    "habit formation",
    "daily habits tracker",
  ],
  authors: [
    {
      name: "UpCoach Team",
      url: siteConfig.url,
    },
  ],
  creator: "UpCoach Inc.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "UpCoach - AI-Powered Personal Coaching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@upcoachapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteConfig.url,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  category: "technology",
  classification: "Productivity & Self-Improvement",
  applicationName: "UpCoach",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteConfig.url),
  assets: ["/assets"],
  archives: ["/blog/archive"],
};

// Page-specific metadata generators
export function generatePageMetadata(
  title: string,
  description: string,
  path: string = "/",
): Metadata {
  const url = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}
