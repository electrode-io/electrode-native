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
  DependencyPath
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
    describe: 'Indicates if this api implementation requires some config during initialization. \nThis command will be stored and reused during container generation to enforce config initialization'
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
  hasConfig
} : {
  api: string,
  nativeOnly: boolean,
  jsOnly: boolean,
  force: boolean,
  outputDirectory: string,
  hasConfig: boolean
}) {
  const apiDep = Dependency.fromPath(DependencyPath.fromString(api))
  const apiImplName = `${apiDep.name}-impl`
  // check if the packageName for specified {apiName}-impl exists
  // Extend the command to ack the scope in the name
  const isPackageNameInNpm = await cliUtils.doesPackageExistInNpm(apiImplName)
  // If package name exists in the npm
  if (isPackageNameInNpm) {
    const skipNpmNameConflict = await cliUtils.promptSkipNpmNameConflictCheck(apiImplName)
    // If user wants to stop execution if npm package name conflicts
    if (!skipNpmNameConflict) {
      return
    }
  }
  log.info(`Generating API implementation for ${api}`)

  try {
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
    log.error(`${e} \n\nAPI implementation generation failed.`)
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
