import stringify from 'json-stable-stringify'

export const pretty = obj => stringify(obj, null, 2)
export const prettyPrint = (obj) => console.log(pretty(obj))
export default ({
  pretty,
  prettyPrint
})
