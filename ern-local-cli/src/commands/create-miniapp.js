// @flow

import {
  MiniApp,
  utils as core,
  ModuleTypes,
  utils as coreUtils
} from 'ern-core'
import utils from '../lib/utils'
import chalk from 'chalk'
import inquirer from 'inquirer'

exports.command = 'create-miniapp <appName>'
exports.desc = 'Create a new ern application(miniapp)'

exports.builder = function (yargs: any) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      type: 'string',
      describe: 'Overrides current platform version in use with this platform version'
    })
    .option('scope', {
      alias: 's',
      describe: 'Scope to use for the MiniApp NPM package'
    })
    .option('packageName', {
      alias: 'p',
      describe: 'Name to use for the MiniApp NPM package'
    })
    .option('skipNpmCheck', {
      describe: 'Skip the check ensuring package does not already exists in NPM registry',
      type: 'bool'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  appName,
  packageName,
  platformVersion,
  scope,
  skipNpmCheck
} : {
  appName: string,
  packageName?: string,
  platformVersion: string,
  scope?: string,
  skipNpmCheck?: boolean
}) {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      isValidElectrodeNativeModuleName: {
        name: appName
      }
    })

    if (!utils.checkIfModuleNameContainsSuffix(appName, ModuleTypes.MINIAPP)) {
      appName = await utils.promptUserToUseSuffixModuleName(appName, ModuleTypes.MINIAPP)
    }

    if (!packageName) {
      const defaultPackageName = core.getDefaultPackageNameForModule(appName, ModuleTypes.MINIAPP)
      packageName = await promptForPackageName(defaultPackageName)
    }

    await utils.logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName
      }
    })

    if (!skipNpmCheck && !await utils.performPkgNameConflictCheck(packageName)) {
      throw new Error(`Aborting command `)
    }

    await MiniApp.create(
      appName,
      packageName, {
        platformVersion: platformVersion && platformVersion.replace('v', ''),
        scope
      })

    logSuccessFooter(appName)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

async function promptForPackageName (defaultPackageName: string): Promise<string> {
  const { packageName } = await inquirer.prompt([{
    type: 'input',
    name: 'packageName',
    message: 'Type NPM package name to use for this MiniApp. Press Enter to use the default.',
    default: defaultPackageName
  }])
  return packageName
}

function logSuccessFooter (appName: string) {
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
}
