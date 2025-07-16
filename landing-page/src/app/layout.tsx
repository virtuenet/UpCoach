import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'UpCoach - AI-Powered Personal Coaching',
    template: '%s | UpCoach',
  },
  description: 'Transform your professional development with UpCoach, the AI-powered coaching platform that provides personalized guidance, smart task management, and progress tracking.',
  keywords: ['AI coaching', 'personal development', 'productivity', 'task management', 'goal setting', 'professional growth'],
  authors: [{ name: 'UpCoach Team' }],
  creator: 'UpCoach',
  publisher: 'UpCoach',
  metadataBase: new URL('https://upcoach.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'UpCoach - AI-Powered Personal Coaching',
    description: 'Transform your professional development with UpCoach, the AI-powered coaching platform.',
    siteName: 'UpCoach',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'UpCoach - AI-Powered Personal Coaching',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UpCoach - AI-Powered Personal Coaching',
    description: 'Transform your professional development with UpCoach, the AI-powered coaching platform.',
    images: ['/og-image.jpg'],
    creator: '@upcoach',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="__next">
          {children}
        </div>
      </body>
    </html>
  );
} 