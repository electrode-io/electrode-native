import { execSync } from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import semver from 'semver'
import { manifest } from './Manifest'
import * as ModuleTypes from './ModuleTypes'
import { PackagePath } from './PackagePath'
import Platform from './Platform'
import { reactnative, yarn } from './clients'
import config from './config'
import createTmpDir from './createTmpDir'
import log from './log'
import {
  findNativeDependencies,
  NativeDependencies,
} from './nativeDependenciesLookup'
import shell from './shell'
import spin from './spin'
import { tagOneLine } from './tagoneline'
import * as utils from './utils'
import {
  readPackageJson,
  readPackageJsonSync,
  writePackageJson,
} from './packageJsonFileUtils'
import { packageCache } from './packageCache'

const npmIgnoreContent = `ios/
android/
yarn.lock
.flowconfig
.buckconfig
.gitattributes
.watchmanconfig
`

export class MiniApp {
  public static fromCurrentPath() {
    return MiniApp.fromPath(process.cwd())
  }

  public static fromPath(fsPath: string) {
    return new MiniApp(fsPath, PackagePath.fromString(fsPath))
  }

  public static existInPath(p) {
    // Need to improve this one to check in the package.json if it contains the
    // ern object with miniapp type
    return fs.existsSync(path.join(p, 'package.json'))
  }

  public static async fromPackagePath(packagePath: PackagePath) {
    let fsPackagePath
    if (!packagePath.isFilePath && config.getValue('package-cache-enabled')) {
      if (!(await packageCache.isInCache(packagePath))) {
        fsPackagePath = await packageCache.addToCache(packagePath)
      } else {
        fsPackagePath = await packageCache.getObjectCachePath(packagePath)
        log.error(`path is ${fsPackagePath}`)
      }
    } else {
      fsPackagePath = createTmpDir()
      shell.cd(fsPackagePath)
      await yarn.add(packagePath)
      const packageJson = await readPackageJson('.')
      const packageName = Object.keys(packageJson.dependencies)[0]
      shell.rm(path.join(fsPackagePath, 'package.json'))
      shell.mv(
        path.join(fsPackagePath, 'node_modules', packageName, '*'),
        fsPackagePath
      )
      shell.rm(
        '-rf',
        path.join(fsPackagePath, 'node_modules', packageName, '*')
      )
    }
    return new MiniApp(fsPackagePath, packagePath)
  }

  public static async create(
    miniAppName: string,
    packageName: string,
    {
      platformVersion = Platform.currentVersion,
      scope,
    }: {
      platformVersion: string
      scope?: string
    }
  ) {
    try {
      if (fs.existsSync(path.join('node_modules', 'react-native'))) {
        throw new Error(
          'It seems like there is already a react native app in this directory. Use another directory.'
        )
      }

      if (Platform.currentVersion !== platformVersion) {
        Platform.switchToVersion(platformVersion)
      }

      log.info(`Creating ${miniAppName} MiniApp`)

      const reactNativeDependency = await spin(
        `Retrieving react-native version from Manifest`,
        manifest.getNativeDependency(PackagePath.fromString('react-native'))
      )

      if (!reactNativeDependency) {
        throw new Error(
          'react-native dependency is not defined in manifest. cannot infer version to be used'
        )
      }

      const reactNativeVersion = reactNativeDependency.version
      if (!reactNativeVersion) {
        throw new Error('React Native version needs to be explicitely defined')
      }

      await spin(
        `Creating ${miniAppName} project using react-native v${reactNativeVersion}. This might take a while.`,
        reactnative.init(miniAppName, reactNativeVersion)
      )

      // Create .npmignore
      const npmIgnorePath = path.join(process.cwd(), miniAppName, '.npmignore')
      fs.writeFileSync(npmIgnorePath, npmIgnoreContent)

      // Inject ern specific data in MiniApp package.json
      const pathToMiniApp = path.join(process.cwd(), miniAppName)
      const appPackageJson = await readPackageJson(pathToMiniApp)
      appPackageJson.ern = {
        moduleName: miniAppName,
        moduleType: ModuleTypes.MINIAPP,
        version: platformVersion,
      }
      appPackageJson.private = false
      appPackageJson.keywords
        ? appPackageJson.keywords.push(ModuleTypes.MINIAPP)
        : (appPackageJson.keywords = [ModuleTypes.MINIAPP])

      if (scope) {
        appPackageJson.name = `@${scope}/${packageName}`
      } else {
        appPackageJson.name = packageName
      }

      await writePackageJson(pathToMiniApp, appPackageJson)

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

  public readonly path: string
  public readonly packageJson: any
  public readonly packagePath: PackagePath

  constructor(miniAppPath: string, packagePath: PackagePath) {
    this.path = miniAppPath

    const packageJsonPath = path.join(miniAppPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`This command should be run at the root of a mini-app`)
    }

    const packageJson = readPackageJsonSync(miniAppPath)
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
      throw new Error(
        tagOneLine`No ern section found in ${
          packageJson.name
        } package.json. Are you sure this is a MiniApp ?`
      )
    }

    this.packageJson = packageJson
    this.packagePath = packagePath
  }

