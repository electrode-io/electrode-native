const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
const inquirer = require('inquirer');
const run = require('./utils/run')

const runAll = process.argv.includes('--all')

const pathToSystemTests = path.join(__dirname, 'tests')
const testsSourceFiles = fs.readdirSync(pathToSystemTests)

if (runAll) {
  runAllTests()
} else {
  inquirer.prompt([{
    type: 'checkbox',
    name: 'userSelectedTests',
    message: 'Choose one or more tests to run',
    choices: testsSourceFiles
  }]).then(answers => {
    for (const userSelectedTestSourceFile of answers.userSelectedTests) {
      runTest(userSelectedTestSourceFile)
    }
  })
}

function runAllTests() {
  for (const testSourceFile of testsSourceFiles) {
    runTest(testSourceFile)
  }
}

function runTest(testSourceFile) {
  // No Cauldron should be active when starting a test suite 
  run(`ern cauldron repo clear`)
  // Trace log level should be set to trace to ensure that `ora` 
  // gets disabled as it can lead to issues on CI env
  run('ern platform config logLevel trace')
  // Disable banner before running a test suite
  // to reduce log verbosity
  run('ern platform config showBanner false')
  const workingDirPath = tmp.dirSync({ unsafeCleanup: true }).name
  process.chdir(workingDirPath)
  console.log(`Running ${testSourceFile} tests`)
  require(path.join(pathToSystemTests, testSourceFile))
}