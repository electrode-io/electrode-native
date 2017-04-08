import _ from 'lodash';
import {
    alreadyExists,
    checkNotFound
} from './util';
import BaseApi from './base-api';

function fmt(action, appName, platformName, versionName, nativeDepName, version) {
    const path = [];
    let label = '';
    if (appName) {
        path.push(appName);
        label = 'app';
    }
    if (platformName) {
        path.push(platformName);
        label = 'platform';
    }
    if (versionName) {
        path.push(versionName);
        label = 'version'
    }
    if (nativeDepName) {
        path.push(nativeDepName);
        label = 'native dep';
    }
    if (version) {
        path.push(version);
        label = 'native dep version';
    }
    return `[${action}] - ${label} '${path.pop()}' ${path.join('.')}`;
}
export default class CauldronApi extends BaseApi {
    constructor(db, binaryStore, sourcemapStore) {
        super(binaryStore, sourcemapStore);
        this._db = db;
    }

    //So it gets it from the Filesystem.
    get _cauldron() {
        return this._db.cauldron;
    }

    begin() {
        this._db.begin();
    }

    commit(...args) {
        return this._db.commit(fmt(...args));
    }

    removeAllApps() {
        this._cauldron.nativeApps = [];
        return this.commit('remove', 'nativeApps');
    }

    getNativeApplications() {
        return this._cauldron.nativeApps;
    }

    getNativeApplication(name) {
        return _.find(this._cauldron.nativeApps, x => x.name === name);
    }


    createNativeApplication(payload) {
        if (!alreadyExists(this._cauldron.nativeApps, payload.name)) {
            this._cauldron.nativeApps.push(payload);
            return this.commit('create', payload.name);
        }
        return false;
    }

    removeNativeApplication(name) {
        const ret = _.remove(this._cauldron.nativeApps, x => x.name === name).length > 0;
        return ret ? this.commit('remove', name) : false;
    }

    async getPlatforms(appName) {
        const app = await this._getNativeApplication(appName);
        return app == null ? null : app.platforms;
    }

    async getPlatform(appName, platformName) {
        return this.getPlatformForApp(await this.getPlatforms(appName), platformName);
    }


    //So the reference does not change.
    getPlatformForApp(platforms, platformName) {
        return _.find(platforms, x => x.name === platformName);
    }

    async createPlatform(appName, payload) {
        const app = await this.getNativeApplication(appName);

        if (!alreadyExists(app.platforms, payload.name)) {
            app.platforms.push(payload);
            return this.commit('create', appName, payload.name);
        }
        return false;
    }

    async removePlatform(appName, platformName) {
        const app = this.getNativeApplication(appName);
        if (app == null) {
            return false;
        }
        const ret = _.remove(app.platforms, x => x.name === platformName).length > 0;
        await this.commit('remove', appName, platformName);
        return ret;
    }

    async createVersion(appName, platformName, payload) {
        const platform = await this._getPlatform(appName, platformName);

        if (!alreadyExists(platform.versions, payload.name)) {
            if (payload.isReleased == null) {
                payload.isReleased = false;
            }
            platform.versions.push(payload);
            return this.commit('create', appName, platformName, payload.name);
        }
        return false;
    }


    async getVersions(appName, platformName) {
        const platform = await this._getPlatform(appName, platformName);
        return platform.versions;
    }

    async getVersion(appName, platformName, versionName) {
        const versions = await this.getVersions(appName, platformName);
        return _.find(versions, x => x.name === versionName);
    }

    async removeVersion(appName, platformName, versionName) {
        const platform = await this.getPlatform(appName, platformName);
        checkNotFound(platform, `No version named ${versionName}`);
        const ret = _.remove(platform.versions, x => x.name === versionName).length > 0;
        return ret ? this.commit(`remove`, appName, platformName, versionName) : false;
    }


    async removeNativeDependency(appName, platformName, versionName, nativeDepName) {
        const version = await this._getVersion(appName, platformName, versionName);

        const ret = _.remove(version.nativeDeps, x => x.name === nativeDepName).length > 0;
        return ret ? this.commit(`remove`, appName, platformName, versionName, nativeDepName) : false;

    }


    async updateNativeDep(appName, platformName, versionName, nativedepName, payload) {
        const nativedep = await this._getNativeDependency(appName, platformName, versionName, nativedepName);
        nativedep.version = payload.version ? payload.version : nativedep.version;
        await this.commit('update', appName, platformName, versionName, nativedepName, nativedep.version);
        return nativedep;
    }


}
