import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { 
  viteSecurityHeaders, 
  developmentSecurityConfig, 
  productionSecurityConfig 
} from './src/middleware/securityHeaders'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add security headers plugin with CSP nonce support
    viteSecurityHeaders(
      process.env.NODE_ENV === 'production' 
        ? productionSecurityConfig 
        : developmentSecurityConfig
    ),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    host: true,
    // Security headers are now handled by the plugin
  },
  preview: {
    port: 3002,
    host: true,
    // Security headers are now handled by the plugin
  },
}) 