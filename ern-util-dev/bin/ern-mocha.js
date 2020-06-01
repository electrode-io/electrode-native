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
process.argv.push('-r', 'source-map-support/register')
process.argv.push('--file', '../ern-core/test/mocha-root-level-hooks.ts')
process.argv.push('test/**/*-test.{ts,js}')
require('mocha/bin/_mocha')
