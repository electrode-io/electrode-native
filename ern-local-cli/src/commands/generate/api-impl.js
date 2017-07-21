// @flow

import {
  Utils
} from '@walmart/ern-util'

exports.command = 'api-impl <api>'
exports.desc = 'Commands to generate API implementation skeleton. [DEPRECATED]'

exports.builder = function (yargs: any) {
  return yargs.option('api', {
    type: 'string',
    describe: `npm package name OR the git location of the api f OR the file path for which an implementation needs to be generated.`
  }).option('nativeOnly', {
    alias: 'n',
    type: 'bool',
    describe: 'Generate native projects with proper dependencies (Implementation of the API has to be written in native'
  }).option('jsOnly', {
    alias: 'j',
    type: 'bool',
    describe: 'Generate js project with proper dependencies (Implementation of the API has to be written in js'
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
  jsOnly,
  force,
  outputFolder
} : {
  api: string,
  nativeOnly: boolean,
  jsOnly: boolean,
  force: boolean,
  outputFolder: string,
}) {
  Utils.logErrorAndExitProcess(`This command is deprecated: to create an api implementation use: ern create-api-impl ${api}`)
}
