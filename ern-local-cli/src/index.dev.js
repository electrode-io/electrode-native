'use strict'
const path = require('path')
const Module = require('module')
const oload = Module._load

if (process.env.NODE_ENV === 'coverage-st') {
  // tslint:disable-next-line:no-var-requires
  require('../dist/index').default()
} else {
  process.env.NODE_ENV = 'development'
  process.env.TS_NODE_PROJECT = path.resolve(
    __dirname,
    '..',
    '..',
    'tsconfig.json'
  )

  let tsNodeSourceMapSupportModule
  Module._load = function(file, parent) {
    if (file === 'source-map-support' && parent.id.includes('ts-node')) {
      tsNodeSourceMapSupportModule = oload(file, parent)
      return tsNodeSourceMapSupportModule
    } else if (file === 'source-map-support') {
      return tsNodeSourceMapSupportModule
    } else {
      return oload(file, parent)
    }
  }

  require('tsconfig-paths/register')
  require('ts-node').register({})
  require('./index.ts').default()
}
