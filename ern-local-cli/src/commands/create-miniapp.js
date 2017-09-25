// @flow

import {
  MiniApp,
  utils as core
} from 'ern-core'
import utils from '../lib/utils'
import chalk from 'chalk'
import inquirer from 'inquirer'

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
    if (!appName) {
      log.error('MiniApp must contain a value')
      return
    }
    let packageName = appName
    if (packageName !== packageName.toLowerCase()) {
      log.info(`NPM does not allow package names containing upper case letters.`)
      let appNameToken = core.splitCamelCaseString(appName)
      if (appNameToken) {
        const answer = await _promptForPackageName(appNameToken.join('-'))
        packageName = answer.packageName
      }
    }
    await MiniApp.create(appName,
      packageName, {
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

function _promptForPackageName (packageName: string) {
  return inquirer.prompt([{
    type: 'input',
    name: 'packageName',
    message: `Type package name to publish to npm. Press Enter to use the default.`,
    default: () => {
      return `${packageName}`
    },
    validate: (value) => {
      if (value && value === value.toLowerCase()) {
        return true
      }
      return 'Check npm package name rules https://docs.npmjs.com/files/package.json'
    }
  }])
}
