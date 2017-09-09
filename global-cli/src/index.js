'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const execSync = childProcess.execSync

// Version update notifier
const updateNotifier = require('update-notifier')
const pkg = require('../package.json')
updateNotifier({ pkg }).notify()

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
const ERN_PATH = path.join(process.env['HOME'], '.ern')
// Default path to the github repo of the platform
const ERN_DEFAULT_GIT_REPO = `https://github.com/electrode-io/electrode-react-native.git`
// Path to ern platform versions folder (containing all installed versions of the platform)
const ERN_VERSIONS_CACHE_PATH = path.join(ERN_PATH, 'versions')
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_PATH, '.ernrc')
// Path to potential ern local configuration file (local to the folder where ern command is run)
const ERN_RC_LOCAL_FILE_PATH = path.join(process.cwd(), '.ernrc')

// First run ever of ern (no versions installed at all yet)
// Create all folders and install/activate current platform version
if (!fs.existsSync(ERN_PATH)) {
  try {
    // Use default git repo or the one provided as a command line argument to ern.
    let gitRepo = ERN_DEFAULT_GIT_REPO
    if (process.argv.length >= 3) {
      gitRepo = process.argv[2]
    }

    // Create path platform root folder
    fs.mkdirSync(ERN_PATH)

    // Create cached versions folder
    fs.mkdirSync(ERN_VERSIONS_CACHE_PATH)

    // List all available versions from electrode-react-native git repository
    const tagVersionRe = /tags\/v(.+)/
    const latestVersion = execSync(`git ls-remote --tags ${gitRepo}`)
      .toString()
      .split('\n')
      .filter(v => tagVersionRe.test(v))
      .slice(-1)[0]

    // Checkout latest branch version
    const latestVersionNumber = tagVersionRe.exec(latestVersion)[1]

    // Create the version directory
    const pathToVersionDirectory = path.join(ERN_VERSIONS_CACHE_PATH, latestVersionNumber)
    fs.mkdirSync(pathToVersionDirectory)
    process.chdir(pathToVersionDirectory)
    execSync(`npm install ern-local-cli@${latestVersionNumber}`)
  } catch (e) {
    // If something went wrong, we just clean up everything.
    // Don't want to create and leave the .ern global folder hanging around
    // in a bad state
    console.log(`Something went wrong ! ${e}`)
    execSync(`rm -rf ${ERN_PATH}`)
  }
} else {
  // Not a first run (at least one version of ern platform is installed)
  // Just select the version of ern currently in use (stored in the .ernrc file)
  // and call the default exported method
  // Basically, it just proxy the ern command to the ern-local-cli (local client)
  // of the version currently in use
  let ernRcPath
  if (fs.existsSync(ERN_RC_LOCAL_FILE_PATH)) {
    ernRcPath = ERN_RC_LOCAL_FILE_PATH
  } else {
    ernRcPath = ERN_RC_GLOBAL_FILE_PATH
  }

  const ernRc = JSON.parse(fs.readFileSync(ernRcPath, 'utf-8'))

  if ((ernRc.platformVersion === '1000') || (ernRc.platformVersion === '1000.0.0')) {
    require(`${ERN_VERSIONS_CACHE_PATH}/v${ernRc.platformVersion}/node_modules/ern-local-cli/src/index.dev.js`)
  } else {
    require(`${ERN_VERSIONS_CACHE_PATH}/v${ernRc.platformVersion}/node_modules/ern-local-cli/src/index.prod.js`)
  }
}
