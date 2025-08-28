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
    // Temporarily disabled security headers plugin to resolve SSR issues during design review
    // viteSecurityHeaders(
    //   process.env.NODE_ENV === 'production' 
    //     ? productionSecurityConfig 
    //     : developmentSecurityConfig
    // ),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 7002,
    host: true,
  },
  preview: {
    port: 7002,
    host: true,
  },
}) 