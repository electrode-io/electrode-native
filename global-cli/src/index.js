'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const ora = require('ora')
const spawn = childProcess.spawn
const execSync = childProcess.execSync
const os = require('os')

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
const ERN_PATH = path.join(os.homedir(), '.ern')
// Path to ern platform versions folder (containing all installed versions of the platform)
const ERN_VERSIONS_CACHE_PATH = path.join(ERN_PATH, 'versions')
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_PATH, '.ernrc')
// Path to potential ern local configuration file (local to the folder where ern command is run)
const ERN_RC_LOCAL_FILE_PATH = path.join(process.cwd(), '.ernrc')
// Name of ern local client NPM package
const ERN_LOCAL_CLI_PACKAGE = 'ern-local-cli'

// Entry point
if (!fs.existsSync(ERN_PATH)) {
  firstTimeInstall()
} else {
  runLocalCli()
}

// First run ever of ern (no versions installed at all yet)
// Create all folders and install/activate current platform version
function firstTimeInstall () {
  try {
    const isDebug = process.argv.indexOf('--debug') !== -1

    const spinner = ora('Performing first time install of Electrode Native').start()

    // Create path platform root folder
    fs.mkdirSync(ERN_PATH)

    // Create cached versions folder
    fs.mkdirSync(ERN_VERSIONS_CACHE_PATH)

    // List all available versions from electrode-native git repository
    const latestVersion = getLatestErnLocalCliVersion()

    // Create the version directory
    const pathToVersionDirectory = path.join(ERN_VERSIONS_CACHE_PATH, latestVersion)
    fs.mkdirSync(pathToVersionDirectory)
    fs.mkdirSync(path.join(pathToVersionDirectory, 'node_modules'))
    process.chdir(pathToVersionDirectory)
    let installProc

    if (isYarnInstalled()) {
      // Favor yarn if it is installed as it will greatly speed up install
      spinner.text = `Installing Electrode Native v${latestVersion} using yarn. This might take a while`
      installProc = spawn('yarn',
        [ 'add', `${ERN_LOCAL_CLI_PACKAGE}@${latestVersion}`, '--exact', '--ignore-engines' ],
        { cwd: pathToVersionDirectory })
    } else {
      spinner.text = `Installing Electrode Native v${latestVersion} using npm. This might take a while`
      installProc = spawn('npm',
        [ 'install', `${ERN_LOCAL_CLI_PACKAGE}@${latestVersion}` ],
        { cwd: pathToVersionDirectory })
    }

    installProc.stdout.on('data', function (data) {
      isDebug && console.log(data.toString())
    })

    installProc.stderr.on('data', function (data) {
      isDebug && console.log(data.toString())
    })

    installProc.on('close', function (code) {
      if (code === 0) {
        spinner.succeed(`Hurray ! Electrode Native v${latestVersion} was successfully installed.`)
      } else {
        spinner.fail(`Something went wrong :( Run the command again with --debug flag for more info.`)
        execSync(`rm -rf ${ERN_PATH}`)
      }
    })
  } catch (e) {
    // If something went wrong, we just clean up everything.
    // Don't want to create and leave the .ern global folder hanging around
    // in a bad state
    console.log(`Something went wrong :( Run the command again with --debug flag for more info.`)
    execSync(`rm -rf ${ERN_PATH}`)
  }
}

// At least a version of ern-local-cli is installed locally
// Just select the version of ern currently in use (stored in the .ernrc file)
// and call the default exported method
// Basically, it just proxy the ern command to the ern-local-cli (local client)
// of the version currently in use
function runLocalCli () {
  let ernRcPath
  if (fs.existsSync(ERN_RC_LOCAL_FILE_PATH)) {
    ernRcPath = ERN_RC_LOCAL_FILE_PATH
  } else {
    ernRcPath = ERN_RC_GLOBAL_FILE_PATH
  }

  const ernRc = JSON.parse(fs.readFileSync(ernRcPath, 'utf-8'))

  if ((ernRc.platformVersion === '1000') || (ernRc.platformVersion === '1000.0.0')) {
    require(`${ERN_VERSIONS_CACHE_PATH}/${ernRc.platformVersion}/ern-local-cli/src/index.dev.js`)
  } else {
    require(`${ERN_VERSIONS_CACHE_PATH}/${ernRc.platformVersion}/node_modules/ern-local-cli/src/index.prod.js`)
  }
}

function getLatestErnLocalCliVersion () {
  try {
    let versions = JSON.parse(execSync(`npm info ${ERN_LOCAL_CLI_PACKAGE} versions --json`))
    return versions.pop()
  } catch (e) {
    console.log(e)
  }
}

function isYarnInstalled () {
  try {
    execSync('yarn --version 1>/dev/null 2>/dev/null')
    return true
  } catch (e) {
    return false
  }
}
