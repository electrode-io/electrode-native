#!/usr/bin/env node
const path = require('path')
const shell = require('shelljs')
process.env.__ERN_TEST__ = true
process.env.TS_NODE_TRANSPILE_ONLY = true
process.env.TS_NODE_PROJECT = path.resolve('..', 'tsconfig.json')
const testCwd = process.cwd()
if (!require('fs').existsSync(require('path').join(process.cwd(), 'test'))) {
  console.log('no tests for project ', testCwd)
  process.exit(0)
}
console.log(`running tests in ${testCwd}`)
process.argv.push('-r', 'ts-node/register')
process.argv.push('-r', 'tsconfig-paths/register')
process.argv.push('--file', '../ern-core/test/mocha-root-level-hooks.ts')
if (process.env.ENV_AZURE_PIPELINE) {
  // Create `node_modules/mocha` in current module directory
  // and copy top level `node_modules/mocha/package.json` to
  // this directory.
  // Done due to the fact that mocha-junit-reporter doesn't
  // currently play well with mono-repo setup as it looks for
  // mocha package.json in node_modules of current directory.
  // See https://github.com/michaelleeallen/mocha-junit-reporter/blob/v1.23.0/index.js#L17
  // But because we are using a mono-repo, mocha node module
  // is hoisted in top level (root) directory.
  // To remove once mocha-junit-reporter is updated to support
  // mono-repo setup.
  shell.mkdir('-p', path.join(testCwd, 'node_modules', 'mocha'))
  shell.cp(
    '-rf',
    path.resolve('..', 'node_modules', 'mocha', 'package.json'),
    path.join(testCwd, 'node_modules', 'mocha', 'package.json')
  )
  process.argv.push('--reporter', 'mocha-junit-reporter')
}
process.argv.push('test/**/*-test.{ts,js}')
require('mocha/bin/_mocha')
