import {cauldron, explodeNapSelector} from '@walmart/ern-util';


exports.command = 'binary <fullNapSelector>';
exports.desc = 'Get the native binary of a given native application';

exports.builder = {};

exports.handler = function (argv) {
  cauldron.getBinaryFromCauldron(
    ...explodeNapSelector(argv.fullNapSelector));
};
