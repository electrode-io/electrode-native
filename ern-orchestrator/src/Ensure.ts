import {
  config,
  manifest,
  PackagePath,
  utils as coreUtils,
  dependencyLookup,
  AppVersionDescriptor,
  AnyAppDescriptor,
  YarnLockParser,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { getContainerMetadataPath } from 'ern-container-gen'
import _ from 'lodash'
import semver from 'semver'
import validateNpmPackageName from 'validate-npm-package-name'
import fs from 'fs'
import levenshtein from 'fast-levenshtein'
import * as constants from './constants'
import treeify from 'treeify'
export default class Ensure {
  public static isValidElectrodeNativeModuleName(
    name: string,
    extraErrorMessage: string = ''
  ) {
    if (!coreUtils.isValidElectrodeNativeModuleName(name)) {
      const errorMessage = `${name} is not a valid Electrode Native module name.\nCheck GLOSSARY for Electrode Native module naming rules.\nhttps://native.electrode.io/reference/glossary${extraErrorMessage}`
      throw new Error(errorMessage)
    }
  }

  public static isValidNpmPackageName(
    name: string,
    extraErrorMessage: string = ''
  ) {
    const validation = validateNpmPackageName(name)
    if (!validation.validForNewPackages) {
      const errorMessage = `${name} is not a valid NPM package name\n`
        .concat(validation.errors ? validation.errors.join('\n') : '')
        .concat(`\n${extraErrorMessage}`)
      throw new Error(errorMessage)
    }
  }

  public static isValidContainerVersion(
    version: string,
    extraErrorMessage: string = ''
  ) {
    if (/^\d+.\d+.\d+$/.test(version) === false) {
      throw new Error(
        `${version} is not a valid container version.\n${extraErrorMessage}`
      )
    }
  }

  public static async isNewerContainerVersion(
    descriptor: string | AppVersionDescriptor,
    containerVersion: string,
    extraErrorMessage: string = ''
  ) {
    const cauldron = await getActiveCauldron()
    const cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(
      coreUtils.coerceToAppVersionDescriptor(descriptor)
    )
    if (
      cauldronContainerVersion &&
      !semver.gt(containerVersion, cauldronContainerVersion)
    ) {
      throw new Error(
        `Container version ${containerVersion} is older than ${cauldronContainerVersion}\n${extraErrorMessage}`
      )
    }
  }

  public static noGitOrFilesystemPath(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const packagePaths = coreUtils.coerceToPackagePathArray(obj)
    for (const packagePath of packagePaths) {
      if (packagePath.isFilePath || packagePath.isGitPath) {
        throw new Error(
          `Found a git or file system path.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static noFileSystemPath(
    obj: string | string[],
    extraErrorMessage: string = ''
  ) {
    const paths = obj instanceof Array ? obj : [obj]
    for (const path of paths) {
      const dependencyPath = PackagePath.fromString(path)
      if (dependencyPath.isFilePath) {
        throw new Error(`Found a file system path.\n${extraErrorMessage}`)
      }
    }
  }

  public static async napDescritorExistsInCauldron(
    d: string | AnyAppDescriptor | Array<string | AnyAppDescriptor>,
    extraErrorMessage: string = ''
  ) {
    const cauldron = await getActiveCauldron()
    const descriptors = coreUtils.coerceToAnyAppDescriptorArray(d)
    for (const descriptor of descriptors) {
      const result = await cauldron.isDescriptorInCauldron(descriptor)
      if (!result) {
        throw new Error(
          `${descriptor.toString()} descriptor does not exist in Cauldron.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static sameNativeApplicationAndPlatform(
    descriptors: Array<string | AppVersionDescriptor>,
    extraErrorMessage: string = ''
  ) {
    const basePathDescriptors = _.map(
      coreUtils.coerceToAppVersionDescriptorArray(descriptors),
      d => `${d.name}:${d.platform}`
    )
    if (_.uniq(basePathDescriptors).length > 1) {
      throw new Error(
        `Descriptors do not all match the same native application/platform pair.\n${extraErrorMessage}`
      )
    }
  }

  public static async napDescritorDoesNotExistsInCauldron(
    d: AnyAppDescriptor | string,
    extraErrorMessage: string = ''
  ) {
    const cauldron = await getActiveCauldron()
    const descriptor = coreUtils.coerceToAnyAppDescriptor(d)
    if (await cauldron.isDescriptorInCauldron(descriptor)) {
      throw new Error(
        `${descriptor} descriptor exist in Cauldron.\n${extraErrorMessage}`
      )
    }
  }

  public static async publishedToNpm(
    obj: string | PackagePath | Array<string | PackagePath>,
    extraErrorMessage: string = ''
  ) {
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      if (!(await coreUtils.isPublishedToNpm(dependency))) {
        throw new Error(
          `${dependency} version is not published to NPM.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async miniAppNotInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const miniApps = coreUtils.coerceToPackagePathArray(obj)
    for (const miniApp of miniApps) {
      if (
        await cauldron.isMiniAppInContainer(napDescriptor, miniApp.basePath)
      ) {
        throw new Error(
          `${
            miniApp.basePath
          } MiniApp exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyNotInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      if (
        await cauldron.isNativeDependencyInContainer(
          napDescriptor,
          dependency.basePath
        )
      ) {
        throw new Error(
          `${
            dependency.basePath
          } dependency exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async miniAppIsInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const miniApps = coreUtils.coerceToPackagePathArray(obj)
    for (const miniApp of miniApps) {
      if (
        !(await cauldron.isMiniAppInContainer(napDescriptor, miniApp.basePath))
      ) {
        throw new Error(
          `${
            miniApp.basePath
          } MiniApp does not exist in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyIsInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      if (
        !(await cauldron.getContainerNativeDependency(
          napDescriptor,
          dependency.basePath
        ))
      ) {
        throw new Error(
          `${
            dependency.basePath
          } does not exists in ${napDescriptor}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const miniApps = coreUtils.coerceToPackagePathArray(obj)
    await Ensure.miniAppIsInNativeApplicationVersionContainer(
      miniApps,
      napDescriptor
    )
    for (const miniApp of miniApps) {
      const miniAppFromCauldron = await cauldron.getContainerMiniApp(
        napDescriptor,
        miniApp.basePath
      )
      const cauldronMiniApp = PackagePath.fromString(miniAppFromCauldron)
      if (cauldronMiniApp.version === miniApp.version) {
        throw new Error(
          `${
            cauldronMiniApp.basePath
          } is already at version ${miniApp.version ||
            ''} in ${napDescriptor}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
    obj: string | PackagePath[] | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    await Ensure.dependencyIsInNativeApplicationVersionContainer(
      obj,
      napDescriptor
    )
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      const dependencyFromCauldron = await cauldron.getContainerNativeDependency(
        napDescriptor,
        dependency.basePath
      )
      if (
        dependencyFromCauldron &&
        dependencyFromCauldron.version === dependency.version
      ) {
        throw new Error(
          `${
            dependency.basePath
          } is already at version ${dependencyFromCauldron.version ||
            'undefined'} in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyNotInUseByAMiniApp(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const dependencies = coreUtils.coerceToPackagePathArray(obj)

    // First let's figure out if any of the MiniApps are using this/these dependency(ies)
    // to make sure that we don't remove any dependency currently used by any MiniApp
    const miniApps = await cauldron.getContainerMiniApps(napDescriptor)

    for (const dependency of dependencies) {
      const miniAppsUsingDependency = await dependencyLookup.getMiniAppsUsingNativeDependency(
        miniApps,
        dependency
      )
      if (miniAppsUsingDependency && miniAppsUsingDependency.length > 0) {
        let errorMessage = ''
        errorMessage += 'The following MiniApp(s) are using this dependency\n'
        for (const miniApp of miniAppsUsingDependency) {
          errorMessage += `=> ${miniApp.name}\n`
        }
        errorMessage +=
          'You cannot remove a native dependency that is being used by at least a MiniApp\n'
        errorMessage +=
          'To properly remove this native dependency, you cant either :\n'
        errorMessage +=
          '- Remove the native dependency from the MiniApp(s) that are using it\n'
        errorMessage += '- Remove the MiniApps that are using this dependency\n'
        errorMessage +=
          '- Provide the force flag to this command (if you really now what you are doing !)\n'
        errorMessage += extraErrorMessage
        throw new Error(errorMessage)
      }
    }
  }

  public static async dependencyIsOrphaned(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: AppVersionDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const lock = await cauldron.getYarnLock(napDescriptor, 'container')
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    if (!lock) {
      return
    }
    const parser = YarnLockParser.fromContent(lock.toString())

    let errorMessage = ''
    for (const dependency of dependencies) {
      const tree = parser.buildDependencyTree(
        PackagePath.fromString(dependency.basePath)
      )
      if (
        _.isEmpty(tree) ||
        _.isEmpty(
          Object.keys(tree).filter(k => Object.keys(tree[k]).length > 0)
        )
      ) {
        continue
      }

      errorMessage += `${dependency} is not orphaned. It is used by one or more packages :\n`
      errorMessage += `${treeify.asTree(tree, true, true)}\n`
    }

    if (errorMessage !== '') {
      errorMessage += extraErrorMessage
      throw new Error(errorMessage)
    }
  }

  public static async cauldronIsActive(extraErrorMessage: string = '') {
    if (!(await getActiveCauldron({ throwIfNoActiveCauldron: false }))) {
      throw new Error(`There is no active Cauldron\n${extraErrorMessage}`)
    }
  }

  public static async pathExist(
    p: fs.PathLike,
    extraErrorMessage: string = ''
  ) {
    return new Promise((resolve, reject) => {
      fs.exists(p, exists =>
        exists
          ? resolve()
          : reject(new Error(`${p} path does not exist.\n${extraErrorMessage}`))
      )
    })
  }

  public static async isFilePath(
    p: fs.PathLike,
    extraErrorMessage: string = ''
  ) {
    return new Promise((resolve, reject) => {
      fs.stat(p, (err, stats) => {
        if (err) {
          reject(new Error(`${p} path does not exist.\n${extraErrorMessage}`))
        } else {
          if (stats.isFile()) {
            resolve()
          } else {
            reject(new Error(`${p} is not a file.\n${extraErrorMessage}`))
          }
        }
      })
    })
  }

  public static async isDirectoryPath(
    p: fs.PathLike,
    extraErrorMessage: string = ''
  ) {
    return new Promise((resolve, reject) => {
      fs.stat(p, (err, stats) => {
        if (err) {
          reject(new Error(`${p} path does not exist.\n${extraErrorMessage}`))
        } else {
          if (stats.isDirectory()) {
            resolve()
          } else {
            reject(new Error(`${p} is not a directory.\n${extraErrorMessage}`))
          }
        }
      })
    })
  }

  public static checkIfCodePushOptionsAreValid(
    descriptors?: Array<string | AppVersionDescriptor>,
    targetBinaryVersion?: string,
    semVerDescriptor?: string,
    extraErrorMessage: string = ''
  ) {
    if (targetBinaryVersion && semVerDescriptor) {
      throw new Error(
        'Specify either targetBinaryVersion or semVerDescriptor not both'
      )
    }
    if (targetBinaryVersion && descriptors && descriptors.length > 1) {
      throw new Error(
        'targetBinaryVersion must specify only 1 target native application version for the push'
      )
    }
  }

  public static isValidPlatformConfig(
    key: string,
    extraErrorMessage: string = ''
  ) {
    const availablePlatformKeys = () =>
      constants.availableUserConfigKeys.map(e => e.name)
    if (!availablePlatformKeys().includes(key)) {
      const closestKeyName = k =>
        availablePlatformKeys().reduce((acc, cur) =>
          levenshtein.get(acc, k) > levenshtein.get(cur, k) ? cur : acc
        )
      throw new Error(
        `Configuration key ${key} does not exists. Did you mean ${closestKeyName(
          key
        )}?`
      )
    }
  }

  // Electrode Native currently supports the following versions types
  // to be added to a Container for MiniApps or JS API Implementations
  // dependending of the path type :
  // - File Path      : No intrisic version. Not allowed.
  // - Git Path       : Branch/Tag/Commit SHA
  // - Registry Path  : Fixed (and valid) semantic version. No Ranges.
  public static isSupportedMiniAppOrJsApiImplVersion(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    extraErrorMessage?: string
  ) {
    if (obj) {
      const dependencies = coreUtils.coerceToPackagePathArray(obj)
      for (const dependency of dependencies) {
        if (dependency.isFilePath) {
          throw new Error('File Path not supported')
        } else if (dependency.isRegistryPath) {
          if (!dependency.version) {
            throw new Error(`Missing version for ${dependency}`)
          } else if (!semver.valid(dependency.version)) {
            throw new Error(
              `Unsupported version ${dependency.version} for ${
                dependency.basePath
              }`
            )
          }
        } else if (!dependency.version) {
          // git path
          throw new Error(`Missing version for ${dependency}`)
        }
      }
    }
  }

  public static isContainerPath(path: string, extraErrorMessage: string = '') {
    if (!fs.existsSync(getContainerMetadataPath(path))) {
      throw new Error(
        `${path} is not a path to a Container\n${extraErrorMessage}`
      )
    }
  }

  public static isEnvVariableDefined(
    envVarName: string,
    extraErrorMessage: string = ''
  ) {
    if (!process.env[envVarName]) {
      throw new Error(`${envVarName} is not defined\n${extraErrorMessage}`)
    }
  }

  public static async manifestIdExists(
    manifestId: string,
    extraErrorMessage: string = ''
  ) {
    if (!(await manifest.hasManifestId(manifestId))) {
      throw new Error(
        `${manifestId} id not found in the Manifest(s)\n${extraErrorMessage}`
      )
    }
  }

  public static async bundleStoreUrlSetInCauldron(
    extraErrorMessage: string = ''
  ) {
    const cauldron = await getActiveCauldron()
    const bundleStoreConfig = await cauldron.getBundleStoreConfig()
    if (!bundleStoreConfig || !bundleStoreConfig.url) {
      throw new Error(
        `bundleStore url not set in Cauldron\n${extraErrorMessage}`
      )
    }
  }

  public static bundleStoreAccessKeyIsSet(extraErrorMessage: string = '') {
    if (!config.getValue('bundlestore-accesskey')) {
      throw new Error(
        `bundlestore-accesskey is not set in configuration\n${extraErrorMessage}`
      )
    }
  }
}
