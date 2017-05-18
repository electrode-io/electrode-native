import Joi from 'joi'

export const miniAppsSchema = Joi.object({
  container: Joi.array().default([]),
  ota: Joi.array().default([])
})

export const nativeApplicationVersionSchema = Joi.object({
  name: Joi.string().required(),
  ernPlatformVersion: Joi.string().required(),
  isReleased: Joi.boolean().optional().default(false),
  binary: Joi.string().default(null),
  nativeDeps: Joi.array().default([]),
  miniApps: miniAppsSchema.default()
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
  miniAppsSchema,
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
