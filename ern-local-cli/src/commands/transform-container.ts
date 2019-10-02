import { PackagePath, Platform, NativePlatform, log } from 'ern-core'
import { transformContainer } from 'ern-container-transformer'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib'
import { Argv } from 'yargs'
import untildify from 'untildify'

export const command = 'transform-container'
export const desc = 'Transform a local Container'

export const builder = (argv: Argv) => {
  return argv
    .option('containerPath', {
      describe: 'Local path to the Container to transform',
      type: 'string',
    })
    .coerce('untildify', p => untildify(p))
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
    .coerce('transformer', PackagePath.fromString)
    .epilog(epilog(exports))
}

const transformerPackagePrefix = 'ern-container-transformer-'

export const commandHandler = async ({
  containerPath,
  extra,
  platform,
  transformer,
}: {
  containerPath?: string
  extra?: string
  platform: NativePlatform
  transformer: PackagePath
}) => {
  containerPath =
    containerPath || Platform.getContainerGenOutDirectory(platform)

  await logErrorAndExitIfNotSatisfied({
    isContainerPath: {
      extraErrorMessage: `Make sure that ${containerPath} is the root of a Container project`,
      p: containerPath!,
    },
  })

  const extraObj = extra && (await parseJsonFromStringOrFile(extra))

  if (
    transformer.isRegistryPath &&
    !transformer.basePath.startsWith(transformerPackagePrefix)
  ) {
    transformer = transformer.version
      ? PackagePath.fromString(
          `${transformerPackagePrefix}${transformer.basePath}@${
            transformer.version
          }`
        )
      : PackagePath.fromString(
          `${transformerPackagePrefix}${transformer.basePath}`
        )
  }

  await transformContainer({
    containerPath,
    extra: extraObj,
    platform,
    transformer,
  })

  log.info('Container transformed successfully')
}

export const handler = tryCatchWrap(commandHandler)
