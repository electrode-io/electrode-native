import { getActiveCauldron } from 'ern-cauldron-api'
import { NativeApplicationDescriptor, kax } from 'ern-core'
import { runContainerPipeline } from './runContainerPipeline'

/**
 * Given a full native application descriptor and a local Container path,
 * run the Container pipeline configured for this descriptor
 */
export async function runContainerPipelineForDescriptor({
  descriptor,
  containerPath,
  containerVersion,
}: {
  descriptor: NativeApplicationDescriptor
  containerPath: string
  containerVersion: string
}) {
  if (!descriptor.platform || !descriptor.version) {
    throw new Error('Can only work with a full native application descriptor')
  }

  const cauldron = await getActiveCauldron()

  const containerGenConfig = await kax
    .task('Getting pipeline configuration from Cauldron')
    .run(cauldron.getContainerGeneratorConfig(descriptor))

  const pipeline = containerGenConfig && containerGenConfig.pipeline
  if (!pipeline) {
    throw new Error(`No pipeline configuration found for ${descriptor}`)
  }

  return runContainerPipeline({
    containerPath,
    containerVersion,
    pipeline,
    platform: descriptor.platform,
  })
}
