import Joi from '@hapi/joi'

export const container = Joi.object({
  ernVersion: Joi.string().default(undefined),
  miniApps: Joi.array().default([]),
  nativeDeps: Joi.array().default([]),
})

export const nativeApplicationVersion = Joi.object({
  binary: Joi.string().default(null),
  codePush: Joi.object().default({}),
  container: container.default(),
  containerVersion: Joi.string().optional(), // optional for Backward Compat. Required in ERN 0.5.0
  description: Joi.string().optional(),
  isReleased: Joi.boolean()
    .optional()
    .default(false),
  name: Joi.string().required(),
  nativeDeps: Joi.array().default([]),
  yarnLocks: Joi.object().default({}),
})

export const nativeAplicationVersionPatch = Joi.object({
  isReleased: Joi.boolean().optional(),
})

export const nativeApplicationPlatform = Joi.object({
  name: Joi.string().valid(['android', 'ios']),
  versions: Joi.array()
    .items(nativeApplicationVersion)
    .default([]),
})

export const nativeApplication = Joi.object({
  name: Joi.string().required(),
  platforms: Joi.array()
    .items(nativeApplicationPlatform)
    .default([]),
})

export const schemaVersion = '3.0.0'

export const cauldronApiVersionBySchemaVersion = {
  '1.0.0': '0.12.x',
  '2.0.0': '0.25.x',
  '3.0.0': '0.32.x',
}
