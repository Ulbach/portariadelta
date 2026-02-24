import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (como VITE_BASE_PATH e API_KEY)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    /**
     * Define o caminho base do projeto.
     * Importante para o GitHub Pages: se o site estiver em 'ulbach.github.io/portariadelta/',
     * o base deve ser '/portariadelta/'. O './' torna os caminhos relativos.
     */
    base: env.VITE_BASE_PATH || './',

    plugins: [
      react()
    ],

    define: {
      // Mapeia as variáveis para o código (acessíveis via process.env)
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_SHEET_ID': JSON.stringify(env.VITE_SHEET_ID),
      'process.env.VITE_SCRIPT_URL': JSON.stringify(env.VITE_SCRIPT_URL),
    },

    resolve: {
      alias: {
        /**
         * Permite usar o atalho '@' para referenciar a raiz do projeto.
         * Exemplo: import { Partner } from '@/types';
         */
        '@': path.resolve(__dirname, '.'),
      }
    },

    build: {
      // Pasta de saída para o deploy conforme configurado no seu deploy.yml
      outDir: 'dist',
      // Gera ficheiros de mapa para facilitar a correção de erros
      sourcemap: true,
      // Limpa a pasta dist antes de cada build
      emptyOutDir: true,
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
    }
  };
});
