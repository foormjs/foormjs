import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { foormPlugin } from '@foormjs/atscript/plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [ts(), foormPlugin()],
})
