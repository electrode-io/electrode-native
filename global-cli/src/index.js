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
// |_ versions
//   |_ 0.5.1
//   |_ 0.6.0
// ....
// |_ .ernrc

// Path to ern platform root folder
const ERN_PATH = path.join(process.env['HOME'], '.ern')
// Path to ern platform versions folder (containing all installed versions of the platform)
const ERN_VERSIONS_CACHE_PATH = path.join(ERN_PATH, 'versions')
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_PATH, '.ernrc')
// Path to potential ern local configuration file (local to the folder where ern command is run)
const ERN_RC_LOCAL_FILE_PATH = path.join(process.cwd(), '.ernrc')

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
  require(`${ERN_VERSIONS_CACHE_PATH}/${ernRc.platformVersion}/node_modules/ern-local-cli/src/index.dev.js`)
} else {
  require(`${ERN_VERSIONS_CACHE_PATH}/${ernRc.platformVersion}/node_modules/ern-local-cli/src/index.prod.js`)
}
