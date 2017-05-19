import {
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

const log = require('console-log-level')()

exports.command = 'dependencies <fullNapSelector>'
exports.desc = 'Get all the native dependencies of a given native application'

exports.builder = {}

exports.handler = function (argv) {
  cauldron.getNativeDependencies(
    ...explodeNapSelector(argv.fullNapSelector), { convertToObjects: false }).then(res => {
      log.info(JSON.stringify(res, null, 1))
    })
}
