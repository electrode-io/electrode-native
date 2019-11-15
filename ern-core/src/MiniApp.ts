import { execSync, execFile } from 'child_process'
import fs from 'fs-extra'
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
import * as utils from './utils'
import { readPackageJson, writePackageJson } from './packageJsonFileUtils'
import { packageCache } from './packageCache'
import kax from './kax'
import { BaseMiniApp } from './BaseMiniApp'
import _ from 'lodash'

const npmIgnoreContent = `ios/
android/
yarn.lock
.flowconfig
.buckconfig
.gitattributes
.watchmanconfig
`

export class MiniApp extends BaseMiniApp {
  // Session cache
  public static miniAppFsPathByPackagePath = new Map<string, string>()

  public static fromCurrentPath() {
    return MiniApp.fromPath(process.cwd())
  }

  public static fromPath(fsPath: string) {
    return new MiniApp(fsPath, PackagePath.fromString(fsPath))
  }

  public static existInPath(p) {
    // Need to improve this one to check in the package.json if it contains the
    // ern object with miniapp type
    return fs.pathExistsSync(path.join(p, 'package.json'))
  }

  public static async fromPackagePath(packagePath: PackagePath) {
    let fsPackagePath
    if (
      config.get('package-cache-enabled', true) &&
      !packagePath.isFilePath &&
      !(await utils.isGitBranch(packagePath))
    ) {
      if (!(await packageCache.isInCache(packagePath))) {
        fsPackagePath = await packageCache.addToCache(packagePath)
      } else {
        fsPackagePath = await packageCache.getObjectCachePath(packagePath)
      }
    } else {
      if (this.miniAppFsPathByPackagePath.has(packagePath.fullPath)) {
        fsPackagePath = this.miniAppFsPathByPackagePath.get(
          packagePath.fullPath
        )
      } else {
        fsPackagePath = createTmpDir()
        shell.pushd(fsPackagePath)
        try {
          await yarn.init()
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
        } finally {
          shell.popd()
        }
      }
    }
    this.miniAppFsPathByPackagePath.set(packagePath.fullPath, fsPackagePath)
    return new MiniApp(fsPackagePath, packagePath)
  }

