import _ from 'lodash'
import {
  shasum,
  buildNativeBinaryFileName,
  buildReactNativeSourceMapFileName,
  checkNotFound,
  alreadyExists,
  containsDependency,
  removeVersionFromDependency
} from './util'
import {
  reactNativeAppSchema,
  nativeApplicationVersionSchema,
  nativeAplicationVersionPatchSchema,
  nativeApplicationPlatformSchema,
  nativeApplicationSchema,
  joiValidate
} from './schemas'

export default class CauldronApi  {
  constructor(db, binaryStore, sourcemapStore) {
    this._db = db
    this._nativeBinariesStore = binaryStore
    this._sourceMapStore = sourcemapStore
  }
  
  async commit(message) {
    return this._db.commit(message)
  }
  
  async getCauldron() {
    return this._db.getCauldron()
  }
  
  //=====================================================================================
  // READ OPERATIONS
  //=====================================================================================
  
  async getNativeApplications() {
    const cauldron = await this.getCauldron()
    return cauldron.nativeApps
  }
  
  async getNativeApplication(name) {
    const cauldron = await this.getCauldron()
    return _.find(cauldron.nativeApps, n => n.name === name)
  }
  
  async getPlatforms(nativeApplicationName) {
    const app = await this.getNativeApplication(nativeApplicationName)
    return app == null ? null : app.platforms
  }
  
  async getPlatform(nativeApplicationName, platformName) {
    const platforms = await this.getPlatforms(nativeApplicationName)
    return _.find(platforms, p => p.name === platformName)
  }
  
