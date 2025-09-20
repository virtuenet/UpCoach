/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  output: 'standalone', // Enable for Docker production builds
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  trailingSlash: true,
  // Remove experimental CSS optimization entirely
  experimental: {
    optimizeCss: false, // Disable CSS optimization to fix unclosed bracket error
  },
  webpack: (config, { isServer }) => {
    // Disable ALL CSS optimization to fix build issues
    config.optimization.minimize = false;
    config.optimization.minimizer = [];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upcoach.ai',
        port: '',
        pathname: '/**',
      },
    ],
    // Legacy domains configuration for compatibility
    domains: ['images.unsplash.com', 'via.placeholder.com', 'upcoach.ai'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false, // Re-enable image optimization
    minimumCacheTTL: 60, // Cache images for 60 seconds
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Redirects and headers are not supported with static export
  // They need to be configured at the hosting level (e.g., Vercel, Netlify)
};

module.exports = nextConfig;
