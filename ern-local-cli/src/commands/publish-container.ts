import {
  utils as coreUtils,
  Platform,
  NativePlatform,
  fileUtils,
} from 'ern-core'
import { publishContainer } from 'ern-container-publisher'
import utils from '../lib/utils'
import fs from 'fs'
import path from 'path'
import { Argv } from 'yargs'

export const command = 'publish-container'
export const desc = 'Publish a local Container'

export const builder = (argv: Argv) => {
  return argv
    .option('version', {
      alias: 'v',
      default: '1.0.0',
      describe: 'Container version to use for publication',
      type: 'string',
    })
    .option('containerPath', {
      describe: 'Local path to the Container to publish',
      type: 'string',
    })
    .option('publisher', {
      alias: 'p',
      demandOption: true,
      describe: 'The publisher to use',
      type: 'string',
    })
    .option('platform', {
      choices: ['android', 'ios'],
      demandOption: true,
      describe: 'The native platform of the Container',
      type: 'string',
    })
    .option('url', {
      alias: 'u',
      describe: 'The publication url',
      type: 'string',
    })
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra publisher configuration (json string or path to config file)',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  containerPath,
  version,
  publisher,
  url,
  extra,
  platform,
}: {
  containerPath?: string
  version: string
  publisher: string
  url: string
  extra?: string
  platform: NativePlatform
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      isValidContainerVersion: { containerVersion: version },
    })

    if (!containerPath) {
      containerPath = path.join(
        Platform.rootDirectory,
        'containergen',
        'out',
        platform
      )
    }

    if (!fs.existsSync(containerPath)) {
      throw new Error('containerPath path does not exist')
    }

    let extraObj
    if (extra) {
      try {
        if (fs.existsSync(extra)) {
          extraObj = await fileUtils.readJSON(extra)
        } else {
          extraObj = JSON.parse(extra)
        }
      } catch (e) {
        throw new Error('config should be valid JSON')
      }
    }

    await publishContainer({
      containerPath,
      containerVersion: version,
      extra: extraObj,
      platform,
      publisher,
      url,
    })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
