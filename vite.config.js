import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons.svg', 'metro/*.webp'],
      manifest: {
        name: 'WayPlanner',
        short_name: 'WayPlanner',
        description: 'Offline-friendly travel planner',
        theme_color: '#0b1220',
        background_color: '#05060a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/([a-c]\.)?tile\.openstreetmap\.org\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-osm',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
          {
            urlPattern: /^https:\/\/([a-d]\.)?basemaps\.cartocdn\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-carto',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/styles\/v1\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-mapbox',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react") || id.includes("scheduler")) return "react-vendor";
          if (id.includes("leaflet") || id.includes("maptiler")) return "map-vendor";
          if (id.includes("@esri/calcite-components")) return "calcite-vendor";
        },
      },
    },
  },
})
