// @flow

import {
  generateApiImpl
} from '@walmart/ern-api-impl-gen'

exports.command = 'api-impl <apiName>'
exports.desc = 'Commands to generate API implementation skeleton.'

exports.builder = function (yargs: any) {
  return yargs.option('apiName', {
    alias: 'api',
    describe: `npm package name or the git location of the api for which an implementation needs to be generated.`
  }).option('nativeOnly', {
    alias: 'n',
    type: 'bool',
    describe: 'Generate native projects with proper dependencies (Implementation of the API has to be written in native'
  })
}

exports.handler = function (argv: any) {
  console.log(`command identified for generating API implementation for  ${argv.apiName}`)

  generateApiImpl({
    apiName: argv.apiName,
    outputFolder: argv.outputFolder,
    nativeOnly: argv.nativeOnly
  })
}
