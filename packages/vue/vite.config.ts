/* eslint-disable unicorn/import-style */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import atscript from 'unplugin-atscript'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    atscript.vite() as any,
    vue(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.app.json',
      afterBuild: () => {
        // Fix import paths in bundled declaration file
        const dtsPath = resolve(__dirname, 'dist/index.d.ts')
        if (existsSync(dtsPath)) {
          let content = readFileSync(dtsPath, 'utf-8')
          // Replace relative paths to workspace packages with module names
          content = content.replaceAll(
            /from ['"]\.\.\/\.\.\/\.\.\/atscript\/src['"]/g,
            "from '@foormjs/atscript'"
          )
          content = content.replaceAll(
            /from ['"]@atscript\/typescript\/utils['"]/g,
            "from '@atscript/typescript'"
          )
          writeFileSync(dtsPath, content)
        }
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'vue',
        '@foormjs/composables',
        '@foormjs/atscript',
        '@atscript/core',
        '@atscript/typescript',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
