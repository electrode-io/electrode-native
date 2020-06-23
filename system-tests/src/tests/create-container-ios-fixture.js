const run = require('../utils/run')
const assert = require('../utils/assert')
const sameDirContent = require('../utils/sameDirContent')
const f = require('../../fixtures/constants')

const miniapps = [
  `${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion}`,
  `${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion}`,
]

const excludeFilter = [
  'project.pbxproj',
  'ElectrodeContainer/Libraries/**',
  'node_modules/**',
  'Pods/**',
  'Podfile.lock',
  'yarn.lock',
]
  .map(s => `**/${s}`)
  .join(',')

const command = `create-container --miniapps ${miniapps.join(
  ' '
)} -p ios --skipInstall --out ${process.cwd()}`

if (process.platform === 'darwin') {
  run(command)
  assert(
    sameDirContent(f.pathToIosContainerFixture, process.cwd(), {
      excludeFilter,
    }),
    'Generated IOS Container differ from reference fixture !'
  )
} else {
  run(command, { expectedExitCode: 1 })
}
