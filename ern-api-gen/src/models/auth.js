import ApiKeyAuthDefinition from './auth/ApiKeyAuthDefinition'
import BasicAuthDefinition from './auth/BasicAuthDefinition'
import OAuth2Definition from './auth/OAuth2Definition'
import {apply} from '../java/beanUtils'

export const AUTHS = [ApiKeyAuthDefinition, BasicAuthDefinition, OAuth2Definition]

const resolve = (def) => {
  if (def == null || def.type == null) return null
  for (const o of AUTHS) {
    if (o.TYPE === def.type) {
      return o
    }
  }
}

export default function authFactory (definition) {
  const Type = resolve(definition)
  if (Type == null) {
    throw new Error(`Unknown Auth Type for :${JSON.stringify(definition)}`)
  }

  return apply(new Type(), definition)
}
