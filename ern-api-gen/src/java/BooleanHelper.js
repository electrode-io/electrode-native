export function parseBoolean (str) {
  if (str == null) return false
  if (str === true || str === false) return str
  const cstr = ('' + str).toLowerCase()
  if (cstr === 'true') return true
  if (cstr === 'false') return false
  return !!str
}
export default ({
  parseBoolean
})
