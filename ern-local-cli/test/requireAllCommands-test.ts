import readDir from 'fs-readdir-recursive'
import path from 'path'

//
// Require all commands so that theses source files get exerciced
// during the unit tests.
// This is not really unit tests per se, but a workarround to
// address an identified issue in nyc, not properly reporting
// combined UT/ST coverage for these files if they don't get
// loaded from UTs (and thus have 0% coverage from UT)
const commandsDir = path.resolve(__dirname, '../src/commands')
readDir(commandsDir)
  .filter(f => path.extname(f) === '.ts')
  .map(f => path.join(commandsDir, f))
  .forEach(f => require(f))
