const chalk = require('chalk')
const fs = require('fs')
const lockfile = require('@yarnpkg/lockfile')
const path = require('path')

const yarnLockContent = fs.readFileSync('yarn.lock', 'utf8')
const yarnLockParsed = lockfile.parse(yarnLockContent)

const allowedRegistriesRe = /https:\/\/registry.yarnpkg.com|http:\/\/registry.npmjs.org/

if (yarnLockParsed && yarnLockParsed.object) {
  let incorrectRegistries = []
  for (let key of Object.keys(yarnLockParsed.object)) {
    if (yarnLockParsed.object[key]) {
      let resolved = yarnLockParsed.object[key].resolved
      if (resolved && !allowedRegistriesRe.exec(resolved)) {
        incorrectRegistries.push(resolved)
      }
    }
  }

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
  } else {
    console.log(
      chalk.bold.green('✅ success')
    )
  }
}
