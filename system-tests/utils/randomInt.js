//
// Returns a random int between min and max (inclusive)
module.exports = function (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}