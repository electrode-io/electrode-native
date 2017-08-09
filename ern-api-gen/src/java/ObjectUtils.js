export const compare = (a, b) => {
  if (a == null && b == null) return true
  if (a == null) return -1
  if (b == null) return 1
  return a < b
}

export default ({
  compare
})
