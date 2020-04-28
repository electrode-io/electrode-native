#!/usr/bin/env node
process.argv.push(
  '--sourceMap=true',
  '--reportDir=.coverage',
  '--reporter=json',
  '--reporter=text-summary',
  '--reporter=html',
  '--instrument=false',
  '--cache=true',
  '--exclude-after-remap=false',
  '--include',
  'ern-*/dist/**/*.{ts,js}',
  'node',
  'system-tests/src/system-tests'
)

require('nyc/bin/nyc')
