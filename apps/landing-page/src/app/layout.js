import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ClerkProvider } from '@clerk/nextjs';
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
export const metadata = defaultMetadata;
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};
export default function RootLayout({ children }) {
    return (_jsx(ClerkProvider, { children: _jsxs("html", { lang: "en", className: "scroll-smooth", children: [_jsxs("head", { children: [_jsx("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }), _jsx("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }), _jsx("link", { rel: "preconnect", href: "https://api.clerk.com" }), _jsx("link", { rel: "dns-prefetch", href: "https://api.clerk.com" }), _jsx("link", { rel: "dns-prefetch", href: "https://supabase.co" }), _jsx("link", { rel: "icon", href: "/favicon.ico" }), _jsx("link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }), _jsx("link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" }), _jsx("link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" }), _jsx("link", { rel: "manifest", href: "/site.webmanifest" }), _jsx("meta", { name: "theme-color", content: "#3b82f6" }), _jsx("style", { dangerouslySetInnerHTML: {
                                __html: `
              /* Critical CSS for initial paint */
              body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .min-h-screen { min-height: 100vh; }
              .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `,
                            } })] }), _jsxs("body", { className: `${inter.className} antialiased`, children: [_jsx(GoogleAnalytics, {}), _jsx(StructuredData, {}), _jsx(WebVitals, {}), _jsxs("div", { id: "__next", children: [_jsx(Header, {}), children] })] })] }) }));
}
//# sourceMappingURL=layout.js.map