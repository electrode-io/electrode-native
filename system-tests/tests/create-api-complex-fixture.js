const path = require('path')
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

run(`ern create-api ${f.complexApiName} -p ${f.testApiPkgName}  --schemaPath ${f.pathToComplexApiSchema} --skipNpmCheck`)
assert(sameDirContent(f.pathToComplexApiFixture, path.join(process.cwd(), f.complexApiName), filesToIgnore), 'Generated API differ from reference fixture !')
