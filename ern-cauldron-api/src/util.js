// @flow

import _ from 'lodash'
import crypto from 'crypto'
import Joi from 'joi'

// ====================================
// Cauldron Helper
// ====================================
export const shasum = (payload: string | Buffer) => crypto.createHash('sha1').update(payload).digest('hex')

export function exists (
  collection: any,
  name: string,
  version: ?string) {
  if (!version) {
    return _.some(collection, x => x.name === name)
  } else {
    return _.some(collection, x => (x.name === name) && (x.version === version))
  }
}

export function buildNativeBinaryFileName (
  appName: string,
  platformName: string,
  versionName: string) {
  const ext = getNativeBinaryFileExt(platformName)
  return `${appName}-${platformName}@${versionName}.${ext}`
}

export function getNativeBinaryFileExt (platformName: string) {
  return platformName === 'android' ? 'apk' : 'app'
}

export function joiValidate (payload: any, schema: any) : Promise<any> {
  return new Promise(function (resolve, reject) {
    Joi.validate(payload, schema, (err, value) => {
      if (err) {
        return reject(err)
      }
      resolve(value)
    })
  })
}
