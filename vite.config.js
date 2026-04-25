import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mesa: resolve(__dirname, 'mesa-de-jogo/index.html'),
        som: resolve(__dirname, 'mesa-de-som/index.html'),
        placar: resolve(__dirname, 'placar/index.html'),
      },
    },
  },
});
