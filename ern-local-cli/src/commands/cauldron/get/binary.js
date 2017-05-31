// @flow

import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'binary <fullNapSelector>'
exports.desc = 'Get the native binary of a given native application'

exports.builder = {}

exports.handler = async function (argv: any) {
  await cauldron.getNativeBinary(
    ...explodeNapSelector(argv.fullNapSelector))
}
