import { utils as coreUtils, Platform, NativePlatform } from 'ern-core'
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
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra transformer configuration (json string or path to config file)',
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
  extra,
  platform,
  transformer,
}: {
  containerPath?: string
  extra?: string
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

    const extraObj = extra && (await utils.parseJsonFromStringOrFile(extra))

    await transformContainer({
      containerPath,
      extra: extraObj,
      platform,
      transformer,
    })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
