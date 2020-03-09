const path = require('path')
const run = require('../utils/run')
const assert = require('../utils/assert')
const sameDirContent = require('../utils/sameDirContent')
const f = require('../../fixtures/constants')

const excludeFilter = [
  'ElectrodeApiImpl.xcodeproj',
  'project.pbxproj',
  '.DS_Store',
  'index.android.bundle',
  'index.android.bundle.meta',
  'yarn.lock',
  'README.md',
  'WalmartItemApi.spec.js',
  'SysteTestEventApi.spec.js',
  'SystemTestsApi.spec.js',
  '.yarn-integrity',
]
  .map(s => `**/${s}`)
  .join(',')

run(
  `create-api ${f.testApiName} -p ${f.testApiPkgName} --schemaPath ${f.pathToTestApiSchema} -u "generated" --skipNpmCheck`
)

const fixtureApiPath = f.pathToBaseApiFixture
const generatedApiPath = path.join(process.cwd(), f.testApiPkgName)

assert(
  sameDirContent(fixtureApiPath, generatedApiPath, { excludeFilter }),
  'Generated API differ from reference fixture !'
)
