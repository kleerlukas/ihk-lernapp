/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Auf GitHub Pages liegt die App unter https://<name>.github.io/<repo>/.
// Der Workflow setzt BASE_PATH=/<repo>/, lokal bleibt es "/".
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // NO_PWA=1 → Build ohne Service Worker (z. B. für eingebettete Vorschauen)
      disable: process.env.NO_PWA === '1',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'FISI AP2 Lernkarten',
        short_name: 'AP2 Lernen',
        description: 'Karteikarten und Rechenaufgaben für die IHK-Abschlussprüfung Teil 2 (FISI)',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f5f4',
        theme_color: '#0f766e',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alles vorab cachen → komplett offline nutzbar
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  build: {
    // Fragen + Highlighting landen bewusst in einem Paket (offline sofort verfügbar)
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
