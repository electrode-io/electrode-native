#!/usr/bin/env node
process.env['BABEL_ENV'] = 'coverage'
process.argv.push(
  '--sourceMap=false',
  '--reportDir=.coverage',
  '--reporter=json',
  '--reporter=text',
  '--instrument=false',
  '--all',
  '--include=ern-*/src/**/*.js',
  'node',
  'system-tests/system-tests')

require('nyc/bin/nyc')
