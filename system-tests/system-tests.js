const fs = require('fs')
const path = require('path')
const tmp = require('tmp')

const pathToSystemTests = path.join(__dirname, 'tests')
const workingDirPath = tmp.dirSync({ unsafeCleanup: true }).name
process.chdir(workingDirPath)

const tests = fs.readdirSync(pathToSystemTests)
for (const test of tests) {
  console.log(`Running ${test} tests`)
  require(path.join(pathToSystemTests, test))
}