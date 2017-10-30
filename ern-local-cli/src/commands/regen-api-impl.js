// @flow

import {
  regenerateApiImpl
} from 'ern-api-impl-gen'
import {
  Platform,
  ModuleTypes,
  utils,
  yarn
} from 'ern-core'
import {
  fileUtils,
  Dependency,
  Utils
} from 'ern-util'
import cliUtils from '../lib/utils'
import path from 'path'
import fs from 'fs'
import semver from 'semver'

exports.command = 'regen-api-impl'
exports.desc = 'Regenerates an existing api implementation for a newer version of the api'

exports.builder = function (yargs: any) {
  return yargs.option('apiVersion', {
    alias: 'v',
    describe: 'a specific version of the api for which an implementation needs to be generated. \n The version should be higher than the version for which an implementation is already generated'
  }).option('hasConfig', {
    type: 'bool',
    describe: 'Indicates if this api implementation requires some config during initialization. \nThis command will be stored and reused during container generation to enforce config initialization'
  }).epilog(cliUtils.epilog(exports))
}

const ERROR_MSG_NOT_IN_IMPL = 'api-regen-impl can only be run inside an implementation project directory. \n Looks like it is ran elsewhere'
const WORKING_DIRECTORY = path.join(Platform.rootDirectory, `api-impl-gen`)
const PLUGIN_DIRECTORY = path.join(WORKING_DIRECTORY, 'plugins')

// TOO MUCH LOGIC IN THE COMMAND ITSELF
// TO REFACTOR TO EXTRACT LOGIC OUT OF THE COMMAND FOR REUSABILITY
exports.handler = async function
  ({
     apiVersion,
     hasConfig
   }: {
    apiVersion: string,
    hasConfig: boolean
  } = {}) {
  log.debug(`regen-api-impl command: ${JSON.stringify(arguments[0])}`)
  try {
    const apiImplPackage = await readPackageJson()

    const api: Dependency = getApi(apiImplPackage)
    const currentApiVersion = api.version
    api.version = apiVersion

    if (apiImplPackage.ern.containerGen.hasConfig) {
      hasConfig = apiImplPackage.ern.containerGen.hasConfig
    }

    log.info(`regenerating api implementation for ${api.toString()}`)

    let reactNativeVersion = await utils.reactNativeManifestVersion()
    log.debug(`Will generate api implementation using react native version: ${reactNativeVersion}`)

    await validatePackage(api)

    await performVersionCheck(api, apiVersion, currentApiVersion)

    await regenerateApiImpl({
      api,
      paths: {
        apiImplHull: path.join(Platform.currentPlatformVersionPath, 'ern-api-impl-gen', 'hull'),
        pluginsDownloadDirectory: PLUGIN_DIRECTORY,
        workingDirectory: WORKING_DIRECTORY,
        outDirectory: process.cwd()
      },
      reactNativeVersion,
      hasConfig,
      platforms: getPlatforms()
    })
    log.info('Successfully regenerated api implementation!')
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }

  async function readPackageJson (): Object {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    log.debug(`Reading package json: ${packageJsonPath}`)
    if (!fs.existsSync(packageJsonPath)) {
      log.error(`${packageJsonPath} not found`)
      throw new Error(ERROR_MSG_NOT_IN_IMPL)
    }

    const apiImplPackage = await fileUtils.readJSON(packageJsonPath)
    if (!apiImplPackage.ern || (apiImplPackage.ern.moduleType !== ModuleTypes.NATIVE_API_IMPL && apiImplPackage.ern.moduleType !== ModuleTypes.JS_API_IMPL)) {
      log.error('Not an api implementation')
      throw new Error(ERROR_MSG_NOT_IN_IMPL)
    }
    return apiImplPackage
  }

  function getApi (apiImplPackage: Object): Dependency {
    for (const depKey of Object.keys(apiImplPackage.dependencies)) {
      if (utils.isDependencyApi(depKey)) {
        // TODO: THis is by assuming that this is the only api dependency inside this implemenation.
        // TODO: This may not be right all the time as an api implementor can add more other apis as dependencies. Logic needs to be revisited.
        return Dependency.fromString(`${depKey}@${apiImplPackage.dependencies[depKey]}`)
      }
    }
    throw new Error('Unable to identify the api for this implementation')
  }

  async function validatePackage (api) {
    if (!await utils.isPublishedToNpm(api.path)) {
      throw new Error(`${api.toString()}: Package not found in npm, please make sure this version of the api is published to npm.`)
    }
  }

  async function performVersionCheck (api: Dependency, apiVersion: ?string, currentApiVersion: string) {
    log.debug('Performing version check before regenerating the code.')

    if (!apiVersion) {
      let latestReleasedPackageJson = await yarn.info(api.path, {json: true})
      apiVersion = latestReleasedPackageJson.data.version
    }

    if (apiVersion && semver.lte(apiVersion, currentApiVersion)) {
      log.warn(`You are generating an api implementation for an api version(${apiVersion}) that is less than or equal to the current one(${currentApiVersion}). `)
    } else {
      log.info(`Regenerating api implementation for apiVersion:${apiVersion}, current apiVersion:${currentApiVersion}`)
    }
  }

  function getPlatforms (): Array<string> {
    const nativeDirectory = path.join(process.cwd(), 'android')

    if (fs.existsSync(nativeDirectory)) {
      return ['android', 'ios']
    } else {
      return ['js']
    }
  }
}
