// @flow

import {
  utils,
  Platform
} from 'ern-core'
import {
  generateApiImpl
} from 'ern-api-impl-gen'
import {
  Dependency,
  DependencyPath,
  Utils
} from 'ern-util'
import cliUtils from '../lib/utils'
import inquirer from 'inquirer'
import path from 'path'

exports.command = 'create-api-impl <api>'
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
    alias: 's',
    describe: 'skips npm check to see if the package already exists. This is mainly useful when running this command for CI',
    type: 'bool'
  }).option('apiImplName', {
    alias: 'n',
    describe: 'Specify the name of the api implementation to use'
  })
  .epilog(cliUtils.epilog(exports))
}

const WORKING_DIRECTORY = path.join(Platform.rootDirectory, 'api-impl-gen')
const PLUGIN_DIRECTORY = path.join(WORKING_DIRECTORY, 'plugins')

exports.handler = async function ({
  api,
  nativeOnly,
  jsOnly,
  force,
  outputDirectory,
  hasConfig,
  skipNpmCheck,
  apiImplName
} : {
  api: string,
  nativeOnly: boolean,
  jsOnly: boolean,
  force: boolean,
  outputDirectory: string,
  hasConfig: boolean,
  skipNpmCheck?: boolean,
  apiImplName?: string
}) {
  try {
    // Fixes https://github.com/electrode-io/electrode-native/issues/265
    if (!await cliUtils.doesPackageExistInNpm(api)) {
      throw new Error(`Couldn't find package ${api} to generate the api implementation`)
    }

    const apiDep = Dependency.fromPath(DependencyPath.fromString(api))
    const implPkgName = `${apiDep.name}-impl`

    // Skip npm check code execution
    if (!skipNpmCheck) {
      // check if the packageName for specified {apiName}-impl exists
      // Extend the command to ack the scope in the name
      const continueIfPkgNameExists = await cliUtils.performPkgNameConflictCheck(implPkgName)
      // If user wants to stop execution if npm package name conflicts
      if (!continueIfPkgNameExists) {
        return
      }
    }

    log.info(`Generating API implementation for ${api}`)
    let reactNativeVersion = await utils.reactNativeManifestVersion()
    log.debug(`Will generate api implementation using react native version: ${reactNativeVersion}`)

    if (jsOnly && nativeOnly) {
      log.warn('Looks like both js and native are selected, should be only one')
      nativeOnly = await promptPlatformSelection()
    }

    if (!jsOnly && !nativeOnly) {
      nativeOnly = await promptPlatformSelection()
    }

    await generateApiImpl({
      apiDependency: apiDep,
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
