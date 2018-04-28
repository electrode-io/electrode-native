#!/usr/bin/env node
process.env.NODE_ENV = 'coverage-st'
process.argv.push(
  '--sourceMap=true',
  '--reportDir=.coverage',
  '--reporter=json',
  '--reporter=text-summary',
  '--instrument=false',
  '--extension=.ts',
  '--all',
  '--include=ern-*/dist/**/*.js',
  'node',
  'system-tests/system-tests',
  '--all'
)

require('nyc/bin/nyc')
