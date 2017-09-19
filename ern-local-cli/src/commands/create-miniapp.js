// @flow

import {
  MiniApp
} from 'ern-core'
import utils from '../lib/utils'
import chalk from 'chalk'

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
    log.info(`${appName} MiniApp was successfully created !`)
    log.info(`================================================`)
    log.info(chalk.bold.white('To run your MiniApp on Android :'))
    log.info(chalk.white(`    > cd ${appName}`))
    log.info(chalk.white(`followed by :`))
    log.info(chalk.white(`    > ern run-android`))
    log.info(chalk.bold.white('To run your MiniApp on iOS :'))
    log.info(chalk.white(`    > cd ${appName}`))
    log.info(chalk.white(`followed by :`))
    log.info(chalk.white(`    > ern run-ios`))
    log.info(`================================================`)
  } catch (e) {
    log.error(e.message)
  }
}
