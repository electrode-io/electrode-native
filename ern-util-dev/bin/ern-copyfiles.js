#!/usr/bin/env node
const fs = require('fs')
const shell = require('shelljs')
const path = require('path')
const ernModulePath = process.cwd()
const modulePackageJson = JSON.parse(
  fs.readFileSync(path.resolve(ernModulePath, 'package.json'))
)
if (modulePackageJson.copyFiles) {
  for (const copyDirective of modulePackageJson.copyFiles) {
    const source = path.resolve(ernModulePath, copyDirective.source)
    const dest = path.resolve(ernModulePath, copyDirective.dest)
    shell.cp('-rf', source, dest)
  }
}
