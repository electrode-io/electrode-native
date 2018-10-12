import { Platform, NativePlatform, log } from 'ern-core'
import { transformContainer } from 'ern-container-transformer'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'
import { epilog, tryCatchWrap } from '../lib'
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
        'Optional extra transformer configuration (json string or local/cauldron path to config file)',
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
    .epilog(epilog(exports))
}

export const commandHandler = async ({
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
  const extraObj = extra && (await parseJsonFromStringOrFile(extra))

  await transformContainer({
    containerPath:
      containerPath || Platform.getContainerGenOutDirectory(platform),
    extra: extraObj,
    platform,
    transformer,
  })
  log.info('Container transformed successfully')
}

export const handler = tryCatchWrap(commandHandler)
