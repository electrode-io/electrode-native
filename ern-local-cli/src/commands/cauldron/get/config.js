import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

const log = require('console-log-level')()

exports.command = 'config <napSelector>'
exports.desc = 'Get a configuration from the cauldron'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.getConfig(
    ...explodeNapSelector(argv.napSelector)).then(res => {
      log.info(JSON.stringify(res, null, 1))
    })
}
