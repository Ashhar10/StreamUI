import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './', // This ensures all asset paths are relative (./assets/...)
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
  }
});
