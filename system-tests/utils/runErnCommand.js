const shell = require('shelljs')
const path = require('path')

const pathToIndexProd = path.resolve(
  __dirname,
  '../../ern-local-cli/dist/index'
)

const ern = `node ${pathToIndexProd}`

module.exports = function(command) {
  return shell.exec(`${ern} ${command}`)
}
