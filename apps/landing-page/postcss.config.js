module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Remove cssnano from PostCSS pipeline to avoid conflicts with Next.js built-in CSS optimization
    // Next.js handles CSS minification internally through SWC
    ...(process.env.NODE_ENV === 'production' ? {} : {}),
  },
};
