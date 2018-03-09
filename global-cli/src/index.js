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
// Directory structure (stored in user home directory)
//
// .ern
// |_ versions
//   |_ 0.5.1
//   |_ 0.6.0
// ....
// |_ .ernrc

// Initial process cwd
const INITIAL_PROCESS_CWD = process.cwd()
// Path to ern platform root directory
const ERN_PATH = path.join(os.homedir(), '.ern')
// Path to ern platform versions directory (containing all installed versions of the platform)
const ERN_VERSIONS_CACHE_PATH = path.join(ERN_PATH, 'versions')
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_PATH, '.ernrc')
// Path to potential ern local configuration file (local to the directory where ern command is run)
const ERN_RC_LOCAL_FILE_PATH = path.join(INITIAL_PROCESS_CWD, '.ernrc')
// Name of ern local client NPM package
const ERN_LOCAL_CLI_PACKAGE = 'ern-local-cli'

const IS_WINDOWS_PLATFORM = /^win/.test(process.platform)

// Entry point
if (!fs.existsSync(ERN_PATH)) {
  firstTimeInstall()
} else {
  runLocalCli()
}

// First run ever of ern (no versions installed at all yet)
// Create all directories and install/activate current platform version
function firstTimeInstall () {
  try {
    const isDebug = process.argv.indexOf('--debug') !== -1

    const spinner = ora('Performing first time install of Electrode Native').start()

    // Create path platform root directory
    fs.mkdirSync(ERN_PATH)

    // Create cached versions directory
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
      if (IS_WINDOWS_PLATFORM) {
        installProc = spawn('cmd',
          ['/s', '/c', 'yarn', 'add', `${ERN_LOCAL_CLI_PACKAGE}@${latestVersion}`, '--exact', '--ignore-engines'],
          { cwd: pathToVersionDirectory })
      } else {
        installProc = spawn('yarn',
          ['add', `${ERN_LOCAL_CLI_PACKAGE}@${latestVersion}`, '--exact', '--ignore-engines'],
          { cwd: pathToVersionDirectory })
      }
    } else {
      spinner.text = `Installing Electrode Native v${latestVersion} using npm. This might take a while`
      if (IS_WINDOWS_PLATFORM) {
        installProc = spawn('cmd',
          ['/s', '/c', 'npm', 'install', `${ERN_LOCAL_CLI_PACKAGE}@${latestVersion}`],
          { cwd: pathToVersionDirectory })
      } else {
        installProc = spawn('npm',
          ['install', `${ERN_LOCAL_CLI_PACKAGE}@${latestVersion}`],
          { cwd: pathToVersionDirectory })
      }
    }

    installProc.stdout.on('data', function (data) {
      isDebug && console.log(data.toString())
    })

    installProc.stderr.on('data', function (data) {
      isDebug && console.log(data.toString())
    })

    installProc.on('error', function (err) {
      console.log(`Something went wrong ${err} :( Run the command again with --debug flag for more info.`)
      removeErnDirectory()
    })

    installProc.on('close', function (code) {
      if (code === 0) {
        spinner.succeed(`Hurray ! Electrode Native v${latestVersion} was successfully installed.`)
      } else {
        spinner.fail(`Something went wrong :( Run the command again with --debug flag for more info.`)
        removeErnDirectory()
      }
    })
  } catch (e) {
    console.log(`Something went wrong :( Run the command again with --debug flag for more info.`)
    removeErnDirectory()
  }
}

// Remove .ern global directory.
// Done if something' gone wrong during install.
// Don't want to leave the .ern global directory hanging around in a bad state
function removeErnDirectory () {
  console.log(`Performing cleanup. Please wait for the process to exit.`)
  process.chdir(INITIAL_PROCESS_CWD)
  if (IS_WINDOWS_PLATFORM) {
    execSync(`rd /s /q ${ERN_PATH}`)
  } else {
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
  const pathToErnVersionEntryPoint = ((ernRc.platformVersion === '1000') || (ernRc.platformVersion === '1000.0.0'))
    ? path.join(ERN_VERSIONS_CACHE_PATH, '1000.0.0', 'ern-local-cli', 'src', 'index.dev.js')
    : path.join(ERN_VERSIONS_CACHE_PATH, ernRc.platformVersion, 'node_modules', 'ern-local-cli', 'src', 'index.prod.js')

  if (!fs.existsSync(pathToErnVersionEntryPoint)) {
    console.error(`Path not found : ${pathToErnVersionEntryPoint}`)
    removeErnDirectory()
    process.exit(1)
  }

  require(pathToErnVersionEntryPoint)
}

function getLatestErnLocalCliVersion () {
  try {
    let versions
    if (isYarnInstalled()) {
      versions = JSON.parse(execSync(`yarn info ${ERN_LOCAL_CLI_PACKAGE} versions --json`)).data
    } else {
      versions = JSON.parse(execSync(`npm info ${ERN_LOCAL_CLI_PACKAGE} versions --json`))
    }
    return versions.pop()
  } catch (e) {
    console.log(e)
  }
}

function isYarnInstalled () {
  try {
    execSync('yarn --version')
    return true
  } catch (e) {
    return false
  }
}
