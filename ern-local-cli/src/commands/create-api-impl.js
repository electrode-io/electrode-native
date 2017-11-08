// @flow

import {
  utils as core,
  Platform,
  ModuleTypes
} from 'ern-core'
import {
  generateApiImpl
} from 'ern-api-impl-gen'
import {
  Dependency,
  DependencyPath,
  Utils
} from 'ern-util'
import utils from '../lib/utils'
import inquirer from 'inquirer'
import path from 'path'

exports.command = 'create-api-impl <apiName> [apiImplName]'
exports.desc = 'Commands to generate API implementation skeleton.'

exports.builder = function (yargs: any) {
  return yargs.option('nativeOnly', {
    alias: 'n',
    type: 'bool',
    describe: 'Generate native projects with proper dependencies (Implementation of the API has to be written in native'
  }).option('jsOnly', {
    alias: 'j',
    type: 'bool',
    describe: 'Generate js project with proper dependencies (Implementation of the API has to be written in js'
  }).option('packageName', {
    alias: 'p',
    describe: 'Name to use for the apiImpl NPM package'
  }).option('scope', {
    alias: 's',
    describe: 'Scope to use for the apiImpl NPM package'
  }).option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Forces a project creation even if an implementation already present inside the output location'
  }).option('outputDirectory', {
    alias: 'o',
    describe: 'Path to output directory'
  }).option('hasConfig', {
    type: 'bool',
    describe: 'Indicates if this api implementation requires some config during initialization. \nThis option will be stored and reused during container generation to enforce config initialization'
  }).option('skipNpmCheck', {
    describe: 'Skip the check ensuring package does not already exists in NPM registry',
    type: 'bool'
  })
  .epilog(utils.epilog(exports))
}

const WORKING_DIRECTORY = path.join(Platform.rootDirectory, 'api-impl-gen')
const PLUGIN_DIRECTORY = path.join(WORKING_DIRECTORY, 'plugins')

exports.handler = async function ({
  apiName,
  apiImplName,
  nativeOnly,
  jsOnly,
  packageName,
  scope,
  force,
  outputDirectory,
  hasConfig,
  skipNpmCheck
} : {
  apiName: string,
  apiImplName?: string,
  nativeOnly: boolean,
  jsOnly: boolean,
  packageName?: string,
  scope?: string,
  force: boolean,
  outputDirectory: string,
  hasConfig: boolean,
  skipNpmCheck?: boolean
}) {
  try {
    const apiDep = Dependency.fromPath(DependencyPath.fromString(apiName))
    // pre conditions
    await utils.logErrorAndExitIfNotSatisfied({
      noGitOrFilesystemPath: {
        obj: apiName
      },
      publishedToNpm: {
        obj: apiName,
        extraErrorMessage: `Couldn't find package ${apiName} to generate the api implementation`
      }
    })

    if (apiImplName) {
      await utils.logErrorAndExitIfNotSatisfied({
        isValidElectrodeNativeModuleName: {
          name: apiImplName
        }
      })
    }

    log.info(`Generating API implementation for ${apiName}`)
    let reactNativeVersion = await core.reactNativeManifestVersion()
    log.debug(`Will generate api implementation using react native version: ${reactNativeVersion}`)

    if (jsOnly && nativeOnly) {
      log.warn('Looks like both js and native are selected, should be only one')
      nativeOnly = await promptPlatformSelection()
    }

    if (!jsOnly && !nativeOnly) {
      nativeOnly = await promptPlatformSelection()
    }

    const moduleType = nativeOnly ? ModuleTypes.NATIVE_API_IMPL : ModuleTypes.JS_API_IMPL

    if (apiImplName && !utils.checkIfModuleNameContainsSuffix(apiImplName, moduleType)) {
      apiImplName = await utils.promptUserToUseSuffixModuleName(apiImplName, moduleType)
    }

    // Must conform to definition of ElectrodeNativeModuleName
    if (!apiImplName) {
      // camel case api name
      let cameCaseName = core.camelize(apiDep.name)
      // remove number if present
      const nameWithNoNumber = cameCaseName.replace(/\d+/g, '')
      apiImplName = `${nameWithNoNumber}Impl`
    }

    // If no package name is specified get default name from apiImplName
    if (!packageName) {
      const defaultPackageName = packageName = core.getDefaultPackageNameForModule(apiImplName, moduleType)
      packageName = await promptForPackageName(defaultPackageName)
    }

    // Check if packageName is valid
    await utils.logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName
      }
    })

    // Skip npm check
    if (!skipNpmCheck && !await utils.performPkgNameConflictCheck(packageName)) {
      throw new Error(`Aborting command `)
    }

    await generateApiImpl({
      apiDependency: apiDep,
      apiImplName,
      outputDirectory,
      nativeOnly,
      forceGenerate: force,
      reactNativeVersion,
      hasConfig,
      packageName,
      scope,
      paths: {
        apiImplHull: path.join(Platform.currentPlatformVersionPath, 'ern-api-impl-gen', 'hull'),
        pluginsDownloadDirectory: PLUGIN_DIRECTORY,
        workingDirectory: WORKING_DIRECTORY,
        outDirectory: ''
      }
    })
    log.info('Success!')
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

async function promptPlatformSelection () : Promise<boolean> {
  const {targetPlatform} = await inquirer.prompt([{
    type: 'list',
    name: 'targetPlatform',
    message: `Choose a platform that you are planning to write this api implementation in?`,
    default: `js`,
    choices: [`js`, `native`]
  }])
  return targetPlatform !== `js`
}

async function promptForPackageName (defaultPackageName: string): Promise<string> {
  const { packageName } = await inquirer.prompt([{
    type: 'input',
    name: 'packageName',
    message: 'Type NPM package name to use for this API implementation. Press Enter to use the default.',
    default: defaultPackageName
  }])
  return packageName
}
