#!/usr/bin/env node
const fs = require('fs');
const child_process = require('child_process');
const execSync = child_process.execSync;
const chalk = require('chalk');

const ERN_GLOBAL_PATH = `${process.env['HOME']}/.ern`;
const ERN_PLATFORM_REPO_PATH = `${ERN_GLOBAL_PATH}/ern-platform`;
const ERN_DEFAULT_GIT_REPO = `git@gecgithub01.walmart.com:Electrode-Mobile-Platform/ern-platform.git`;
const ERN_CACHE_PATH = `${ERN_GLOBAL_PATH}/cache`;
const ERN_RC_GLOBAL_FILE_PATH = `${ERN_GLOBAL_PATH}/.ernrc`;
const ERN_RC_LOCAL_FILE_PATH = `${process.cwd()}/.ernrc`;

// First run
// Create all folders and install/activate current platform version
if (!fs.existsSync(ERN_GLOBAL_PATH)) {
  let gitRepo = ERN_DEFAULT_GIT_REPO;
  if (process.argv.length >= 3) {
    gitRepo = process.argv[2];
  }
  fs.mkdirSync(ERN_GLOBAL_PATH);
  execSync(`git clone ${gitRepo} ${ERN_PLATFORM_REPO_PATH}`);
  fs.mkdirSync(ERN_CACHE_PATH);
  fs.writeFileSync(ERN_RC_GLOBAL_FILE_PATH, '{}');
  const install = require(`${ERN_PLATFORM_REPO_PATH}/install.js`).install;
  install(true /*shouldSwitchToVersion*/);
} else {
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
  var run = require(`${ERN_CACHE_PATH}/v${ernRc.platformVersion}/ern-local-cli/distrib/index.js`);
  run.default();
}

// .ern
// |_ ern-platform (git)
// |_ cache
//   |_ v1
//   |_ v2
// |_ .ernrc
