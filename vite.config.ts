import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const repoName = 'local-browser-ai'

export default defineConfig({
  base: `/${repoName}/`,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'مساعدك المحلي',
        short_name: 'مساعد محلي',
        description:
          'محادثة ذكاء اصطناعي تعمل بالكامل داخل متصفحك — بلا خادم وبلا إرسال لبياناتك.',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#0f766e',
        background_color: '#f1f5f4',
        display: 'standalone',
        start_url: `/${repoName}/`,
        scope: `/${repoName}/`,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // WebLLM ships a multi‑MB JS bundle; must be precached for true offline reload.
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2,webmanifest}'],
        navigateFallback: `/${repoName}/index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 8000,
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', '@huggingface/transformers'],
  },
  server: {
    host: true,
    port: 5173,
    open: '/local-browser-ai/',
  },
  preview: {
    host: true,
    port: 4173,
    open: '/local-browser-ai/',
  },
})
