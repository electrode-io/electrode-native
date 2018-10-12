import fs from 'fs'
import { ApiGen } from 'ern-api-gen'
import {
  PackagePath,
  manifest,
  utils as coreUtils,
  ModuleTypes,
  log,
  checkIfModuleNameContainsSuffix,
} from 'ern-core'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  performPkgNameConflictCheck,
  promptUserToUseSuffixModuleName,
} from '../lib'
import inquirer from 'inquirer'
import { Argv } from 'yargs'

export const command = 'create-api <apiName>'
export const desc = 'Create a new api'

export const builder = (argv: Argv) => {
  return argv
    .option('apiAuthor', {
      alias: 'u',
      describe: 'Author of library',
    })
    .option('apiVersion', {
      alias: 'a',
      describe: 'Initial npm version',
    })
    .option('packageName', {
      alias: 'p',
      describe: 'Name to use for the api NPM package',
    })
    .option('schemaPath', {
      alias: 'm',
      describe: 'Path to pre-existing schema(swagger)',
    })
    .option('scope', {
      alias: 's',
      describe: 'Scope to use for the api NPM package',
    })
    .option('skipNpmCheck', {
      describe:
        'Skip the check ensuring package does not already exists in NPM registry',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  apiAuthor,
  apiName,
  apiVersion,
  packageName,
  schemaPath,
  scope,
  skipNpmCheck,
}: {
  apiAuthor?: string
  apiName: string
  apiVersion?: string
  packageName: string
  schemaPath?: string
  scope?: string
  skipNpmCheck?: boolean
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
      isValidElectrodeNativeModuleName: {
        name: apiName,
      },
    })

    if (schemaPath && !fs.existsSync(schemaPath)) {
      throw new Error(`Cannot resolve path to ${schemaPath}`)
    }

    if (!checkIfModuleNameContainsSuffix(apiName, ModuleTypes.API)) {
      apiName = await promptUserToUseSuffixModuleName(apiName, ModuleTypes.API)
    }

    // Construct the package name
    if (!packageName) {
      const defaultPackageName = coreUtils.getDefaultPackageNameForModule(
        apiName,
        ModuleTypes.API
      )
      packageName = await promptForPackageName(defaultPackageName)
    }

    await logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName,
      },
    })

    if (!skipNpmCheck && !(await performPkgNameConflictCheck(packageName))) {
      throw new Error('Aborting command')
    }

    const bridgeDep = await manifest.getNativeDependency(
      PackagePath.fromString('react-native-electrode-bridge')
    )
    if (!bridgeDep) {
      throw new Error(
        'react-native-electrode-bridge not found in manifest. cannot infer version to use'
      )
    }
    if (!bridgeDep.version) {
      throw new Error(
        'react-native-electrode-bridge version needs to be defined'
      )
    }

    const reactNative = await manifest.getNativeDependency(
      PackagePath.fromString('react-native')
    )
    if (!reactNative) {
      throw new Error(
        'react-native-electrode-bridge not found in manifest. cannot infer version to use'
      )
    }

    log.info(`Generating ${apiName} API`)

    await ApiGen.generateApi({
      apiAuthor,
      apiSchemaPath: schemaPath,
      apiVersion,
      bridgeVersion: `${bridgeDep.version || ''}`,
      name: apiName,
      npmScope: scope,
      packageName,
      reactNativeVersion: reactNative.version,
    })
    log.info('Success!')
  } catch (e) {
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
        'Type NPM package name to use for this API. Press Enter to use the default.',
      name: 'packageName',
      type: 'input',
    },
  ])
  return packageName
}
