import { getActiveCauldron } from 'ern-cauldron-api';
import { AppVersionDescriptor, kax, log } from 'ern-core';
import { runContainerPipeline } from './runContainerPipeline';

/**
 * Given a full native application descriptor and a local Container path,
 * run the Container pipeline configured for this descriptor
 */
export async function runContainerPipelineForDescriptor({
  descriptor,
  containerPath,
  containerVersion,
}: {
  descriptor: AppVersionDescriptor;
  containerPath: string;
  containerVersion: string;
}) {
  if (!descriptor.platform || !descriptor.version) {
    throw new Error('Can only work with a full native application descriptor');
  }

  const cauldron = await getActiveCauldron();

  const containerGenConfig = await kax
    .task('Getting pipeline configuration from Cauldron')
    .run(cauldron.getContainerGeneratorConfig(descriptor));

  const pipeline = containerGenConfig?.pipeline;
  if (!pipeline) {
    log.warn(`No pipeline configuration found for ${descriptor}`);
  } else {
    return runContainerPipeline({
      containerPath,
      containerVersion,
      pipeline,
      platform: descriptor.platform,
    });
  }
}
