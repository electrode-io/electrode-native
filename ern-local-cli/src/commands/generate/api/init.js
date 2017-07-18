// @flow

import {
  Manifest
} from '@walmart/ern-core'
import {
  Utils
} from '@walmart/ern-util'

exports.command = 'init <apiName>'
exports.desc = 'Creates a new api'

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
  const bridgeDep = await Manifest.getPlugin('@walmart/react-native-electrode-bridge')
  if (!bridgeDep) {
    return log.error(`@walmart/react-native-electrode-bridge not found in manifest. cannot infer version to use`)
  }

  const reactNative = await Manifest.getPlugin('react-native')
  if (!reactNative) {
    return log.error(`react-native not found in manifest. cannot infer version to use`)
  }

  Utils.logErrorAndExitProcess(`This command is deprecated. To create an API, run the following command: ern create api ${apiName}`)
}
