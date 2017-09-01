// @flow

import utils from '../lib/utils'
import start from '../lib/start'

exports.command = 'start'
exports.desc = 'Start a composite MiniApp'

exports.builder = function (yargs: any) {
  return yargs
    .option('completeNapDescriptor', {
      type: 'string',
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
    .option('watchNodeModules', {
      type: 'array',
      alias: 'w',
      describe: 'A list of one or more folder name from node_modules that should be watched for changes'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  completeNapDescriptor,
  miniapps,
  watchNodeModules
} : {
  completeNapDescriptor?: string,
  miniapps?: Array<string>,
  watchNodeModules?: Array<string>
}) {
  try {
    await start({ miniapps, completeNapDescriptor, watchNodeModules })
  } catch (e) {
    log.error(e.message)
  }
}
