import Boom from 'boom';
import {
    shasum,
    buildNativeBinaryFileName,
    buildReactNativeSourceMapFileName,
    checkNotFound,
    alreadyExists,
    containsDependency
} from './util';
import {find, remove} from 'lodash';


export default class BaseApi {
    constructor(binaryStore, sourcemapStore) {
        this._nativeBinariesStore = binaryStore;
        this._sourceMapStore = sourcemapStore;
    }

    begin() {
    }

    commit() {
    }

    async _getNativeApplication(name, withAuth) {
        const app = await this.getNativeApplication(name, withAuth);
        return checkNotFound(app, `Application not found [${name}]`);
    }

    async _getPlatform(appName, platformName, withAuth) {
        const platform = await this.getPlatform(appName, platformName, withAuth);
        return checkNotFound(platform, `Platform not found [${platformName}]`);
    };

    async _getVersion(appName, platformName, versionName, withAuth) {
        const version = await this.getVersion(appName, platformName, versionName, withAuth);
        return checkNotFound(version, `No version found [${version}]`);
    }

    async updateVersion(appName, platformName, versionName, payload, withAuth) {
        const version = await this._getVersion(appName, platformName, versionName, withAuth);
        if (payload.isReleased != null) {
            version.isReleased = payload.isReleased;
            return this.commit(version)
        }
        throw new Boom.badData(`isReleased can't be null`);
    }

    async validateAndGet(appName, platformName, versionName, withAuth) {
        let app = await this._getNativeApplication(appName, withAuth);
        let platform, version;
        if (platformName) {
            platform = await this._getPlatform(appName, platformName);
            if (versionName) {
                version = await this._getVersion(appName, platformName, versionName);
            }
        }
        return {app, platform, version};
    }

    async getNativeBinary(appName, platformName, versionName, withAuth) {
        const {app, platform, version} = await this.validateAndGet(appName, platformName, versionName, withAuth);
        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        return this._nativeBinariesStore.getFile(filename);
    }

    async removeNativeBinary(appName, platformName, versionName, withAuth) {
        const {app, platform, version} =
            await this.validateAndGet(appName, platformName, versionName, withAuth);

        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        this._nativeBinariesStore.removeFile(filename);
        version.binary = null;
        return this.commit(version);
    }

    async createSourceMap(appName, versionName, payload, withAuth) {
        const filename = buildReactNativeSourceMapFileName(appName, versionName);
        this._sourceMapStore.storeFile(filename, payload);
        return true;
    }

    async getSourceMap(appName, versionName) {
        const filename = buildReactNativeSourceMapFileName(appName, versionName);
        const fileExists = this._sourceMapStore.hasFile(filename);
        return fileExists ? this._sourceMapStore.getFile(filename) : false;
    }

    async removeSourceMap(appName, versionName) {
        const filename = buildReactNativeSourceMapFileName(appName, versionName);
        const fileExists = this._sourceMapStore.hasFile(filename);
        return fileExists ? this._sourceMapStore.removeFile(filename) : false;
    }

    async createNativeBinary(appName, platformName, versionName, payload, withAuth) {
        const version = await this._getVersion(appName, platformName, versionName, withAuth);

        const filename = buildNativeBinaryFileName(appName, platformName, versionName);

        await this._nativeBinariesStore.storeFile(filename, payload);

        version.binary = shasum(payload);
        this.commit(version);
        return version;
    }

    async createNativeDep(appName, platformName, versionName, dependency, withAuth) {
        const version = await this._getVersion(appName, platformName, versionName, withAuth);
        if (!containsDependency(version.nativeDeps, dependency, { shouldMatchVersion: false })) {
            version.nativeDeps.push(dependency);
            return this.commit(version);
        }
        return false;
    }

    async getNativeDependency(appName, platformName, versionName, nativedepName, withAuth) {
        const nativeDeps = await this.getNativeDependencies(appName, platformName, versionName, withAuth);
        return find(nativeDeps, x => x.startsWith(`${nativedepName}@`));
    }

    async getNativeDependencies(appName, platformName, versionName, withAuth) {
        const {nativeDeps = []} = await this._getVersion(appName, platformName, versionName, withAuth);
        return nativeDeps;
    }

    async _getNativeDependency(appName, platformName, versionName, nativedepName, withAuth) {
        return checkNotFound(await this.getNativeDependency(appName, platformName, versionName, nativedepName, withAuth), `Native Dependency not found [${nativedepName}]`);
    }

    async createReactNativeApp(appName, platformName, versionName, payload, withAuth) {
        const version = await this._getVersion(appName, platformName, versionName, withAuth);
        if (!alreadyExists(version.reactNativeApps, payload.name, payload.version)) {
            version.reactNativeApps.push(payload);
        } 
        return this.commit(version);
    }

    async updateReactNativeAppVersion(appName, platformName, versionName, payload, newVersion) {
        const version = await this._getVersion(appName, platformName, versionName);
        const f = find(version.reactNativeApps, r => r.name === payload.name);
        f.version = newVersion;
        return this.commit(version);
    }

    async getReactNativeApps(appName, platformName, versionName, withAuth) {
        const {reactNativeApps} = await this._getVersion(appName, platformName, versionName, withAuth);
        return reactNativeApps || [];
    }

    async getReactNativeApp(appName, platformName, versionName, reactAppName, withAuth) {
        const reactNativeApps = await this.getReactNativeApps(appName, platformName, versionName, withAuth);
        return reactNativeApps.filter(v => v.name == reactAppName);
    }

    async removeReactNativeApp(appName, platformName, versionName, reactnativeappName, withAuth) {
        const version = await this._getVersion(appName, platformName, versionName, withAuth);
        const ret = remove(version.reactNativeApps, x => x.name === reactnativeappName).length > 0;
        return ret ? this.commit(version) : ret;
    }

}
