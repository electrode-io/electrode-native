import fs from 'fs';
import CauldronApi from './index';
/**
 * This class should go away, it is a link
 * between the old rest based api and the new github based api.
 *
 */
export default class CauldronClient {
    constructor(url) {
        this.cauldron = CauldronApi(url);
    }

    addNativeApp(app) {
        return this.cauldron.createNativeApplication(app);
    }

    getAllNativeApps() {
        return this.cauldron.getNativeApplications();
    }

    getNativeApp(appName) {
        return this.cauldron.getNativeApplication(appName);
    }

    deleteNativeApp(appName) {
        return this.cauldron.removeNativeApplication(appName);
    }

    addPlatform(appName, platform) {
        return this.cauldron.createPlatform(appName, platform);
    }

    getAllPlatforms(appName) {
        return this.cauldron.getPlatforms(appName);
    }

    getPlatform(appName, platformName) {
        return this.cauldron.getPlatform(appName, platformName);
    }

    deletePlatform(appName, platformName) {
        return this.cauldron.removePlatform(appName, platformName);
    }

    addNativeAppVersion(appName, platformName, version) {
        return this.cauldron.createVersion(appName, platformName, version);
    }

    getAllNativeAppVersions(appName, platformName) {
        return this.cauldron.getVersions(appName, platformName);
    }

    getNativeAppVersion(appName, platformName, versionName) {
        return this.cauldron.getVersion(appName, platformName, versionName);

    }

    deleteNativeAppVersion(appName, platformName, versionName) {
        return this.cauldron.removeVersion(appName, platformName, versionName);
    }

    addNativeAppDependency(appName, platformName, versionName, nativeDep) {
        return this.cauldron.createNativeDep(appName, platformName, versionName, nativeDep);
    }

    getAllNativeAppDependencies(appName, platformName, versionName) {
        return this.cauldron.getNativeDependencies(appName, platformName, versionName);
    }

    getNativeAppDependency(appName, platformName, versionName, dependencyName) {
        return this.cauldron.getNativeDependency(appName, platformName, versionName, dependencyName);
    }

    updateNativeAppDependency(appName, platformName, versionName, dependencyName, newVersion) {
        return this.cauldron.updateNativeDep(appName, platformName, versionName, dependencyName, newVersion);
    }

    updateNativeAppIsReleased(appName, platformName, versionName, isReleased) {
        return this.cauldron.updateVersion(appName, platformName, versionName, {isReleased: isReleased});
    }

    deleteNativeAppDependency(appName, platformName, versionName, dependency) {
        return this.cauldron.removeNativeDependency(appName, platformName, versionName, dependency);
    }

    addReactNativeApp(appName, platformName, versionName, reactNativeApp) {
        return this.cauldron.createReactNativeApp(appName, platformName, versionName, reactNativeApp);
    }

    getAllReactNativeApps(appName, platformName, versionName) {
        return this.cauldron.getReactNativeApps(appName, platformName, versionName);
    }

    getReactNativeApp(appName, platformName, versionName, reactNativeAppName) {
        return this.cauldron.getReactNativeApp(appName, platformName, versionName, reactNativeAppName);
    }

    deleteReactNativeApp(appName, platformName, versionName, reactNativeAppName) {
        return this.cauldron.removeReactNativeApp(appName, platformName, versionName, reactNativeAppName);
    }

    updateReactNativeAppVersion(appName, platformName, versionName, payload, newVersion) {
        return this.cauldron.updateReactNativeAppVersion(appName, platformName, versionName, payload, newVersion);
    }

    addNativeAppBinary(appName, platformName, versionName, binaryPath) {
        return this.cauldron.createNativeBinary(appName, platformName, versionName, fs.readFileSync(binaryPath));
    }

    getNativeAppBinary(appName, platformName, versionName) {
        return this.cauldron.getNativeBinary(appName, platformName, versionName);
    }

    deleteNativeAppBinary(appName, platformName, versionName) {
        return this.cauldron.removeNativeBinary(appName, platformName, versionName);
    }

    addReactNativeSourceMap(reactNativeAppName, versionName, sourceMap) {
        return this.cauldron.createSourceMap(reactNativeAppName, versionName, sourceMap);
    }

    getReactNativeSourceMap(reactNativeAppName, versionName) {
        return this.cauldron.getSourceMap(reactNativeAppName, versionName);
    }

    deleteNativeAppBinary(reactNativeAppName, versionName) {
        return this.cauldron.removeSourceMap(reactNativeAppName, versionName);
    }

    getConfig({appName, platformName, versionName} = {}) {
        return this.cauldron.getConfig({appName, platformName, versionName})
    }
};
