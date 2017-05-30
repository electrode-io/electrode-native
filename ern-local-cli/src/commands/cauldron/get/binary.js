// @flow

import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'binary <fullNapSelector>'
exports.desc = 'Get the native binary of a given native application'

exports.builder = {}

exports.handler = function (argv: any) {
  cauldron.getBinaryFromCauldron(
    ...explodeNapSelector(argv.fullNapSelector))
}
