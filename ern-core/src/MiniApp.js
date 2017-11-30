// @flow

import {
  config as ernConfig,
  findNativeDependencies,
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor,
  spin,
  tagOneLine,
  shell
} from 'ern-util'
import manifest from './Manifest'
import Platform from './Platform'
import {
  reactnative,
  yarn
} from './clients'
import * as ModuleTypes from './ModuleTypes'
import {
  checkCompatibilityWithNativeApp
} from './compatibility'
import * as utils from './utils'
import {
  execSync
} from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import tmp from 'tmp'
import path from 'path'
import semver from 'semver'

export default class MiniApp {
  _path: string
  _packageJson: Object
  _isLocal: boolean

  constructor (miniAppPath: string, isLocal: boolean) {
    this._path = miniAppPath
    this._isLocal = isLocal

    const packageJsonPath = path.join(miniAppPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`This command should be run at the root of a mini-app`)
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (packageJson.ernPlatformVersion) {
      // TO REMOVE IN ERN 0.5.0
      log.warn(`
=================================================================
ernPlatformVersion will be deprecated soon
Please replace 
  "ernPlatformVersion" : "${packageJson.ernPlatformVersion}" 
with 
  "ern" : { "version" : "${packageJson.ernPlatformVersion}" }
in the package.json of ${packageJson.name} MiniApp
=================================================================`)
    } else if (!packageJson.ern) {
      throw new Error(tagOneLine`No ern section found in ${packageJson.name} package.json. 
Are you sure this is a MiniApp ?`)
    }

    this._packageJson = packageJson
  }

  static fromCurrentPath () {
    return MiniApp.fromPath(process.cwd())
  }

  static existInPath (p) {
    // Need to improve this one to check in the package.json if it contains the
    // ern object with miniapp type
    return fs.existsSync(path.join(p, 'package.json'))
  }

  static fromPath (path) {
    return new MiniApp(path, true /* isLocal */)
  }

  // Create a MiniApp object given a valid package path to the MiniApp
  // package path can be any valid git or npm path to the MiniApp
  // package
  static async fromPackagePath (packagePath: DependencyPath) {
    const tmpMiniAppPath = tmp.dirSync({ unsafeCleanup: true }).name
    shell.cd(tmpMiniAppPath)
    await yarn.add(packagePath)
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    const packageName = Object.keys(packageJson.dependencies)[0]
    shell.rm(path.join(tmpMiniAppPath, 'package.json'))
    shell.mv(path.join(tmpMiniAppPath, 'node_modules', packageName, '*'), tmpMiniAppPath)
    return new MiniApp(tmpMiniAppPath, false /* isLocal */)
  }

  static async create (
    miniAppName: string,
    packageName: string, {
      platformVersion = Platform.currentVersion,
      scope
    } : {
      platformVersion: string,
      scope?: string
    }) {
    try {
      if (fs.existsSync(path.join('node_modules', 'react-native'))) {
        throw new Error('It seems like there is already a react native app in this directory. Use another directory.')
      }

      if (Platform.currentVersion !== platformVersion) {
        Platform.switchToVersion(platformVersion)
      }

      log.info(`Creating ${miniAppName} MiniApp`)

      const reactNativeDependency = await spin(
        `Retrieving react-native version from Manifest`,
        manifest.getNativeDependency(Dependency.fromString('react-native')))

      if (!reactNativeDependency) {
        throw new Error('react-native dependency is not defined in manifest. cannot infer version to be used')
      }

      const reactNativeVersion = reactNativeDependency.version

      await spin(
        `Creating ${miniAppName} project using react-native v${reactNativeVersion}. This might take a while.`,
        reactnative.init(miniAppName, reactNativeVersion))

      // Inject ern specific data in MiniApp package.json
      const appPackageJsonPath = path.join(process.cwd(), miniAppName, 'package.json')
      const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf-8'))
      appPackageJson.ern = {
        version: platformVersion,
        moduleType: ModuleTypes.MINIAPP,
        moduleName: miniAppName
      }
      appPackageJson.private = false
      appPackageJson.keywords
        ? appPackageJson.keywords.push(ModuleTypes.MINIAPP)
        : appPackageJson.keywords = [ModuleTypes.MINIAPP]

      if (scope) {
        appPackageJson.name = `@${scope}/${packageName}`
      } else {
        appPackageJson.name = packageName
      }

      fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2))
      // Remove react-native generated android and ios projects
      // They will be replaced with our owns when user uses `ern run android`
      // or `ern run ios` command
      const miniAppPath = path.join(process.cwd(), miniAppName)
      shell.cd(miniAppPath)
      shell.rm('-rf', 'android')
      shell.rm('-rf', 'ios')

