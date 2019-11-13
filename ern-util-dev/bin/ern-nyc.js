#!/usr/bin/env node
var fs = require('fs')
process.env.__ERN_TEST__ = true
process.env.TS_NODE_TRANSPILE_ONLY = true
if (!fs.existsSync('test')) {
  console.log(`No tests found in ${process.cwd()}/test`)
  process.exit(0)
}
process.argv.push(
  '--sourceMap=true',
  '--reportDir=.coverage',
  '--reporter=json',
  '--reporter=text-summary',
  '--instrument=true',
  '--extension=.ts',
  '--cache=true',
  '--include',
  'src/**/*.{ts,js}',
  '../node_modules/.bin/mocha',
  '-r',
  'source-map-support/register',
  '-r',
  'tsconfig-paths/register',
  '-r',
  'ts-node/register',
  '--file',
  '../ern-core/test/mocha-root-level-hooks.ts',
  '--full-trace',
  '--bail',
  'test/*-test.{ts,js}'
)
require('nyc/bin/nyc')
