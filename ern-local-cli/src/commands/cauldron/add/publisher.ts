import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron, cauldronFileUriScheme } from 'ern-cauldron-api'
import { getPublisher, ContainerPublisher } from 'ern-container-publisher'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'publisher'
export const desc = 'Add a Container publisher for a native application'

export const builder = (argv: Argv) => {
  return argv
    .option('publisher', {
      alias: 'p',
      demandOption: true,
      describe: 'The publisher to add',
      type: 'string',
    })
    .option('url', {
      alias: 'u',
      describe: 'The publication url (format is publisher specific)',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe:
        'A partial native application descriptor (NativeAppName:platform)',
      type: 'string',
    })
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra publisher configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
}

export const handler = async ({
  publisher,
  url,
  descriptor,
  extra,
}: {
  publisher: string
  descriptor: string
  url?: string
  extra?: string
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    const cauldron = await getActiveCauldron()

    let extraObj
    if (extra) {
      if (extra.startsWith(cauldronFileUriScheme)) {
        //
        // Cauldron file path.
        // In that case, the extra property set for this publisher
        // in Cauldron, will be a string, with its value being
        // the path to the json extra config file stored in
        // Cauldron.
        // For example :
        //  "extra": "cauldron://config/publishers/maven.json"

        // We just validate that the file exist in Cauldron ...
        if (!(await cauldron.hasFile({ cauldronFilePath: extra }))) {
          throw new Error(`File ${extra} does not exist in Cauldron.`)
        }
        // ... and that it is a properly formatted json file
        const cauldronFile = await cauldron.getFile({ cauldronFilePath: extra })
        await utils.parseJsonFromStringOrFile(cauldronFile.toString())
        extraObj = extra
      } else {
        // Local file path to json file or json string.
        // In that case, the extra property set for this publisher
        // in Cauldron, will be the the json string, or the
        // content of the json file, as such
        // For example :
        // "extra": {
        //   "artifactId": "app-container",
        //   "groupId": "com.company.app"
        // }
        extraObj = await utils.parseJsonFromStringOrFile(extra)
      }
    }

    const p: ContainerPublisher = await getPublisher(publisher)

    let napDescriptor
    if (descriptor) {
      napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
      if (!p.platforms.includes(napDescriptor.platform)) {
        throw new Error(
          `The ${p.name} publisher does not support ${
            napDescriptor.platform
          } platform`
        )
      }
    }

    await cauldron.addPublisher(
      publisher,
      p.platforms,
      napDescriptor,
      url,
      extraObj
    )
    log.info(`${publisher} publisher was successfully added!`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
