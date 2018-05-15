const fs = require('fs')
const lockfile = require('@yarnpkg/lockfile')
const chalk = require('chalk')
const path = require('path')

const yarnLock = 'yarn.lock'
const yarnRegistryRe = /https:\/\/registry.yarnpkg.com|http:\/\/registry.npmjs.org/

const yarnLockContent = fs.readFileSync(yarnLock, 'utf8')
const yarnLockParsed = lockfile.parse(yarnLockContent)

/*
  {
  type: 'success',
  object: {
  'JSONSelect@0.4.0': {
  version: '0.4.0',
  resolved: 'https://registry.yarnpkg.com/JSONSelect/-/JSONSelect-0.4.0.tgz#a08edcc67eb3fcbe99ed630855344a0cf282bb8d'
  }
  }
  */
if (yarnLockParsed && yarnLockParsed.object) {
  let incorrectRegistries = []
  for (let key of Object.keys(yarnLockParsed.object)) {
    if (yarnLockParsed.object[key]) {
      let resolved = yarnLockParsed.object[key].resolved
      if (resolved && !yarnRegistryRe.exec(resolved)) {
        incorrectRegistries.push(resolved)
      }
    }
  }

  /*
    yarn.lock contains registry other than https://registry.yarnpkg.com
    */
  if (incorrectRegistries.length > 0) {
    console.log(
      chalk.bold.red(
        `yarn.lock contains registry other than https://registry.yarnpkg.com`
      )
    )
    incorrectRegistries.forEach(item => {
      console.log(chalk.bold.red(item))
    })
    process.exit(1)
  }
}
