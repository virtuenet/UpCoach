import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import GoogleAnalytics from '../components/GoogleAnalytics';
import Header from '../components/Header';
import StructuredData from '../components/StructuredData';
import WebVitals from '../components/WebVitals';

import { defaultMetadata } from './metadata';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <head>
          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://api.clerk.com" />

          {/* DNS Prefetch for performance */}
          <link rel="dns-prefetch" href="https://api.clerk.com" />
          <link rel="dns-prefetch" href="https://supabase.co" />

          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="theme-color" content="#3b82f6" />

          {/* Critical CSS for above-the-fold content */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              /* Critical CSS for initial paint */
              body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .min-h-screen { min-height: 100vh; }
              .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `,
            }}
          />
        </head>
        <body className={`${inter.className} antialiased`}>
          <GoogleAnalytics />
          <StructuredData />
          <WebVitals />
          <div id="__next">
            <Header />
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
