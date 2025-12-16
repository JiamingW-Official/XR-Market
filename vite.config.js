import glsl from 'vite-plugin-glsl';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [glsl()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        'index': resolve(__dirname, './index.html'),
      },
    },
  },
});