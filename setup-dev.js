
//==============================================================================
// Script to setup development environment
// Only meant to be used by ern-platform developers/contributors
//==============================================================================

const chalk = require('chalk');
const shell = require('shelljs');

// Path to ern platform root folder
const ERN_PATH = `${process.env['HOME']}/.ern`;
// Path to ern platform cloned git repo
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
// Path to ern platform cache folder (containing all installed cached versions of the platform)
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = `${ERN_PATH}/.ernrc`;
// Path from where this script is run (wherever the user cloned the repo locally)
const WORKING_DIR = process.cwd();

// Create a git tag v1000.0 so that the platform can detect this version
shell.cd(ERN_PLATFORM_REPO_PATH);
shell.exec('git tag v1000.0');

// Create the cache folder for this version as a symlink to current working folder
shell.cd(ERN_VERSIONS_CACHE_PATH);
shell.exec(`ln -s ${WORKING_DIR} v1000`);

console.log(
chalk.green(`
=================================================================
Development environment is now setup !

Version v1000 has been created and points to your working folder.
You can switch to this version by running :
${chalk.yellow(`ern platform use 1000`)}

Enjoï.
=================================================================
`));
