import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';
const log = require('console-log-level')();

exports.command = 'dependencies <fullNapSelector>'
exports.desc = 'Get all the native dependencies of a given native application'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.getNativeDependencies(
    ...explodeNapSelector(argv.fullNapSelector)).then(res => {
      log.info(JSON.stringify(res, null, 1));
    });
}
