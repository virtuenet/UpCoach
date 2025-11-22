'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Script from 'next/script';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export default function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) {
        console.warn('Google Analytics Measurement ID not found');
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx(Script, { strategy: "afterInteractive", src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}` }), _jsx(Script, { id: "google-analytics", strategy: "afterInteractive", dangerouslySetInnerHTML: {
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
                } })] }));
}
//# sourceMappingURL=GoogleAnalytics.js.map