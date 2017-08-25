// @flow

import utils from '../lib/utils'

exports.command = 'run-android [miniapp]'
exports.desc = 'Run a MiniApp in the android Runner application'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function ({
  miniapp
} : {
  miniapp?: string
}) {
  try {
    await utils.runMiniApp('android', { miniapp })
  } catch (e) {
    log.error(`${e}`)
  }
}
