const run = require('../utils/run')
const assert = require('../utils/assert')
const sameDirContent = require('../utils/sameDirContent')
const f = require('../fixtures/constants')

const filesToIgnore = [
  'ElectrodeApiImpl.xcodeproj',
  'project.pbxproj',
  'package.json',
  '.DS_Store',
  'index.android.bundle',
  'index.android.bundle.meta',
  'yarn.lock',
  'README.md',
  'WalmartItemApi.spec.js',
  'SysteTestEventApi.spec.js',
  'SystemTestsApi.spec.js'
]

run(`ern create-api-impl ${f.movieApiPkgName} -p ${f.movieApiImplPkgName} --skipNpmCheck --nativeOnly --outputDirectory ${process.cwd()} --force`)
assert(sameDirContent(f.pathToNativeApiImplFixture, process.cwd(), filesToIgnore), 'Generated API Native Impl differ from reference fixture !')
