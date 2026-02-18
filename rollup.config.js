/* eslint-disable import/no-default-export */
import { readdirSync, rmSync, statSync } from 'node:fs'

import { dye } from '@prostojs/dye'
import commonJS from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { createRequire } from 'node:module'
import { dts } from 'rollup-plugin-dts'
import typescript from 'rollup-plugin-typescript2'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

const target = process.env.TARGET

const dyeModifiers = [
  'dim',
  'bold',
  'underscore',
  'inverse',
  'italic',
  'crossed',
  'gray01',
  'gray02',
  'gray03',
]
const dyeColors = ['red', 'green', 'cyan', 'blue', 'yellow', 'white', 'magenta', 'black']

const external = ['url', 'crypto', 'stream', 'http', 'path', /^packages\/[^/]+\/src/]

const replacePlugin = replace({
  values: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    '__VERSION__': JSON.stringify(pkg.version),
    '__PROJECT__': JSON.stringify(process.env.PROJECT),
    ...createDyeReplaceConst(),
  },
  preventAssignment: true,
})

function getBuildOptions(target) {
  const pkg = require(`./packages/${target}/package.json`)
  const buildArray = Array.isArray(pkg.build) ? pkg.build : pkg.build ? [pkg.build] : [{}]
  return buildArray.map(build => ({
    entries: build.entries || ['src/index.ts'],
    formats: build.format ? [build.format] : ['mjs', 'cjs'],
    dts: build.dts ?? true,
  }))
}

const targets = readdirSync('packages').filter(f => {
  if (f !== target) {
    return false
  }
  if (!statSync(`packages/${f}`).isDirectory()) {
    return false
  }
  const pkg = require(`./packages/${f}/package.json`)
  if (pkg.private) {
    return false
  }
  const deps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})]
  if (deps.length > 0) external.push(...deps)
  rmSync(`./packages/${f}/dist`, { recursive: true, force: true })
  return true
})

const configs = targets.flatMap(target => {
  const builds = getBuildOptions(target)
  return builds.flatMap(build => {
    const results = []
    for (const entry of build.entries) {
      const fileName = entry
        .split('/')
        .pop()
        .replace(/\.\w+$/, '')
      for (const format of build.formats) {
        results.push(createConfig(target, format, entry, fileName))
      }
      if (build.dts) {
        results.push(createDtsConfig(target, entry, fileName))
      }
    }
    return results
  })
})

function createConfig(target, type, entry = 'src/index.ts', fileName = 'index') {
  const formats = {
    cjs: 'cjs',
    mjs: 'es',
  }
  return {
    external,
    input: `./packages/${target}/${entry}`,
    output: {
      file: `./packages/${target}/dist/${fileName}.${type}`,
      format: formats[type],
      sourcemap: false,
    },
    plugins: [
      commonJS({ sourceMap: false }),
      nodeResolve(),
      typescript({
        check: true,
        tsconfig: './tsconfig.json',
        tsconfigOverride: {
          target: 'es2020',
          declaration: false,
          declarationMap: false,
          removeComments: true,
          include: ['packages/*/src', 'packages/*/__tests__', 'common/*.ts'],
          exclude: [
            '**/__tests__',
            '*.spec.ts',
            'explorations',
            'packages/vue',
            'packages/composables',
          ],
        },
      }),
      replacePlugin,
    ],
  }
}

function createDtsConfig(target, entry = 'src/index.ts', fileName = 'index') {
  return {
    external,
    input: `./packages/${target}/${entry}`,
    output: {
      file: `./packages/${target}/dist/${fileName}.d.ts`,
      format: 'es',
      sourcemap: false,
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          removeComments: false,
        },
      }),
    ],
  }
}

export default configs

function createDyeReplaceConst() {
  const c = dye('red')
  const bg = dye('bg-red')
  const dyeReplacements = {
    __DYE_RESET__: `'${dye.reset}'`,
    __DYE_COLOR_OFF__: `'${c.close}'`,
    __DYE_BG_OFF__: `'${bg.close}'`,
  }
  for (const v of dyeModifiers) {
    dyeReplacements[`__DYE_${v.toUpperCase()}__`] = `'${dye(v).open}'`
    dyeReplacements[`__DYE_${v.toUpperCase()}_OFF__`] = `'${dye(v).close}'`
  }
  for (const v of dyeColors) {
    dyeReplacements[`__DYE_${v.toUpperCase()}__`] = `'${dye(v).open}'`
    dyeReplacements[`__DYE_BG_${v.toUpperCase()}__`] = `'${dye(`bg-${v}`).open}'`
    dyeReplacements[`__DYE_${v.toUpperCase()}_BRIGHT__`] = `'${dye(`${v}-bright`).open}'`
    dyeReplacements[`__DYE_BG_${v.toUpperCase()}_BRIGHT__`] = `'${dye(`bg-${v}-bright`).open}'`
  }
  return dyeReplacements
}
