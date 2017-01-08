import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';
import { logInfo } from '../../../util/log.js';

exports.command = 'binary <napSelector>'
exports.desc = 'Get the native binary of a given native application'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.getBinaryFromCauldron(
    ...explodeNapSelector(argv.napSelector));
}
