#!/usr/bin/env node
var fs = require('fs')

process.env['__ERN_TEST__'] = true

if (!fs.existsSync('test')) {
  console.log(`No tests found in ${process.cwd()}/test`)
  process.exit(0)
}

process.argv.push(
  '--sourceMap=false',
  '--reportDir=.coverage',
  '--reporter=json',
  '--reporter=text',
  '--show-process-tree',
  '--instrument=false',
  '--all',
  `--require=${__dirname}/../babelhook-coverage`,
  '--include=src/**/*.js',
  'mocha',
  'test/*-test.js')

require('nyc/bin/nyc')
