import generateContainer from './index.js';
const log = require('console-log-level')();
const argv = require('minimist')(process.argv.slice(2));

//
// This is the target version of the produced maven artifact (Android)
const containerPomVersion = argv['version'];
if (!containerPomVersion) {
  log.error("--version=[version] required");
  process.exit();
}

let config;
if (argv['config-path']) {
  config = require(argv['config-path']);
} else {
  config = require(`${process.cwd()}/.containergenrc.conf.json`);
}

generateContainer(config);
