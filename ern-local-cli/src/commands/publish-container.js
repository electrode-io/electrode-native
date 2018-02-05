// @flow

import {
  utils as coreUtils
} from 'ern-core'
import {
  MavenPublisher,
  GitHubPublisher
} from 'ern-container-gen'
import utils from '../lib/utils'
import fs from 'fs'

exports.command = 'publish-container <containerPath>'
exports.desc = 'Publish a local Container'

exports.builder = function (yargs: any) {
  return yargs
    .option('version', {
      type: 'string',
      alias: 'v',
      describe: 'Container version to use for publication',
      demandOption: true
    })
    .option('publisher', {
      type: 'string',
      alias: 'p',
      describe: 'The publisher type',
      choices: ['git', 'maven'],
      demandOption: true
    })
    .option('url', {
      type: 'string',
      alias: 'u',
      describe: 'The publication url',
      demandOption: true
    })
    .option('config', {
      type: 'string',
      alias: 'c',
      describe: 'Optional publisher configuration (as a JSON string)'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  containerPath,
  version,
  publisher,
  url,
  config
} : {
  containerPath: string,
  version: string,
  publisher: string,
  url: string,
  config?: string
} = {}) {
  try {
    console.log('here')
    await utils.logErrorAndExitIfNotSatisfied({
      isValidContainerVersion: { containerVersion: version }
    })

    // Container path validation
    if (!fs.existsSync(containerPath)) {
      throw new Error('containerPath path does not exist')
    }

    // JSON config validation
    if (config) {
      try {
        JSON.parse(config)
      } catch (e) {
        throw new Error('config should be valid JSON')
      }
    }

    // Publisher validation
    if (!['maven', 'git'].includes(publisher)) {
      throw new Error('publisher can only be either maven or git')
    }

    if (publisher === 'git') {
      await new GitHubPublisher().publish({
        containerPath,
        containerVersion: version,
        url
      })
    } else if (publisher === 'maven') {
      await new MavenPublisher().publish({
        containerPath,
        containerVersion: version,
        url,
        extra: config ? JSON.parse(config) : undefined
      })
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
