#!/usr/bin/env node
process.env['__ERN_TEST__'] = true
if (!require('fs').existsSync(require('path').join(process.cwd(), 'test'))) {
  console.log('no tests for project ', process.cwd())
  process.exit(0)
}
console.log(`running tests in ${process.cwd()}`)
process.argv.push('-r', 'tsconfig-paths/register')
process.argv.push('-r', 'ts-node/register')
process.argv.push('test/*-test.{ts,js}')
require('mocha/bin/_mocha')
