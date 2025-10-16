import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Optimize React for production
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],

  server: {
    port: 1006,
    host: true,
    // Enhanced security headers for production
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
    minify: 'terser',
    target: 'es2020',

    // Optimize bundle size
    rollupOptions: {
      output: {
        // Aggressive chunk splitting for better caching
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],

          // UI libraries
          'mui-core': ['@mui/material'],
          'mui-icons': ['@mui/icons-material'],
          'mui-utils': ['@mui/utils', '@mui/system'],

          // Data visualization
          'charts': ['recharts'],

          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers'],

          // Utilities
          'utilities': ['date-fns', 'lodash', 'clsx'],

          // State management
          'state': ['zustand', 'react-query'],
        },

        // Optimize file names for caching
        chunkFileNames: 'chunks/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'images/[name].[hash].[ext]';
          }
          if (/css/i.test(ext)) {
            return 'css/[name].[hash].[ext]';
          }
          return 'assets/[name].[hash].[ext]';
        },
      },

      // Tree-shaking optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },

    // Terser options for production optimization
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: {
        safari10: true
      }
    },

    // Size limits
    chunkSizeWarningLimit: 1000
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@upcoach/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@upcoach/types': path.resolve(__dirname, '../../packages/types/src'),
      '@upcoach/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@upcoach/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __DEV__: false,
    __PROD__: true
  },

  // Production optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      'recharts'
    ],
    exclude: [
      '@upcoach/shared',
      '@upcoach/types',
      '@upcoach/utils',
      '@upcoach/ui'
    ]
  },

  // Enable gzip compression hints
  esbuild: {
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true
  }
});