import { regenerateApiImpl } from 'ern-api-impl-gen'
import {
  Platform,
  ModuleTypes,
  utils as coreUtils,
  yarn,
  PackagePath,
  log,
} from 'ern-core'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib'
import path from 'path'
import fs from 'fs-extra'
import semver from 'semver'
import { Argv } from 'yargs'

export const command = 'regen-api-impl'
export const desc =
  'Regenerates an existing api implementation for a newer version of the api'

export const builder = (argv: Argv) => {
  return argv
    .option('apiVersion', {
      alias: 'v',
      describe:
        'a specific version of the api for which an implementation needs to be generated. \n The version should be higher than the version for which an implementation is already generated',
    })
    .option('manifestId', {
      describe: 'Id of the Manifest entry to use',
      type: 'string',
    })
    .epilog(epilog(exports))
}

const ERROR_MSG_NOT_IN_IMPL =
  'api-regen-impl can only be run inside an implementation project directory. \n Looks like it is ran elsewhere'
const WORKING_DIRECTORY = path.join(Platform.rootDirectory, `api-impl-gen`)
const PLUGIN_DIRECTORY = path.join(WORKING_DIRECTORY, 'plugins')

// TOO MUCH LOGIC IN THE COMMAND ITSELF
// TO REFACTOR TO EXTRACT LOGIC OUT OF THE COMMAND FOR REUSABILITY
export const handler = async ({
  apiVersion,
  manifestId,
}: {
  apiVersion: string
  manifestId?: string
}) => {
  try {
    if (manifestId) {
      await logErrorAndExitIfNotSatisfied({
        manifestIdExists: {
          id: manifestId,
        },
      })
    }

    const apiImplPackage = await readPackageJson()

    let api: PackagePath = await getApi(apiImplPackage)
    const currentApiVersion = api.version
    if (!currentApiVersion) {
      throw new Error('no API version. This should not happen.')
    }
    api = PackagePath.fromString(
      `${api.basePath}${apiVersion ? `@${apiVersion}` : ''}`
    )

    log.info(`regenerating api implementation for ${api.toString()}`)

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

    await validatePackage(api)

    await performVersionCheck(api, currentApiVersion, apiVersion)

    await regenerateApiImpl({
      api,
      paths: {
        apiImplHull: path.join(
          Platform.currentPlatformVersionPath,
          'ern-api-impl-gen',
          'hull'
        ),
        outDirectory: process.cwd(),
      },
      platforms: getPlatforms(),
      reactNativeVersion,
    })
    log.info('Successfully regenerated api implementation!')
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }

  async function readPackageJson(): Promise<any> {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    log.debug(`Reading package json: ${packageJsonPath}`)
    if (!(await fs.pathExists(packageJsonPath))) {
      log.error(`${packageJsonPath} not found`)
      throw new Error(ERROR_MSG_NOT_IN_IMPL)
    }

    const apiImplPackage = await fs.readJson(packageJsonPath)
    if (
      !apiImplPackage.ern ||
      (apiImplPackage.ern.moduleType !== ModuleTypes.NATIVE_API_IMPL &&
        apiImplPackage.ern.moduleType !== ModuleTypes.JS_API_IMPL)
    ) {
      log.error('Not an api implementation')
      throw new Error(ERROR_MSG_NOT_IN_IMPL)
    }
    return apiImplPackage
  }

  async function getApi(apiImplPackage: any): Promise<PackagePath> {
    for (const depKey of Object.keys(apiImplPackage.dependencies)) {
      if (await coreUtils.isDependencyApi(depKey)) {
        // TODO: THis is by assuming that this is the only api dependency inside this implemenation.
        // TODO: This may not be right all the time as an api implementor can add more other apis as dependencies. Logic needs to be revisited.
        return PackagePath.fromString(
          `${depKey}@${apiImplPackage.dependencies[depKey]}`
        )
      }
    }
    throw new Error('Unable to identify the api for this implementation')
  }

  async function validatePackage(api) {
    if (!(await coreUtils.isPublishedToNpm(api.toString()))) {
      throw new Error(
        `${api.toString()}: Package not found in npm, please make sure this version of the api is published to npm.`
      )
    }
  }

  async function performVersionCheck(
    api: PackagePath,
    currentApiVersion: string,
    version?: string
  ) {
    log.debug('Performing version check before regenerating the code.')

    if (!version) {
      const latestReleasedPackageJson = await yarn.info(api)
      version = latestReleasedPackageJson.version
    }

    if (version && semver.lte(version, currentApiVersion)) {
      log.warn(
        `You are generating an api implementation for an api version(${version}) that is less than or equal to the current one(${currentApiVersion}). `
      )
    } else {
      log.info(
        `Regenerating api implementation for apiVersion:${version}, current apiVersion:${currentApiVersion}`
      )
    }
  }

  function getPlatforms(): string[] {
    const nativeDirectory = path.join(process.cwd(), 'android')
    return fs.pathExistsSync(nativeDirectory) ? ['android', 'ios'] : ['js']
  }
}
