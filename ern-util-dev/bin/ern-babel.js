#!/usr/bin/env node
const babelRc = require('../babelrc.prod.json')
process.argv.push('--source-maps')
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
