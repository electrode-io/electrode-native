import { utils as coreUtils, Platform, NativePlatform, log } from 'ern-core'
import { publishContainer } from 'ern-container-publisher'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied } from '../lib'
import { Argv } from 'yargs'

export const command = 'publish-container'
export const desc = 'Publish a local Container'

export const builder = (argv: Argv) => {
  return argv
    .option('containerPath', {
      describe: 'Local path to the Container to publish',
      type: 'string',
    })
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra publisher configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .option('platform', {
      choices: ['android', 'ios'],
      demandOption: true,
      describe: 'The native platform of the Container',
      type: 'string',
    })
    .option('publisher', {
      alias: 'p',
      demandOption: true,
      describe: 'The publisher to use',
      type: 'string',
    })
    .option('url', {
      alias: 'u',
      describe: 'The publication url',
      type: 'string',
    })
    .option('version', {
      alias: 'v',
      default: '1.0.0',
      describe: 'Container version to use for publication',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  containerPath,
  extra,
  platform,
  publisher,
  url,
  version,
}: {
  containerPath?: string
  extra?: string
  platform: NativePlatform
  publisher: string
  url: string
  version: string
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
      isValidContainerVersion: { containerVersion: version },
    })

    const extraObj = extra && (await parseJsonFromStringOrFile(extra))

    await publishContainer({
      containerPath:
        containerPath || Platform.getContainerGenOutDirectory(platform),
      containerVersion: version,
      extra: extraObj,
      platform,
      publisher,
      url,
    })
    log.info('Container published successfully')
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
