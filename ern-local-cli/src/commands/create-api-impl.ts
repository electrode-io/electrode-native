import {
  PackagePath,
  utils as coreUtils,
  Platform,
  ModuleTypes,
  log,
} from 'ern-core'
import { generateApiImpl } from 'ern-api-impl-gen'
import utils from '../lib/utils'
import inquirer from 'inquirer'
import path from 'path'
import { Argv } from 'yargs'

export const command = 'create-api-impl <apiName> [apiImplName]'
export const desc = 'Commands to generate API implementation skeleton.'

export const builder = (argv: Argv) => {
  return argv
    .option('nativeOnly', {
      alias: 'n',
      describe:
        'Generate native projects with proper dependencies (Implementation of the API has to be written in native',
      type: 'boolean',
    })
    .option('jsOnly', {
      alias: 'j',
      describe:
        'Generate js project with proper dependencies (Implementation of the API has to be written in js',
      type: 'boolean',
    })
    .option('packageName', {
      alias: 'p',
      describe: 'Name to use for the apiImpl NPM package',
    })
    .option('scope', {
      alias: 's',
      describe: 'Scope to use for the apiImpl NPM package',
    })
    .option('force', {
      alias: 'f',
      describe:
        'Forces a project creation even if an implementation already present inside the output location',
      type: 'boolean',
    })
    .option('outputDirectory', {
      alias: 'o',
      describe: 'Path to output directory',
    })
    .option('hasConfig', {
      describe:
        'Indicates if this api implementation requires some config during initialization. \nThis option will be stored and reused during container generation to enforce config initialization',
      type: 'boolean',
    })
    .option('skipNpmCheck', {
      describe:
        'Skip the check ensuring package does not already exists in NPM registry',
      type: 'boolean',
    })
    .epilog(utils.epilog(exports))
}

const WORKING_DIRECTORY = path.join(Platform.rootDirectory, 'api-impl-gen')
const PLUGIN_DIRECTORY = path.join(WORKING_DIRECTORY, 'plugins')

export const handler = async ({
  apiName,
  apiImplName,
  nativeOnly,
  jsOnly,
  packageName,
  scope,
  force,
  outputDirectory,
  hasConfig,
  skipNpmCheck,
}: {
  apiName: string
  apiImplName?: string
  nativeOnly: boolean
  jsOnly: boolean
  packageName?: string
  scope?: string
  force: boolean
  outputDirectory: string
  hasConfig: boolean
  skipNpmCheck?: boolean
}) => {
  try {
    const apiDep = PackagePath.fromString(apiName)
    // pre conditions
    await utils.logErrorAndExitIfNotSatisfied({
      noGitOrFilesystemPath: {
        obj: apiName,
      },
      publishedToNpm: {
        extraErrorMessage: `Couldn't find package ${apiName} to generate the api implementation`,
        obj: apiName,
      },
    })

    if (apiImplName) {
      await utils.logErrorAndExitIfNotSatisfied({
        isValidElectrodeNativeModuleName: {
          name: apiImplName,
        },
      })
    }

    log.info(`Generating API implementation for ${apiName}`)
    const reactNativeVersion = await coreUtils.reactNativeManifestVersion()
    if (!reactNativeVersion) {
      throw new Error(
        'React Native version is not defined in Manifest. This sould not happen !'
      )
    }
    log.debug(
      `Will generate api implementation using react native version: ${reactNativeVersion}`
    )

    if (jsOnly && nativeOnly) {
      log.warn('Looks like both js and native are selected, should be only one')
      nativeOnly = await promptPlatformSelection()
    }

    if (!jsOnly && !nativeOnly) {
      nativeOnly = await promptPlatformSelection()
      jsOnly = !nativeOnly
    }

    const moduleType = nativeOnly
      ? ModuleTypes.NATIVE_API_IMPL
      : ModuleTypes.JS_API_IMPL

    if (
      apiImplName &&
      !utils.checkIfModuleNameContainsSuffix(apiImplName, moduleType)
    ) {
      apiImplName = await utils.promptUserToUseSuffixModuleName(
        apiImplName,
        moduleType
      )
    }

    // Must conform to definition of ElectrodeNativeModuleName
    if (!apiImplName) {
      // camel case api name
      const cameCaseName = coreUtils.camelize(apiDep.basePath)
      // remove number if present
      const nameWithNoNumber = cameCaseName.replace(/\d+/g, '')
      apiImplName = `${nameWithNoNumber}Impl${jsOnly ? 'Js' : 'Native'}`
    }

    // If no package name is specified get default name from apiImplName
    if (!packageName) {
      const defaultPackageName = (packageName = coreUtils.getDefaultPackageNameForModule(
        apiImplName,
        moduleType
      ))
      packageName = await promptForPackageName(defaultPackageName)
    }

    // Check if packageName is valid
    await utils.logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName,
      },
    })

    // Skip npm check
    if (
      !skipNpmCheck &&
      !(await utils.performPkgNameConflictCheck(packageName))
    ) {
      throw new Error(`Aborting command `)
    }

    await generateApiImpl({
      apiDependency: apiDep,
      apiImplName,
      forceGenerate: force,
      hasConfig,
      nativeOnly,
      outputDirectory,
      packageName,
      paths: {
        apiImplHull: path.join(
          Platform.currentPlatformVersionPath,
          'ern-api-impl-gen',
          'hull'
        ),
        outDirectory: '',
        pluginsDownloadDirectory: PLUGIN_DIRECTORY,
        workingDirectory: WORKING_DIRECTORY,
      },
      reactNativeVersion,
      scope,
    })
    log.info('Success!')
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

async function promptPlatformSelection(): Promise<boolean> {
  const { targetPlatform } = await inquirer.prompt([
    <inquirer.Question>{
      choices: [`js`, `native`],
      default: `js`,
      message: `Choose a platform that you are planning to write this api implementation in?`,
      name: 'targetPlatform',
      type: 'list',
    },
  ])
  return targetPlatform !== `js`
}

async function promptForPackageName(
  defaultPackageName: string
): Promise<string> {
  const { packageName } = await inquirer.prompt([
    <inquirer.Question>{
      default: defaultPackageName,
      message:
        'Type NPM package name to use for this API implementation. Press Enter to use the default.',
      name: 'packageName',
      type: 'input',
    },
  ])
  return packageName
}
