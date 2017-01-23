import fs from 'fs';
import crypto from 'crypto';

import Hapi from 'hapi';
import Joi from 'joi';
import Boom from 'boom';
import _ from 'lodash';
import path from 'path';

import Db from './db.js';
import FileStore from './filestore.js'

const DEFAULT_SERVER_PORT = 3000;

const CAULDRONRC_FILE = `${process.cwd()}/.cauldronrc`;

let cauldronServerPort = DEFAULT_SERVER_PORT;

console.log(CAULDRONRC_FILE);
if (fs.existsSync(CAULDRONRC_FILE)) {
    const cauldronRc = JSON.parse(fs.readFileSync(CAULDRONRC_FILE));
    cauldronServerPort = cauldronRc.port;
}

const server = new Hapi.Server();
server.connection({port: cauldronServerPort});

//====================================
// Cauldron Helper
//====================================

export class CauldronHelper {
    constructor(cauldron) {
        this._cauldron = cauldron;
    }

    getNativeApplication(name) {
        return _.find(this._cauldron.nativeApps, x => x.name === name);
    }

    removeNativeApplication(name) {
        return _.remove(this._cauldron.nativeApps, x => x.name === name).length > 0;
    }

    getPlatform(appName, platformName) {
        const app = this.getNativeApplication(appName);
        if (app) {
            return _.find(app.platforms, x => x.name === platformName);
        }
    }

    removePlatform(app, platformName) {
        return _.remove(app.platforms, x => x.name === platformName).length > 0;
    }

    getVersion(appName, platformName, versionName) {
        const platform = this.getPlatform(appName, platformName);
        if (platform) {
            return _.find(platform.versions, x => x.name === versionName);
        }
    }

    removeVersion(platform, versionName) {
        return _.remove(platform.versions, x => x.name === versionName).length > 0;
    }

    getNativeDependency(nativeAppVersion, nativeDepName) {
        return _.find(nativeAppVersion.nativeDeps, x => x.name === nativeDepName);
    }

    removeNativeDependency(nativeAppVersion, nativeDepName) {
        return _.remove(nativeAppVersion.nativeDeps, x => x.name === nativeDepName).length > 0;
    }

    getReactNativeApp(nativeAppVersion, appName) {
        return _.filter(nativeAppVersion.reactNativeApps, x => x.name === appName);
    }

    removeReactNativeApp(nativeAppVersion, appName) {
        return _.remove(nativeAppVersion.reactNativeApps, x => x.name === appName).length > 0;
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
}

let nativeBinariesStore, sourceMapsStore, db, cauldron, ch;

//====================================
// JOI validation schemas
//====================================

const nativeDependencySchema = Joi.object({
    name: Joi.string().required(),
    version: Joi.string().required(),
    scope: Joi.string().optional()
});

const nativeDependencyPatchSchema = Joi.object({
    version: Joi.string().optional()
});

const reactNativeAppSchema = Joi.object({
    name: Joi.string().required(),
    version: Joi.string().required(),
    isInBinary: Joi.boolean().required(),
    scope: Joi.string().optional(),
    hasSourceMap: Joi.boolean().optional()
});

const nativeApplicationVersionSchema = Joi.object({
    name: Joi.string().required(),
    ernPlatformVersion: Joi.string().required(),
    isReleased: Joi.boolean().optional().default(false),
    binary: Joi.string().default(null),
    nativeDeps: Joi.array().items(nativeDependencySchema).default([]),
    reactNativeApps: Joi.array().items(reactNativeAppSchema).default([])
});

const nativeAplicationVersionPatchSchema = Joi.object({
    isReleased: Joi.boolean().optional()
});

const nativeApplicationPlatformSchema = Joi.object({
    name: Joi.string().valid(['android', 'ios']),
    versions: Joi.array().items(nativeApplicationVersionSchema).default([])
});

const nativeApplicationSchema = Joi.object({
    name: Joi.string().required(),
    platforms: Joi.array().items(nativeApplicationPlatformSchema).default([])
});

//====================================
// Cauldron API routes
//====================================

//------------------------------------
// /nativeapps
//------------------------------------

server.route({
    method: 'POST',
    path: '/nativeapps',
    handler: function (req, reply) {
        if (!alreadyExists(cauldron.nativeApps, req.payload.name)) {
            cauldron.nativeApps.push(req.payload);
            return dbCommit(reply);
        }
        reply().code(200);
    },
    config: {validate: {payload: nativeApplicationSchema}}
});

server.route({
    method: 'GET',
    path: '/nativeapps',
    handler: function (req, reply) {
        reply(cauldron.nativeApps).code(200);
    }
});

server.route({
    method: 'DELETE',
    path: '/nativeapps',
    handler: function (req, reply) {
        cauldron.nativeApps = [];
        dbCommit(reply);
    }
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}',
    handler: function (req, reply) {
        const {app} = ch.validateAndGet(req.params.app);
        reply(app).code(200);
    }
});

