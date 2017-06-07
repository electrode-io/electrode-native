// @flow

import {
  generateContainerForRunner,
  generateRunner
} from '@walmart/ern-runner-gen'
import {
  android,
  Dependency,
  NativeApplicationDescriptor,
  Platform,
  reactNative,
  spin,
  tagOneLine,
  yarn
} from '@walmart/ern-util'
import {
  checkCompatibilityWithNativeApp
} from './compatibility.js'
import {
  execSync
} from 'child_process'
import cauldron from './cauldron'
import fs from 'fs'
import readDir from 'fs-readdir-recursive'
import inquirer from 'inquirer'
import _ from 'lodash'
import shell from 'shelljs'

const simctl = require('node-simctl')

const {
  runAndroid
} = android
const {
  yarnAdd,
  yarnInstall
} = yarn

const NPM_SCOPED_MODULE_RE = /@(.*)\/(.*)/

export default class MiniApp {
  _path: string
  _packageJson: Object

  constructor (miniAppPath: string) {
    this._path = miniAppPath

    const packageJsonPath = `${miniAppPath}/package.json`
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(tagOneLine`No package.json found.
      This command should be run at the root of a mini-app`)
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (!packageJson.ernPlatformVersion) {
      throw new Error(tagOneLine`No ernPlatformVersion found in package.json.
      Are you sure you are running this within an electrode miniapp folder ?`)
    }

    this._packageJson = packageJson
  }

  static fromCurrentPath () {
    return new MiniApp(process.cwd())
  }

  static fromPath (path) {
    return new MiniApp(path)
  }

  static async create (
    appName: string, {
      platformVersion,
      scope,
      headless
    } : {
      platformVersion: string,
      scope: string,
      headless: boolean
    }) {
    try {
      if (!platformVersion) {
        platformVersion = Platform.currentVersion
      }

      if (Platform.currentVersion !== platformVersion) {
        Platform.switchToVersion(platformVersion)
      }

      log.info(`Creating application ${appName} at platform version ${platformVersion}`)

      const reactNativeDependency = Platform.getPlugin('react-native')
      if (!reactNativeDependency) {
        throw new Error('react-native dependency is not defined in manifest. cannot infer version to be used')
      }

      const reactDependency = Platform.getJsDependency('react')
      if (!reactDependency) {
        throw new Error('react dependency is not defined in manifest. cannot infer version to be used')
      }

      //
      // Create application using react-native init command
      await spin(`Running react-native init using react-native v${reactNativeDependency.version}`,
                reactNative.init(appName, reactNativeDependency.version))

      //
      // Patch package.json file of application
      const appPackageJsonPath = `${process.cwd()}/${appName}/package.json`
      const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf-8'))
      appPackageJson.ernPlatformVersion = `${platformVersion}`
      appPackageJson.ernHeadLess = headless
      appPackageJson.private = false
      appPackageJson.dependencies['react'] = reactDependency.version
      if (scope) {
        appPackageJson.name = `@${scope}/${appName}`
      }
      fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2))

      //
      // Remove react-native generated android and ios projects
      // They will be replaced with our owns when user uses `ern miniapp run android`
      // or `ern miniapp run ios` command
      const miniAppPath = `${process.cwd()}/${appName}`
      shell.cd(miniAppPath)
      shell.rm('-rf', 'android')
      shell.rm('-rf', 'ios')

      //
      /// If it's a headless miniapp (no ui), just override index.android.js / index.ios.js
      // with our own and create index.source.js
      // Later on it might be done in a better way by retrieving our own structured
      // project rather than using react-native generated on and patching it !
      if (headless) {
        fs.writeFileSync(`${miniAppPath}/index.android.js`, "require('./index.source');", 'utf-8')
        fs.writeFileSync(`${miniAppPath}/index.ios.js`, "require('./index.source');", 'utf-8')
        fs.writeFileSync(`${miniAppPath}/index.source.js`, '// Add your implementation here', 'utf-8')
      }

