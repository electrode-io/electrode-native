const run = require('../utils/run')
const assert = require('../utils/assert')
const sameDirContent = require('../utils/sameDirContent')
const f = require('../fixtures/constants')

const miniapps = [
  `${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion}`,
  `${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion}`
]

const filesToIgnoreForDiffs = [
  'index.android.bundle', 
  'index.android.bundle.meta'
]

run(`ern create-container --miniapps ${miniapps.join(' ')} -p android --dependencies react-native-code-push@5.2.1 --out ${process.cwd()}`)
assert(sameDirContent(f.pathToAndroidContainerFixture, process.cwd(), filesToIgnoreForDiffs), 'Generated Android Container differ from reference fixture !')