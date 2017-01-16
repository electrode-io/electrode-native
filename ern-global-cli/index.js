const fs = require('fs');
const child_process = require('child_process');
const execSync = child_process.execSync;
const chalk = require('chalk');

//
// Directory structure (stored in user home folder)
//
// .ern
// |_ ern-platform (git)
// |_ cache
//   |_ v1
//   |_ v2
// ....
// |_ .ernrc

// Path to ern platform root folder
const ERN_PATH = `${process.env['HOME']}/.ern`;
// Path to ern platform cloned git repo
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
// Default path to the github repo of the platform
const ERN_DEFAULT_GIT_REPO = `git@gecgithub01.walmart.com:Electrode-Mobile-Platform/ern-platform.git`;
// Path to ern platform cache folder (containing all installed cached versions of the platform)
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = `${ERN_PATH}/.ernrc`;
// Path to potential ern local configuration file (local to the folder where ern command is run)
const ERN_RC_LOCAL_FILE_PATH = `${process.cwd()}/.ernrc`;

// First run ever of ern (no versions installed at all yet)
// Create all folders and install/activate current platform version
if (!fs.existsSync(ERN_PATH)) {
  // Use default git repo or the one provided as a command line argument to ern.
  let gitRepo = ERN_DEFAULT_GIT_REPO;
  if (process.argv.length >= 3) {
    gitRepo = process.argv[2];
  }

  // Create path platform root folder
  fs.mkdirSync(ERN_PATH);

  // Create cached versions folder
  fs.mkdirSync(ERN_VERSIONS_CACHE_PATH);

  // Clone github repository containing the platform
  execSync(`git clone ${gitRepo} ${ERN_PLATFORM_REPO_PATH}`);

  // Cd into platform repo folder
  process.chdir(ERN_PLATFORM_REPO_PATH);

  // List all available versions from remote
  const branchVersionRe = /heads\/v(\d+)/;
  const latestVersion = execSync(`git ls-remote --heads`)
    .toString()
    .split('\n')
    .filter(v => branchVersionRe.test(v))
    .slice(-1)[0];

  // Checkout latest branch version
  const latestVersionNumber = branchVersionRe.exec(latestVersion)[1];
  execSync(`git checkout origin/v${latestVersionNumber}`);

  // Call install function
  const install = require(`${ERN_PLATFORM_REPO_PATH}/install.js`).install;

  install();
}
// Not a first run (at least one version of ern platform is installed)
// Just select the version of ern currently in use (stored in the .ernrc file)
// and call the default exported method
// Basically, it just proxy the ern command to the ern-local-cli (local client)
// of the version currently in use
else {
  let ernRcPath;
  // use local .ernrc file if it exists
  if (fs.existsSync(ERN_RC_LOCAL_FILE_PATH)) {
    ernRcPath = ERN_RC_LOCAL_FILE_PATH;
  }
  // Otherwise use global one
  else {
    ernRcPath = ERN_RC_GLOBAL_FILE_PATH;
  }

  const ernRc = JSON.parse(fs.readFileSync(ernRcPath, 'utf-8'));
  var run = require(`${ERN_VERSIONS_CACHE_PATH}/v${ernRc.platformVersion}/ern-local-cli/src/index.js`);
  run.default();
}
