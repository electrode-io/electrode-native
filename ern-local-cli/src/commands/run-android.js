// @flow

import utils from '../lib/utils'

exports.command = 'run-android [miniapp]'
exports.desc = 'Run a MiniApp in the android Runner application'

exports.builder = function (yargs: any) {
  return yargs
    .option('dev', {
      type: 'bool',
      alias: 'p',
      default: true,
      describe: 'Enable or disable React Native dev support'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  miniapp,
  dev = true
} : {
  miniapp?: string,
  dev: boolean
}) {
  try {
    await utils.runMiniApp('android', {
      miniapp,
      dev
    })
  } catch (e) {
    log.error(`${e}`)
  }
}
