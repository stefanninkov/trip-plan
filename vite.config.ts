import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  base: '/trip-plan/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Trip Plan',
        short_name: 'Trip Plan',
        description: 'AI-powered trip planner',
        theme_color: '#1A1A1E',
        background_color: '#1A1A1E',
        display: 'standalone',
        start_url: '/trip-plan/',
        scope: '/trip-plan/',
        icons: [
          { src: '/trip-plan/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/trip-plan/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
