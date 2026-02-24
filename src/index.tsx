import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Caminho base para rodar no GitHub Pages: https://ulbach.github.io/portariadelta/
    base: env.VITE_BASE_PATH || '/portariadelta/',

    plugins: [react()],

    // Mantém o uso de process.env.* no código (sheetService, etc.)
    define: {
      'process.env.VITE_SHEET_ID': JSON.stringify(env.VITE_SHEET_ID),
      'process.env.VITE_SCRIPT_URL': JSON.stringify(env.VITE_SCRIPT_URL),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
