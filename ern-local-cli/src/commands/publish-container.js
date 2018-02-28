// @flow

import {
  utils as coreUtils
} from 'ern-core'
import {
  MavenPublisher,
  GitHubPublisher,
  JcenterPublisher
} from 'ern-container-gen'
import utils from '../lib/utils'
import fs from 'fs'
import path from 'path'
import os from 'os'

exports.command = 'publish-container <containerPath>'
exports.desc = 'Publish a local Container'

exports.builder = function (yargs: any) {
  return yargs
    .option('version', {
      type: 'string',
      alias: 'v',
      describe: 'Container version to use for publication',
      default: '1.0.0'
    })
    .option('publisher', {
      type: 'string',
      alias: 'p',
      describe: 'The publisher type',
      choices: ['git', 'maven', 'jcenter'],
      demandOption: true
    })
    .option('url', {
      type: 'string',
      alias: 'u',
      describe: 'The publication url'
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
    await utils.logErrorAndExitIfNotSatisfied({
      isValidContainerVersion: { containerVersion: version }
    })

    // url validation
    if (!url && publisher === 'git') {
      throw new Error('url is required when using a git publisher')
    } else if (!url && publisher === 'maven') {
      url = `file:${path.join(os.homedir() || '', '.m2', 'repository')}`
    }

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

    switch (publisher) {
      case 'git':
        await new GitHubPublisher().publish({
          containerPath,
          containerVersion: version,
          url
        })
        break
      case 'maven':
        await new MavenPublisher().publish({
          containerPath,
          containerVersion: version,
          url,
          extra: config ? JSON.parse(config) : undefined
        })
        break
      case 'jcenter':
        await new JcenterPublisher().publish({
          containerPath,
          containerVersion: version,
          url: '', // jcenter does not require a url
          extra: config ? JSON.parse(config) : undefined
        })
        break
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
