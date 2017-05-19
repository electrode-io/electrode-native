import {
  Dependency,
  explodeNapSelector
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'dependency <fullNapSelector> <dependency>'
exports.desc = 'Add a native dependency in the cauldron'

exports.builder = {}

exports.handler = async function (argv) {
  await cauldron.addNativeDependency(Dependency.fromString(argv.dependency), ...explodeNapSelector(argv.fullNapSelector))
}
