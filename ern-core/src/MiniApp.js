// @flow

import config from './config'
import PackagePath from './PackagePath'
import spin from './spin'
import tagOneLine from './tagoneline'
import shell from './shell'
import manifest from './Manifest'
import Platform from './Platform'
import createTmpDir from './createTmpDir'
import * as nativeDependenciesLookup from './nativeDependenciesLookup'
import {
  reactnative,
  yarn
} from './clients'
import * as ModuleTypes from './ModuleTypes'
import type {
  NativeDependencies
} from './nativeDependenciesLookup'
import * as utils from './utils'
import {
  execSync
} from 'child_process'
import fs from 'fs'
import path from 'path'
import semver from 'semver'
import _ from 'lodash'

export default class MiniApp {
  _path: string
  _packageJson: Object
  _isLocal: boolean
  _packagePath: PackagePath

  constructor (miniAppPath: string, isLocal: boolean, packagePath: PackagePath) {
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
    this._packagePath = packagePath
  }

  static fromCurrentPath () {
    return MiniApp.fromPath(process.cwd())
  }

  static existInPath (p) {
    // Need to improve this one to check in the package.json if it contains the
    // ern object with miniapp type
    return fs.existsSync(path.join(p, 'package.json'))
  }

  get packagePath () : PackagePath {
    return this._packagePath
  }

  static fromPath (path) {
    return new MiniApp(path, true /* isLocal */, PackagePath.fromString(path))
  }

  static async fromPackagePath (packagePath: PackagePath) {
    const tmpMiniAppPath = createTmpDir()
    shell.cd(tmpMiniAppPath)
    await yarn.add(packagePath)
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    const packageName = Object.keys(packageJson.dependencies)[0]
    shell.rm(path.join(tmpMiniAppPath, 'package.json'))
    shell.mv(path.join(tmpMiniAppPath, 'node_modules', packageName, '*'), tmpMiniAppPath)
    shell.rm('-rf', path.join(tmpMiniAppPath, 'node_modules', packageName, '*'))
    return new MiniApp(tmpMiniAppPath, false /* isLocal */, packagePath)
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
        manifest.getNativeDependency(PackagePath.fromString('react-native')))

      if (!reactNativeDependency) {
        throw new Error('react-native dependency is not defined in manifest. cannot infer version to be used')
      }

      const reactNativeVersion = reactNativeDependency.version
      if (!reactNativeVersion) {
        throw new Error('React Native version needs to be explicitely defined')
      }

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

  get normalizedName () : string {
    return this.name.replace(/-/g, '')
  }