server.route({
    method: 'DELETE',
    path: '/nativeapps/{app}',
    handler: function (req, reply) {
        const {app} = ch.validateAndGet(req.params.app);
        ch.removeNativeApplication(app.name);
        dbCommit(reply);
    }
});

server.route({
    method: 'POST',
    path: '/nativeapps/{app}/platforms',
    handler: function (req, reply) {
        const {app} = ch.validateAndGet(req.params.app);

        if (!alreadyExists(app.platforms, req.payload.name)) {
            app.platforms.push(req.payload);
            return dbCommit(reply);
        }
        reply().code(200);
    },
    config: {validate: {payload: nativeApplicationPlatformSchema}}
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms',
    handler: function (req, reply) {
        const {app} = ch.validateAndGet(req.params.app);
        reply(app.platforms).code(200);
    }
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}',
    handler: function (req, reply) {
        const {app, platform} =
            ch.validateAndGet(req.params.app, req.params.platform);
        reply(platform).code(200);
    }
});

server.route({
    method: 'DELETE',
    path: '/nativeapps/{app}/platforms/{platform}',
    handler: function (req, reply) {
        const {app, platform} =
            ch.validateAndGet(req.params.app, req.params.platform);
        ch.removePlatform(app, platform.name);
        dbCommit(reply);
    }
});

server.route({
    method: 'POST',
    path: '/nativeapps/{app}/platforms/{platform}/versions',
    handler: function (req, reply) {
        const {app, platform} =
            ch.validateAndGet(req.params.app, req.params.platform);

        if (!alreadyExists(platform.versions, req.payload.name)) {
            platform.versions.push(req.payload);
            return dbCommit(reply);
        }
        reply().code(200);
    },
    config: {validate: {payload: nativeApplicationVersionSchema}}
});

server.route({
    method: 'PATCH',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);

        if (req.payload.isReleased !== undefined) {
            version.isReleased = req.payload.isReleased;
        }

        reply().code(200);
    },
    config: {validate: {payload: nativeAplicationVersionPatchSchema}}
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions',
    handler: function (req, reply) {
        const {app, platform} =
            ch.validateAndGet(req.params.app, req.params.platform);
        reply(platform.versions).code(200);
    }
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        reply(version).code(200);
    }
});

server.route({
    method: 'DELETE',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        ch.removeVersion(platform, version.name);
        dbCommit(reply);
    }
});

server.route({
    method: 'POST',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        if (!alreadyExists(version.nativeDeps, req.payload.name)) {
            version.nativeDeps.push(req.payload);
            return dbCommit(reply);
        }
        reply().code(200);
    },
    config: {validate: {payload: nativeDependencySchema}}
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        reply(version.nativeDeps).code(200);
    }
});

server.route({
    method: 'PATCH',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        const nativedep = ch.getNativeDependency(version, req.params.nativedep);
        if (nativedep) {
            nativedep.version = req.payload.version ? req.payload.version : nativedep.version;
            reply(nativedep).code(200)
        } else {
            reply().code(404);
        }
    },
    config: {validate: {payload: nativeDependencyPatchSchema}}
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        const nativedep = ch.getNativeDependency(version, req.params.nativedep);
        nativedep ? reply(nativedep).code(200) : reply().code(404);
    }
});

