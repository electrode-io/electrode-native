// @flow

import {
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'publisher'
exports.desc = 'Add a publisher url to publish the generated container/archive.'

exports.builder = (yargs: any) => {
  return yargs
    .option('mavenUrl', {
      type: 'string',
      describe: 'Maven url to publish the generated aar file for Android container.'
    })
    .option('githubUrl', {
      type: 'string',
      describe: 'Github url to publish the generated framework project(if ios) or library project (if android)'
    })
    .option('descriptor', {
      type: 'string',
      alias: 'd',
      describe: 'A partial native application descriptor(NativeAppName:platform)'
    })
}

exports.handler = async function ({
                                    mavenUrl,
                                    githubUrl,
                                    descriptor
                                  }: {
  mavenUrl?: string,
  githubUrl?: string,
  descriptor?: string
}) {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage: 'A Cauldron must be active in order to use this command'
      }
    })

    let url = ''
    if (mavenUrl) {
      url = mavenUrl
    } else if (githubUrl) {
      url = githubUrl
    } else {
      throw new Error('Please provide a publisher option (publisher --mavenUrl or --githubUrl)')
    }

    log.debug(`Adding ${mavenUrl ? 'maven' : 'gitHub'}publisher: ${url}`)

    let napDescriptor
    if (descriptor) {
      napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    }

    if (mavenUrl && napDescriptor && napDescriptor.platform === 'ios') {
      throw new Error('Maven publisher is only supported for android, you selected ios.')
    }
    const publisherType = mavenUrl ? 'maven' : 'github'
    const cauldron = await coreUtils.getCauldronInstance()
    await cauldron.addPublisher(publisherType, url, napDescriptor)
    log.info(`${publisherType} publisher was successfully added!`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
