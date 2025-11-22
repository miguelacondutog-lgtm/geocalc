import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: If deploying to https://<USERNAME>.github.io/<REPO>/
  // Change this base line to match your repository name:
  base: './', 
  build: {
    outDir: 'dist',
  }
});