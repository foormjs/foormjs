import fs from 'node:fs'

import execa from 'execa'
import minimist from 'minimist'
import path from 'path'
import semver from 'semver'

import { __dirname, out, packages, require, version as currentVersion } from './utils.js'

const { prompt } = require('enquirer')

const args = minimist(process.argv.slice(2))

const preId =
  args.preid || (semver.prerelease(currentVersion) && semver.prerelease(currentVersion)[0])
const isDryRun = args.dry
const skipTests = args.skipTests
const skipBuild = args.skipBuild

if (isDryRun) {
  out.warn('Dry Run!')
}
if (skipBuild) {
  out.warn('Skip Build!')
}

const versionIncrements = [
  'patch',
  'minor',
  'major',
  ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] : []),
]

const inc = i => semver.inc(currentVersion, i, preId)
const bin = name => path.resolve(__dirname, `../node_modules/.bin/${name}`)
const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts })
const dryRun = (bin, args, opts = {}) => out.info(`[dryrun] ${bin} ${args.join(' ')}`, opts)
const runIfNotDry = isDryRun ? dryRun : run

async function main() {
  let targetVersion = args._[0]

  if (!targetVersion) {
    // no explicit version, offer suggestions
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(['custom']),
    })

    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion,
        })
      ).version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`,
  })

  if (!yes) {
    return
  }

  // run tests before release
  out.step('Running tests...')
  if (!skipTests && !isDryRun) {
    await run('pnpm', ['test'])
  } else {
    out.warn(`(skipped)`)
  }

  // update all package versions
  out.step('Updating versions...')
  updateVersions(targetVersion)

  // build all packages with types
  out.step('Building all packages...')
  if (!skipBuild && !isDryRun) {
    await run('pnpm', ['run', 'build', '--release'])
  } else {
    out.warn(`(skipped)`)
  }

  // generate changelog
  out.step('Generating changelog...')
  await run(`pnpm`, ['run', 'changelog'])

  // update lockfile
  out.step('Updating lockfile...')
  await run(`pnpm`, ['i'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    out.step('Committing changes...')
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', ['commit', '-m', `release: v${targetVersion}`])
  } else {
    console.log('No changes to commit.')
  }

  // publish packages via workspace pub scripts
  out.step('Publishing packages...')
  await runIfNotDry('pnpm', ['-r', 'run', 'pub'])

  // push to GitHub
  out.step('Pushing to GitHub...')
  await runIfNotDry('git', ['tag', `v${targetVersion}`])
  await runIfNotDry('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
  await runIfNotDry('git', ['push'])

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }
  console.log()
}

function updateVersions(version) {
  // 1. update root package.json
  updatePackage(path.resolve(__dirname, '..', 'package.json'), version)
  // 2. update all workspace packages
  packages.forEach(p => updatePackage(p.pkgPath, version))
}

function updatePackage(pkgPath, version) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.version = version
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

main().catch(error => {
  updateVersions(currentVersion)
  out.error(error)
})
