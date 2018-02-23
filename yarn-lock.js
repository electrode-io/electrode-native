const fs = require('fs')
const lockfile = require('@yarnpkg/lockfile')
const chalk = require('chalk')
const path = require('path')

const yarnLock = 'yarn.lock'
const yarnRegistryRe = /https:\/\/registry.yarnpkg.com/

let ernDirs = fs.readdirSync(process.cwd()).filter(x => x.startsWith('ern'))
ernDirs.push(yarnLock) // Root yarn.lock

ernDirs.forEach(current => {
  let yarnLockPath = current === yarnLock
    ? yarnLock
    : path.join(current, yarnLock)

  try {
    let yarnLockContent = fs.readFileSync(yarnLockPath, 'utf8')
    let yarnLockParsed = lockfile.parse(yarnLockContent)

    /*
     {
     type: 'success',
     object: {
     '@yarnpkg/lockfile@^1.0.0': {
     version: '1.0.0',
     resolved: 'http://npme.walmart.com/@yarnpkg/lockfile/-/lockfile-1.0.0.tgz#33d1dbb659a23b81f87f048762b35a446172add3'
     },
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
       http://npme.walmart.com/@yarnpkg/lockfile/-/lockfile-1.0.0.tgz#33d1dbb659a23b81f87f048762b35a446172add3
       http://npme.walmart.com/colors/-/colors-1.1.2.tgz#168a4701756b6a7f51a12ce0c97bfa28c084ed63
       http://npme.walmart.com/diff/-/diff-3.4.0.tgz#b1d85507daf3964828de54b37d0d73ba67dda56c
       */
      if (incorrectRegistries.length > 0) {
        console.log(chalk.bold.red(`${yarnLockPath} contains registry other than https://registry.yarnpkg.com`))
        incorrectRegistries.forEach((item) => {
          console.log(chalk.bold.red(item))
        })
        process.exit(1)
      }
    }
  } catch (e) {
    console.log(chalk.yellow(`Skip yarn-lock registry check for ${current}`))
  }
})
