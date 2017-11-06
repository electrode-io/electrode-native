#!/usr/bin/env node
if (!process.env.COVERAGE) {
  // babelhook is already required through nyc command
  require('ern-util-dev/babelhook')
}
require('./index.js').default()
