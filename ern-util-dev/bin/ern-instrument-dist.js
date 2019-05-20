#!/usr/bin/env node

/*
 * This script will transform the 'dist' directory
 * by replacing all source files with their istanbul
 * instrumented version.
 */
const shell = require('shelljs')
const readDir = require('fs-readdir-recursive')
const path = require('path')

// Instrument all source files from 'dist' to 'dist-instrumented'
// It is not possible to instrument source files in place :(
// Thus, the rest of the script takes care of moving everything back
// to 'dist'
process.argv.push('instrument', 'dist', 'dist-instrumented')
require('nyc/bin/nyc')

// Source maps are not copied to the target directory by
// 'nyc instrument' command. We need to copy them from
// 'dist' to 'dist-instrumented'
const files = readDir('dist')
files
  .filter(f => f.endsWith('.map'))
  .map(f => ({
    source: path.join('dist', f),
    target: path.join('dist-instrumented', f),
  }))
  .forEach(f => shell.cp(f.source, f.target))

// Remove original 'dist' directory
shell.rm('-rf', 'dist')

// Rename 'dist-instrumented' to 'dist'
shell.mv('dist-instrumented', 'dist')
