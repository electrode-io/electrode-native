// @flow

import {
  generateContainerForRunner,
  generateRunner
} from 'ern-runner-gen'
import {
  android,
  config as ernConfig,
  findNativeDependencies,
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor,
  spin,
  tagOneLine
} from 'ern-util'
import cauldron from './cauldron'
import manifest from './manifest'
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
import inquirer from 'inquirer'
import _ from 'lodash'
import shell from 'shelljs'
import tmp from 'tmp'
import path from 'path'
import ora from 'ora'

const simctl = require('node-simctl')

const {
  runAndroid
} = android

export default class MiniApp {
  _path: string
  _packageJson: Object

  constructor (miniAppPath: string) {
    this._path = miniAppPath

    const packageJsonPath = `${miniAppPath}/package.json`
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`This command should be run at the root of a mini-app`)
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (packageJson.ernPlatformVersion) {
      // TO REMOVE IN ERN 0.5.0
      log.warn(`
=================================================================
ernPlatformVersion will be deprecated in next ern version. 
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
    return new MiniApp(process.cwd())
  }

  static fromPath (path) {
    return new MiniApp(path)
  }

  // Create a MiniApp object given a valid package path to the MiniApp
  // package path can be any valid git/npm or file path to the MiniApp
  // package
  static async fromPackagePath (packagePath: DependencyPath) {
    const tmpMiniAppPath = tmp.dirSync({ unsafeCleanup: true }).name
    shell.cd(tmpMiniAppPath)
    await yarn.add(packagePath)
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    const packageName = Object.keys(packageJson.dependencies)[0]
    shell.rm(path.join(tmpMiniAppPath, 'package.json'))
    shell.mv(path.join(tmpMiniAppPath, 'node_modules', packageName, '*'), tmpMiniAppPath)
    return this.fromPath(tmpMiniAppPath)
  }

  static async create (
    appName: string, {
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

      log.info(`Creating ${appName} MiniApp using platform version ${platformVersion}`)

      const reactNativeDependency = await manifest.getNativeDependency(Dependency.fromString('react-native'))
      if (!reactNativeDependency) {
        throw new Error('react-native dependency is not defined in manifest. cannot infer version to be used')
      }

      const reactDependency = await manifest.getJsDependency(Dependency.fromString('react'))
      if (!reactDependency) {
        throw new Error('react dependency is not defined in manifest. cannot infer version to be used')
      }

      //
      // Create application using react-native init command
      await spin(`Running react-native init using react-native v${reactNativeDependency.version}`,
                reactnative.init(appName, reactNativeDependency.version))

      //
      // Patch package.json file of application
      const appPackageJsonPath = `${process.cwd()}/${appName}/package.json`
      const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf-8'))
      appPackageJson.ern = {
        version: `${platformVersion}`,
        moduleType: `${ModuleTypes.MINIAPP}`
      }
      appPackageJson.private = false
      appPackageJson.dependencies['react'] = reactDependency.version
      appPackageJson.keywords
        ? appPackageJson.keywords.push(ModuleTypes.MINIAPP)
        : appPackageJson.keywords = [ModuleTypes.MINIAPP]

      if (scope) {
        appPackageJson.name = `@${scope}/${appName}`
      }
      fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2))

      //
      // Remove react-native generated android and ios projects
      // They will be replaced with our owns when user uses `ern run android`
      // or `ern run ios` command
      const miniAppPath = `${process.cwd()}/${appName}`
      shell.cd(miniAppPath)
      shell.rm('-rf', 'android')
      shell.rm('-rf', 'ios')

      return new MiniApp(miniAppPath)
    } catch (e) {
      log.debug(`[MiniApp.create] ${e}`)
      throw e
    }
  }

  get packageJson () : Object {
    return this._packageJson
  }

  get path () : string {
    return this._path
  }

  get name (): string {
    return this.getUnscopedModuleName(this.packageJson.name)
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
    return findNativeDependencies(`${this.path}/node_modules`)
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

  async runInIosRunner ({
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled: boolean
  } = {}) : Promise<*> {
    reactnative.startPackagerInNewWindow()

    // Unfortunately, for now, because Container for IOS is not as dynamic as Android one
    // (no code injection for plugins yet :()), it has hard-coded references to
    // our bridge and code-push ... so we absolutely need them in the miniapp for
    // iOS container project to build
    // Ensure that they are present
    // This block should be removed once iOS container is improved to be more flexbile
    const runnerConfig = {
      platformPath: Platform.currentPlatformVersionPath,
      plugins: this.nativeDependencies,
      miniapp: {name: this.name, localPath: this.path},
      outDir: `${this.path}/ios`,
      platform: 'ios',
      containerGenWorkingDir: `${Platform.rootDirectory}/containergen`,
      reactNativeAarsPath: `${Platform.masterManifestDirectory}/react-native_aars`,
      reactNativeDevSupportEnabled
    }

    const iosDevices = await simctl.getDevices()
    let iosDevicesChoices = _.filter(
                                    _.flattenDeep(
                                       _.map(iosDevices, (val, key) => val)
                                        ), (device) => device.name.match(/^iPhone/))
    const inquirerChoices = _.map(iosDevicesChoices, (val, key) => ({
      name: `${val.name} (UDID ${val.udid})`,
      value: val
    }))

    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'device',
      message: 'Choose iOS simulator',
      choices: inquirerChoices
    }])
    try {
      execSync(`killall "Simulator" `)
    } catch (e) {
      // do nothing if there is no simulator launched
    }

    try {
      execSync(`xcrun instruments -w ${answer.device.udid}`)
    } catch (e) {
      // Apple will always throw some exception because we don't provide a -t.
      // but we just care about launching simulator with chosen UDID
    }

    if (!fs.existsSync('ios')) {
      log.info(`Generating runner iOS project`)
      await generateRunner(runnerConfig)
    } else {
      log.info(`Re-generating runner container`)
      await generateContainerForRunner(runnerConfig)
    }

    const device = answer.device
    shell.cd(`${this.path}/ios`)

    const spinner = ora(`Compiling runner project`).start()

    try {
      execSync(`xcodebuild -scheme ErnRunner -destination 'platform=iOS Simulator,name=${device.name}' SYMROOT="${this.path}/ios/build" build`)
      spinner.text = 'Installing runner project on device'
      await simctl.installApp(device.udid, `${this.path}/ios/build/Debug-iphonesimulator/ErnRunner.app`)
      spinner.text = 'Launching runner project'
      await simctl.launch(device.udid, 'com.yourcompany.ernrunner')
      spinner.succeed('Done')
    } catch (e) {
      spinner.fail(e.message)
      throw e
    }
  }

  async runInAndroidRunner ({
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled: boolean
  } = {}) : Promise<*> {
    reactnative.startPackagerInNewWindow()

    const runnerConfig = {
      platformPath: Platform.currentPlatformVersionPath,
      plugins: this.nativeDependencies,
      miniapp: {name: this.name, localPath: this.path},
      outDir: `${this.path}/android`,
      platform: 'android',
      containerGenWorkingDir: `${Platform.rootDirectory}/containergen`,
      reactNativeAarsPath: `${Platform.masterManifestDirectory}/react-native_aars`,
      reactNativeDevSupportEnabled
    }

    if (!fs.existsSync('android')) {
      log.info(`Generating runner android project`)
      await generateRunner(runnerConfig)
    } else {
      log.info(`Re-generating runner container`)
      await generateContainerForRunner(runnerConfig)
    }

    await runAndroid({
      projectPath: `${this.path}/android`,
      packageName: 'com.walmartlabs.ern'
    })
  }

  async addDependency (
    dependency: Dependency,
    { dev, peer } : { dev?: boolean, peer?: boolean } = {}) : Promise<?Dependency> {
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
      const manifestDependency = await manifest.getNativeDependency(versionLessDependency) || await manifest.getJsDependency(versionLessDependency)

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
          // This is a pure JS dependency. Not much to do here -yet-
          finalDependency = versionLessDependency
        } else if (nativeDependencies.length === 1) {
          // This is a native dependency or it contains a single native dependency as a transitive one
          if (Dependency.same(nativeDependencies[0], dependency, { ignoreVersion: true })) {
            // This dependency is itself the native dependency.
            // Let's check if this is an API (or API implementation) or a third party native dependency
            if (/^react-native-.+-api$|^react-native-.+-api-impl$/.test(dependency.name)) {
              // This is a native API or API implementation
              // Just tell user he/she should consider adding it to manifest
              log.warn(`${versionLessDependency.toString()} is not declared in the Manifest. You might consider adding it.`)
              finalDependency = dependency
            } else {
              // This is a third party native dependency. If it's not in the master manifest,
              // then it means that it is not supported by the platform yet. Fail.
              return log.error(`${dependency.toString()} plugin is not yet supported. Consider adding support for it to the master manifest`)
            }
          } else {
            // This is a dependency which is not native itself but contains a native dependency as as transitive one (example 'native-base')
            // Recurse with this native dependency
            if (!await this.addDependency(nativeDependencies[0])) {
              return log.error(`${dependency.toString()} was not added to the MiniApp.`)
            }
          }
        } else {
          // Multiple native dependencies ! (example '@shoutem/ui')
          // It might be a pure JS dependency which contains transitive native dependencies
          // Or a native dependency which also contains transitive native dependencies
          // We don't support this scenario just yet
          return log.error(`${dependency.toString()} contains multiple plugins. This is not supported yet.`)
        }
      } else {
        // Dependency is defined in manifest. But does the version match the one from manifest ?
        if (!dependency.version) {
          // If no version was specified for this dependency, we're good, just use the version
          // declared in the manifest
          finalDependency = manifestDependency
        } else {
          // Version is provided for this dependency, check that version match manifest
          if (dependency.version !== manifestDependency.version) {
            // Dependency version mismatch. Let the user know of potential impacts and suggest user to
            // updat the version in the manifest
            // TODO : If not API/API impl, we need to ensure that plugin is supported by platform
            // for the provided plugin version
            log.warn(`${dependency.toString()} version mismatch.`)
            log.warn(`Manifest version: ${manifestDependency.version}`)
            log.warn(`Wanted version: ${dependency.version}`)
            log.warn(`You might want to update the version in your Manifest`)
          } else {
            // Dependency version match
            finalDependency = manifestDependency
          }
        }
      }

      if (finalDependency) {
        process.chdir(this.path)
        await spin(`Adding ${finalDependency.toString()} to MiniApp`, yarn.add(DependencyPath.fromString(finalDependency.toString())))
        return finalDependency
      }
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

    // Update ernPlatfomVersion in package.json
    if (!this.packageJson.ern) {
      throw new Error(`In order to upgrade, please first replace "ernPlatformVersion" : "${this.packageJson.ernPlatformVersion}" in your package.json 
with "ern" : { "version" : "${this.packageJson.ernPlatformVersion}" } instead`)
    }

    this.packageJson.ern.version = versionToUpgradeTo

    // Write back package.json
    const appPackageJsonPath = `${this.path}/package.json`
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(this.packageJson, null, 2))

    process.chdir(this.path)
    await spin(`Running yarn install`, yarn.install())
  }

  async addToNativeAppInCauldron (
    napDescriptor: NativeApplicationDescriptor,
    force: boolean) {
    try {
      const nativeApp = await cauldron.getNativeApp(napDescriptor)

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
                    await cauldron.getNativeDependency(napDescriptor, localNativeDependencyString, { convertToObject: true })

        // Update dependency version in Cauldron, only if local dependency version is a newer version compared to Cauldron
        // This will only apply for API/API-IMPLS and bridge due to backward compatibility (if no major version update)
        // This does not apply to other third party native dependencies (anyway in that case the code should not react this
        // point as compatibility checks would have failed unless force flag is used)
        if (remoteDependency && (remoteDependency.version < localNativeDependency.version)) {
          await cauldron.updateNativeAppDependency(napDescriptor, localNativeDependencyString, localNativeDependency.version)
        } else if (!remoteDependency) {
          await cauldron.addNativeDependency(napDescriptor, localNativeDependency)
        }
      }

      const currentMiniAppEntryInContainer =
                await cauldron.getContainerMiniApp(napDescriptor, miniApp.withoutVersion())

      if (currentMiniAppEntryInContainer && !nativeApp.isReleased) {
        await cauldron.updateMiniAppVersion(napDescriptor, miniApp)
      } else if (!currentMiniAppEntryInContainer && !nativeApp.isReleased) {
        await cauldron.addContainerMiniApp(napDescriptor, miniApp)
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
