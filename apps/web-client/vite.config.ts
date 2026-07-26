import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/web': {
        target: 'http://localhost:8019',
        changeOrigin: true,
      },
      '/websocket': {
        target: 'ws://localhost:8019',
        ws: true,
      },
      '/report': {
        target: 'http://localhost:8019',
        changeOrigin: true,
      }
    }
  }
});
