#!/usr/bin/env node
const ernModulePath = process.cwd()
const path = require('path')
process.argv.push('--project')
process.argv.push(path.resolve(ernModulePath, 'tsconfig.release.json'))
console.log('running tsc with', process.argv.slice(2))
require('typescript/lib/tsc')
