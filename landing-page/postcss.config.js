module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === "production"
      ? {
          cssnano: {
            preset: [
              "default",
              {
                discardComments: {
                  removeAll: true,
                },
                minifyFontValues: {
                  removeQuotes: false,
                },
                normalizeWhitespace: true,
                colormin: true,
                minifySelectors: true,
              },
            ],
          },
        }
      : {}),
  },
};
