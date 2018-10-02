import { utils as coreUtils, Platform, NativePlatform } from 'ern-core'
import { publishContainer } from 'ern-container-publisher'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied } from '../lib'
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
        'Optional extra publisher configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .epilog(epilog(exports))
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
    await logErrorAndExitIfNotSatisfied({
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

    const extraObj = extra && (await parseJsonFromStringOrFile(extra))

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
