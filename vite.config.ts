import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Nidz',
        short_name: 'Nidz',
        description: 'Algeria pet care marketplace',
        /* Must track --background in src/index.css. These paint the installed
           PWA's chrome and its launch screen, so a stale value here is a flash
           of the old colour before the app renders. Audit 1.2: white. */
        theme_color: '#EDF2F0',
        background_color: '#EDF2F0',
        icons: [
          { src: '/favicon.ico', sizes: '64x64 32x32 16x16', type: 'image/x-icon' }
        ]
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
