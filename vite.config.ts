import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const nvidiaBaseUrl = (env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com').replace(/\/+$/, '');
    return {
      base: mode === 'production' ? (env.VITE_BASE || '/StormPlan-yswy.github.io/') : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/nvidia': {
            target: nvidiaBaseUrl,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/nvidia/, ''),
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
