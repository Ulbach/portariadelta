import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // O ponto garante que os arquivos sejam encontrados em qualquer subpasta do GitHub
  base: './', 
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    // Garante que o build limpe a pasta anterior antes de criar uma nova
    emptyOutDir: true,
  }
});
