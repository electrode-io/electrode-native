const path = require('path')
const run = require('../utils/run')
const f = require('../../fixtures/constants')

run(`create-api-impl ${f.notInNpmPkg} --skipNpmCheck --nativeOnly --force`, {
  expectedExitCode: 1,
})
run(
  `create-api-impl ${f.movieApiPkgName} ${f.invalidElectrodeNativeModuleName} --skipNpmCheck --nativeOnly --force`,
  { expectedExitCode: 1 }
)
run(
  `create-api-impl ${f.movieApiPkgName} ${f.movieApiImplName} -p ${f.movieApiImplPkgName} --skipNpmCheck --nativeOnly --force`
)
const apiImplPath = path.join(process.cwd(), f.movieApiImplPkgName)
console.log(`Entering ${apiImplPath}`)
process.chdir(apiImplPath)
run('regen-api-impl')
