import {
  NativeApplicationDescriptor,
  utils as coreUtils,
  log,
  fileUtils,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { getPublisher, ContainerPublisher } from 'ern-container-publisher'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'
import fs from 'fs'

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
        'Optional extra publisher configuration (json string or path to config file)',
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
  extra?: any
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    let extraObj
    if (extra) {
      try {
        if (fs.existsSync(extra)) {
          extraObj = await fileUtils.readJSON(extra)
        } else {
          extraObj = JSON.parse(extra)
        }
      } catch (e) {
        throw new Error('config should be valid JSON')
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

    const cauldron = await getActiveCauldron()
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
