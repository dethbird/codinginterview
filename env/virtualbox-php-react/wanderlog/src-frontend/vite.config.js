import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  root: resolve(__dirname),
  base: command === 'serve' ? '/' : '/assets/js/',
  plugins: [react()],
  server: {
    strictPort: true,
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',        // if you ever use localhost:3000
      '127.0.0.1',        // if you ever use localhost:3000
      'wanderlog',             // your VM’s hostname
      '192.168.86.180',   // or its IP
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: resolve(__dirname, '../public/assets/js'),
    emptyOutDir: true,
    manifest: true,
    assetsDir: '.', 
    rollupOptions: {
      input: resolve(__dirname, 'main.jsx'),
    }
  }
}));