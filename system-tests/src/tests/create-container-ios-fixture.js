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
]
  .map(s => `**/${s}`)
  .join(',')

run(
  `create-container --miniapps ${miniapps.join(
    ' '
  )} -p ios --out ${process.cwd()}`
)
assert(
  sameDirContent(f.pathToIosContainerFixture, process.cwd(), { excludeFilter }),
  'Generated IOS Container differ from reference fixture !'
)
