import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // This ensures all asset paths are relative (./assets/...)
  build: {
    outDir: 'dist',
  }
});
