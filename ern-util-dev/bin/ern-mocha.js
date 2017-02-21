#!/usr/bin/env node
process.argv.push('--compilers', `js:${__dirname}/../babelhook`);
process.argv.push('test/*-test.js');
require('mocha/bin/mocha');
