const chalk = require('chalk')
const shell = require('shelljs')
const afterAll = require('./afterAll')
const runErnCommand = require('./runErnCommand')

//
// Run the given 'ern' command synchronously
// using pre transpiled ern binary (in dist)
module.exports = function(command, { expectedExitCode = 0 } = {}) {
  console.log(
    '==========================================================================='
  )
  console.log(`${chalk.bold.red('Running')} ${chalk.bold.blue(`${command}`)}`)

  const cmdProcess = runErnCommand(command)
  if (!cmdProcess) {
    // Process was killed, perform clean up
    afterAll()
    shell.exit(1)
  } else if (cmdProcess.code !== expectedExitCode) {
    console.log(
      `${chalk.bold.red('!!! TEST FAILED !!! ')} ${chalk.bold.blue(
        `${command}`
      )}`
    )
    console.log(
      `Expected exit code ${expectedExitCode} but command exited with code ${cmdProcess.code}`
    )
    afterAll()
    shell.exit(1)
  }
  console.log(
    '==========================================================================='
  )
}
