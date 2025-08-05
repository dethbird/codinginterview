import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: '.',                  // project root for Vite
  base: '/assets/js/',        // where your built files will be served from
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../public'),
    emptyOutDir: true,
    manifest: true,           // generates manifest.json for server-side injection
    rollupOptions: {
      input: resolve(__dirname, 'main.jsx')
    }
  },
  server: {
    strictPort: true,
    port: 3000,
    // proxy API calls to your PHP backend:
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});
