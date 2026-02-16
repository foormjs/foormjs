import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'foorm': path.resolve(__dirname, 'packages/foorm/src'),
      '@foormjs/': path.resolve(__dirname, 'packages/') + '/',
    },
  },
  test: {
    include: ['packages/**/src/**/*.spec.ts'],
    globals: true,
  },
})
