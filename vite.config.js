import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// Injects Firebase env vars into firebase-messaging-sw.js at build time
// (service workers can't access import.meta.env)
function injectFirebaseSwConfig() {
  return {
    name: 'inject-firebase-sw-config',
    closeBundle() {
      const swPath = path.resolve('dist', 'firebase-messaging-sw.js');
      if (!fs.existsSync(swPath)) return;

      const env = loadEnv('', process.cwd(), 'VITE_');
      let content = fs.readFileSync(swPath, 'utf-8');

      const replacements = {
        "self.FIREBASE_API_KEY            || ''":             `'${env.VITE_FIREBASE_API_KEY || ''}'`,
        "self.FIREBASE_AUTH_DOMAIN        || ''":             `'${env.VITE_FIREBASE_AUTH_DOMAIN || ''}'`,
        "self.FIREBASE_PROJECT_ID         || ''":             `'${env.VITE_FIREBASE_PROJECT_ID || ''}'`,
        "self.FIREBASE_STORAGE_BUCKET     || ''":             `'${env.VITE_FIREBASE_STORAGE_BUCKET || ''}'`,
        "self.FIREBASE_MESSAGING_SENDER_ID|| ''":             `'${env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}'`,
        "self.FIREBASE_APP_ID             || ''":             `'${env.VITE_FIREBASE_APP_ID || ''}'`,
      };

      for (const [from, to] of Object.entries(replacements)) {
        content = content.replaceAll(from, to);
      }

      fs.writeFileSync(swPath, content);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/solarhub-api\.onrender\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'solarhub-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Solar Maket Nigeria',
        short_name: 'Solar Maket',
        description: 'The premier marketplace for solar energy components and professional engineers in Nigeria.',
        theme_color: '#f59e0b',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    injectFirebaseSwConfig(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3002,
  }
});
