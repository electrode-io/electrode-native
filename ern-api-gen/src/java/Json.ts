import stringify from 'json-stable-stringify'

export const pretty = obj => stringify(obj)
export const prettyPrint = obj => console.log(pretty(obj))
export default {
  pretty,
  prettyPrint,
}
