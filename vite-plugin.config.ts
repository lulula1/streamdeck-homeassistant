import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from "vite-plugin-singlefile"

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
    outDir: "./fr.lulula1.streamdeck.homeassistant.sdPlugin",
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: {
        plugin: resolve(__dirname, 'plugin.html'),
      }
    }
  }
})
