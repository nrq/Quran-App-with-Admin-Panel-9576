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
    // Optimize for mobile
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 600,
    // Ensure environment variables are properly embedded
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Firebase into its own chunk for better caching
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Separate React and React DOM
          react: ['react', 'react-dom', 'react-router-dom'],
          // Separate UI libraries
          ui: ['framer-motion', 'react-hot-toast', 'react-icons']
        }
      }
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true // Split CSS for better caching
  },
  // Define environment variable prefix
  envPrefix: 'VITE_',
});