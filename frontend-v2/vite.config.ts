import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better DX
      fastRefresh: true,
    }),
    tsconfigPaths(),
  ],
  
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    strictPort: false,
  },
  
  build: {
    // Output to 'build' directory for consistency with server deployment
    outDir: 'build',
    
    // Generate sourcemaps for production debugging (can be disabled for smaller bundles)
    sourcemap: false,
    
    // Optimize for modern browsers
    target: 'es2020',
    
    // Minify with esbuild (faster than terser)
    minify: 'esbuild',
    
    // Inline small assets as base64
    assetsInlineLimit: 4096,
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Core React libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // Data fetching
          query: ['@tanstack/react-query', 'axios'],
          
          // UI utilities
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          
          // Form handling
          forms: ['react-hook-form', 'zod'],
          
          // State management
          state: ['zustand'],
        },
        
        // Naming convention for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Optimize dependencies during build
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
    ],
  },
  
  // Ensure proper handling of environment variables
  envPrefix: 'VITE_',
})
