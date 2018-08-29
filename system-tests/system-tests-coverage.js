#!/usr/bin/env node
process.argv.push(
  '--sourceMap=true',
  '--reportDir=.coverage',
  '--reporter=json',
  '--reporter=text-summary',
  '--reporter=html',
  '--instrument=true',
  '--extension=.ts',
  '--cache=true',
  '--include',
  'ern-*/src/**/*.{ts,js}',
  '--require',
  'source-map-support/register',
  'node',
  'system-tests/system-tests',
  '--all'
)

require('nyc/bin/nyc')
