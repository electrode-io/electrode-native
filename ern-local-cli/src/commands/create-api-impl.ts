import {
  PackagePath,
  utils as coreUtils,
  Platform,
  ModuleTypes,
  log,
  checkIfModuleNameContainsSuffix,
} from 'ern-core'
import { generateApiImpl } from 'ern-api-impl-gen'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  performPkgNameConflictCheck,
  promptUserToUseSuffixModuleName,
  tryCatchWrap,
  askUserToInputPackageName,
  askUserToSelectAnEnvironment,
} from '../lib'
import path from 'path'
import { Argv } from 'yargs'
import untildify from 'untildify'

export const command = 'create-api-impl <apiName> [apiImplName]'
export const desc = 'Commands to generate API implementation skeleton.'

export const builder = (argv: Argv) => {
  return argv
    .option('force', {
      alias: 'f',
      describe:
        'Forces a project creation even if an implementation already present inside the output location',
      type: 'boolean',
    })
    .option('hasConfig', {
      describe:
        'Indicates if this api implementation requires some config during initialization. \nThis option will be stored and reused during container generation to enforce config initialization',
      type: 'boolean',
    })
    .option('jsOnly', {
      alias: 'j',
      describe:
        'Generate js project with proper dependencies (Implementation of the API has to be written in js',
      type: 'boolean',
    })
    .option('manifestId', {
      describe: 'Id of the Manifest entry to use',
      type: 'string',
    })
    .option('nativeOnly', {
      alias: 'n',
      describe:
        'Generate native projects with proper dependencies (Implementation of the API has to be written in native',
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
    .option('skipNpmCheck', {
      describe:
        'Skip the check ensuring package does not already exists in NPM registry',
      type: 'boolean',
    })
    .option('outputDirectory', {
      alias: 'o',
      describe: 'Path to output directory',
    })
    .coerce('outputDirectory', p => untildify(p))
    .epilog(epilog(exports))
}

const WORKING_DIRECTORY = path.join(Platform.rootDirectory, 'api-impl-gen')
const PLUGIN_DIRECTORY = path.join(WORKING_DIRECTORY, 'plugins')

export const commandHandler = async ({
  apiName,
  apiImplName,
  force,
  hasConfig,
  jsOnly,
  manifestId,
  nativeOnly,
  packageName,
  scope,
  skipNpmCheck,
  outputDirectory,
}: {
  apiName: string
  apiImplName?: string
  force: boolean
  hasConfig: boolean
  jsOnly: boolean
  manifestId?: string
  nativeOnly: boolean
  packageName?: string
  scope?: string
  skipNpmCheck?: boolean
  outputDirectory: string
}) => {
  const apiDep = PackagePath.fromString(apiName)
  // pre conditions
  await logErrorAndExitIfNotSatisfied({
    noGitOrFilesystemPath: {
      obj: apiName,
    },
    publishedToNpm: {
      extraErrorMessage: `Couldn't find package ${apiName} to generate the api implementation`,
      obj: apiName,
    },
  })

  if (apiImplName) {
    await logErrorAndExitIfNotSatisfied({
      isValidElectrodeNativeModuleName: {
        name: apiImplName,
      },
    })
  }

  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    })
  }

  log.info(`Generating API implementation for ${apiName}`)
  const reactNativeVersion = await coreUtils.reactNativeManifestVersion({
    manifestId,
  })
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
    nativeOnly = (await askUserToSelectAnEnvironment()) !== 'js'
    jsOnly = !nativeOnly
  }

  if (!jsOnly && !nativeOnly) {
    nativeOnly = (await askUserToSelectAnEnvironment()) !== 'js'
    jsOnly = !nativeOnly
  }

  const moduleType = nativeOnly
    ? ModuleTypes.NATIVE_API_IMPL
    : ModuleTypes.JS_API_IMPL

  if (
    apiImplName &&
    !checkIfModuleNameContainsSuffix(apiImplName, moduleType)
  ) {
    apiImplName = await promptUserToUseSuffixModuleName(apiImplName, moduleType)
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
    packageName = await askUserToInputPackageName({ defaultPackageName })
  }

  // Check if packageName is valid
  await logErrorAndExitIfNotSatisfied({
    isValidNpmPackageName: {
      name: packageName,
    },
  })

  // Skip npm check
  if (!skipNpmCheck && !(await performPkgNameConflictCheck(packageName))) {
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
    },
    reactNativeVersion,
    scope,
  })
  log.info('Success')
}

export const handler = tryCatchWrap(commandHandler)
