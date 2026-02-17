import { defineConfig } from '@atscript/core'
import ts from '@atscript/typescript'
import { foormPlugin } from 'foorm/plugin'

export default defineConfig({
  rootDir: 'src',
  plugins: [
    ts(),
    foormPlugin({
      components: ['CustomInput', 'DatePicker', 'RichTextEditor'],
    }),
  ],
})
