import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { auth } from '@clerk/nextjs/server';
// import { redirect } from 'next/navigation';
// Temporary workaround for redirect issue
const redirect = (url) => {
    if (typeof window !== 'undefined') {
        window.location.href = url;
    }
    else {
        // Server-side redirect fallback
        return Response.redirect(url);
    }
};
export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/');
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-8", children: "Welcome to Your Dashboard" }), _jsx("p", { className: "text-gray-600", children: "This is a protected page. Only authenticated users can see this content." }), _jsxs("div", { className: "mt-8 p-6 bg-white rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "User ID" }), _jsx("p", { className: "text-gray-700 font-mono", children: userId })] })] }) }));
}
//# sourceMappingURL=page.js.map