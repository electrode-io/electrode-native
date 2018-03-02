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
  run(`ern cauldron repo clear`)
  const workingDirPath = tmp.dirSync({ unsafeCleanup: true }).name
  process.chdir(workingDirPath)
  console.log(`Running ${testSourceFile} tests`)
  require(path.join(pathToSystemTests, testSourceFile))
}