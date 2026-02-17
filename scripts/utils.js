import { dye } from '@prostojs/dye'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROJECT } from './constants.js'

export const require = createRequire(import.meta.url)
export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

export const packagesDir = path.resolve(__dirname, '../packages')

const files = fs.readdirSync(packagesDir)

const mainPkg = require('../package.json')

export const version = mainPkg.version
export const packages = files
  .filter(shortName => fs.statSync(path.join(packagesDir, shortName)).isDirectory())
  .map(shortName => {
    const pkgRoot = path.join(packagesDir, shortName)
    const pkgPath = path.join(pkgRoot, `package.json`)
    return {
      name:
        shortName === PROJECT || shortName === `create-${PROJECT}`
          ? shortName
          : `@${PROJECT}js/${shortName}`,
      shortName,
      pkgPath,
      pkgRoot,
      pkg: fs.existsSync(pkgPath) ? require(pkgPath) : null,
    }
  })

let step = 1

export const out = {
  info: dye('cyan').attachConsole('info'),
  error: dye('red').attachConsole('error'),
  step: dye('cyan')
    .prefix(() => dye('bold')(`\nStep ${step++}. `))
    .attachConsole('info'),
  log: dye('gray04').attachConsole('log'),
  warn: dye('yellow').attachConsole('warn'),
  success: dye('green').attachConsole('log'),
}
