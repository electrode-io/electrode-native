'use strict'

require('babel-polyfill')
const conf = require('./babelrc.dev.json')
const Module = require('module')
const path = require('path')
const babelRegister = require('babel-register')
const oload = Module._load

if (process.env.COVERAGE) {
  conf.plugins.push([
    'istanbul',
    {
      'exclude': [
        '**/test/*-test.js'
      ]
    }
  ])
}

const projectPath = path.join(__dirname, '..')

conf.only = /ern-[^/]*\/(src|test|lib)/

function normalizePath (file, parent) {
  if (/^\./.test(file)) {
    return file
  }

  const pathToErnModule = path.join(projectPath, 'ern-')
  if (file.startsWith(pathToErnModule)) {
    return file.replace(pathToErnModule, '')
  }
  return file
}

Module._load = function (file, parent) {
  let absFile = normalizePath(file, parent)
  if (absFile) {
    let parts = absFile.split(path.sep)
    let scope = parts[0]
    let pkg = parts[1]
    let rest = parts.slice(2).join(path.sep)
    if (/ern-/.test(scope)) {
      if (!pkg || pkg === 'dist') pkg = 'src'
      file = path.join(projectPath, scope, pkg, rest || 'index')
    }
  }

  return oload(file, parent)
}

babelRegister(conf)
