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

exports.command = 'create-api-impl <apiName>'
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
    describe: 'Name to use for the ApiImpl NPM package'
  }).option('scope', {
    alias: 's',
    describe: 'Scope to use for the ApiImpl NPM package'
  }).option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Forces a project creation even if an imlemenation already present inside the output location'
  }).option('outputDirectory', {
    alias: 'o',
    describe: 'Path to output directory'
  }).option('hasConfig', {
    type: 'bool',
    describe: 'Indicates if this api implementation requires some config during initialization. \nThis option will be stored and reused during container generation to enforce config initialization'
  }).option('skipNpmCheck', {
    describe: 'skips npm check to see if the package already exists. This is mainly useful when running this command for CI',
    type: 'bool'
  })
  .epilog(utils.epilog(exports))
}

const WORKING_DIRECTORY = path.join(Platform.rootDirectory, 'api-impl-gen')
const PLUGIN_DIRECTORY = path.join(WORKING_DIRECTORY, 'plugins')

exports.handler = async function ({
  apiName,
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

    // Construct the package name
    if (packageName) {
      packageName = scope ? `@${scope}/${packageName}` : packageName
    } else {
      packageName = core.getDefaultPackageNameForModule(
        scope ? `@${scope}/${apiDep.name}` : apiDep.name,
        nativeOnly ? ModuleTypes.NATIVE_API_IMPL : ModuleTypes.JS_API_IMPL)
    }

    // Check if packageName is valid
    await utils.logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName,
        extraErrorMessage: `${packageName} is not a valid npm package name`
      }
    })

    const apiImplDep = Dependency.fromPath(DependencyPath.fromString(packageName))
    // Skip npm check code execution
    if (!skipNpmCheck) {
      // check if the packageName for specified {apiName}-impl exists
      // Extend the command to ack the scope in the name
      const continueIfPkgNameExists = await utils.performPkgNameConflictCheck(packageName)
      // If user wants to stop execution if npm package name conflicts
      if (!continueIfPkgNameExists) {
        return
      }
    }

    await generateApiImpl({
      apiDependency: apiDep,
      apiImplDependency: apiImplDep,
      outputDirectory,
      nativeOnly,
      forceGenerate: force,
      reactNativeVersion,
      hasConfig,
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
