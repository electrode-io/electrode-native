#!/usr/bin/env node
process.argv.push(
  '--sourceMap=false',
  '--reportDir=.coverage',
  '--reporter=json',
  '--reporter=text',
  '--show-process-tree',
  '--instrument=false',
  '--all',
  `--require=${__dirname}/ern-util-dev/babelhook-coverage`,
  '--include=ern-*/src/**/*.js',
  'node',
  'system-tests')

require('nyc/bin/nyc')
