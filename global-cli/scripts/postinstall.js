#!/usr/bin/env node
'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const execSync = childProcess.execSync

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
var ERN_PATH = path.join(process.env['HOME'], '.ern')
// Path to ern platform versions folder (containing all installed versions of the platform)
const ERN_VERSIONS_CACHE_PATH = path.join(ERN_PATH, 'versions')
// Name of ern local client NPM package
const ERN_LOCAL_CLI_PACKAGE = 'ern-local-cli'

// First run ever of ern (no versions installed at all yet)
// Create all folders and install/activate current platform version
if (!fs.existsSync(ERN_PATH)) {
  try {
    // Create path platform root folder
    fs.mkdirSync(ERN_PATH)

    // Create cached versions folder
    fs.mkdirSync(ERN_VERSIONS_CACHE_PATH)

    // List all available versions from electrode-react-native git repository
    const latestVersion = getLatestErnLocalCliVersion()

    // Create the version directory
    const pathToVersionDirectory = path.join(ERN_VERSIONS_CACHE_PATH, latestVersion)
    fs.mkdirSync(pathToVersionDirectory)
    process.chdir(pathToVersionDirectory)
    console.log(`Installing Electrode React Native ${latestVersion}`)
    if (isYarnInstalled()) {
      // Favor yarn if it is installed as it will greatly speed up install
      execSync(`yarn add ${ERN_LOCAL_CLI_PACKAGE}@${latestVersion} --exact`)
    } else {
      execSync(`npm install ${ERN_LOCAL_CLI_PACKAGE}@${latestVersion} --exact`)
    }
    console.log(`Hurray !`)
  } catch (e) {
    // If something went wrong, we just clean up everything.
    // Don't want to create and leave the .ern global folder hanging around
    // in a bad state
    console.log(`Something went wrong ! ${e}`)
    execSync(`rm -rf ${ERN_PATH}`)
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
