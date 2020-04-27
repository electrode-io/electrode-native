const chalk = require('chalk');
const shell = require('shelljs');
const f = require('../../fixtures/constants');
const runErnCommand = require('./runErnCommand');
const info = chalk.bold.blue;

//
// Clean up the system test environment
module.exports = function () {
  console.log(
    '===========================================================================',
  );
  console.log(info('Cleaning up test env'));
  console.log(info('Deactivating current Cauldron'));
  runErnCommand('cauldron repo clear');
  console.log(info('Removing Cauldron alias'));
  runErnCommand(`cauldron repo remove ${f.cauldronName}`);
  console.log(
    '===========================================================================',
  );
};
