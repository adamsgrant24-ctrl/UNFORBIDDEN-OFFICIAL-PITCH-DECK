import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-ui': ['framer-motion', 'lucide-react', 'react', 'react-dom'],
          'vendor-ai': ['@google/genai'],
        },
      },
    },
  },
});