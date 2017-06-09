// @flow

import {
  generateMiniAppsComposite
} from '@walmart/ern-container-gen'
import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  runLocalContainerGen,
  runCauldronContainerGen
} from '../../lib/publication'
import _ from 'lodash'
import cauldron from '../../lib/cauldron'
import inquirer from 'inquirer'

exports.command = 'container'
exports.desc = 'Run the container generator'

exports.builder = function (yargs: any) {
  return yargs
    .option('completeNapDescriptor', {
      type: 'string',
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('containerVersion', {
      type: 'string',
      alias: 'v',
      describe: 'Version of the generated container'
    })
    .option('jsOnly', {
      type: 'bool',
      alias: 'js',
      describe: 'Generates JS only (composite app)'
    })
    .option('disablePublication', {
      type: 'boolean',
      alias: 'dontPublish',
      describe: 'Do not publish container to Maven or GitHub (just generate it)'
    })
    .option('publicationUrl', {
      type: 'string',
      describe: 'The url to publish cauldron to'
    })
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
    .option('platform', {
      type: 'string',
      alias: 'p',
      describe: 'The platform for which to generate the container',
      choices: ['android', 'ios']
    })
    .option('containerName', {
      type: 'string',
      describe: 'The name to user for the container (usually native application name)'
    })
    .group(['outputFolder'], 'jsOnly Options:')
    .option('outputFolder', {
      type: 'string',
      alias: 'out',
      describe: 'Output folder path'
    })
}

exports.handler = async function ({
  completeNapDescriptor,
  containerVersion,
  jsOnly,
  outputFolder,
  miniapps,
  disablePublication,
  platform,
  containerName,
  publicationUrl
} : {
  completeNapDescriptor?: string,
  containerVersion?: string,
  disablePublication?: boolean,
  jsOnly?: boolean,
  outputFolder?: string,
  miniapps?: Array<string>,
  platform?: 'android' | 'ios',
  containerName?: string,
  publicationUrl?: string
}) {
  let napDescriptor: ?NativeApplicationDescriptor

  //
  // Full native application selector was not provided.
  // Ask the user to select a completeNapDescriptor from a list
  // containing all the native applications versions in the cauldron
  // Not needed if miniapps are directly provided
  if (!completeNapDescriptor && !miniapps) {
    const nativeApps = await cauldron.getAllNativeApps()

    // Transform native apps from the cauldron to an Array
    // of completeNapDescriptor strings
    // [Should probably move to a Cauldron util class for reusability]
    let result = _.flattenDeep(
                  _.map(nativeApps, nativeApp =>
                    _.map(nativeApp.platforms, platform =>
                      _.map(platform.versions, version =>
                       `${nativeApp.name}:${platform.name}:${version.name}`))))

    const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([{
      type: 'list',
      name: 'userSelectedCompleteNapDescriptor',
      message: 'Choose a native application version for which to generate container',
      choices: result
    }])

    completeNapDescriptor = userSelectedCompleteNapDescriptor
  }

  if (completeNapDescriptor) {
    napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  }

  //
  // If the user wants to generates a complete container (not --jsOnly)
  // user has to provide a container version
  // If not specified in command line, we ask user to input the version
  if (!containerVersion && !jsOnly) {
    const { userSelectedContainerVersion } = await inquirer.prompt([{
      type: 'input',
      name: 'userSelectedContainerVersion',
      message: 'Enter version for the generated container'
    }])

    containerVersion = userSelectedContainerVersion
  }

  //
  // --jsOnly switch
  // Ony generates the composite miniapp to a provided output folder
  if (jsOnly) {
    if (!miniapps) {
      if (!napDescriptor) {
        return log.error('You need to provide a napDescriptor if not providing miniapps')
      }
      miniapps = await cauldron.getContainerMiniApps(napDescriptor)
    }

    if (!outputFolder) {
      const { userSelectedOutputFolder } = await inquirer.prompt([{
        type: 'input',
        name: 'userSelectedOutputFolder',
        message: 'Enter output folder path'
      }])

      outputFolder = userSelectedOutputFolder
    }

    await generateMiniAppsComposite(miniapps, outputFolder)
  } else {
    if (!napDescriptor && miniapps) {
      if (!platform) {
        const { userSelectedPlatform } = await inquirer.prompt([{
          type: 'list',
          name: 'userSelectedPlatform',
          message: 'Choose platform to generate container for',
          choices: ['android', 'ios']
        }])

        platform = userSelectedPlatform
      }

      await runLocalContainerGen(
        miniapps,
        platform, {
          containerVersion,
          nativeAppName: containerName,
          publicationUrl
        }
      )
    } else if (napDescriptor && containerVersion) {
      await runCauldronContainerGen(
      napDescriptor,
      containerVersion,
      { disablePublication })
    }
  }
}