  get name(): string {
    if (this.packageJson.ern) {
      if (this.packageJson.ern.miniAppName) {
        return this.packageJson.ern.miniAppName
      } else if (this.packageJson.ern.moduleName) {
        return this.packageJson.ern.moduleName
      }
    }
    return this.getUnscopedModuleName(this.packageJson.name)
  }

  get normalizedName(): string {
    return this.name.replace(/-/g, '')
  }

  get pascalCaseName(): string {
    return `${this.normalizedName
      .charAt(0)
      .toUpperCase()}${this.normalizedName.slice(1)}`
  }

  get scope(): string | void {
    const scopeCapture = /^@(.*)\//.exec(this.packageJson.name)
    if (scopeCapture) {
      return scopeCapture[1]
    }
  }

  get version(): string {
    return this.packageJson.version
  }

  get platformVersion(): string {
    return this.packageJson.ern
      ? this.packageJson.ern.version
      : this.packageJson.ernPlatformVersion
  }

  get packageDescriptor(): string {
    return `${this.packageJson.name}@${this.packageJson.version}`
  }

  public async getNativeDependencies(): Promise<NativeDependencies> {
    return findNativeDependencies(path.join(this.path, 'node_modules'))
  }

  public async isPublishedToNpm(): Promise<boolean> {
    return utils.isPublishedToNpm(
      PackagePath.fromString(
        `${this.packageJson.name}@${this.packageJson.version}`
      )
    )
  }

  // Return all javascript (non native) dependencies currently used by the MiniApp
  // This method checks dependencies from the package.json of the MiniApp and
  // exclude native dependencies (plugins).
  public async getJsDependencies(): Promise<PackagePath[]> {
    const nativeDependencies: NativeDependencies = await this.getNativeDependencies()
    const nativeDependenciesNames: string[] = _.map(
      nativeDependencies.all,
      d => d.basePath
    )
    const nativeAndJsDependencies = this.getPackageJsonDependencies()

    return _.filter(
      nativeAndJsDependencies,
      d => !nativeDependenciesNames.includes(d.basePath)
    )
  }

  public getPackageJsonDependencies(): PackagePath[] {
    return _.map(this.packageJson.dependencies, (val: string, key: string) =>
      PackagePath.fromString(`${key}@${val}`)
    )
  }

