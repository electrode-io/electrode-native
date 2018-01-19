// @flow

import Joi from 'joi'

export const container = Joi.object({
  miniApps: Joi.array().default([]),
  nativeDeps: Joi.array().default([]),
  jsApiImpls: Joi.array().default([])
})

export const nativeApplicationVersion = Joi.object({
  name: Joi.string().required(),
  ernPlatformVersion: Joi.string().required(),
  isReleased: Joi.boolean().optional().default(false),
  binary: Joi.string().default(null),
  yarnLocks: Joi.object().default({}),
  nativeDeps: Joi.array().default([]),
  container: container.default(),
  codePush: Joi.object().default({}),
  containerVersion: Joi.string().optional() // optional for Backward Compat. Required in ERN 0.5.0
})

export const nativeAplicationVersionPatch = Joi.object({
  isReleased: Joi.boolean().optional()
})

export const nativeApplicationPlatform = Joi.object({
  name: Joi.string().valid(['android', 'ios']),
  versions: Joi.array().items(nativeApplicationVersion).default([])
})

export const nativeApplication = Joi.object({
  name: Joi.string().required(),
  platforms: Joi.array().items(nativeApplicationPlatform).default([])
})
