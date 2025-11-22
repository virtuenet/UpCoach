import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const isProd = mode === 'production';

  return {
    plugins: [
      react({
        // React optimization for production
        babel: {
          plugins: isProd ? [
            ['transform-remove-console', { exclude: ['error', 'warn'] }]
          ] : []
        }
      }),

      // Automatic vendor chunk splitting
      splitVendorChunkPlugin(),

      // Bundle analyzer for production builds
      isProd && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    server: {
      port: 1006,
      host: true,
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: isDev ? true : 'hidden', // Hidden sourcemaps for production
      minify: isProd ? 'terser' : false,

      // Performance optimizations
      chunkSizeWarningLimit: 500,
      reportCompressedSize: false, // Faster builds

      // Terser configuration for better compression
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
          pure_funcs: isProd ? ['console.log', 'console.info'] : []
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      },

      rollupOptions: {
        output: {
          // Advanced chunk splitting strategy
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }

              // UI library
              if (id.includes('@mui') || id.includes('@emotion')) {
                return 'mui-vendor';
              }

              // Data fetching and state management
              if (id.includes('@tanstack') || id.includes('zustand') || id.includes('axios')) {
                return 'data-vendor';
              }

              // Charts and visualization
              if (id.includes('recharts') || id.includes('d3')) {
                return 'charts-vendor';
              }

              // Form libraries
              if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
                return 'forms-vendor';
              }

              // i18n and localization
              if (id.includes('i18next') || id.includes('react-i18next')) {
                return 'i18n-vendor';
              }

              // Date utilities
              if (id.includes('date-fns')) {
                return 'date-vendor';
              }

              // Utility libraries
              if (id.includes('lodash') || id.includes('clsx') || id.includes('tailwind')) {
                return 'utils-vendor';
              }

              // Everything else in node_modules
              return 'vendor';
            }

            // App chunks based on routes/features
            if (id.includes('/pages/') || id.includes('/routes/')) {
              if (id.includes('dashboard')) return 'dashboard';
              if (id.includes('analytics')) return 'analytics';
              if (id.includes('users')) return 'users';
              if (id.includes('content')) return 'content';
              if (id.includes('settings')) return 'settings';
            }

            // Component chunks
            if (id.includes('/components/')) {
              if (id.includes('charts') || id.includes('Chart')) return 'chart-components';
              if (id.includes('forms') || id.includes('Form')) return 'form-components';
              if (id.includes('tables') || id.includes('Table')) return 'table-components';
              return 'ui-components';
            }
          },

          // Consistent chunk naming
          chunkFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          entryFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];

            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]-[hash].${extType}`;
            }

            if (/\.(css)$/i.test(assetInfo.name)) {
              return `css/[name]-[hash].${extType}`;
            }

            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${extType}`;
            }

            return `assets/[name]-[hash].${extType}`;
          }
        },

        // External dependencies (if using CDN)
        external: isProd ? [] : [],

        // Tree shaking configuration
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },

      // CSS optimization
      cssCodeSplit: true,
      cssMinify: isProd
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@pages': resolve(__dirname, './src/pages'),
        '@utils': resolve(__dirname, './src/utils'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@types': resolve(__dirname, './src/types'),
        '@assets': resolve(__dirname, './src/assets'),
        '@services': resolve(__dirname, './src/services'),
        '@stores': resolve(__dirname, './src/stores')
      },
    },

    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      // Remove development-only code in production
      __DEV__: isDev
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@tanstack/react-query',
        'axios',
        'zustand',
        'clsx'
      ],
      exclude: [
        // Large libraries that should be loaded on demand
        'recharts'
      ]
    },

    // CSS preprocessing optimizations
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      },
      modules: {
        localsConvention: 'camelCase'
      },
      postcss: {
        plugins: [
          require('autoprefixer'),
          isProd && require('cssnano')({
            preset: ['default', {
              discardComments: { removeAll: true },
              normalizeUnicode: false
            }]
          })
        ].filter(Boolean)
      }
    },

    // Preview configuration for production testing
    preview: {
      port: 1006,
      host: true,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },

    // Development optimizations
    ...(isDev && {
      esbuild: {
        target: 'es2020'
      }
    }),

    // Worker configuration for web workers
    worker: {
      format: 'es'
    }
  };
});