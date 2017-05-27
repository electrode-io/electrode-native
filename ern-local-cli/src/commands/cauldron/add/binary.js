// @flow

import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'binary <fullNapSelector> <path>'
exports.desc = 'Add a native binary (.app or .apk) in the cauldron'

exports.builder = {}

exports.handler = function (argv: any) {
  cauldron.addNativeBinary(
        argv.path,
        ...explodeNapSelector(argv.fullNapSelector))
}
