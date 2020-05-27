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
const ERN_PATH = process.env['ERN_HOME'] || path.join(os.homedir(), '.ern')
// Path to ern platform versions directory (containing all installed versions of the platform)
const ERN_VERSIONS_CACHE_PATH = path.join(ERN_PATH, 'versions')
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_PATH, '.ernrc')
// Path to potential ern local configuration file (local to the directory where ern command is run)
const ERN_RC_LOCAL_FILE_PATH = path.join(INITIAL_PROCESS_CWD, '.ernrc')
// Resolved path to ern configuration file
const ENR_RC_RESOLVED_PATH = fs.existsSync(ERN_RC_LOCAL_FILE_PATH)
  ? ERN_RC_LOCAL_FILE_PATH
  : ERN_RC_GLOBAL_FILE_PATH
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
function firstTimeInstall() {
  try {
    const isDebug = process.argv.indexOf('--debug') !== -1

    const spinner = ora(
      'Performing first time install of Electrode Native'
    ).start()

    // Create path platform root directory
    fs.mkdirSync(ERN_PATH)

    // Create cached versions directory
    fs.mkdirSync(ERN_VERSIONS_CACHE_PATH)

    // The initial version to install is either set via an environment variable,
    // declared in a local .ernrc file if it exists, or the latest available
    // version available on npm.
    let initialVersion
    if (process.env['ERN_INITIAL_VERSION']) {
      initialVersion = process.env['ERN_INITIAL_VERSION']
    } else if (ERN_RC_LOCAL_FILE_PATH === ENR_RC_RESOLVED_PATH) {
      const ernRc = JSON.parse(fs.readFileSync(ENR_RC_RESOLVED_PATH, 'utf-8'))
      initialVersion = ernRc.platformVersion
    } else {
      initialVersion = getLatestVersion(ERN_LOCAL_CLI_PACKAGE)
    }

    // Create the version directory
    const pathToVersionDirectory = path.join(
      ERN_VERSIONS_CACHE_PATH,
      initialVersion
    )
    fs.mkdirSync(pathToVersionDirectory)
    fs.mkdirSync(path.join(pathToVersionDirectory, 'node_modules'))
    fs.writeFileSync(path.join(pathToVersionDirectory, 'package.json'), '{}')
    process.chdir(pathToVersionDirectory)
    let installProc

    if (isYarnInstalled()) {
      // Favor yarn if it is installed as it will greatly speed up install
      spinner.text = `Installing Electrode Native v${initialVersion} using yarn. This might take a while`
      if (IS_WINDOWS_PLATFORM) {
        installProc = spawn(
          'cmd',
          [
            '/s',
            '/c',
            'yarn',
            'add',
            `${ERN_LOCAL_CLI_PACKAGE}@${initialVersion}`,
            '--exact',
            '--ignore-engines',
          ],
          { cwd: pathToVersionDirectory }
        )
      } else {
        installProc = spawn(
          'yarn',
          [
            'add',
            `${ERN_LOCAL_CLI_PACKAGE}@${initialVersion}`,
            '--exact',
            '--ignore-engines',
          ],
          { cwd: pathToVersionDirectory }
        )
      }
    } else {
      spinner.text = `Installing Electrode Native v${initialVersion} using npm. This might take a while`
      if (IS_WINDOWS_PLATFORM) {
        installProc = spawn(
          'cmd',
          [
            '/s',
            '/c',
            'npm',
            'install',
            `${ERN_LOCAL_CLI_PACKAGE}@${initialVersion}`,
          ],
          { cwd: pathToVersionDirectory }
        )
      } else {
        installProc = spawn(
          'npm',
          ['install', `${ERN_LOCAL_CLI_PACKAGE}@${initialVersion}`],
          { cwd: pathToVersionDirectory }
        )
      }
    }

    installProc.stdout.on('data', function(data) {
      isDebug && console.log(data.toString())
    })

    installProc.stderr.on('data', function(data) {
      isDebug && console.log(data.toString())
    })

    installProc.on('error', function(err) {
      console.log(
        `Something went wrong ${err} :( Run the command again with --debug flag for more info.`
      )
      cleanupAndExitWithFailure()
    })

    installProc.on('close', function(code) {
      if (code === 0) {
        spinner.succeed(
          `Hurray ! Electrode Native v${initialVersion} was successfully installed.`
        )
        runLocalCli()
      } else {
        spinner.fail(
          'Something went wrong :( Run the command again with --debug flag for more info.'
        )
        cleanupAndExitWithFailure()
      }
    })
  } catch (e) {
    console.error(
      'Something went wrong :( Run the command again with --debug flag for more info.'
    )
    cleanupAndExitWithFailure()
  }
}

function cleanupAndExitWithFailure() {
  removeErnDirectory()
  process.exit(1)
}

// Remove .ern global directory.
// Done if something' gone wrong during install.
// Don't want to leave the .ern global directory hanging around in a bad state
function removeErnDirectory() {
  console.log('Performing cleanup. Please wait for the process to exit.')
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
function runLocalCli() {
  const ernRc = JSON.parse(fs.readFileSync(ENR_RC_RESOLVED_PATH, 'utf-8'))
  const pathToErnVersionEntryPoint =
    ernRc.platformVersion === '1000' || ernRc.platformVersion === '1000.0.0'
      ? path.join(
          ERN_VERSIONS_CACHE_PATH,
          '1000.0.0',
          'ern-local-cli',
          'src',
          'index.dev.js'
        )
      : path.join(
          ERN_VERSIONS_CACHE_PATH,
          ernRc.platformVersion,
          'node_modules',
          'ern-local-cli',
          'src',
          'index.prod.js'
        )

  if (!fs.existsSync(pathToErnVersionEntryPoint)) {
    console.error(`Path not found : ${pathToErnVersionEntryPoint}`)
    removeErnDirectory()
    process.exit(1)
  }

  require(pathToErnVersionEntryPoint)
}

function getLatestVersion(pkg) {
  try {
    let versions
    if (isYarnInstalled()) {
      versions = JSON.parse(
        execSync(`yarn info ${pkg} versions --json`)
      ).data
    } else {
      versions = JSON.parse(
        execSync(`npm v ${pkg} versions --json`)
      )
    }
    return versions.pop()
  } catch (e) {
    console.error(e)
  }
}

function isYarnInstalled() {
  try {
    execSync('yarn --version')
    return true
  } catch (e) {
    return false
  }
}
