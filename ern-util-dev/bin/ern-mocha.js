#!/usr/bin/env node
if (!require('fs').existsSync(require('path').join(process.cwd(), 'test'))) {
    console.log('no tests for project ', process.cwd());
    process.exit(0);
}
console.log(`running tests in ${process.cwd()}`);
process.argv.push('--compilers', `js:${__dirname}/../babelhook`);
process.argv.push('test/*-test.js');
require('mocha/bin/mocha');
