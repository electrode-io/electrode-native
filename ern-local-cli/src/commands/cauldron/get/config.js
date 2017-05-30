// @flow

import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'config <napSelector>'
exports.desc = 'Get a configuration from the cauldron'

exports.builder = {}

exports.handler = function (argv: any) {
  cauldron.getConfig(
    ...explodeNapSelector(argv.napSelector)).then(res => {
      log.info(JSON.stringify(res, null, 1))
    })
}
