import { getActiveCauldron, cauldronFileUriScheme } from 'ern-cauldron-api'
import { log, NativeApplicationDescriptor, kax } from 'ern-core'
import { transformContainer } from 'ern-container-transformer'
import { parseJsonFromStringOrFile } from './parseJsonFromStringOrFile'

/**
 * Given a full Native Appplication Descriptor and a local Container path,
 * run all Container Transformers configured in Cauldron
 */
export async function runContainerTransformers({
  napDescriptor,
  containerPath,
}: {
  napDescriptor: NativeApplicationDescriptor
  containerPath: string
}) {
  if (!napDescriptor.platform || !napDescriptor.version) {
    throw new Error('Can only work with a full native application descriptor')
  }

  const cauldron = await getActiveCauldron()

  const containerGenConfig = await cauldron.getContainerGeneratorConfig(
    napDescriptor
  )

  const transformersFromCauldron =
    containerGenConfig && containerGenConfig.transformers

  for (const transformerFromCauldron of transformersFromCauldron || []) {
    if (transformerFromCauldron.disabled) {
      log.info(
        `Skipping Container Transformer ${
          transformerFromCauldron.name
        } (disabled=true)`
      )
      continue
    }
    let extra = transformerFromCauldron.extra
    if (
      extra &&
      typeof extra === 'string' &&
      extra.startsWith(cauldronFileUriScheme)
    ) {
      if (!(await cauldron.hasFile({ cauldronFilePath: extra }))) {
        throw new Error(
          `Cannot find transformer extra config file ${extra} in Cauldron`
        )
      }
      const extraFile = await cauldron.getFile({ cauldronFilePath: extra })
      extra = parseJsonFromStringOrFile(extraFile.toString())
    }
    await kax
      .task(`Running Container Transformer ${transformerFromCauldron.name}`)
      .run(
        transformContainer({
          containerPath,
          extra,
          platform: napDescriptor.platform,
          transformer: transformerFromCauldron.name,
        })
      )
  }
}