      return new MiniApp(miniAppPath)
    } catch (e) {
      log.error(`[MiniApp.create] ${e}`)
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
    return this.packageJson.ernPlatformVersion
  }

  get isHeadLess () : boolean {
    return this.packageJson.ernHeadLess
  }

    // Return all native dependencies currently used by the mini-app
    // This method scans the node_modules folder to find any folder containing
    // a build.gradle file (which at least is an indication that the folder contains
    // some android native code.
    // The dependencies are returned as a array of objects
    // Each object represent a native dependency (name/version and optionaly scope)
    // Sample output :
    // [ { name: "react-native", version: "0.39.2", scope: "walmart" }]
  get nativeDependencies () : Array<Dependency> {
    let result = []

    const nativeDependenciesNames = new Set()

        // Get all node_modules folders that are containing a build.gradle
        // file (Note: might not be enough if we have react-native plugins
        // that are solely for iOS. Not the case yet)
    const nodeModulesFoldersWithBuildGradle = readDir(`${this.path}/node_modules`)
            .filter(a => a.includes('build.gradle'))

        // By convention we only assume react native plugins to be in folders
        // which names are starting with 'react-native' (excluding scope)
    const nativeDepsFolders = _.filter(nodeModulesFoldersWithBuildGradle,
            d => d.includes('react-native'))

    for (const nativeDepsFolder of nativeDepsFolders) {
      if (nativeDepsFolder.split('/')[0].startsWith('@')) {
        nativeDependenciesNames.add(
                    `${nativeDepsFolder.split('/')[0]}/${nativeDepsFolder.split('/')[1]}`)
      } else {
        nativeDependenciesNames.add(nativeDepsFolder.split('/')[0])
      }
    }

    // Get associated versions
    for (const nativeDependencyName of nativeDependenciesNames) {
      const nativeDepPackageJson = require(
                `${this.path}/node_modules/${nativeDependencyName}/package.json`)

      if (NPM_SCOPED_MODULE_RE.test(nativeDependencyName)) {
        result.push(new Dependency(NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[2], {
          scope: NPM_SCOPED_MODULE_RE.exec(nativeDependencyName)[1],
          version: nativeDepPackageJson.version.startsWith('v')
                             ? nativeDepPackageJson.version.slice(1)
                             : nativeDepPackageJson.version
        }))
      } else {
        result.push(new Dependency(nativeDependencyName, {
          version: nativeDepPackageJson.version.startsWith('v')
                             ? nativeDepPackageJson.version.slice(1)
                             : nativeDepPackageJson.version
        }))
      }
    }

    return result
  }

    // Return all javascript (non native) dependencies currently used by the mini-app
    // This method checks dependencies from the pa2ckage.json of the miniapp and
    // exclude native dependencies (plugins).
  get jsDependencies () : Array<any> {
    const nativeDependenciesNames = _.map(this.nativeDependencies, d => d.name)
    let result = _.map(this.packageJson.dependencies, (val: string, key: string) =>
            Dependency.fromString(`${key}@${val}`))

    return result == null ? [] : _.filter(result, d => !nativeDependenciesNames.includes(d.name))
  }

  get nativeAndJsDependencies () : Array<any> {
    return [...this.jsDependencies, ...this.nativeDependencies]
  }

  async runInIosRunner () : Promise<*> {
    // Unfortunately, for now, because Container for IOS is not as dynamic as Android one
    // (no code injection for plugins yet :()), it has hard-coded references to
    // our bridge and code-push ... so we absolutely need them in the miniapp for
    // iOS container project to build
    // Ensure that they are present
    // This block should be removed once iOS container is improved to be more flexbile
    const nativeDependenciesNames = _.map(this.nativeDependencies, d => d.name)
    if (!nativeDependenciesNames.includes('react-native-electrode-bridge')) {
      log.error("react-native-electrode-bridge is required for iOS runner.\n Execute `ern miniapp add @walmart/react-native-electrode-bridge` if you haven't already")
      throw new Error('react-native-electrode-bridge is required for iOS runner :(')
    }
    if (!nativeDependenciesNames.includes('react-native-code-push')) {
      log.error("react-native-code-push is required for iOS runner.\n Execute `ern miniapp add react-native-code-push` if you haven't already")
      throw new Error('react-native-code-push is required for iOS runner :(')
    }

    const runnerConfig = {
      platformPath: Platform.currentPlatformVersionPath,
      plugins: this.nativeDependencies,
      miniapp: {name: this.name, localPath: this.path},
      outFolder: `${this.path}/ios`,
      headless: this.isHeadLess,
      platform: 'ios'
    }

    const iosDevices = await simctl.getDevices()
    const bootedIosDevices = _.filter(
                                    _.flattenDeep(
                                        _.map(iosDevices, (val, key) => val)
                                        ), (device) => device.state === 'Booted')
    if (bootedIosDevices.length === 0) {
      throw new Error('No iOS running devices found')
    }

    if (!fs.existsSync('ios')) {
      log.info(`Generating runner iOS project`)
      await generateRunner(runnerConfig)
    } else {
      log.info(`Re-generating runner container`)
      await generateContainerForRunner(runnerConfig)
    }

    const inquirerChoices = _.map(bootedIosDevices, (val, key) => ({
      name: `${val.name} (SDK ${val.sdk})`,
      value: val
    }))

    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'device',
      message: 'Choose iOS simulator',
      choices: inquirerChoices
    }])

    const device = answer.device
    shell.cd(`${this.path}/ios`)
    execSync(`xcodebuild -scheme ErnRunner -destination 'platform=iOS Simulator,name=${device.name},OS=${device.sdk}' SYMROOT="${this.path}/ios/build" build`)

    await simctl.installApp(device.udid, `${this.path}/ios/build/Debug-iphonesimulator/ErnRunner.app`)
    await simctl.launch(device.udid, 'MyCompany.ErnRunner')
  }

  async runInAndroidRunner () : Promise<*> {
    const runnerConfig = {
      platformPath: Platform.currentPlatformVersionPath,
      plugins: this.nativeDependencies,
      miniapp: {name: this.name, localPath: this.path},
      outFolder: `${this.path}/android`,
      headless: this.isHeadLess,
      platform: 'android'
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
    dependencyName: string,
    {dev} : { dev: boolean } = {}) {
    let dep = Platform.getDependency(dependencyName)
    if (!dep) {
      log.warn(
                `
==================================================================================
Dependency ${dependencyName} is not declared in current platform version manifest.
If this is a non purely JS dependency you will face issues during publication.
Otherwise you can safely ignore this warning
==================================================================================
`)
      dep = Dependency.fromString(dependencyName)
      dep.version = 'latest'
    }

    process.chdir(this.path)
    if (dep.scope) {
      await spin(`Installing @${dep.scope}/${dep.name}@${dep.version}`, yarnAdd(dep, {dev}))
    } else {
      await spin(`Installing ${dep.name}@${dep.version}`, yarnAdd(dep, {dev}))
    }
  }

  async upgradeToPlatformVersion (versionToUpgradeTo: string, force: boolean) : Promise<*> {
    if ((this.platformVersion === versionToUpgradeTo) &&
            (!force)) {
      return log.error(`This miniapp is already using v${versionToUpgradeTo}. Use 'f' flag if you want to force upgrade.`)
    }

    // Update all modules versions in package.json
    const manifestDependencies = Platform.getManifestPluginsAndJsDependencies(versionToUpgradeTo)

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
    this.packageJson.ernPlatformVersion = versionToUpgradeTo

    // Write back package.json
    const appPackageJsonPath = `${this.path}/package.json`
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(this.packageJson, null, 2))

    process.chdir(this.path)
    await spin(`Running yarn install`, yarnInstall())
  }

  async addToNativeAppInCauldron (
    napDescriptor: NativeApplicationDescriptor,
    force: boolean) {
    try {
      const nativeApp = await cauldron.getNativeApp(napDescriptor)

      const miniApp = Dependency.fromString(`${this.packageJson.name}@${this.packageJson.version}`)

      const currentMiniAppEntryInCauldronAtSameVersion = nativeApp.isReleased
                    ? await cauldron.getOtaMiniApp(napDescriptor, miniApp)
                    : await cauldron.getContainerMiniApp(napDescriptor, miniApp)

       // If this is not a forced add, we run quite some checks beforehand
      if (!force) {
        log.info(`Checking if ${miniApp.toString()} is not already in ${napDescriptor.toString()}`)

        if (currentMiniAppEntryInCauldronAtSameVersion) {
          throw new Error(`${miniApp.toString()} already in ${napDescriptor.toString()}`)
        }

        /* log.info(`Checking that container version match native app version`)
        const nativeAppPlatformVersion = nativeApp.ernPlatformVersion
        const miniAppPlatformVersion = this.platformVersion
        if (nativeAppPlatformVersion !== miniAppPlatformVersion) {
        throw new Error(tagOneLine`Platform versions mismatch :
        [${miniAppName} => ${miniAppPlatformVersion}]
        [${appName}:${platformName}:${versionName} => ${nativeAppPlatformVersion}]`);
        } */

        log.info('Checking compatibility with each native dependency')
        let report = await checkCompatibilityWithNativeApp(
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
        if (remoteDependency && (remoteDependency.version === localNativeDependency.version)) {
          continue
        }

        if (!force) {
          await cauldron.addNativeDependency(napDescriptor, localNativeDependency)
        } else {
          let nativeDepInCauldron
          try {
            nativeDepInCauldron = await cauldron
                            .getNativeDependency(napDescriptor, localNativeDependencyString)
          } catch (e) {
                        // 404 most probably, swallow, need to improve cauldron cli to return null
                        // instead in case of 404
          }

          if (nativeDepInCauldron) {
            await cauldron.updateNativeAppDependency(napDescriptor, localNativeDependencyString, localNativeDependency.version)
          } else {
            await cauldron.addNativeDependency(napDescriptor, localNativeDependency)
          }
        }
      }

      const currentMiniAppEntryInContainer =
                await cauldron.getContainerMiniApp(napDescriptor, miniApp.withoutVersion())

      if (currentMiniAppEntryInContainer && !nativeApp.isReleased) {
        await cauldron.updateMiniAppVersion(napDescriptor, miniApp)
      } else if (!currentMiniAppEntryInContainer && !nativeApp.isReleased) {
        await cauldron.addContainerMiniApp(napDescriptor, miniApp)
      } else {
        await cauldron.addOtaMiniApp(napDescriptor, miniApp)
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
}
