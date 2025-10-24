import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure environment variables are properly embedded
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Firebase into its own chunk for better caching
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  // Define environment variable prefix
  envPrefix: 'VITE_',
});