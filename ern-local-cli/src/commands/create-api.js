// @flow

import {
  ApiGen
} from 'ern-api-gen'
import {
  PackagePath,
  manifest,
  utils as coreUtils,
  ModuleTypes
} from 'ern-core'
import utils from '../lib/utils'
import inquirer from 'inquirer'

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

    if (!utils.checkIfModuleNameContainsSuffix(apiName, ModuleTypes.API)) {
      apiName = await utils.promptUserToUseSuffixModuleName(apiName, ModuleTypes.API)
    }

    // Construct the package name
    if (!packageName) {
      const defaultPackageName = coreUtils.getDefaultPackageNameForModule(apiName, ModuleTypes.API)
      packageName = await promptForPackageName(defaultPackageName)
    }

    await utils.logErrorAndExitIfNotSatisfied({
      isValidNpmPackageName: {
        name: packageName
      }
    })

    if (!skipNpmCheck && !await utils.performPkgNameConflictCheck(packageName)) {
      throw new Error('Aborting command')
    }

    const bridgeDep = await manifest.getNativeDependency(PackagePath.fromString('react-native-electrode-bridge'))
    if (!bridgeDep) {
      throw new Error('react-native-electrode-bridge not found in manifest. cannot infer version to use')
    }
    if (!bridgeDep.version) {
      throw new Error('react-native-electrode-bridge version needs to be defined')
    }

    const reactNative = await manifest.getNativeDependency(PackagePath.fromString('react-native'))
    if (!reactNative) {
      throw new Error('react-native-electrode-bridge not found in manifest. cannot infer version to use')
    }

    log.info(`Generating ${apiName} API`)

    await ApiGen.generateApi({
      bridgeVersion: `${bridgeDep.version || ''}`,
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
    coreUtils.logErrorAndExitProcess(e)
  }
}

async function promptForPackageName (defaultPackageName: string): Promise<string> {
  const { packageName } = await inquirer.prompt([{
    type: 'input',
    name: 'packageName',
    message: 'Type NPM package name to use for this API. Press Enter to use the default.',
    default: defaultPackageName
  }])
  return packageName
}
