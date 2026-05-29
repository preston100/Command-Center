import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Command Center',
        short_name: 'Command',
        description: 'Your personal all-in-one dashboard',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60*60*24*365 } }
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'weather', expiration: { maxEntries: 5, maxAgeSeconds: 1800 } }
          }
        ]
      }
    })
  ]
})
