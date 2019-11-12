import stringify from 'json-stable-stringify'
import { log } from 'ern-core'

export const pretty = obj => stringify(obj)
export const prettyPrint = obj => log.info(pretty(obj))
export default {
  pretty,
  prettyPrint,
}
