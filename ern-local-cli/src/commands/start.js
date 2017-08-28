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
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  completeNapDescriptor,
  miniapps
} : {
  completeNapDescriptor?: string,
  miniapps?: Array<string>
}) {
  try {
    await start({ miniapps, completeNapDescriptor })
  } catch (e) {
    log.error(e.message)
  }
}
