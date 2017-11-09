#!/usr/bin/env node
let babelRc
if (process.env['BABEL_ENV'] !== 'coverage') {
  babelRc = require('../babelrc.prod.json')
} else {
  babelRc = require('../babelrc.coverage.json')
}

process.argv.push('--source-maps')
process.argv.push(babelRc.sourceMaps)
process.argv.push('--presets')
process.argv.push(babelRc.presets)
process.argv.push('--plugins')
process.argv.push(babelRc.plugins.join(','))
// src --out-dir distrib
process.argv.push('src')
process.argv.push('--out-dir')
process.argv.push('dist')

console.log('running babel with', process.argv.slice(2))
require('babel-cli/lib/babel')