server.route({
    method: 'DELETE',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        ch.removeNativeDependency(version, req.params.nativedep)
            ? dbCommit(reply) : reply().code(404);
    }
});

server.route({
    method: 'POST',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        if (!alreadyExists(version.reactNativeApps, req.payload.name)) {
            version.reactNativeApps.push(req.payload);
        } else { /// consider version update, even if not the case
            _.find(version.reactNativeApps, r => r.name === req.payload.name).version = req.payload.version;
        }
        return dbCommit(reply);
    },
    config: {validate: {payload: reactNativeAppSchema}}
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        reply(version.reactNativeApps).code(200);
    }
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        const reactNativeApp = ch.getReactNativeApp(version, req.params.reactnativeapp);
        reactNativeApp.length > 0 ? reply(reactNativeApp).code(200) : reply().code(404);
    }
});

server.route({
    method: 'DELETE',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);
        ch.removeReactNativeApp(version, req.params.reactnativeapp) ? dbCommit(reply) : reply().code(404);
    }
});

server.route({
    method: 'POST',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary',
    config: {payload: {maxBytes: 52428800}},
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);

        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        const shasum = crypto.createHash('sha1');
        shasum.update(req.payload);
        nativeBinariesStore.storeFile(filename, req.payload);
        version.binary = shasum.digest('hex');
        return dbCommit(reply);
    }
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);

        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        reply(nativeBinariesStore.getFile(filename)).code(200);
    }
});

server.route({
    method: 'GET',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary/hash',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);

        version.binary ? reply({hash: version.binary}).code(200) : reply().code(404);
    }
});

server.route({
    method: 'DELETE',
    path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary',
    handler: function (req, reply) {
        const {app, platform, version} =
            ch.validateAndGet(req.params.app, req.params.platform, req.params.version);

        const filename = buildNativeBinaryFileName(app.name, platform.name, version.name);
        nativeBinariesStore.removeFile(filename);
        version.binary = null;
        reply().code(200);
    }
});

//------------------------------------
// /reactnativeapps
//------------------------------------

server.route({
    method: 'POST',
    path: '/reactnativeapps/{app}/versions/{version}/sourcemap',
    config: {payload: {maxBytes: 52428800}},
    handler: function (req, reply) {
        const filename = buildReactNativeSourceMapFileName(req.params.app, req.params.version);
        sourceMapsStore.storeFile(filename, req.payload);
        reply().code(200);
    }
});

server.route({
    method: 'GET',
    path: '/reactnativeapps/{app}/versions/{version}/sourcemap',
    handler: function (req, reply) {
        const filename = buildReactNativeSourceMapFileName(req.params.app, req.params.version);
        const fileExists = sourceMapsStore.hasFile(filename);
        fileExists ? reply(sourceMapsStore.getFile(filename, req.payload)).code(200) : reply().code(404);
    }
});

//====================================
// Helper functions
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

function dbCommit(reply) {
    db.commit(() =>{
        reply().code(200)
    });
}

//====================================
// HAPI server config / launch
//====================================

export default function start({
    nativeBinariesStorePath = path.join(process.cwd(), '.cauldron/binaries'),
    sourceMapsStorePath = path.join(process.cwd(), './.cauldron/sourcemaps'),
    dbFilePath = path.join(process.cwd(), './.cauldron/db.json')
} = {}, cb) {
    nativeBinariesStore = new FileStore(nativeBinariesStorePath);
    sourceMapsStore = new FileStore(sourceMapsStorePath);
    db = new Db(dbFilePath);
    cauldron = db.cauldron;
    ch = new CauldronHelper(cauldron);

    server.start((err) => {
        console.log(`Cauldron server running at: ${server.info.uri}`);
        cb && cb(err, server);
    });

}

//module.exports = start;

export function getCauldron() {
    if (process.env.NODE_ENV === 'test') {
        return cauldron;
    } else {
        throw new Error("Cannot set cauldron in non testing env");
    }
}

export function setCauldron(value) {
    if (process.env.NODE_ENV === 'test') {
        cauldron = value;
        ch = new CauldronHelper(cauldron);
    } else {
        throw new Error("Cannot set cauldron in non testing env");
    }
}
