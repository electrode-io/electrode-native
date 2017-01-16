import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';
import { logInfo } from '../../../util/log.js';

exports.command = 'dependencies <fullNapSelector>'
exports.desc = 'Get all the native dependencies of a given native application'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.getNativeDependencies(
    ...explodeNapSelector(argv.fullNapSelector)).then(res => {
      logInfo(JSON.stringify(res, null, 1));
    });
}
