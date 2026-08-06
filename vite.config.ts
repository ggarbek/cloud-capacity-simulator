import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    rollupOptions: {
      output: {
        // v2.25.5 — Split the baked live catalog (~1.2MB gzipped, refreshed
        // weekly) into its own chunk so returning visitors only re-download the
        // changed rate data, not the whole app shell (which stays cached).
        manualChunks(id) {
          if (id.includes('liveCatalog.generated.json')) return 'live-catalog';
        },
      },
    },
    // The live-catalog data chunk is intentionally large; raise the warning
    // limit so the build stays clean (app-code chunks remain well under it).
    chunkSizeWarningLimit: 2000,
  },
});
