// @flow

import {
  generateApiImpl
} from '@walmart/ern-api-impl-gen'

exports.command = 'api-impl <api>'
exports.desc = 'Commands to generate API implementation skeleton.'

exports.builder = function (yargs: any) {
  return yargs.option('api', {
    type: 'string',
    describe: `npm package name OR the git location of the api f OR the file path for which an implementation needs to be generated.`
  }).option('nativeOnly', {
    alias: 'n',
    type: 'bool',
    describe: 'Generate native projects with proper dependencies (Implementation of the API has to be written in native'
  }).option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Forces a project creation even if an imlemenation already present inside the output location'
  })
}

exports.handler = function (argv: any) {
  console.log(`command identified for generating API implementation for  ${argv.api}`)

  generateApiImpl({
    api: argv.api,
    outputFolder: argv.outputFolder,
    nativeOnly: argv.nativeOnly,
    forceGenerate: argv.force
  })
}
