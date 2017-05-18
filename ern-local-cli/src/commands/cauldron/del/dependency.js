import {explodeNapSelector} from '@walmart/ern-util';
import cauldron from '../../../lib/cauldron'

exports.command = 'dependency <fullNapSelector> <dependencyName>'
exports.desc = 'Remove a dependency from the cauldron'

exports.builder = {}

exports.handler = function (argv) {
    cauldron.removeNativeDependency(
        argv.dependencyName,
        ...explodeNapSelector(argv.fullNapSelector));
}
