import Boom from 'boom';
import _ from 'lodash';
import crypto from 'crypto';

//====================================
// Cauldron Helper
//====================================

function alreadyExists(collection, name, version) {
    if (!version) {
        return _.some(collection, x => x.name === name);
    } else {
        return _.some(collection, x => (x.name === name) && (x.version === version));
    }
}

function buildNativeBinaryFileName(appName, platformName, versionName) {
    const ext = getNativeBinaryFileExt(platformName);
    return `${appName}-${platformName}@${versionName}.${ext}`;
}

function getNativeBinaryFileExt(platformName) {
    return platformName === 'android' ? 'apk' : 'app';
}

function buildReactNativeSourceMapFileName(appName, versionName) {
    return `${appName}@${versionName}.map`;
}

export default class CauldronApi {
    constructor(db, binaryStore, sourcemapStore) {
        this._db = db;
        this._nativeBinariesStore = binaryStore;
        this._sourceMapStore = sourcemapStore;
    }

    //So it gets it from the Filesystem.
    get _cauldron() {
        return this._db.cauldron;
    }

    begin() {
        this._db.begin();
    }

    removeAllApps(cb) {
        this._db.cauldron.nativeApps = [];
        this._db.commit(cb);
    }

    getNativeApplication(name) {
        return _.find(this._cauldron.nativeApps, x => x.name === name);
    }

    createNativeApplication(payload, cb) {
        if (!alreadyExists(this._cauldron.nativeApps, payload.name)) {
            this._cauldron.nativeApps.push(payload);
            return this._db.commit(() => cb(null, true));
        }
        cb(null, false);
    }

    removeNativeApplication(name, cb) {
        const ret = _.remove(this._cauldron.nativeApps, x => x.name === name).length > 0;
        return this._db.commit(() => cb(null, ret));
    }

    getPlatform(appName, platformName) {
        return this.getPlatformForApp(this.getNativeApplication(appName), platformName);
    }

    //So the reference does not change.
    getPlatformForApp(app, platformName) {
        if (app) {
            return _.find(app.platforms, x => x.name === platformName);
        }
    }

    createPlatform(appName, payload, cb) {
        const {app} = this.validateAndGet(appName);
        if (!alreadyExists(app.platforms, payload.name)) {
            app.platforms.push(payload);
            return this._db.commit(() => cb(null, true));
        }
        cb(null, false);
    }

    removePlatform(appName, platformName, cb) {
        const {app} =this.validateAndGet(appName, platformName);
        const ret = _.remove(app.platforms, x => x.name === platformName).length > 0;
        this._db.commit(() => cb(null, ret));
    }

    createVersion(appName, platformName, payload, cb) {
        const {platform} = this.validateAndGet(appName, platformName);

        if (!alreadyExists(platform.versions, payload.name)) {
            platform.versions.push(payload);
            return this._db.commit(() => cb(null, true));
        }
        cb(null, false);
    }

    updateVersion(appName, platformName, versionName, payload, cb) {
        const {version} = this.validateAndGet(appName, platformName, versionName);
        if (payload.isReleased !== undefined) {
            version.isReleased = payload.isReleased;
        }
        this._db.commit(() => cb(null, true));
    }

    getVersion(appName, platformName, versionName) {
        const platform = this.getPlatform(appName, platformName);
        if (platform) {
            return _.find(platform.versions, x => x.name === versionName);
        }
    }

    removeVersion(appName, platformName, versionName, cb) {
        const {platform} = this.validateAndGet(appName, platformName, versionName);
        const ret = _.remove(platform.versions, x => x.name === versionName).length > 0;
        this._db.commit(() => cb(null, ret));
    }

    getNativeDependency(nativeAppVersion, nativeDepName) {
        return _.find(nativeAppVersion.nativeDeps, x => x.name === nativeDepName);
    }

    removeNativeDependency(appName, platformName, versionName, nativeDepName, cb) {
        const {version} =   this.validateAndGet(appName, platformName, versionName);
        const ret = _.remove(version.nativeDeps, x => x.name === nativeDepName).length > 0;
        this._db.commit(() => {
            cb(null, ret);
        });
    }

    getReactNativeApp(nativeAppVersion, appName) {
        return _.filter(nativeAppVersion.reactNativeApps, x => x.name === appName);
    }

    removeReactNativeApp(appName, platformName, versionName, reactnativeappName, cb) {
        const {version} =this.validateAndGet(appName, platformName, versionName);
        const ret = _.remove(version.reactNativeApps, x => x.name === reactnativeappName).length > 0;
        cb(null, ret);
    }

    createReactNativeApp(appName, platformName, versionName, payload, cb) {

        const {version} =this.validateAndGet(appName, platformName, versionName);
        if (!alreadyExists(version.reactNativeApps, payload.name)) {
            version.reactNativeApps.push(payload);
        } else { /// consider version update, even if not the case
            _.find(version.reactNativeApps, r => r.name === payload.name).version = payload.version;
        }
        this._db.commit(cb);
    }

    createNativeDep(appName, platformName, versionName, payload, cb) {
        const {version} = this.validateAndGet(appName, platformName, versionName);
        if (!alreadyExists(version.nativeDeps, payload.name)) {
            version.nativeDeps.push(payload);
            return this._db.commit(() => cb(null, true));
        }
        cb(null, false);
    }

    updateNativeDep(appName, platformName, versionName, nativedepName, payload, cb) {
        const {version} = this.validateAndGet(appName, platformName, versionName);
        const nativedep = this.getNativeDependency(version, nativedepName);
        if (nativedep) {
            nativedep.version = payload.version ? payload.version : nativedep.version;
            cb(null, nativedep);
        } else {
            cb();
        }
    }

    validateAndGet(appName, platformName, versionName) {
        let app = this.getNativeApplication(appName);
        let platform, version;

        if (!app) {
            throw Boom.notFound(`No application named ${appName}`);
        }
        if (platformName) {
            platform = this.getPlatform(appName, platformName);
            if (!platform) {
                throw Boom.notFound(`No platform named ${platformName}`);
            }
            if (versionName) {
                version = this.getVersion(appName, platformName, versionName);
                if (!version) {
                    throw Boom.notFound(`No version named ${versionName}`);
                }
            }
        }

        return {app, platform, version};
    }

    createNativeBinary(appName, platformName, versionName, payload, cb) {
        const {app, platform, version} =
            this.validateAndGet(appName, platformName, versionName);

        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        const shasum = crypto.createHash('sha1');
        shasum.update(payload);
        this._nativeBinariesStore.storeFile(filename, payload);
        version.binary = shasum.digest('hex');
        cb(null, version);
    }

    getNativeBinary(appName, platformName, versionName, cb) {
        const {app, platform, version} = this.validateAndGet(appName, platformName, versionName);
        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        cb(null, this._nativeBinariesStore.getFile(filename)).code(200);
    }

    removeNativeBinary(appName, platformName, versionName, cb) {
        const {app, platform, version} =
            this.validateAndGet(appName, platformName, versionName);

        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        this._nativeBinariesStore.removeFile(filename);
        version.binary = null;
        cb();
    }

    createSourceMap(appName, versionName, payload, cb) {
        const filename = buildReactNativeSourceMapFileName(appName, versionName);
        this._sourceMapStore.storeFile(filename, payload);
        cb();
    }

    getSourceMap(appName, versionName, cb) {
        const filename = buildReactNativeSourceMapFileName(appName, versionName);
        const fileExists = this._sourceMapStore.hasFile(filename);
        cb(null, fileExists ? this._sourceMapStore.getFile(filename) : false);
    }
}
