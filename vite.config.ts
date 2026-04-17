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
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Open-Meteo forecast + geocoding — short TTL, network-first so
          // fresh forecasts win when online but cached data shows offline.
          {
            urlPattern:
              /^https:\/\/(?:api\.open-meteo\.com|archive-api\.open-meteo\.com|geocoding-api\.open-meteo\.com)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
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
          { src: '/trip-plan/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/modifiers', '@dnd-kit/utilities'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
