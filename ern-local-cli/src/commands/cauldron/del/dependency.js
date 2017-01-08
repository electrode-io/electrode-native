import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';

exports.command = 'dependency <napSelector> <dependencyName>'
exports.desc = 'Remove a dependency from the cauldron'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.removeNativeDependency(
    argv.dependencyName,
    ...explodeNapSelector(argv.napSelector));
}
