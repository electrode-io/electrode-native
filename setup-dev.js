// ==============================================================================
// Script to setup development environment
// Only meant to be used by ern-platform developers/contributors
// ==============================================================================
const childProcess = require('child_process')
const execSync = childProcess.execSync

console.log('Performing install and rebuild, this may take a few minutes, please wait..')
execSync(`yarn install`)
execSync(`npm run rebuild`)

const chalk = require('chalk')
const shell = require('shelljs')
const os = require('os')

// Path to ern platform root directory
const ERN_PATH = `${os.homedir()}/.ern`
// Path to ern platform cache directory (containing all installed cached versions of the platform)
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/versions`
// Path from where this script is run (wherever the user cloned the repo locally)
const WORKING_DIR = process.cwd()

// Create the cache directory for this version as a symlink to current working directory
shell.cd(ERN_VERSIONS_CACHE_PATH)
shell.ln('-sf', WORKING_DIR, '1000.0.0')

console.log(
    chalk.green(`
=================================================================
Development environment is now setup !
Version v1000.0.0 has been created and points to your working directory.
You can switch to this version by running :
${chalk.yellow(`ern platform use 1000.0.0`)}
Enjoï.
=================================================================
`))
