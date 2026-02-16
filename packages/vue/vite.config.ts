/* eslint-disable unicorn/import-style */
import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import atscript from 'unplugin-atscript'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    atscript.vite() as any,
    vue(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      compilerOptions: {
        skipLibCheck: true,
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'index',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
