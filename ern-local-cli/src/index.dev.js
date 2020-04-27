'use strict';
const path = require('path');
const Module = require('module');
const oload = Module._load;

const workspacePath = path.resolve(__dirname, '../..');

process.env.ERN_ENV = 'development';
process.env.TS_NODE_PROJECT = path.resolve(workspacePath, 'tsconfig.json');

let tsNodeSourceMapSupportModule;
Module._load = function (file, parent) {
  if (file === 'source-map-support' && parent.id.includes('ts-node')) {
    tsNodeSourceMapSupportModule = oload(file, parent);
    return tsNodeSourceMapSupportModule;
  } else if (file === 'source-map-support') {
    return tsNodeSourceMapSupportModule;
  } else {
    return oload(file, parent);
  }
};

require(path.normalize(
  `${workspacePath}/node_modules/tsconfig-paths/register`,
));
require(path.normalize(`${workspacePath}/node_modules/ts-node`)).register({
  dir: workspacePath,
  transpileOnly: true,
});
require('./index.ts');
