import { getActiveCauldron, cauldronFileUriScheme } from 'ern-cauldron-api'
import { NativeApplicationDescriptor, kax, log } from 'ern-core'
import { publishContainer } from 'ern-container-publisher'
import { parseJsonFromStringOrFile } from './parseJsonFromStringOrFile'
import { getDefaultExtraConfigurationOfPublisherFromCauldron } from './getDefaultExtraConfigurationOfPublisherFromCauldron'

/**
 * Given a full Native Appplication Descriptor and a local Container path,
 * run all Container Publishers configured in Cauldron
 */
export async function runContainerPublishers({
  napDescriptor,
  containerPath,
  containerVersion,
}: {
  napDescriptor: NativeApplicationDescriptor
  containerPath: string
  containerVersion: string
}) {
  if (!napDescriptor.platform || !napDescriptor.version) {
    throw new Error('Can only work with a full native application descriptor')
  }

  const cauldron = await getActiveCauldron()

  const containerGenConfig = await cauldron.getContainerGeneratorConfig(
    napDescriptor
  )

  const publishersFromCauldron =
    containerGenConfig && containerGenConfig.publishers
  if (publishersFromCauldron) {
    for (const publisherFromCauldron of publishersFromCauldron || []) {
      let extra = publisherFromCauldron.extra
      if (!extra) {
        extra = getDefaultExtraConfigurationOfPublisherFromCauldron({
          napDescriptor,
          publisherFromCauldron,
        })
      } else if (
        typeof extra === 'string' &&
        extra.startsWith(cauldronFileUriScheme)
      ) {
        if (!(await cauldron.hasFile({ cauldronFilePath: extra }))) {
          throw new Error(
            'Cannot find publisher extra config file ${extra} in Cauldron'
          )
        }
        const extraFile = await cauldron.getFile({ cauldronFilePath: extra })
        extra = parseJsonFromStringOrFile(extraFile.toString())
      }

      // ==================================================================
      // Legacy code. To be deprecated
      let publisherName = publisherFromCauldron.name
      if (publisherName === 'github') {
        log.warn(
          `Your Cauldron is using the 'github' publisher which has been deprecated.
Please rename 'github' publisher name to 'git' in your Cauldron to get rid of this warning.`
        )
        publisherName = 'git'
      }
      // ==================================================================

      await kax.task(`Running Container Publisher ${publisherName}`).run(
        publishContainer({
          containerPath,
          containerVersion,
          extra,
          platform: napDescriptor.platform,
          publisher: publisherName,
          url: publisherFromCauldron.url,
        })
      )
    }
    log.info(
      `Published new Container version ${containerVersion} for ${napDescriptor.toString()}`
    )
  }
}
