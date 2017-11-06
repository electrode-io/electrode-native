// @flow

import {
  ApiGen
} from 'ern-api-gen'
import {
  manifest,
  utils as core,
  ModuleTypes
} from 'ern-core'
import {
  Dependency,
  Utils
} from 'ern-util'
import utils from '../lib/utils'

exports.command = 'create-api <apiName>'
exports.desc = 'Create a new api'

exports.builder = function (yargs: any) {
  return yargs.option('scope', {
    alias: 's',
    describe: 'Scope to use for the api NPM package'
  }).option('packageName', {
    alias: 'p',
    describe: 'Name to use for the api NPM package'
  }).option('apiVersion', {
    alias: 'a',
    describe: 'Initial npm version'
  }).option('apiAuthor', {
    alias: 'u',
    describe: 'Author of library'
  }).option('schemaPath', {
    alias: 'm',
    describe: 'Path to schema(swagger)'
  }).option('skipNpmCheck', {
    describe: 'Skip the check ensuring package does not already exists in NPM registry',
    type: 'bool'
  })
  .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  apiName,
  scope,
  packageName,
  apiVersion,
  apiAuthor,
  schemaPath,
  skipNpmCheck
} : {
  apiName: string,
  scope?: string,
  packageName: string,
  apiVersion?: string,
  apiAuthor?: string,
  schemaPath?: string,
  skipNpmCheck? : boolean
}) {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      isValidElectrodeNativeModuleName: {
        name: apiName
      }
    })

    // Construct the package name
    if (!packageName) {
      packageName = core.getDefaultPackageNameForModule(apiName, ModuleTypes.API)
    }

    await utils.logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName
      }
    })

    if (!skipNpmCheck && !await utils.performPkgNameConflictCheck(packageName)) {
      throw new Error(`Aborting command `)
    }

    const bridgeDep = await manifest.getNativeDependency(Dependency.fromString('react-native-electrode-bridge'))
    if (!bridgeDep) {
      return log.error(`react-native-electrode-bridge not found in manifest. cannot infer version to use`)
    }

    const reactNative = await manifest.getNativeDependency(Dependency.fromString('react-native'))
    if (!reactNative) {
      return log.error(`react-native not found in manifest. cannot infer version to use`)
    }

    log.info(`Generating ${apiName} API`)

    await ApiGen.generateApi({
      bridgeVersion: `${bridgeDep.version}`,
      reactNativeVersion: reactNative.version,
      name: apiName,
      npmScope: scope,
      modelSchemaPath: schemaPath,
      apiVersion: apiVersion,
      apiAuthor: apiAuthor,
      packageName: packageName
    })
    log.info('Success!')
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
