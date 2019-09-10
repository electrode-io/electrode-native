const run = require('../utils/run')
const assert = require('../utils/assert')
const sameDirContent = require('../utils/sameDirContent')
const f = require('../fixtures/constants')

const miniapps = [
  `${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion}`,
  `${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion}`
]

const excludeFilter = [
    'project.pbxproj',
    'ElectrodeContainer/Libraries/**'
].map(s => `**/${s}`).join(',')

run(`create-container --miniapps ${miniapps.join(' ')} -p ios --dependencies react-native-code-push@5.2.1 --out ${process.cwd()}`)
assert(sameDirContent(f.pathToIosContainerFixture, process.cwd(), {excludeFilter}), 'Generated IOS Container differ from reference fixture !')
