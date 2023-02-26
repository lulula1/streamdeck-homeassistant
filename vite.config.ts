import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

const file = process.argv.find(arg => arg.startsWith('--file='))?.replace('--file=', '') || '';

if (!file) {
  console.error('Argument --file=<filename> is missing');
  process.exit(1);
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue(), viteSingleFile()],
  resolve: {
    alias: {
      '@public': fileURLToPath(new URL('./public', import.meta.url))
    }
  },
  build: {
    outDir: resolve(process.env.APPDATA || '.', 'Elgato/StreamDeck/Plugins/fr.lulula1.streamdeck.homeassistant.sdPlugin'),
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, file)
    }
  }
})
