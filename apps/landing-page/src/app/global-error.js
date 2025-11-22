'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function GlobalError({ error: _error, reset, }) {
    return (_jsx("html", { lang: "en", children: _jsx("body", { children: _jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Something went wrong!" }), _jsx("p", { className: "text-gray-600 mb-8", children: "We apologize for the inconvenience." }), _jsx("button", { onClick: () => reset(), className: "px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors", children: "Try again" })] }) }) }) }));
}
//# sourceMappingURL=global-error.js.map