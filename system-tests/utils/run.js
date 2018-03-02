const chalk = require('chalk')
const shell = require('shelljs')
const afterAll = require('./afterAll')

//
// Run the given shell command synchronously
module.exports = function (command, {
    expectedExitCode = 0
  } = {}) {
  console.log('===========================================================================')
  console.log(`${chalk.bold.red('Running')} ${chalk.bold.blue(`${command}`)}`)
  const cmdProcess = shell.exec(command)
  if (!cmdProcess) {
    // Process was killed, perform clean up
    afterAll()
    shell.exit(1)
  } else if (cmdProcess.code !== expectedExitCode) {
    console.log(`${chalk.bold.red('!!! TEST FAILED !!! ')} ${chalk.bold.blue(`${command}`)}`)
    console.log(`Expected exit code ${expectedExitCode} but command exited with code ${cmdProcess.code}`)
    afterAll()
    shell.exit(1)
  }
  console.log('===========================================================================')
}