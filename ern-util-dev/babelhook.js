const conf = require('./babelrc.json');
const Module = require('module');
const path = require('path');
const babelRegister = require('babel-register');
const oload = Module._load;
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
Module._load = function (file, parent) {

    let [scope, pkg, rest] = file.split('/', 3);
    if (scope === '@walmart' && !/node_modules\//.test(rest)) {
        if (/ern-(?!util-dev$)/.test(pkg)) {
            file = `${scope}/${pkg}/src${rest ? '/' + rest : ''}`
        }
    }
    return oload(file, parent);
};
babelRegister(conf);

