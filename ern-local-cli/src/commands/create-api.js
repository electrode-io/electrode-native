// @flow

import {
  generateApi
} from '@walmart/ern-api-gen'
import {
  Manifest
} from '@walmart/ern-core'

exports.command = 'create-api <apiName>'
exports.desc = 'Create a new api'

exports.builder = function (yargs: any) {
  return yargs.option('scope', {
    alias: 'n',
    describe: 'NPM scope of project'
  }).option('apiVersion', {
    alias: 'a',
    describe: 'Initial npm version'
  }).option('apiAuthor', {
    alias: 'u',
    describe: 'Author of library'
  }).option('schemaPath', {
    alias: 'm',
    describe: 'Path to schema(swagger)'
  })
}

exports.handler = async function ({
  apiName,
  scope,
  apiVersion,
  apiAuthor,
  schemaPath
} : {
  apiName: string,
  scope?: string,
  apiVersion?: string,
  apiAuthor?: string,
  schemaPath?: string
}) {
  const bridgeDep = await Manifest.getPlugin('@walmart/react-native-electrode-bridge')
  if (!bridgeDep) {
    return log.error(`@walmart/react-native-electrode-bridge not found in manifest. cannot infer version to use`)
  }

  const reactNative = await Manifest.getPlugin('react-native')
  if (!reactNative) {
    return log.error(`react-native not found in manifest. cannot infer version to use`)
  }

  log.info(`Generating ${apiName} api`)
  generateApi({
    bridgeVersion: `${bridgeDep.version}`,
    reactNativeVersion: reactNative.version,
    name: apiName,
    npmScope: scope,
    modelSchemaPath: schemaPath,
    apiVersion: apiVersion,
    apiAuthor: apiAuthor
  }).then(() => {
    log.info(`Done!`)
  })
}
