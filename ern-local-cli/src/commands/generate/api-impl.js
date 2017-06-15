// @flow

import {
  generateApiImpl
} from '@walmart/ern-api-impl-gen'
import Platform from '../../lib/Platform'

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
  }).option('outputFolder', {
    alias: 'o',
    describe: 'Path to output folder'
  })
}

exports.handler = async function ({
  api,
  nativeOnly,
  force,
  outputFolder
} : {
  api: string,
  nativeOnly: boolean,
  force: boolean,
  outputFolder: string
}) {
  console.log(`command identified for generating API implementation for  ${api}`)

  await generateApiImpl({
    api,
    outputFolder,
    nativeOnly,
    forceGenerate: force,
    platformPath: Platform.currentPlatformVersionPath,
    workingFolder: `${Platform.rootDirectory}/api-impl-gen`
  })
}
