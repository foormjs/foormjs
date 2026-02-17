import { dye } from '@prostojs/dye'

import { PROJECT } from './constants.js'
import { packages } from './utils.js'

const print = {
  header: dye('bold', 'bg-cyan').prefix(' '.repeat(5)).suffix(' '.repeat(5)).attachConsole(),
  subHeader: dye('cyan').prefix('  ').attachConsole(),
  item: dye('green', 'dim').prefix('    ').attachConsole(),
  item2: dye('green-bright').prefix('    ').attachConsole(),
  gray: dye('gray05'),
}

run()

function run() {
  for (const { pkg, name } of packages) {
    console.log()
    print.header(name)
    if (pkg.dependencies) {
      print.subHeader('dependencies')
      for (const i of Object.entries(pkg.dependencies).map(e =>
        [e[0], print.gray(e[1])].join('\t')
      )) {
        if (i.startsWith(`@${PROJECT}js`)) {
          print.item2(i)
        } else {
          print.item(i)
        }
      }
    }
    if (pkg.devDependencies) {
      print.subHeader('devDependencies')
      for (const i of Object.entries(pkg.devDependencies).map(e =>
        [e[0], print.gray(e[1])].join('\t')
      )) {
        if (i.startsWith(`@${PROJECT}js`)) {
          print.item2(i)
        } else {
          print.item(i)
        }
      }
    }
    if (pkg.peerDependencies) {
      print.subHeader('peerDependencies')
      for (const i of Object.entries(pkg.peerDependencies).map(e =>
        [e[0], print.gray(e[1])].join('\t')
      )) {
        if (i.startsWith(`@${PROJECT}js`)) {
          print.item2(i)
        } else {
          print.item(i)
        }
      }
    }
    console.log()
  }
}
