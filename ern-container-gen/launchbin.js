import generateContainer from './index.js';
const argv = require('minimist')(process.argv.slice(2));

//
// This is the target version of the produced maven artifact (Android)
const containerPomVersion = argv['version'];
if (!containerPomVersion) {
  console.log("--version=[version] required");
  process.exit();
}

let config;
if (argv['config-path']) {
  config = require(argv['config-path']);
} else {
  config = require(`${process.cwd()}/.containergen.conf.json`);
}

generateContainer(config);
