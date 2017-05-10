import Boom from 'boom';
import crypto from 'crypto';
import {some as _some} from 'lodash';

//====================================
// Cauldron Helper
//====================================
export const shasum = (payload) => crypto.createHash('sha1').update(payload).digest('hex');

export function alreadyExists(collection, name, version) {
    if (!version) {
        return _some(collection, x => x.name === name);
    } else {
        return _some(collection, x => (x.name === name) && (x.version === version));
    }
}

export function buildNativeBinaryFileName(appName, platformName, versionName) {
    const ext = getNativeBinaryFileExt(platformName);
    return `${appName}-${platformName}@${versionName}.${ext}`;
}

export function getNativeBinaryFileExt(platformName) {
    return platformName === 'android' ? 'apk' : 'app';
}

export function buildReactNativeSourceMapFileName(appName, versionName) {
    return `${appName}@${versionName}.map`;
}

export function checkNotFound(val, message, ...data) {
    if (val == null)
        throw new Boom.notFound(message, data);
    return val;
}
