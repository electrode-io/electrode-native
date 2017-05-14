import Joi from 'joi'

export const reactNativeAppSchema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().required(),
  isInBinary: Joi.boolean().required(),
  scope: Joi.string().optional(),
  hasSourceMap: Joi.boolean().optional()
})

export const nativeApplicationVersionSchema = Joi.object({
  name: Joi.string().required(),
  ernPlatformVersion: Joi.string().required(),
  isReleased: Joi.boolean().optional().default(false),
  binary: Joi.string().default(null),
  nativeDeps: Joi.array().default([]),
  reactNativeApps: Joi.array().items(reactNativeAppSchema).default([])
})

export const nativeAplicationVersionPatchSchema = Joi.object({
  isReleased: Joi.boolean().optional()
})

export const nativeApplicationPlatformSchema = Joi.object({
  name: Joi.string().valid(['android', 'ios']),
  versions: Joi.array().items(nativeApplicationVersionSchema).default([])
})

export const nativeApplicationSchema = Joi.object({
  name: Joi.string().required(),
  platforms: Joi.array().items(nativeApplicationPlatformSchema).default([])
})

export default ({
  reactNativeAppSchema,
  nativeApplicationVersionSchema,
  nativeAplicationVersionPatchSchema,
  nativeApplicationPlatformSchema,
  nativeApplicationSchema
})

export function joiValidate(payload, schema) {
  return new Promise(function(resolve, reject) {
    Joi.validate(payload, schema, (err, value) => {
      if (err) {
        return reject(err)
      }
      resolve(value)
    })
  })
} 
