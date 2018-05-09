#!/usr/bin/env node
const path = require('path')
const ernModulePath = process.cwd()
require('rimraf').sync(path.resolve(ernModulePath, 'dist'))
process.argv.push('--project')
process.argv.push(path.resolve(ernModulePath, 'tsconfig.release.json'))
console.log('running tsc with', process.argv.slice(2))
require('typescript/lib/tsc')