  public static async create(
    miniAppName: string,
    packageName: string,
    {
      language = 'JavaScript',
      manifestId,
      packageManager,
      platformVersion = Platform.currentVersion,
      scope,
      template,
    }: {
      language?: 'JavaScript' | 'TypeScript'
      manifestId?: string
      packageManager?: 'npm' | 'yarn'
      platformVersion?: string
      scope?: string
      template?: string
    } = {}
  ) {
    if (await fs.pathExists(path.join('node_modules/react-native'))) {
      throw new Error(
        'It seems like there is already a react native app in this directory. Use another directory.'
      )
    }

    if (Platform.currentVersion !== platformVersion) {
      Platform.switchToVersion(platformVersion)
    }

    let reactNativeVersion
    const retrieveRnManifestTask = kax.task(
      'Querying Manifest for react-native version to use'
    )

    try {
      const reactNativeDependency = await manifest.getNativeDependency(
        PackagePath.fromString('react-native'),
        {
          manifestId,
          platformVersion,
        }
      )

      if (!reactNativeDependency) {
        throw new Error(
          'react-native dependency is not defined in manifest. cannot infer version to be used'
        )
      }

      reactNativeVersion = reactNativeDependency.version
      if (!reactNativeVersion) {
        throw new Error('React Native version needs to be explicitly defined')
      }
      retrieveRnManifestTask.succeed(
        `Retrieved react-native version from Manifest [${reactNativeVersion}]`
      )
    } catch (e) {
      retrieveRnManifestTask.fail()
      throw e
    }

    if (
      process.platform === 'darwin' &&
      semver.gte(reactNativeVersion, '0.60.0') &&
      !Platform.isCocoaPodsInstalled()
    ) {
      throw new Error(`pod command not found.
CocoaPods is required starting from React Native 0.60 version.
You can find instructions to install CocoaPods @ https://cocoapods.org`)
    }

    await kax
      .task(
        `Creating ${miniAppName} project using react-native v${reactNativeVersion}`
      )
      .run(
        reactnative.init(miniAppName, reactNativeVersion, {
          template:
            language === 'TypeScript'
              ? 'typescript'
              : template
              ? template
              : undefined,
        })
      )

    // Create .npmignore if it does not exist
    const npmIgnorePath = path.join(process.cwd(), miniAppName, '.npmignore')
    if (!npmIgnorePath) {
      await fs.writeFile(npmIgnorePath, npmIgnoreContent)
    }

    // Inject ern specific data in MiniApp package.json
    const pathToMiniApp = path.join(process.cwd(), miniAppName)
    const appPackageJson = await readPackageJson(pathToMiniApp)
    appPackageJson.ern = {
      moduleName: miniAppName,
      moduleType: ModuleTypes.MINIAPP,
      packageManager: packageManager
        ? packageManager
        : Platform.isYarnInstalled()
        ? 'yarn'
        : 'npm',
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

    const miniAppPath = path.join(process.cwd(), miniAppName)

    // For RN > 0.57
    // Write custom metro.config.js to make sure that packager does not crash
    // on Windows while building the Runner.
    // Do not write this file if creating a MiniApp from a project template
    // as the template might contain a custom metro.config.js file.
    // This is the responsibility of the template project owner to add
    // resolver blacklisted paths.
    // See https://github.com/facebook/react-native/issues/9136#issuecomment-348773574
    if (semver.gt(reactNativeVersion, '0.57.0') && !template) {
      await fs.writeFile(
        path.join(miniAppPath, 'metro.config.js'),
        `const blacklist = require('metro-config/src/defaults/blacklist');
module.exports = {
  resolver: {
    blacklistRE: blacklist([
      // Ignore IntelliJ directories
      /.*\\.idea\\/.*/,
      // ignore git directories
      /.*\\.git\\/.*/,
      // Ignore android directories
      /.*\\/app\\/build\\/.*/,
    ]),
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
`
      )
    }

    // Remove react-native generated android and ios projects
    // They will be replaced with our owns when user uses `ern run android`
    // or `ern run ios` command
    // Also add ern-navigation dependency to the MiniApp.
    shell.pushd(miniAppPath)
    try {
      shell.rm('-rf', 'android')
      shell.rm('-rf', 'ios')
      const ernNavigationDependency =
        (await kax
          .task('Querying Manifest for ern-navigation version to use')
          .run(
            manifest.getNativeDependency(
              PackagePath.fromString('ern-navigation'),
              {
                manifestId,
                platformVersion,
              }
            )
          )) || PackagePath.fromString('ern-navigation')
      await kax
        .task(`Adding ${ernNavigationDependency} dependency`)
        .run(yarn.add(ernNavigationDependency))
      return MiniApp.fromPath(miniAppPath)
    } finally {
      shell.popd()
    }
  }

  constructor(miniAppPath: string, packagePath: PackagePath) {
    super({ miniAppPath, packagePath })
  }

  public async getNativeDependencies({
    manifestId,
  }: { manifestId?: string } = {}): Promise<NativeDependencies> {
    return findNativeDependencies(path.join(this.path, 'node_modules'), {
      manifestId,
    })
  }

  // Return all javascript (non native) dependencies currently used by the MiniApp
  // This method checks dependencies from the package.json of the MiniApp and
  // exclude native dependencies (plugins).
  public async getJsDependencies(): Promise<PackagePath[]> {
    const nativeDependencies: NativeDependencies = await this.getNativeDependencies()
    const nativeDependenciesNames: string[] = _.map(
      nativeDependencies.all,
      d => d.packagePath.basePath
    )
    const nativeAndJsDependencies = this.getPackageJsonDependencies()

    return _.filter(
      nativeAndJsDependencies,
      d => !nativeDependenciesNames.includes(d.basePath)
    )
  }

  public async addDependency(
    dependency: PackagePath,
    {
      dev,
      manifestId,
      peer,
    }: { dev?: boolean; manifestId?: string; peer?: boolean } = {}
  ): Promise<PackagePath | void> {
    if (!dependency) {
      return log.error('dependency cannot be null')
    }
    if (dev || peer) {
      // Dependency is a devDependency or peerDependency
      // In that case we don't perform any checks at all (for now)
      await this.addDevOrPeerDependency(dependency, dev)
    } else {
      // Dependency is not a development dependency
      // In that case we need to perform additional checks and operations
      const basePathDependency = new PackagePath(dependency.basePath)
      const manifestNativeDependency = await manifest.getNativeDependency(
        basePathDependency,
        { manifestId }
      )
      const manifestDependency =
        manifestNativeDependency ||
        (await manifest.getJsDependency(basePathDependency, { manifestId }))

      if (!manifestDependency) {
        // Dependency is not declared in manifest
        // We need to detect if this dependency is a pure JS one or if it's a native one or
        // if it contains transitive native dependencies
        const tmpPath = createTmpDir()
        process.chdir(tmpPath)
        await kax
          .task(
            `${basePathDependency.toString()} is not declared in the manifest. Performing additional checks.`
          )
          .run(
            this.packageManager.add(
              PackagePath.fromString(dependency.toString())
            )
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
          let dep
          for (dep of nativeDependencies.all) {
            if (
              dependency.same(new PackagePath(dep.packagePath.basePath), {
                ignoreVersion: true,
              })
            ) {
              if (
                await utils.isDependencyApiOrApiImpl(dep.packagePath.basePath)
              ) {
                log.debug(`${dep.packagePath.toString()} is an api or api-impl`)
                log.warn(
                  `${dep.packagePath.toString()} is not declared in the Manifest. You might consider adding it.`
                )
              } else {
                // This is a third party native dependency. If it's not in the master manifest,
                // then it means that it is not supported by the platform yet. Fail.
                return log.error(
                  `${dep.packagePath.toString()} plugin is not yet supported. Consider adding support for it to the master manifest`
                )
              }
            } else {
              // This is a dependency which is not native itself but contains a native dependency as  transitive one (example 'native-base')
              // If ern platform contains entry in the manifest but dependency versions do not align, report error
              const manifestDep = await manifest.getNativeDependency(
                new PackagePath(dep.packagePath.basePath),
                { manifestId }
              )
              if (manifestDep) {
                if (
                  !dep.packagePath.same(manifestDep, { ignoreVersion: false })
                ) {
                  throw new Error(
                    `[Transitive Dependency] ${dep.packagePath.toString()} was not added to the MiniApp`
                  )
                }
              }
            }
          }
        }
      } else {
        if (dependency.version) {
          log.debug(
            `Dependency:${dependency.toString()} defined in manifest, performing version match`
          )
          // If the dependency & manifest version differ, log error and exit
          if (!dependency.same(manifestDependency, { ignoreVersion: false })) {
            throw new Error(
              `${dependency.toString()} was not added to the MiniApp`
            )
          }
        }
      }

      // Checks have passed add the dependency
      process.chdir(this.path)
      await kax
        .task(
          `Adding ${
            manifestDependency
              ? manifestDependency.toString()
              : dependency.toString()
          } to ${this.name}`
        )
        .run(
          this.packageManager.add(
            manifestDependency || PackagePath.fromString(dependency.toString())
          )
        )
      return manifestDependency ? manifestDependency : dependency
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

  public async upgrade({
    manifestId,
    platformVersion = Platform.currentVersion,
  }: {
    manifestId?: string
    platformVersion?: string
  } = {}): Promise<any> {
    // Update all modules versions in package.json
    const manifestDependencies = await manifest.getJsAndNativeDependencies({
      manifestId,
      platformVersion,
    })

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

    this.packageJson.ern.version = platformVersion

    // Write back package.json
    const appPackageJsonPath = path.join(this.path, 'package.json')
    await fs.writeFile(
      appPackageJsonPath,
      JSON.stringify(this.packageJson, null, 2)
    )

    process.chdir(this.path)
    await kax.task('Running yarn install').run(this.packageManager.install())
  }

  public publishToNpm() {
    execSync(`npm publish --prefix ${this.path}`)
  }

  private async addDevOrPeerDependency(
    dependency: PackagePath,
    dev: boolean | undefined
  ) {
    const depPath = PackagePath.fromString(dependency.toString())
    if (dev) {
      await kax
        .task(`Adding ${dependency.toString()} to MiniApp devDependencies`)
        .run(this.packageManager.add(depPath, { dev: true }))
    } else {
      await kax
        .task(`Adding ${dependency.toString()} to MiniApp peerDependencies`)
        .run(this.packageManager.add(depPath, { peer: true }))
    }
  }
}
