import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (dev/prod)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Configura o caminho base para o GitHub Pages. 
    // Se VITE_BASE_PATH não existir, usa './' para caminhos relativos.
    base: env.VITE_BASE_PATH || './',

    plugins: [
      react()
    ],

    define: {
      // Define as chaves para que fiquem disponíveis no código via process.env ou import.meta.env
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_SHEET_ID': JSON.stringify(env.VITE_SHEET_ID),
      'process.env.VITE_SCRIPT_URL': JSON.stringify(env.VITE_SCRIPT_URL),
    },

    resolve: {
      alias: {
        // Permite usar '@/' como atalho para a raiz do projeto
        '@': path.resolve(__dirname, '.'),
      }
    },

    build: {
      // Garante que o build seja gerado na pasta 'dist' conforme o seu deploy.yml
      outDir: 'dist',
      // Gera sourcemaps para facilitar a depuração, se necessário
      sourcemap: true,
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
    }
  };
});
