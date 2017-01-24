import path from 'path';
import Api from './api';
import Db from './db';
import {
    nativeDependencySchema,
    nativeDependencyPatchSchema,
    reactNativeAppSchema,
    nativeApplicationVersionSchema,
    nativeAplicationVersionPatchSchema,
    nativeApplicationPlatformSchema,
    nativeApplicationSchema
} from './schemas';
import Filestore from './filestore'
function register(server, {
    nativeBinariesStorePath = path.join(process.cwd(), '.cauldron/binaries'),
    sourceMapsStorePath = path.join(process.cwd(), './.cauldron/sourcemaps'),
    dbFilePath = path.join(process.cwd(), './.cauldron/db.json')
}, next) {

    function existsReply(reply) {
        return function (e, o) {
            if (e) return reply(e).code(500);
            if (o) return reply().code(200);
            reply().code(404);
        }
    }

    const db = new Db(dbFilePath);
    const api = server.plugins.cauldron = new Api(db, new Filestore(nativeBinariesStorePath), new Filestore(sourceMapsStorePath));
//====================================
// HAPI server config / launch
//====================================

    /** So we "begin" a transaction on each request
     * This fetches new content from the json file.  So
     * it is never out of sync.
     */
    server.ext('onRequest', (request, reply) => {
        api.begin();
        reply.continue();
    });


//------------------------------------
// /nativeapps
//------------------------------------

    server.route({
        method: 'POST',
        path: '/nativeapps',
        handler: function ({payload}, reply) {
            api.createNativeApplication(payload, () => reply().code(200));
        },
        config: {validate: {payload: nativeApplicationSchema}}
    });

    server.route({
        method: 'GET',
        path: '/nativeapps',
        handler: function (req, reply) {
            reply(db.cauldron.nativeApps).code(200);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/nativeapps',
        handler: function (req, reply) {
            api.removeAllApps(() => reply().code(200))
        }
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}',
        handler: function ({params:{app}}, reply) {
            const val = api.validateAndGet(app);
            reply(val.app).code(200);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/nativeapps/{app}',
        handler: function ({params:{app}}, reply) {
            api.removeNativeApplication(app, existsReply(reply));
        }
    });

    server.route({
        method: 'POST',
        path: '/nativeapps/{app}/platforms',
        handler: function ({params:{app}, payload}, reply) {
            api.createPlatform(app, payload, () => reply().code(200));
        },
        config: {validate: {payload: nativeApplicationPlatformSchema}}
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms',
        handler: function (req, reply) {
            const {app} = api.validateAndGet(req.params.app);
            reply(app.platforms).code(200);
        }
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}',
        handler: function ({params:{app, platform}}, reply) {
            reply(api.validateAndGet(app, platform).platform).code(200);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/nativeapps/{app}/platforms/{platform}',
        handler: function ({params:{app, platform}}, reply) {
            api.removePlatform(app, platform, existsReply(reply));
        }
    });

    server.route({
        method: 'POST',
        path: '/nativeapps/{app}/platforms/{platform}/versions',
        handler: function ({params:{app, platform}, payload}, reply) {
            api.createVersion(app, platform, payload, () => reply().code(200));
        },
        config: {validate: {payload: nativeApplicationVersionSchema}}
    });

    server.route({
        method: 'PATCH',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}',
        handler: function ({params:{app, platform, version}, payload}, reply) {
            api.updateVersion(app, platform, version, payload, () => reply().code(200));
        },
        config: {validate: {payload: nativeAplicationVersionPatchSchema}}
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions',
        handler: function ({params:{app, platform}}, reply) {
            const resp = api.validateAndGet(app, platform);
            reply(resp.platform.versions).code(200);
        }
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}',
        handler: function ({params:{app, platform, version}}, reply) {
            reply(api.validateAndGet(app, platform, version).version).code(200);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}',
        handler: function ({params:{app, platform, version}}, reply) {
            api.removeVersion(app, platform, version, existsReply(reply));
        }
    });

    server.route({
        method: 'POST',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps',
        handler: function ({params:{app, platform, version}, payload}, reply) {
            api.createNativeDep(app, platform, version, payload, () => reply().code(200));
        },
        config: {validate: {payload: nativeDependencySchema}}
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps',
        handler: function (req, reply) {
            const {version} =
                api.validateAndGet(req.params.app, req.params.platform, req.params.version);
            reply(version.nativeDeps).code(200);
        }
    });

    server.route({
        method: 'PATCH',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}',
        handler: function ({payload, params:{app, platform, version, nativedep}}, reply) {
            api.updateNativeDep(app, platform, version, nativedep, payload, (e, p) => {
                if (!p) return reply().code(404);
                reply(p).code(200)
            });
        },
        config: {validate: {payload: nativeDependencyPatchSchema}}
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}',
        handler: function (req, reply) {
            const {app, platform, version} =
                api.validateAndGet(req.params.app, req.params.platform, req.params.version);
            const nativedep = api.getNativeDependency(version, req.params.nativedep);
            nativedep ? reply(nativedep).code(200) : reply().code(404);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/nativedeps/{nativedep}',
        handler: function ({params:{app, platform, version, nativedep}}, reply) {
            api.removeNativeDependency(app, platform, version, nativedep, (e, v) => v ? reply().code(200) : reply().code(404));
        }
    });

    server.route({
        method: 'POST',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps',
        handler: function ({params:{app, platform, version}, payload}, reply) {
            api.createReactNativeApp(app, platform, version, payload, () => reply().code(200));
        },
        config: {validate: {payload: reactNativeAppSchema}}
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps',
        handler: function (req, reply) {
            const {app, platform, version} =
                api.validateAndGet(req.params.app, req.params.platform, req.params.version);
            reply(version.reactNativeApps).code(200);
        }
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}',
        handler: function (req, reply) {
            const {version} = api.validateAndGet(req.params.app, req.params.platform, req.params.version);
            const reactNativeApp = api.getReactNativeApp(version, req.params.reactnativeapp);
            reactNativeApp.length > 0 ? reply(reactNativeApp).code(200) : reply().code(404);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/reactnativeapps/{reactnativeapp}',
        handler: function ({params:{app, platform, version, reactnativeapp}}, reply) {
            api.removeReactNativeApp(app, platform, version, reactnativeapp, existsReply(reply));
        }
    });

    server.route({
        method: 'POST',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary',
        config: {payload: {maxBytes: 52428800}},
        handler: function ({params:{app, platform, version}, payload}, reply) {

            api.createNativeBinary(app, platform, version, payload, () => reply().code(200));
        }
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary',
        handler: function ({params:{app, platform, version}}, reply) {
            api.getNativeBinary(app, platform, version, (e, o) => reply(o).code(200));
        }
    });

    server.route({
        method: 'GET',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary/hash',
        handler: function (req, reply) {
            const {app, platform, version} =
                api.validateAndGet(req.params.app, req.params.platform, req.params.version);

            version.binary ? reply({hash: version.binary}).code(200) : reply().code(404);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/nativeapps/{app}/platforms/{platform}/versions/{version}/binary',
        handler: function ({params:{app, platform, version}}, reply) {
            api.removeNativeBinary(app, platform, version, () => reply().code(200))
        }
    });

//------------------------------------
// /reactnativeapps
//------------------------------------

    server.route({
        method: 'POST',
        path: '/reactnativeapps/{app}/versions/{version}/sourcemap',
        config: {payload: {maxBytes: 52428800}},
        handler: function ({payload, params:{app, version}}, reply) {
            api.createSourceMap(app, version, payload, () => reply().code(200))
        }
    });

    server.route({
        method: 'GET',
        path: '/reactnativeapps/{app}/versions/{version}/sourcemap',
        handler: function ({params:{app, version}}, reply) {
            api.getSourceMap(app, version, (e, o) => o ? reply(o).code(200) : reply().code(404));
        }
    });

    next();
}
register.attributes = {name: 'ern:cauldron:routes'};

export default {register}
