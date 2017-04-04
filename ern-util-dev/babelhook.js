"use strict";

require('babel-polyfill');
const conf = require('./babelrc.dev.json');
const Module = require('module');
const path = require('path');
const babelRegister = require('babel-register');
const oload = Module._load;

if (process.env.COVERAGE) {
    console.log('Has Coverage');
    conf.plugins.push([
        "istanbul",
        {
            "exclude": [
                "**/test/*-test.js"
            ]
        }
    ]);
}
const project = path.join(__dirname, '..');

//only look into ern- projects that have a src directory.
conf.only = /ern-[^/]*\/(src|test|lib)/;

/**
 * Babelify all ern- projects.  And if they
 * are an ern- project than use the src.
 *
 * @param file
 * @param parent
 * @private
 */
function normalizePath(file, parent) {
    if (/^\./.test(file)) {
        return file;
    }
    //fixes issue with globa-cli calling local-cli.
    if (/\/ern-local-cli$/.test(file)) {
        return 'ern-local-cli'
    }
    if (/^\//.test(file)) {
        if (file.startsWith(project + '/ern-')) {
            return file.replace(project + '/', '');
        }
        return file;
    }
    if (/(@walmart\/)?ern-/.test(file)) {
        return file.replace('@walmart/', '');
    }
    return;
}
Module._load = function (file, parent) {

    let absFile = normalizePath(file, parent);
    if (absFile) {


        let parts = absFile.split('/');
        let scope = parts[0], pkg = parts[1], rest = parts.slice(2).join(path.sep);
        if (/ern-/.test(scope)) {
            if (!pkg || pkg == 'dist') pkg = 'src';
            file = path.join(project, scope, pkg, rest || 'index');// `${project}/${pkg}/${rest ? '/' + rest : ''}`
        }
    }

    return oload(file, parent);
};
babelRegister(conf);

