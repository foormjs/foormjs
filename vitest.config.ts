import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@foormjs/atscript': path.resolve(__dirname, 'packages/atscript/src'),
      '@foormjs/': `${path.resolve(__dirname, 'packages/')}/`,
    },
  },
  test: {
    include: ['packages/**/src/**/*.spec.ts'],
    globals: true,
  },
})
