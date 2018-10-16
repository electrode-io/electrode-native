import {
  MiniApp,
  utils as core,
  ModuleTypes,
  log,
  kax,
  checkIfModuleNameContainsSuffix,
} from 'ern-core'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  promptUserToUseSuffixModuleName,
  performPkgNameConflictCheck,
  tryCatchWrap,
  askUserToInputPackageName,
} from '../lib'
import chalk from 'chalk'
import { Argv } from 'yargs'

export const command = 'create-miniapp <appName>'
export const desc = 'Create a new ern application(miniapp)'

export const builder = (argv: Argv) => {
  return argv
    .option('packageName', {
      alias: 'p',
      describe: 'Name to use for the MiniApp NPM package',
    })
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
    .option('skipNpmCheck', {
      describe:
        'Skip the check ensuring package does not already exists in NPM registry',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
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
  await logErrorAndExitIfNotSatisfied({
    isValidElectrodeNativeModuleName: {
      name: appName,
    },
  })

  if (!checkIfModuleNameContainsSuffix(appName, ModuleTypes.MINIAPP)) {
    appName = await promptUserToUseSuffixModuleName(
      appName,
      ModuleTypes.MINIAPP
    )
  }

  if (!packageName) {
    const defaultPackageName = core.getDefaultPackageNameForModule(
      appName,
      ModuleTypes.MINIAPP
    )
    packageName = await askUserToInputPackageName({ defaultPackageName })
  }

  await logErrorAndExitIfNotSatisfied({
    isValidNpmPackageName: {
      name: packageName,
    },
  })

  if (!skipNpmCheck && !(await performPkgNameConflictCheck(packageName))) {
    throw new Error(`Aborting command `)
  }

  await kax.task('Creating MiniApp').run(
    MiniApp.create(appName, packageName, {
      platformVersion: platformVersion && platformVersion.replace('v', ''),
      scope,
    })
  )

  logSuccessFooter(appName)
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

export const handler = tryCatchWrap(commandHandler)
