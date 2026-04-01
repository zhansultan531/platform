import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': { target: 'https://platform-production-4564.up.railway.app', changeOrigin: true },
'/socket.io': { target: 'https://platform-production-4564.up.railway.app', ws: true },
    },
  },
});
