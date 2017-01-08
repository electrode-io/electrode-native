import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';

exports.command = 'dependency <napSelector> <dependency>'
exports.desc = 'Add a native dependency in the cauldron'

exports.builder = {}

exports.handler = function (argv) {
  const explodedNameVersion = /(.*)@(.*)/.exec(argv.dependency);

  cauldron.addNativeDependency({
      name: explodedNameVersion[1],
      version: explodedNameVersion[2]
    },
    ...explodeNapSelector(argv.napSelector));
}