      if (semver.gte(reactNativeVersion, '0.49.0')) {
        // Starting from React Native v0.49.0, the generated file structure
        // is different. There is just a single `index.js` and `App.js` in
        // replacement of `index.ios.js` and `index.android.js`
        // To keep backard compatibility with file structure excpected by
        // Electrode Native, we just create `index.ios.js` and `index.android.js`
        shell.cp('index.js', 'index.ios.js')
        shell.cp('index.js', 'index.android.js')
        shell.rm('index.js')
      }

      return MiniApp.fromPath(miniAppPath)
    } catch (e) {
      log.debug(`[MiniApp.create] ${e}`)
      throw e
    }
  }

  get isLocal () : boolean {
    return this._isLocal
  }

  get packageJson () : Object {
    return this._packageJson
  }

  get path () : string {
    return this._path
  }

  get name (): string {
    if (this.packageJson.ern) {
      if (this.packageJson.ern.miniAppName) {
        return this.packageJson.ern.miniAppName
      } else if (this.packageJson.ern.moduleName) {
        return this.packageJson.ern.moduleName
      }
    }
    return this.getUnscopedModuleName(this.packageJson.name)
  }

  get scope () : ?string {
    const scopeCapture = /^@(.*)\//.exec(this.packageJson.name)
    if (scopeCapture) {
      return scopeCapture[1]
    }
  }

  get version () : string {
    return this.packageJson.version
  }

  get platformVersion () : string {
    return this.packageJson.ern ? this.packageJson.ern.version : this.packageJson.ernPlatformVersion
  }

  get packageDescriptor () : string {
    return `${this.packageJson.name}@${this.packageJson.version}`
  }

  // Return all native dependencies currently used by the mini-app
  get nativeDependencies () : Array<Dependency> {
    return findNativeDependencies(path.join(this.path, 'node_modules'))
  }

  async isPublishedToNpm () : Promise<boolean> {
    return utils.isPublishedToNpm(DependencyPath.fromString(`${this.packageJson.name}@${this.packageJson.version}`))
  }

  // Return all javascript (non native) dependencies currently used by the mini-app
  // This method checks dependencies from the pa2ckage.json of the miniapp and
  // exclude native dependencies (plugins).
  get jsDependencies () : Array<Dependency> {
    const nativeDependenciesNames = _.map(this.nativeDependencies, d => d.name)
    let result = _.map(this.packageJson.dependencies, (val: string, key: string) =>
            Dependency.fromString(`${key}@${val}`))

    return result == null ? [] : _.filter(result, d => !nativeDependenciesNames.includes(d.name))
  }

  get nativeAndJsDependencies () : Array<Dependency> {
    return [...this.jsDependencies, ...this.nativeDependencies]
  }

  async addDependency (
    dependency: Dependency,
    { dev, peer } : { dev?: boolean, peer?: boolean } = {}, addedDependencies: Array<string> = []) : Promise<?Dependency> {
    if (dev || peer) {
      // Dependency is a devDependency or peerDependency
      // In that case we don't perform any checks at all (for now)
      const devDependencyPath = DependencyPath.fromString(dependency.toString())
      if (dev) {
        await spin(`Adding ${dependency.toString()} to MiniApp devDependencies`, yarn.add(devDependencyPath, { dev: true }))
      } else {
        await spin(`Adding ${dependency.toString()} to MiniApp peerDependencies`, yarn.add(devDependencyPath, { peer: true }))
      }
    } else {
      let finalDependency
      // Dependency is not a development dependency
      // In that case we need to perform additional checks and operations
      const versionLessDependency = dependency.withoutVersion()
      const manifestNativeDependency = await manifest.getNativeDependency(versionLessDependency)
      const manifestDependency = manifestNativeDependency || await manifest.getJsDependency(versionLessDependency)

      if (!manifestDependency) {
        // Dependency is not declared in manifest
        // We need to detect if this dependency is a pure JS one or if it's a native one or
        // if it contains transitive native dependencies
        const tmpPath = tmp.dirSync({ unsafeCleanup: true }).name
        process.chdir(tmpPath)
        await spin(`${versionLessDependency.toString()} is not declared in the manifest. Performing additional checks.`,
                    yarn.add(DependencyPath.fromString(dependency.toString())))

        const nativeDependencies = findNativeDependencies(path.join(tmpPath, 'node_modules'))
        if (nativeDependencies.length === 0) {
          log.debug('Pure JS dependency')
          // This is a pure JS dependency. Not much to do here -yet-
          finalDependency = versionLessDependency
        } else if (nativeDependencies.length >= 1) {
          log.debug(`One or more native dependencies identified: ${JSON.stringify(nativeDependencies)}`)
          for (let dep: Dependency of nativeDependencies) {
            if (Dependency.same(dep.withoutVersion(), dependency, {ignoreVersion: true})) {
              if (await utils.isDependencyApiOrApiImpl(dep.scopedName)) {
                log.debug(`This is an api or api-impl`)
                log.warn(`${dep.toString()} is not declared in the Manifest. You might consider adding it.`)
                finalDependency = dep
              } else {
                // This is a third party native dependency. If it's not in the master manifest,
                // then it means that it is not supported by the platform yet. Fail.
                return log.error(`${dep.toString()} plugin is not yet supported. Consider adding support for it to the master manifest`)
              }
            } else {
              // This is a dependency which is not native itself but contains a native dependency as as transitive one (example 'native-base')
              // Recurse with this native dependency
              if (!addedDependencies.includes(dep.scopedName) && !await this.addDependency(dep, {dev: false, peer: false}, addedDependencies)) {
                return log.error(`${dep.toString()} was not added to the MiniApp.`)
              }
            }
          }
        }
      } else {
        log.debug(`Dependency:${dependency.toString()} defined in manifest, performing version match`)
        let d = this.manifestConformingDependency(dependency, manifestDependency)
        if (d) {
          finalDependency = d
        }
      }

      if (finalDependency) {
        process.chdir(this.path)
        await spin(`Adding ${finalDependency.toString()} to ${this.name}`, yarn.add(DependencyPath.fromString(finalDependency.toString())))
        addedDependencies.push(finalDependency.scopedName)
        return finalDependency
      } else {
        log.debug(`No final dependency? expected?`)
      }
    }
  }

  /**
   * Perform checks to ensure that proper dependency version is picked based on manifest entry.
   *
   * @param dependency dependency to be added
   * @param manifestDependency dependency defined in manifest
   * @returns {Dependency} Dependency with proper version number
   */
  manifestConformingDependency (dependency: Dependency, manifestDependency: Dependency): ? Dependency {
    if (!dependency.version || dependency.version === manifestDependency.version) {
      // If no version was specified for this dependency, we're good, just use the version
      // declared in the manifest
      return manifestDependency
    } else {
      // Dependency version mismatch. Let the user know of potential impacts and suggest user to
      // updat the version in the manifest
      // TODO : If not API/API impl, we need to ensure that plugin is supported by platform
      // for the provided plugin version
      log.warn(`${dependency.toString()} version mismatch.`)
      log.warn(`Manifest version: ${manifestDependency.version}`)
      log.warn(`Wanted version: ${dependency.version}`)
      log.warn(`You might want to update the version in your Manifest to add this dependency to ${this.name}`)
      return dependency
    }
  }

  async upgradeToPlatformVersion (versionToUpgradeTo: string) : Promise<*> {
    // Update all modules versions in package.json
    const manifestDependencies = await manifest.getJsAndNativeDependencies(versionToUpgradeTo)

    for (const manifestDependency of manifestDependencies) {
      const nameWithScope = `${manifestDependency.scope ? `@${manifestDependency.scope}/` : ''}${manifestDependency.name}`
      if (this.packageJson.dependencies[nameWithScope]) {
        const dependencyManifestVersion = manifestDependency.version
        const localDependencyVersion = this.packageJson.dependencies[nameWithScope]
        if (dependencyManifestVersion !== localDependencyVersion) {
          log.info(`${nameWithScope} : ${localDependencyVersion} => ${dependencyManifestVersion}`)
          this.packageJson.dependencies[nameWithScope] = dependencyManifestVersion
        }
      }
    }

    // Update ernPlatformVersion in package.json
    if (!this.packageJson.ern) {
      throw new Error(`In order to upgrade, please first replace "ernPlatformVersion" : "${this.packageJson.ernPlatformVersion}" in your package.json 
with "ern" : { "version" : "${this.packageJson.ernPlatformVersion}" } instead`)
    }

    this.packageJson.ern.version = versionToUpgradeTo

    // Write back package.json
    const appPackageJsonPath = path.join(this.path, 'package.json')
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(this.packageJson, null, 2))

    process.chdir(this.path)
    await spin(`Running yarn install`, yarn.install())
  }

  async addToNativeAppInCauldron (
    napDescriptor: NativeApplicationDescriptor,
    force?: boolean) {
    try {
      const cauldronInstance = await utils.getCauldronInstance()
      if (!cauldronInstance) {
        throw new Error('No Cauldron is active')
      }
      const nativeApp = await cauldronInstance.getNativeApp(napDescriptor)

      const miniApp = Dependency.fromString(`${this.packageJson.name}@${this.packageJson.version}`)

       // If this is not a forced add, we run quite some checks beforehand
      if (!force) {
        if (nativeApp.isReleased) {
          throw new Error(`${napDescriptor.toString()} is released. You cannot add or update MiniApps in its container.`)
        }

        /* log.info(`Checking that container version match native app version`)
        const nativeAppPlatformVersion = nativeApp.ernPlatformVersion
        const miniAppPlatformVersion = this.platformVersion
        if (nativeAppPlatformVersion !== miniAppPlatformVersion) {
        throw new Error(tagOneLine`Platform versions mismatch :
        [${miniAppName} => ${miniAppPlatformVersion}]
        [${appName}:${platformName}:${versionName} => ${nativeAppPlatformVersion}]`);
        } */

        log.debug('Checking compatibility with each native dependency')
        let report = await checkCompatibilityWithNativeApp(
          this,
          napDescriptor.name,
          napDescriptor.platform,
          napDescriptor.version)
        if (!report.isCompatible) {
          throw new Error('At least a native dependency is incompatible')
        }
      }

      for (const localNativeDependency of this.nativeDependencies) {
        // If local native dependency already exists at same version in cauldron,
        // we then don't need to add it or update it
        const localNativeDependencyString =
                        `${localNativeDependency.scope ? `@${localNativeDependency.scope}/` : ''}${localNativeDependency.name}`
        const remoteDependency =
                    await cauldronInstance.getNativeDependency(napDescriptor, localNativeDependencyString, { convertToObject: true })

        // Update dependency version in Cauldron, only if local dependency version is a newer version compared to Cauldron
        // This will only apply for API/API-IMPLS and bridge due to backward compatibility (if no major version update)
        // This does not apply to other third party native dependencies (anyway in that case the code should not react this
        // point as compatibility checks would have failed unless force flag is used)
        if (remoteDependency && (remoteDependency.version < localNativeDependency.version)) {
          await cauldronInstance.updateNativeAppDependency(napDescriptor, localNativeDependencyString, localNativeDependency.version)
        } else if (!remoteDependency) {
          await cauldronInstance.addNativeDependency(napDescriptor, localNativeDependency)
        }
      }

      const currentMiniAppEntryInContainer =
                await cauldronInstance.getContainerMiniApp(napDescriptor, miniApp.withoutVersion())

      if (currentMiniAppEntryInContainer && !nativeApp.isReleased) {
        await cauldronInstance.updateMiniAppVersion(napDescriptor, miniApp)
      } else if (!currentMiniAppEntryInContainer && !nativeApp.isReleased) {
        await cauldronInstance.addContainerMiniApp(napDescriptor, miniApp)
      } else {
        log.error('not supported')
      }
    } catch (e) {
      log.error(`[addMiniAppToNativeAppInCauldron ${e.message}`)
      throw e
    }
  }

  publishToNpm () {
    execSync(`npm publish --prefix ${this._path}`)
  }

  // Should go somewhere else. Does not belong in MiniApp class
  getUnscopedModuleName (moduleName: string) : string {
    const npmScopeModuleRe = /(@.*)\/(.*)/
    return npmScopeModuleRe.test(moduleName)
            ? npmScopeModuleRe.exec(`${moduleName}`)[2]
            : moduleName
  }

  async link () {
    let miniAppsLinks = ernConfig.getValue('miniAppsLinks', {})
    const previousLinkPath = miniAppsLinks[this.packageJson.name]
    if (previousLinkPath && (previousLinkPath !== this.path)) {
      log.warn(`Replacing previous link [${this.packageJson.name} => ${previousLinkPath}]`)
    } else if (previousLinkPath && (previousLinkPath === this.path)) {
      return log.warn(`Link is already created for ${this.packageJson.name} with same path`)
    }
    miniAppsLinks[this.packageJson.name] = this.path
    ernConfig.setValue('miniAppsLinks', miniAppsLinks)
    log.info(`${this.packageJson.name} link created [${this.packageJson.name} => ${this.path}]`)
  }

  async unlink () {
    let miniAppsLinks = ernConfig.getValue('miniAppsLinks', {})
    if (miniAppsLinks[this.packageJson.name]) {
      delete miniAppsLinks[this.packageJson.name]
      ernConfig.setValue('miniAppsLinks', miniAppsLinks)
      log.info(`${this.packageJson.name} link was removed`)
    } else {
      return log.warn(`No link exists for ${this.packageJson.name}`)
    }
  }
}
