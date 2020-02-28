const fs = require('fs')
const os = require('os')
const path = require('path')

module.exports = function() {
  const ERN_PATH = process.env['ERN_HOME'] || path.join(os.homedir(), '.ern')
  const ERN_RC_PATH = path.join(ERN_PATH, '.ernrc')
  const ernRc = JSON.parse(fs.readFileSync(ERN_RC_PATH))
  return ernRc.cauldronRepoInUse
}