  public async addDependency(
    dependency: PackagePath,
    { dev, peer }: { dev?: boolean; peer?: boolean } = {}
  ): Promise<PackagePath | void> {
    if (dev || peer) {
      // Dependency is a devDependency or peerDependency
      // In that case we don't perform any checks at all (for now)
      await this.addDevOrPeerDependency(dependency, dev)
    } else {
      // Dependency is not a development dependency
      // In that case we need to perform additional checks and operations
      const basePathDependency = new PackagePath(dependency.basePath)
      const manifestNativeDependency = await manifest.getNativeDependency(
        basePathDependency
      )
      const manifestDependency =
        manifestNativeDependency ||
        (await manifest.getJsDependency(basePathDependency))

      if (!manifestDependency) {
        // Dependency is not declared in manifest
        // We need to detect if this dependency is a pure JS one or if it's a native one or
        // if it contains transitive native dependencies
        const tmpPath = createTmpDir()
        process.chdir(tmpPath)
        await spin(
          `${basePathDependency.toString()} is not declared in the manifest. Performing additional checks.`,
          yarn.add(PackagePath.fromString(dependency.toString()))
        )

        const nativeDependencies = await findNativeDependencies(
          path.join(tmpPath, 'node_modules')
        )
        if (_.isEmpty(nativeDependencies.all)) {
          log.debug('Pure JS dependency')
          // This is a pure JS dependency. Not much to do here -yet-
        } else if (nativeDependencies.all.length >= 1) {
          log.debug(
            `One or more native dependencies identified: ${JSON.stringify(
              nativeDependencies.all
            )}`
          )
          let dep: PackagePath
          for (dep of nativeDependencies.all) {
            if (
              dependency.same(new PackagePath(dep.basePath), {
                ignoreVersion: true,
              })
            ) {
              if (await utils.isDependencyApiOrApiImpl(dep.basePath)) {
                log.debug(`${dep.toString()} is an api or api-impl`)
                log.warn(
                  `${dep.toString()} is not declared in the Manifest. You might consider adding it.`
                )
              } else {
                // This is a third party native dependency. If it's not in the master manifest,
                // then it means that it is not supported by the platform yet. Fail.
                return log.error(
                  `${dep.toString()} plugin is not yet supported. Consider adding support for it to the master manifest`
                )
              }
            } else {
              // This is a dependency which is not native itself but contains a native dependency as  transitive one (example 'native-base')
              // If ern platform contains entry in the manifest but dependency versions do not align, report error
              const transitiveDep = await manifest.getNativeDependency(
                new PackagePath(dep.basePath)
              )
              if (
                transitiveDep &&
                !dep.same(transitiveDep, { ignoreVersion: false })
              ) {
                return log.error(
                  `${basePathDependency.toString()} was not added to the MiniApp. Transitive dependency ${dep.toString()} in ${basePathDependency.toString()} differs with manifest version which is ${transitiveDep.toString()}`
                )
              }
            }
          }
        }
      } else {
        log.debug(
          `Dependency:${dependency.toString()} defined in manifest, performing version match`
        )
        if (
          dependency &&
          !dependency.same(manifestDependency, { ignoreVersion: false })
        ) {
          return log.error(
            `${basePathDependency.toString()} was not added to the MiniApp. Transitive dependency ${dependency.toString()} in ${basePathDependency.toString()} differs with manifest version which is ${manifestDependency.toString()}`
          )
        }
      }
      if (dependency) {
        process.chdir(this.path)
        await spin(
          `Adding ${dependency.toString()} to ${this.name}`,
          yarn.add(PackagePath.fromString(dependency.toString()))
        )
        return dependency
      } else {
        log.debug('No final dependency? expected?')
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
  public manifestConformingDependency(
    dependency: PackagePath,
    manifestDependency: PackagePath
  ): PackagePath | void {
    if (
      !dependency.version ||
      dependency.version === manifestDependency.version
    ) {
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
      log.warn(
        `You might want to update the version in your Manifest to add this dependency to ${
          this.name
        }`
      )
      return dependency
    }
  }

  public async upgradeToPlatformVersion(
    versionToUpgradeTo: string
  ): Promise<any> {
    // Update all modules versions in package.json
    const manifestDependencies = await manifest.getJsAndNativeDependencies(
      versionToUpgradeTo
    )

    for (const manifestDependency of manifestDependencies) {
      if (this.packageJson.dependencies[manifestDependency.basePath]) {
        const dependencyManifestVersion = manifestDependency.version
        const localDependencyVersion = this.packageJson.dependencies[
          manifestDependency.basePath
        ]
        if (dependencyManifestVersion !== localDependencyVersion) {
          log.info(
            `${
              manifestDependency.basePath
            } : ${localDependencyVersion} => ${dependencyManifestVersion}`
          )
          this.packageJson.dependencies[
            manifestDependency.basePath
          ] = dependencyManifestVersion
        }
      }
    }

    // Update ernPlatformVersion in package.json
    if (!this.packageJson.ern) {
      throw new Error(`In order to upgrade, please first replace "ernPlatformVersion" : "${
        this.packageJson.ernPlatformVersion
      }" in your package.json 
with "ern" : { "version" : "${this.packageJson.ernPlatformVersion}" } instead`)
    }

    this.packageJson.ern.version = versionToUpgradeTo

    // Write back package.json
    const appPackageJsonPath = path.join(this.path, 'package.json')
    fs.writeFileSync(
      appPackageJsonPath,
      JSON.stringify(this.packageJson, null, 2)
    )

    process.chdir(this.path)
    await spin(`Running yarn install`, yarn.install())
  }

  public publishToNpm() {
    execSync(`npm publish --prefix ${this.path}`)
  }

  // Should go somewhere else. Does not belong in MiniApp class
  public getUnscopedModuleName(moduleName: string): string {
    const npmScopeModuleRe = /(@.*)\/(.*)/
    return npmScopeModuleRe.test(moduleName)
      ? npmScopeModuleRe.exec(moduleName)![2]
      : moduleName
  }

  public async link() {
    const miniAppsLinks = config.getValue('miniAppsLinks', {})
    const previousLinkPath = miniAppsLinks[this.packageJson.name]
    if (previousLinkPath && previousLinkPath !== this.path) {
      log.warn(
        `Replacing previous link [${
          this.packageJson.name
        } => ${previousLinkPath}]`
      )
    } else if (previousLinkPath && previousLinkPath === this.path) {
      return log.warn(
        `Link is already created for ${this.packageJson.name} with same path`
      )
    }
    miniAppsLinks[this.packageJson.name] = this.path
    config.setValue('miniAppsLinks', miniAppsLinks)
    log.info(
      `${this.packageJson.name} link created [${this.packageJson.name} => ${
        this.path
      }]`
    )
  }

  public async unlink() {
    const miniAppsLinks = config.getValue('miniAppsLinks', {})
    if (miniAppsLinks[this.packageJson.name]) {
      delete miniAppsLinks[this.packageJson.name]
      config.setValue('miniAppsLinks', miniAppsLinks)
      log.info(`${this.packageJson.name} link was removed`)
    } else {
      return log.warn(`No link exists for ${this.packageJson.name}`)
    }
  }

  private async addDevOrPeerDependency(
    dependency: PackagePath,
    dev: boolean | undefined
  ) {
    const depPath = PackagePath.fromString(dependency.toString())
    if (dev) {
      await spin(
        `Adding ${dependency.toString()} to MiniApp devDependencies`,
        yarn.add(depPath, { dev: true })
      )
    } else {
      await spin(
        `Adding ${dependency.toString()} to MiniApp peerDependencies`,
        yarn.add(depPath, { peer: true })
      )
    }
  }
}
