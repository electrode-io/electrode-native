// @flow

import {
  MiniApp
} from 'ern-core'
import utils from '../lib/utils'

exports.command = 'create-miniapp <appName> [platformVersion] [scope]'
exports.desc = 'Create a new ern application(miniapp)'

exports.builder = function (yargs: any) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      type: 'string',
      describe: 'Overrides current platform version in use with this platform version'
    })
    .option('scope', {
      describe: 'specify npm scope to group related packages together'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  appName,
  platformVersion,
  scope
} : {
  appName: string,
  platformVersion: string,
  scope?: string,
}) {
  try {
    await MiniApp.create(appName, {
      platformVersion: platformVersion && platformVersion.replace('v', ''),
      scope
    })
    log.info(`${appName} MiniApp was created`)
  } catch (e) {
    log.error(e.message)
  }
}
