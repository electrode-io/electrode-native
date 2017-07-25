// @flow

import {
  Utils
} from 'ern-util'

exports.command = 'init <apiName>'
exports.desc = 'Creates a new api [DEPRECATED]'

exports.builder = function (yargs: any) {
  return yargs.option('swagger', {
    alias: 's',
    describe: 'Path to swagger'
  }).option('scope', {
    alias: 'n',
    describe: 'NPM scope of project'
  }).option('apiVersion', {
    alias: 'a',
    describe: 'Initial npm version'
  }).option('apiAuthor', {
    alias: 'u',
    describe: 'Author of library'
  }).option('modelSchemaPath', {
    alias: 'm',
    describe: 'Path to model schema'
  })
}

exports.handler = async function ({
  apiName,
  swagger,
  scope,
  apiVersion,
  apiAuthor,
  modelSchemaPath
} : {
  apiName: string,
  swagger?: string,
  scope?: string,
  apiVersion?: string,
  apiAuthor?: string,
  modelSchemaPath?: string
}) {
  Utils.logErrorAndExitProcess(`This command is deprecated. To create an API, run the following command: ern create-api ${apiName}`)
}
