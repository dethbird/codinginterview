import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// export default defineConfig({
//   root: '.',                  // project root for Vite
//   base: '/assets/js/',        // where your built files will be served from
//   plugins: [react()],
//   build: {
//     outDir: resolve(__dirname, '../public/assets/js'),
//     emptyOutDir: true,
//     manifest: true,           // generates manifest.json for server-side injection
//     assetsDir: '',
//     rollupOptions: {
//       input: resolve(__dirname, 'main.jsx')
//     }
//   },
//   server: {
//     strictPort: true,
//     port: 3000,
//     // proxy API calls to your PHP backend:
//     proxy: {
//       '/api': {
//         target: 'http://localhost:8080',
//         changeOrigin: true,
//       }
//     }
//   }
// });


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
      'code',             // your VM’s hostname
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