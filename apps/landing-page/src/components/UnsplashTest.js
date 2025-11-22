'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
/**
 * Test component to verify Unsplash images work with our Next.js configuration
 * This includes the specific image from the error message and a few others
 */
export default function UnsplashTest() {
    const testImages = [
        {
            id: 'original-error',
            src: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
            alt: 'Original error image - professional headshot',
            description: 'The exact image from the error message',
        },
        {
            id: 'general-test',
            src: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
            alt: 'Test image - larger version',
            description: 'Same image but larger size',
        },
        {
            id: 'different-image',
            src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            alt: 'Different headshot',
            description: 'Different Unsplash image for comparison',
        },
    ];
    return (_jsx("div", { className: "p-8 bg-gray-50 min-h-screen", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-8", children: "Unsplash Image Configuration Test" }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4", children: "Configuration Status" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsx("p", { children: "\u2705 Next.js version: 15.5.3" }), _jsx("p", { children: "\u2705 remotePatterns configured for images.unsplash.com" }), _jsx("p", { children: "\u2705 Modern Next.js image optimization enabled" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: testImages.map((image) => (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: image.description }), _jsx("div", { className: "relative mb-4", children: _jsx(Image, { src: image.src, alt: image.alt, width: image.id === 'original-error' ? 64 : image.id === 'general-test' ? 200 : 150, height: image.id === 'original-error' ? 64 : image.id === 'general-test' ? 200 : 150, className: "rounded-lg mx-auto", priority: image.id === 'original-error', onLoad: () => console.log(`✅ Successfully loaded: ${image.id}`), onError: (e) => console.error(`❌ Failed to load: ${image.id}`, e) }) }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("p", { className: "font-medium", children: "Image Details:" }), _jsxs("p", { className: "break-all", children: ["URL: ", image.src] }), _jsxs("p", { children: ["Size: ", image.id === 'original-error' ? '64x64' : image.id === 'general-test' ? '200x200' : '150x150'] })] })] }, image.id))) }), _jsxs("div", { className: "mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-800 mb-2", children: "Testing Instructions" }), _jsxs("ol", { className: "list-decimal list-inside text-blue-700 space-y-1", children: [_jsx("li", { children: "If all images load successfully, the configuration is working correctly" }), _jsx("li", { children: "Check the browser console for any load success/error messages" }), _jsx("li", { children: "If images fail to load, check the Next.js dev server output for errors" }), _jsx("li", { children: "Remember to remove this test component after verification" })] })] })] }) }));
}
//# sourceMappingURL=UnsplashTest.js.map