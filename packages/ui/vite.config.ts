import { fileURLToPath, URL } from 'node:url'
import { resolve } from "path";
import typescript from 'rollup-plugin-typescript2'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  server: {
    host: '0.0.0.0',
  },
  plugins: [
    // dts({
    //   insertTypesEntry: true,
    // }),
    vue({
      script: {
        defineModel: true
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', 'foorm', '@prostojs/ftring']
    },
  },
})
