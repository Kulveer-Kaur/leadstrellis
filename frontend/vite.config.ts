import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Dev: /api goes to the Express backend, so the browser sees one origin (no CORS, cookies work).
      proxy: {
        '/api': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true },
        // Live updates (Socket.IO) go to the same backend.
        '/socket.io': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true, ws: true },
      },
    },
  };
});
