#!/usr/bin/env node
if (process.env['BABEL_ENV'] !== 'coverage') {
  // babelhook is already required through nyc command
  require('ern-util-dev/babelhook')
  require('./index.js').default()
} else {
  require('./index.prod')
}
