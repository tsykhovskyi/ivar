import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/cmd': 'http://localhost:29999',
      '/sessions': 'http://localhost:29999',
      '/traffic': 'http://localhost:29999',
      '/config': 'http://localhost:29999',
      '/ws': 'ws://localhost:29999',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
