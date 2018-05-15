#!/usr/bin/env node
var execSync = require('child_process').execSync

var stdout = execSync(
  'git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD'
)

if (stdout) {
  if (/\nyarn\.lock/.test(stdout)) {
    console.log('========================================================')
    console.log('Dependency changes detected')
    console.log('Running yarn install')
    console.log('========================================================')
    execSync('yarn install', { stdio: [0, 1, 2] })
  }
}
