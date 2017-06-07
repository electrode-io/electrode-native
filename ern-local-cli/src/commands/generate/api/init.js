// @flow

import {
  generateApi
} from '@walmart/ern-api-gen'
import {
  Platform
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
    describe: `Author of library`
  }).demandCommand(1, 'Must have an apiName')
}

exports.handler = async function (argv: any) {
  const bridgeDep = Platform.getPlugin('@walmart/react-native-electrode-bridge')
  const reactNative = Platform.getPlugin('react-native')

  await generateApi({
    bridgeVersion: `${bridgeDep.version}`,
    reactNativeVersion: reactNative.version,
    name: argv.apiName,
    npmScope: argv.scope,
    modelSchemaPath: argv.modelSchemaPath,
    apiVersion: argv.apiVersion,
    apiAuthor: argv.apiAuthor
  })
}
