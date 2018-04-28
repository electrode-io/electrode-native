import { utils as coreUtils } from 'ern-core'
import {
  MavenPublisher,
  GitHubPublisher,
  JcenterPublisher,
} from 'ern-container-gen'
import utils from '../lib/utils'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { Argv } from 'yargs'

export const command = 'publish-container <containerPath>'
export const desc = 'Publish a local Container'

export const builder = (argv: Argv) => {
  return argv
    .option('version', {
      alias: 'v',
      default: '1.0.0',
      describe: 'Container version to use for publication',
      type: 'string',
    })
    .option('publisher', {
      alias: 'p',
      choices: ['git', 'maven', 'jcenter'],
      demandOption: true,
      describe: 'The publisher type',
      type: 'string',
    })
    .option('url', {
      alias: 'u',
      describe: 'The publication url',
      type: 'string',
    })
    .option('config', {
      alias: 'c',
      describe: 'Optional publisher configuration (as a JSON string)',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  containerPath,
  version,
  publisher,
  url,
  config,
}: {
  containerPath: string
  version: string
  publisher: string
  url: string
  config?: string
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      isValidContainerVersion: { containerVersion: version },
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
          url,
        })
        break
      case 'maven':
        await new MavenPublisher().publish({
          containerPath,
          containerVersion: version,
          extra: config ? JSON.parse(config) : undefined,
          url,
        })
        break
      case 'jcenter':
        await new JcenterPublisher().publish({
          containerPath,
          containerVersion: version,
          extra: config ? JSON.parse(config) : undefined,
          url: '', // jcenter does not require a url
        })
        break
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
