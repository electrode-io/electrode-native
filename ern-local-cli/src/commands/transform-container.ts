import {
  Platform,
  NativeApplicationDescriptor,
  NativePlatform,
  log,
} from 'ern-core'
import { transformContainer } from 'ern-container-transformer'
import {
  parseJsonFromStringOrFile,
  runContainerTransformers,
} from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib'
import { Argv } from 'yargs'

export const command = 'transform-container'
export const desc = 'Transform a local Container'

export const builder = (argv: Argv) => {
  return argv
    .option('containerPath', {
      describe: 'Local path to the Container to transform',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descritor',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra transformer configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .option('platform', {
      alias: 'p',
      describe: 'Native platform of the Container',
      type: 'string',
    })
    .option('transformer', {
      alias: 't',
      describe: 'Transformer to use',
      type: 'string',
    })

    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerPath,
  descriptor,
  extra,
  platform,
  transformer,
}: {
  containerPath?: string
  descriptor?: NativeApplicationDescriptor
  extra?: string
  platform: NativePlatform
  transformer: string
}) => {
  if (!descriptor && !platform) {
    throw new Error('--platform is required if not using --descriptor')
  }
  if (!descriptor && !transformer) {
    throw new Error('--transformer is required if not using --descriptor')
  }

  if (descriptor) {
    platform = descriptor.platform!
  }

  containerPath =
    containerPath || Platform.getContainerGenOutDirectory(platform)

  await logErrorAndExitIfNotSatisfied({
    isContainerPath: {
      extraErrorMessage: `Make sure that ${containerPath} is the root of a Container project`,
      p: containerPath!,
    },
  })

  if (descriptor) {
    await runContainerTransformers({ napDescriptor: descriptor, containerPath })
  } else {
    const extraObj = extra && (await parseJsonFromStringOrFile(extra))

    await transformContainer({
      containerPath,
      extra: extraObj,
      platform,
      transformer,
    })
  }

  log.info('Container transformed successfully')
}

export const handler = tryCatchWrap(commandHandler)
