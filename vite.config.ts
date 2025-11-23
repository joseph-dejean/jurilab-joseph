import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file from parent directory (outside jurilabb folder)
  const parentDir = path.resolve(__dirname, '..');
  const env = loadEnv(mode, parentDir, 'VITE_');
  
  console.log('🔧 Vite Config - Loading env from:', parentDir);
  console.log('🔧 Vite Config - DAILY_API_KEY exists:', !!env.VITE_DAILY_API_KEY);
  console.log('🔧 Vite Config - GEMINI_API_KEY exists:', !!env.VITE_GEMINI_API_KEY);
  
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true, // Échoue si le port est déjà utilisé
    },
    plugins: [react()],
    envPrefix: 'VITE_',
    envDir: parentDir, // Tell Vite to look for .env in parent directory
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      'import.meta.env.VITE_DAILY_API_KEY': JSON.stringify(env.VITE_DAILY_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
