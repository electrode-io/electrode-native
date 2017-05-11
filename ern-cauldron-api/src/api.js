import _ from 'lodash';
import {
    alreadyExists,
    checkNotFound,
    removeVersionFromDependency
} from './util';
import {
    reactNativeAppSchema,
    nativeApplicationVersionSchema,
    nativeAplicationVersionPatchSchema,
    nativeApplicationPlatformSchema,
    nativeApplicationSchema
} from './schemas'
import Joi from 'Joi'
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

function joiValidate(payload, schema) {
    return new Promise(function(resolve, reject) {
        Joi.validate(payload, schema, (err, value) => {
            if (err) {
                return reject(err)
            }
            resolve(value)
        })
    })
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

    async begin() {
        return this._db.begin();
    }

    commit(...args) {
        return this._db.commit(fmt(...args));
    }

    async removeAllApps() {
        await this.begin()
        this._cauldron.nativeApps = [];
        return this.commit('remove', 'nativeApps');
    }

    async getNativeApplications() {
        await this.begin()
        return this._cauldron.nativeApps;
    }

    async getNativeApplication(name) {
        await this.begin()
        return _.find(this._cauldron.nativeApps, x => x.name === name);
    }

    async createNativeApplication(payload) {
        await this.begin()
        if (!alreadyExists(this._cauldron.nativeApps, payload.name)) {
            const validatedPayload = await joiValidate(payload, nativeApplicationSchema)
            
            this._cauldron.nativeApps.push(validatedPayload);
            return this.commit('create', payload.name);
        }
    }

    async removeNativeApplication(name) {
        await this.begin()
        const ret = _.remove(this._cauldron.nativeApps, x => x.name === name).length > 0;
        return ret ? this.commit('remove', name) : false;
    }

    async getPlatforms(appName) {
        await this.begin()
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
        await this.begin()
        const app = await this.getNativeApplication(appName);

        if (!alreadyExists(app.platforms, payload.name)) {
            const validatedPayload = await joiValidate(payload, nativeApplicationPlatformSchema)
            
            app.platforms.push(validatedPayload);
            return this.commit('create', appName, payload.name);
        }
    }

    async removePlatform(appName, platformName) {
        await this.begin()
        const app = this.getNativeApplication(appName);
        if (app == null) {
            return false;
        }
        const ret = _.remove(app.platforms, x => x.name === platformName).length > 0;
        await this.commit('remove', appName, platformName);
        return ret;
    }

    async createVersion(appName, platformName, payload) {
        await this.begin()
        const platform = await this._getPlatform(appName, platformName);

        if (!alreadyExists(platform.versions, payload.name)) {
            const validatedPayload = await joiValidate(payload, nativeApplicationVersionSchema)

            if (validatedPayload.isReleased == null) {
                validatedPayload.isReleased = false;
            }

            platform.versions.push(validatedPayload);
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

    async removeNativeDependency(appName, platformName, versionName, dependency) {
        const version = await this._getVersion(appName, platformName, versionName);
        const ret = _.remove(version.nativeDeps, x => x.startsWith(`${dependency}@`)).length > 0;
        return ret ? this.commit(`remove`, appName, platformName, versionName, dependency) : false;
    }

    async updateNativeDep(appName, platformName, versionName, dependencyName, newVersion) {
        await this.begin()
        const version = await this._getVersion(appName, platformName, versionName)
        _.remove(version.nativeDeps, x => x.startsWith(`${dependencyName}@`))
        const newDependencyString = `${dependencyName}@${newVersion}`
        version.nativeDeps.push(newDependencyString)        
        await this.commit('update', appName, platformName, versionName, dependencyName,newVersion);
        return newDependencyString;
    }
}
