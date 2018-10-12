import { NativeApplicationDescriptor, log } from 'ern-core'
import { getActiveCauldron, cauldronFileUriScheme } from 'ern-cauldron-api'
import { parseJsonFromStringOrFile } from 'ern-orchestrator'
import { getPublisher, ContainerPublisher } from 'ern-container-publisher'
import { epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'publisher'
export const desc = 'Add a Container publisher for a native application'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      alias: 'd',
      describe:
        'A partial native application descriptor (NativeAppName:platform)',
      type: 'string',
    })
    .coerce('descriptor', NativeApplicationDescriptor.fromString)
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra publisher configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
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
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
  extra,
  publisher,
  url,
}: {
  descriptor: NativeApplicationDescriptor
  extra?: string
  publisher: string
  url?: string
}) => {
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
      await parseJsonFromStringOrFile(cauldronFile.toString())
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
      extraObj = await parseJsonFromStringOrFile(extra)
    }
  }

  const p: ContainerPublisher = await getPublisher(publisher)

  if (descriptor && !p.platforms.includes(descriptor.platform!)) {
    throw new Error(
      `The ${p.name} publisher does not support ${descriptor.platform} platform`
    )
  }

  await cauldron.addPublisher(publisher, p.platforms, descriptor, url, extraObj)
  log.info(`${publisher} publisher successfully added to ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)