  async getVersions(nativeApplicationName, platformName) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    return platform.versions
  }
  
  async getVersion(nativeApplicationName, platformName, versionName) {
    const versions = await this.getVersions(nativeApplicationName, platformName)
    return _.find(versions, x => x.name === versionName)
  }
  
  async getReactNativeApps(nativeApplicationName, platformName, versionName) {
    const {reactNativeApps} = await this.getVersion(nativeApplicationName, platformName, versionName)
    return reactNativeApps || []
  }
  
  async getReactNativeApp(nativeApplicationName, platformName, versionName, reactAppName) {
    const reactNativeApps = await this.getReactNativeApps(nativeApplicationName, platformName, versionName)
    return reactNativeApps.filter(v => v.name == reactAppName)
  }
  
  async getNativeDependencies(nativeApplicationName, platformName, versionName) {
    const {nativeDeps = []} = await this.getVersion(nativeApplicationName, platformName, versionName)
    return nativeDeps
  }
  
  async getNativeDependency(nativeApplicationName, platformName, versionName, nativedepName) {
    const nativeDeps = await this.getNativeDependencies(nativeApplicationName, platformName, versionName)
    return _.find(nativeDeps, x => x.startsWith(`${nativedepName}@`))
  }
  
  async getConfig({appName, platformName, versionName} = {}) {
    if (appName) {
      if (platformName) {
        if (versionName) {
          const version = await this.getVersion(appName, platformName, versionName)
          return version.config
        }
        const platform = await this.getPlatform(appName, platformName)
        return platform.config
      }
      const app = await this.getNativeApplication(appName)
      return app.config
    }
  }
  
  //=====================================================================================
  // WRITE OPERATIONS
  //=====================================================================================
  
  async clearCauldron() {
    const cauldron = await this.getCauldron()
    cauldron.nativeApps = []
    await this.commit('Clear Cauldron')
  }
  
  async createNativeApplication(nativeApplication) {
    const cauldron = await this.getCauldron()
    if (!alreadyExists(cauldron.nativeApps, nativeApplication.name)) {
      const validatedNativeApplication = await joiValidate(nativeApplication, nativeApplicationSchema)
      cauldron.nativeApps.push(validatedNativeApplication)
      await this.commit(`Create ${nativeApplication.name} native application`)
    }
  }
  
  async removeNativeApplication(name) {
    const cauldron = await this.getCauldron()
    if (_.remove(cauldron.nativeApps, x => x.name === name).length > 0) {
      await this.commit(`Remove ${name} native application`)
    }
  }
  
  async createPlatform(nativeApplicationName, platform) {
    const nativeApplication = await this.getNativeApplication(nativeApplicationName)
    if (!alreadyExists(nativeApplication.platforms, platform.name)) {
      const validatedPlatform = await joiValidate(platform, nativeApplicationPlatformSchema)
      nativeApplication.platforms.push(validatedPlatform)
      await this.commit(`Create ${platform.name} platform for ${nativeApplicationName}`)
    }
  }
  
  async removePlatform(nativeApplicationName, platformName) {
    const nativeApplication = await this.getNativeApplication(nativeApplicationName)
    if (_.remove(nativeApplication.platforms, x => x.name === platformName).length > 0) {
      await this.commit(`Remove ${platformName} platform from ${nativeApplicationName}`)
    }
  }
  
  async createVersion(nativeApplicationName, platformName, version) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    if (!alreadyExists(platform.versions, version.name)) {
      const validatedVersion = await joiValidate(version, nativeApplicationVersionSchema)
      platform.versions.push(validatedVersion)
      await this.commit(`Create version ${version.name} of ${nativeApplicationName} ${platformName}`)
    }
  }
  
  async removeVersion(nativeApplicationName, platformName, versionName) {
    const platform = await this.getPlatform(nativeApplicationName, platformName)
    checkNotFound(platform, `No platform named ${platformName}`)
    if (_.remove(platform.versions, x => x.name === versionName).length > 0) {
      await this.commit(`Remove version ${versionName} from ${nativeApplicationName} ${platformName}`)
    }
  }
  
  async updateVersion(nativeApplicationName, platformName, versionName, newVersion) {
    const validatedVersion = await joiValidate(newVersion, nativeAplicationVersionPatchSchema)
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (validatedVersion.isReleased != null) {
      version.isReleased = validatedVersion.isReleased
      await this.commit(`Update release status of ${nativeApplicationName} ${platformName} ${versionName}`)
    }
  }
  
  async removeNativeDependency(nativeApplicationName, platformName, versionName, dependency) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (_.remove(version.nativeDeps, x => x.startsWith(`${dependency}@`)).length > 0) {
      await this.commit(`Remove ${dependency} dependency from ${nativeApplicationName} ${platformName}`)
    }
  }
  
  async updateNativeDependency(nativeApplicationName, platformName, versionName, dependencyName, newVersion) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    _.remove(version.nativeDeps, x => x.startsWith(`${dependencyName}@`))
    const newDependencyString = `${dependencyName}@${newVersion}`
    version.nativeDeps.push(newDependencyString)        
    await this.commit(`Update ${dependency} dependency to v${dependencyName,newVersion} for ${nativeApplicationName} ${platformName}`)
  }
  
  async updateReactNativeAppVersion(nativeApplicationName, platformName, versionName, rnApp, newVersion) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    const f = _.find(version.reactNativeApps, r => r.name === rnApp.name)
    f.version = newVersion
    await this.commit(`Update version of ${rnApp.name} MiniApp to ${newVersion}`)
  }
  
  async removeReactNativeApp(nativeApplicationName, platformName, versionName, rnAppName) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (_.remove(version.reactNativeApps, x => x.name === rnAppName).length > 0) {
      await this.commit(`Remove ${rnAppName} from ${appName} ${platformName} ${versionName}`)
    }
  }
  
  async createNativeDependency(nativeApplicationName, platformName, versionName, dependency) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!containsDependency(version.nativeDeps, dependency, { shouldMatchVersion: false })) {
      version.nativeDeps.push(dependency)
      await this.commit(`Add native dependency ${dependency.name} to ${nativeApplicationName} ${platformName} ${versionName}`)
    }
  }
  
  async createReactNativeApp(nativeApplicationName, platformName, versionName, rnApp) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    if (!alreadyExists(version.reactNativeApps, rnApp.name, rnApp.version)) {
      version.reactNativeApps.push(rnApp)
      await this.commit(`Add ${rnApp.name} MiniApp to ${nativeApplicationName} ${platformName} ${versionName}`)
    } 
  }
  
  async validateAndGet(nativeApplicationName, platformName, versionName) {
    let app = await this.getNativeApplication(nativeApplicationName)
    let platform, version
    if (platformName) {
      platform = await this.getPlatform(nativeApplicationName, platformName)
      if (versionName) {
        version = await this.getVersion(nativeApplicationName, platformName, versionName)
      }
    }
    return {app, platform, version}
  }
  
  //=====================================================================================
  // FILE OPERATIONS (TO DEPRECATE OR IMPROVE)
  //=====================================================================================
  
  async getNativeBinary(nativeApplicationName, platformName, versionName) {
    const filename = buildNativeBinaryFileName(nativeApplicationName, platformName, versionName)
    return this._nativeBinariesStore.getFile(filename)
  }
  
  async removeNativeBinary(nativeApplicationName, platformName, versionName) {
    const filename = buildNativeBinaryFileName(nativeApplicationName, platformName, versionName)
    this._nativeBinariesStore.removeFile(filename)
    version.binary = null
    return this.commit(version)
  }
  
  async createSourceMap(nativeApplicationName, versionName, payload) {
    const filename = buildReactNativeSourceMapFileName(nativeApplicationName, versionName)
    this._sourceMapStore.storeFile(filename, payload)
    return true
  }
  
  async getSourceMap(nativeApplicationName, versionName) {
    const filename = buildReactNativeSourceMapFileName(nativeApplicationName, versionName)
    const fileExists = this._sourceMapStore.hasFile(filename)
    return fileExists ? this._sourceMapStore.getFile(filename) : false
  }
  
  async removeSourceMap(nativeApplicationName, versionName) {
    const filename = buildReactNativeSourceMapFileName(nativeApplicationName, versionName)
    const fileExists = this._sourceMapStore.hasFile(filename)
    return fileExists ? this._sourceMapStore.removeFile(filename) : false
  }
  
  async createNativeBinary(nativeApplicationName, platformName, versionName, payload) {
    const version = await this.getVersion(nativeApplicationName, platformName, versionName)
    
    const filename = buildNativeBinaryFileName(nativeApplicationName, platformName, versionName)
    
    await this._nativeBinariesStore.storeFile(filename, payload)
    
    version.binary = shasum(payload)
    this.commit(version)
    return version
  }
}
