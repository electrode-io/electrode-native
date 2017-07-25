// @flow

import {Utils} from 'ern-util'

exports.command = 'container'
exports.desc = 'Run the container generator [DEPRECATED]'

exports.builder = function (yargs: any) {
  return yargs
    .option('completeNapDescriptor', {
      type: 'string',
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('containerVersion', {
      type: 'string',
      alias: 'v',
      describe: 'Version of the generated container'
    })
    .option('jsOnly', {
      type: 'bool',
      alias: 'js',
      describe: 'Generates JS only (composite app)'
    })
    .option('publish', {
      type: 'boolean',
      describe: 'Publish the generated container to Maven(.aar file for android) or GitHub (Project framework for ios)'
    })
    .option('publicationUrl', {
      type: 'string',
      describe: 'The url to publish cauldron to'
    })
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
    .option('platform', {
      type: 'string',
      alias: 'p',
      describe: 'The platform for which to generate the container',
      choices: ['android', 'ios', undefined]
    })
    .option('containerName', {
      type: 'string',
      describe: 'The name to user for the container (usually native application name)'
    })
    .group(['outputFolder'], 'jsOnly Options:')
    .option('outputFolder', {
      type: 'string',
      alias: 'out',
      describe: 'Output folder path'
    })
}

exports.handler = async function ({
  completeNapDescriptor,
  containerVersion,
  jsOnly,
  outputFolder,
  miniapps,
  publish,
  platform,
  containerName,
  publicationUrl
} : {
  completeNapDescriptor?: string,
  containerVersion?: string,
  publish?: boolean,
  jsOnly?: boolean,
  outputFolder?: string,
  miniapps?: Array<string>,
  platform?: 'android' | 'ios',
  containerName?: string,
  publicationUrl?: string
}) {
  Utils.logErrorAndExitProcess(`This command is deprecated, to create a container run the following command: ern create-container`)
}
