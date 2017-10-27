#!/usr/bin/env node
var execSync = require('child_process').execSync

var stdout = execSync('git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD')

if (stdout) {
  if (/\nyarn\.lock/.test(stdout)) {
    console.log('========================================================')
    console.log('Dependency changes detected in Electrode Native root')
    console.log('Running yarn install')
    console.log('========================================================')
    execSync('yarn install', { stdio: [0, 1, 2] })
  }
  if (/ern-.+(\/|\\)yarn\.lock/.test(stdout)) {
    console.log('========================================================')
    console.log('Dependency changes detected in one or more ern module(s)')
    console.log('Rebuilding Electrode Native platform')
    console.log('========================================================')
    execSync('npm run rebuild', { stdio: [0, 1, 2] })
  }
}
