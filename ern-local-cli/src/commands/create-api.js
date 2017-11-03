// @flow

import {
  ApiGen
} from 'ern-api-gen'
import {
  manifest
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
    describe: 'NPM scope of project'
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
  apiVersion,
  apiAuthor,
  schemaPath,
  skipNpmCheck
} : {
  apiName: string,
  scope?: string,
  apiVersion?: string,
  apiAuthor?: string,
  schemaPath?: string,
  skipNpmCheck? : boolean
}) {
  // Check if the api name is valid npm package name
  // https://docs.npmjs.com/files/package.json
  await utils.logErrorAndExitIfNotSatisfied({
    isValidNpmPackageName: {
      name: apiName
    }
  })

  if (!skipNpmCheck) {
    const continueIfPkgNameExists = await utils.performPkgNameConflictCheck(apiName)
    // If user wants to stop execution if npm package name conflicts
    if (!continueIfPkgNameExists) {
      return
    }
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
  try {
    await ApiGen.generateApi({
      bridgeVersion: `${bridgeDep.version}`,
      reactNativeVersion: reactNative.version,
      name: apiName,
      npmScope: scope,
      modelSchemaPath: schemaPath,
      apiVersion: apiVersion,
      apiAuthor: apiAuthor
    })
    log.info('Success!')
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}
