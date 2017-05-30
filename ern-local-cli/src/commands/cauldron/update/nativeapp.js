// @flow

import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'nativeapp <fullNapSelector> [isReleased]'
exports.desc = 'Update a native application info in cauldron'

exports.builder = function (yargs: any) {
  return yargs
        .option('isReleased', {
          alias: 'r',
          type: 'bool',
          describe: 'true if version is released, false otherwise'
        }).demandCommand(1, 'nativeapp needs <fullNapSelector>')
}

exports.handler = async function (argv: any) {
  if (argv.isReleased !== undefined) {
    cauldron.updateNativeAppIsReleased(...explodeNapSelector(argv.fullNapSelector),
            argv.isReleased)
  }
}
