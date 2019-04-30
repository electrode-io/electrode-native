// ==============================================================================
// Script to setup development environment
// Only meant to be used by ern-platform developers/contributors
// ==============================================================================
const childProcess = require('child_process')
const execSync = childProcess.execSync

console.log('Performing Electrode Native development setup. Please wait.')
execSync(`yarn install`)

const chalk = require('chalk')
const shell = require('shelljs')
const os = require('os')
const path = require('path')

// Path to ern platform root directory
const ERN_PATH = process.env.ERN_HOME || path.join(os.homedir(), '.ern')
// Path to ern platform cache directory (containing all installed cached versions of the platform)
const ERN_VERSIONS_CACHE_PATH = path.join(ERN_PATH, 'versions')
// Path from where this script is run (wherever the user cloned the repo locally)
const WORKING_DIR = process.cwd()
console.log('WORKING_DIR is ', WORKING_DIR)
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
`)
)