  get pascalCaseName () : string {
    return `${this.normalizedName.charAt(0).toUpperCase()}${this.normalizedName.slice(1)}`
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

  async getNativeDependencies () : Promise<NativeDependencies> {
    return nativeDependenciesLookup.findNativeDependencies(path.join(this.path, 'node_modules'))
  }

  async isPublishedToNpm () : Promise<boolean> {
    return utils.isPublishedToNpm(PackagePath.fromString(`${this.packageJson.name}@${this.packageJson.version}`))
  }

  // Return all javascript (non native) dependencies currently used by the MiniApp
  // This method checks dependencies from the package.json of the MiniApp and
  // exclude native dependencies (plugins).
  async getJsDependencies () : Promise<Array<PackagePath>> {
    const nativeDependencies : NativeDependencies = await this.getNativeDependencies()
    const nativeDependenciesNames : Array<string> = _.map(nativeDependencies.all, d => d.name)
    const nativeAndJsDependencies = this.getPackageJsonDependencies()

    return _.filter(nativeAndJsDependencies, d => !nativeDependenciesNames.includes(d.name))
  }

  getPackageJsonDependencies () : Array<PackagePath> {
    return _.map(
      this.packageJson.dependencies, (val: string, key: string) =>
      PackagePath.fromString(`${key}@${val}`))
  }

  async addDependency (
    dependency: PackagePath,
    { dev, peer } : { dev?: boolean, peer?: boolean } = {}, addedDependencies: Array<string> = []) : Promise<?PackagePath> {
    if (dev || peer) {
      // Dependency is a devDependency or peerDependency
      // In that case we don't perform any checks at all (for now)
      const devDependencyPath = PackagePath.fromString(dependency.toString())
      if (dev) {
        await spin(`Adding ${dependency.toString()} to MiniApp devDependencies`, yarn.add(devDependencyPath, { dev: true }))
      } else {
        await spin(`Adding ${dependency.toString()} to MiniApp peerDependencies`, yarn.add(devDependencyPath, { peer: true }))
      }
    } else {
      let finalDependency
      // Dependency is not a development dependency
      // In that case we need to perform additional checks and operations
      const basePathDependency = new PackagePath(dependency.basePath)
      const manifestNativeDependency = await manifest.getNativeDependency(basePathDependency)
      const manifestDependency = manifestNativeDependency || await manifest.getJsDependency(basePathDependency)

      if (!manifestDependency) {
        // Dependency is not declared in manifest
        // We need to detect if this dependency is a pure JS one or if it's a native one or
        // if it contains transitive native dependencies
        const tmpPath = createTmpDir()
        process.chdir(tmpPath)
        await spin(`${basePathDependency.toString()} is not declared in the manifest. Performing additional checks.`,
                    yarn.add(PackagePath.fromString(dependency.toString())))

        const nativeDependencies = await nativeDependenciesLookup.findNativeDependencies(path.join(tmpPath, 'node_modules'))
        if (_.isEmpty(nativeDependencies.all)) {
          log.debug('Pure JS dependency')
          // This is a pure JS dependency. Not much to do here -yet-
          finalDependency = basePathDependency
        } else if (nativeDependencies.all.length >= 1) {
          log.debug(`One or more native dependencies identified: ${JSON.stringify(nativeDependencies.all)}`)
          for (let dep: PackagePath of nativeDependencies.all) {
            if (dependency.same(new PackagePath(dep.basePath), {ignoreVersion: true})) {
              if (await utils.isDependencyApiOrApiImpl(dep.basePath)) {
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
              if (!addedDependencies.includes(dep.basePath) && !await this.addDependency(dep, {dev: false, peer: false}, addedDependencies)) {
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
        await spin(`Adding ${finalDependency.toString()} to ${this.name}`, yarn.add(PackagePath.fromString(finalDependency.toString())))
        addedDependencies.push(finalDependency.basePath)
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
  manifestConformingDependency (dependency: PackagePath, manifestDependency: PackagePath): ? PackagePath {
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
      log.warn(`Manifest version: ${manifestDependency.version || 'undefined'}`)
      log.warn(`Wanted version: ${dependency.version || 'undefined'}`)
      log.warn(`You might want to update the version in your Manifest to add this dependency to ${this.name}`)
      return dependency
    }
  }

  async upgradeToPlatformVersion (versionToUpgradeTo: string) : Promise<*> {
    // Update all modules versions in package.json
    const manifestDependencies = await manifest.getJsAndNativeDependencies(versionToUpgradeTo)

    for (const manifestDependency of manifestDependencies) {
      if (this.packageJson.dependencies[manifestDependency.basePath]) {
        const dependencyManifestVersion = manifestDependency.version
        const localDependencyVersion = this.packageJson.dependencies[manifestDependency.basePath]
        if (dependencyManifestVersion !== localDependencyVersion) {
          log.info(`${manifestDependency.basePath} : ${localDependencyVersion} => ${dependencyManifestVersion}`)
          this.packageJson.dependencies[manifestDependency.basePath] = dependencyManifestVersion
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
    let miniAppsLinks = config.getValue('miniAppsLinks', {})
    const previousLinkPath = miniAppsLinks[this.packageJson.name]
    if (previousLinkPath && (previousLinkPath !== this.path)) {
      log.warn(`Replacing previous link [${this.packageJson.name} => ${previousLinkPath}]`)
    } else if (previousLinkPath && (previousLinkPath === this.path)) {
      return log.warn(`Link is already created for ${this.packageJson.name} with same path`)
    }
    miniAppsLinks[this.packageJson.name] = this.path
    config.setValue('miniAppsLinks', miniAppsLinks)
    log.info(`${this.packageJson.name} link created [${this.packageJson.name} => ${this.path}]`)
  }

  async unlink () {
    let miniAppsLinks = config.getValue('miniAppsLinks', {})
    if (miniAppsLinks[this.packageJson.name]) {
      delete miniAppsLinks[this.packageJson.name]
      config.setValue('miniAppsLinks', miniAppsLinks)
      log.info(`${this.packageJson.name} link was removed`)
    } else {
      return log.warn(`No link exists for ${this.packageJson.name}`)
    }
  }
}
