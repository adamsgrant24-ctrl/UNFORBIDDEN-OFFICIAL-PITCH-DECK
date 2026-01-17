import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure process.env.API_KEY doesn't crash the app if missing during build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': {}
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // In this specific ESM-based setup, we treat these as external to leverage the importmap
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'framer-motion',
        'lucide-react',
        '@google/genai'
      ]
    }
  }
});