import {
  MiniApp,
  utils as core,
  ModuleTypes,
  utils as coreUtils,
  log,
} from 'ern-core'
import utils from '../lib/utils'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { Argv } from 'yargs'

export const command = 'create-miniapp <appName>'
export const desc = 'Create a new ern application(miniapp)'

export const builder = (argv: Argv) => {
  return argv
    .option('platformVersion', {
      alias: 'v',
      describe:
        'Overrides current platform version in use with this platform version',
      type: 'string',
    })
    .option('scope', {
      alias: 's',
      describe: 'Scope to use for the MiniApp NPM package',
    })
    .option('packageName', {
      alias: 'p',
      describe: 'Name to use for the MiniApp NPM package',
    })
    .option('skipNpmCheck', {
      describe:
        'Skip the check ensuring package does not already exists in NPM registry',
      type: 'boolean',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  appName,
  packageName,
  platformVersion,
  scope,
  skipNpmCheck,
}: {
  appName: string
  packageName?: string
  platformVersion: string
  scope?: string
  skipNpmCheck?: boolean
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      isValidElectrodeNativeModuleName: {
        name: appName,
      },
    })

    if (!utils.checkIfModuleNameContainsSuffix(appName, ModuleTypes.MINIAPP)) {
      appName = await utils.promptUserToUseSuffixModuleName(
        appName,
        ModuleTypes.MINIAPP
      )
    }

    if (!packageName) {
      const defaultPackageName = core.getDefaultPackageNameForModule(
        appName,
        ModuleTypes.MINIAPP
      )
      packageName = await promptForPackageName(defaultPackageName)
    }

    await utils.logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName,
      },
    })

    if (
      !skipNpmCheck &&
      !(await utils.performPkgNameConflictCheck(packageName))
    ) {
      throw new Error(`Aborting command `)
    }

    await MiniApp.create(appName, packageName, {
      platformVersion: platformVersion && platformVersion.replace('v', ''),
      scope,
    })

    logSuccessFooter(appName)
  } catch (e) {
    console.log('BOUM')
    coreUtils.logErrorAndExitProcess(e)
  }
}

async function promptForPackageName(
  defaultPackageName: string
): Promise<string> {
  const { packageName } = await inquirer.prompt([
    <inquirer.Question>{
      default: defaultPackageName,
      message:
        'Type NPM package name to use for this MiniApp. Press Enter to use the default.',
      name: 'packageName',
      type: 'input',
    },
  ])
  return packageName
}

function logSuccessFooter(appName: string) {
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
