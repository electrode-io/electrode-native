// ==============================================================================
// Script to setup development environment
// Only meant to be used by ern-platform developers/contributors
// ==============================================================================
const childProcess = require('child_process')
const execSync = childProcess.execSync

console.log('Performing Electrode Native development setup. Please wait...')
execSync(`yarn`)

const chalk = require('chalk')
const shell = require('shelljs')
const os = require('os')
const path = require('path')
const fs = require('fs')

// Ensure directory structure exists and create symlink
const ERN_HOME = process.env.ERN_HOME || path.join(os.homedir(), '.ern')
shell.mkdir('-p', path.join(ERN_HOME, 'versions'))
shell.ln('-sf', process.cwd(), path.join(ERN_HOME, 'versions', '1000.0.0'))

// Create initial .ernrc if necessary
const ERN_RC = path.join(ERN_HOME, '.ernrc')
if (!fs.existsSync(ERN_RC)) {
  const ernRc = {
    platformVersion: '1000.0.0',
  }
  fs.writeFileSync(ERN_RC, JSON.stringify(ernRc, null, 2).concat('\n'))
}

console.log(
  chalk.green(`
==============================================================================
Development environment setup complete!
Version ${chalk.bold(`1000.0.0`)} has been symlinked to the current directory.

You can switch to the latest release version by running:
${chalk.yellow(`ern platform use latest`)}

Switch to the development version:
${chalk.yellow(`ern platform use 1000.0.0`)}

Enjoï.
==============================================================================
`)
)
