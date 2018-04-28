import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'publisher'
export const desc =
  'Add a publisher url to publish the generated container/archive.'

export const builder = (argv: Argv) => {
  return argv
    .option('mavenUrl', {
      describe:
        'Maven url to publish the generated aar file for Android container.',
      type: 'string',
    })
    .option('githubUrl', {
      describe:
        'Github url to publish the generated framework project(if ios) or library project (if android)',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe:
        'A partial native application descriptor(NativeAppName:platform)',
      type: 'string',
    })
}

export const handler = async ({
  mavenUrl,
  githubUrl,
  descriptor,
}: {
  mavenUrl?: string
  githubUrl?: string
  descriptor?: string
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
    })

    let url = ''
    if (mavenUrl) {
      url = mavenUrl
    } else if (githubUrl) {
      url = githubUrl
    } else {
      throw new Error(
        'Please provide a publisher option (publisher --mavenUrl or --githubUrl)'
      )
    }

    log.debug(`Adding ${mavenUrl ? 'maven' : 'gitHub'}publisher: ${url}`)

    let napDescriptor
    if (descriptor) {
      napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    }

    if (mavenUrl && napDescriptor && napDescriptor.platform === 'ios') {
      throw new Error(
        'Maven publisher is only supported for android, you selected ios.'
      )
    }
    const publisherType = mavenUrl ? 'maven' : 'github'
    const cauldron = await getActiveCauldron()
    await cauldron.addPublisher(publisherType, url, napDescriptor)
    log.info(`${publisherType} publisher was successfully added!`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
