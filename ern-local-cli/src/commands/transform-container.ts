import {
  utils as coreUtils,
  Platform,
  NativePlatform,
  fileUtils,
} from 'ern-core'
import { transformContainer } from 'ern-container-transformer'
import utils from '../lib/utils'
import fs from 'fs'
import path from 'path'
import { Argv } from 'yargs'

export const command = 'transform-container'
export const desc = 'Transform a local Container'

export const builder = (argv: Argv) => {
  return argv
    .option('containerPath', {
      describe: 'Local path to the Container to transform',
      type: 'string',
    })
    .option('config', {
      alias: 'c',
      describe:
        'Optional transformer configuration (json string or path to config file)',
      type: 'string',
    })
    .option('platform', {
      alias: 'p',
      choices: ['android', 'ios'],
      demandOption: true,
      describe: 'Native platform of the Container',
      type: 'string',
    })
    .option('transformer', {
      alias: 't',
      demandOption: true,
      describe: 'Transformer to use',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  containerPath,
  config,
  platform,
  transformer,
}: {
  containerPath?: string
  config?: string
  platform: NativePlatform
  transformer: string
}) => {
  try {
    if (!containerPath) {
      containerPath = path.join(
        Platform.rootDirectory,
        'containergen',
        'out',
        platform
      )
    }

    if (!fs.existsSync(path.resolve(containerPath))) {
      throw new Error('containerPath path does not exist')
    }

    let configObj
    if (config) {
      try {
        if (fs.existsSync(config)) {
          configObj = await fileUtils.readJSON(config)
        } else {
          configObj = JSON.parse(config)
        }
      } catch (e) {
        throw new Error('config should be valid JSON')
      }
    }

    await transformContainer({
      containerPath,
      extra: configObj,
      platform,
      transformer,
    })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
