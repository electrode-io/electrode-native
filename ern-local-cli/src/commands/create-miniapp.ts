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
import inquirer from 'inquirer'

export const command = 'create-miniapp <appName>'
export const desc = 'Create a new ern application(miniapp)'

export const builder = (argv: Argv) => {
  return argv
    .option('language', {
      choices: ['JavaScript', 'TypeScript', undefined],
      deprecated: 'use --template directly',
      describe: 'Language to use for this MiniApp',
      type: 'string',
    })
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
    .option('manifestId', {
      describe: 'Id of the Manifest entry to use to create this MiniApp',
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
    .option('packageManager', {
      choices: ['npm', 'yarn', undefined],
      describe: 'Package manager to use for this MiniApp',
      type: 'string',
    })
    .option('template', {
      describe: 'Template to use to create the MiniApp',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  appName,
  language,
  manifestId,
  packageManager,
  packageName,
  platformVersion,
  scope,
  skipNpmCheck,
  template,
}: {
  appName: string
  language: 'JavaScript' | 'TypeScript'
  manifestId?: string
  packageName?: string
  packageManager?: 'npm' | 'yarn'
  platformVersion: string
  scope?: string
  skipNpmCheck?: boolean
  template?: string
}) => {
  await logErrorAndExitIfNotSatisfied({
    isValidElectrodeNativeModuleName: {
      name: appName,
    },
  })

  if (language) {
    log.warn('Deprecated: --language. Use --template, or omit to use default.')
  }

  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    })
  }

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

  if (!packageManager) {
    const { userSelectedPackageManager } = await inquirer.prompt([
      <inquirer.Question>{
        choices: ['yarn', 'npm'],
        message: 'Choose the package manager to use for this MiniApp',
        name: 'userSelectedPackageManager',
        type: 'list',
      },
    ])
    packageManager = userSelectedPackageManager
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
      language,
      manifestId,
      packageManager,
      platformVersion: platformVersion && platformVersion.replace('v', ''),
      scope,
      template,
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
