const run = require('../utils/run')
const assert = require('../utils/assert')
const sameDirContent = require('../utils/sameDirContent')
const f = require('../../fixtures/constants')

const miniapps = [
  `${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion}`,
  `${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion}`,
]

const excludeFilter = [
  'index.android.bundle',
  'index.android.bundle.meta',
  'jniLibs/**',
  'yarn.lock',
]
  .map(s => `**/${s}`)
  .join(',')

run(
  `create-container --miniapps ${miniapps.join(
    ' '
  )} -p android --out ${process.cwd()}`
)
assert(
  sameDirContent(f.pathToAndroidContainerFixture, process.cwd(), {
    excludeFilter,
  }),
  'Generated Android Container differ from reference fixture !'
)
