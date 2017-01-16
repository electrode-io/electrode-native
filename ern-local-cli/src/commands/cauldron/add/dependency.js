import cauldron from '../../../util/cauldron.js';
import explodeNapSelector from '../../../util/explodeNapSelector.js';

exports.command = 'dependency <fullNapSelector> <dependency>'
exports.desc = 'Add a native dependency in the cauldron'

exports.builder = {}

exports.handler = function (argv) {
  const SCOPE_NAME_VERSION_RE = /@(.+)\/(.*)@(.*)/;
  const NAME_VERSION_RE = /(.*)@(.*)/;

  if (SCOPE_NAME_VERSION_RE.test(argv.dependency)) {
    const scopeNameVersion = SCOPE_NAME_VERSION_RE.exec(argv.dependency);

    cauldron.addNativeDependency({
        scope: scopeNameVersion[1],
        name: scopeNameVersion[2],
        version: scopeNameVersion[3]
      },
      ...explodeNapSelector(argv.fullNapSelector));
  } else {
    const nameVersion = NAME_VERSION_RE.exec(argv.dependency);

    cauldron.addNativeDependency({
        name: nameVersion[1],
        version: nameVersion[2]
      },
      ...explodeNapSelector(argv.fullNapSelector));
  }
}
