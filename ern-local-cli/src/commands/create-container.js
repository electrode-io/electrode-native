// @flow

import {
  generateMiniAppsComposite
} from 'ern-container-gen'
import {
  cauldron,
  Platform
} from 'ern-core'
import {
  DependencyPath,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  runLocalContainerGen,
  runCauldronContainerGen
} from '../lib/publication'
import _ from 'lodash'
import inquirer from 'inquirer'

exports.command = 'create-container'
exports.desc = 'Create a container locally'

exports.builder = function (yargs: any) {
  return yargs
    .option('completeNapDescriptor', {
      type: 'string',
      alias: 'n',
      describe: 'Full native application selector'
    })
    .option('version', {
      type: 'string',
      alias: 'v',
      describe: 'Version of the generated container. Default to 1.0.0'
    })
    .option('jsOnly', {
      type: 'bool',
      alias: 'js',
      describe: 'Generates JS only (composite app)'
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
      choices: ['android', 'ios', undefined]
    })
    .option('containerName', {
      type: 'string',
      describe: 'The name to user for the container (usually native application name)'
    })
    .option('outDir', {
      type: 'string',
      alias: 'out',
      describe: 'Directory to output the generated container to'
    })
}

exports.handler = async function ({
  completeNapDescriptor,
  version = '1.0.0',
  jsOnly,
  outDir,
  miniapps,
  platform,
  containerName,
  publicationUrl
} : {
  completeNapDescriptor?: string,
  version: string,
  jsOnly?: boolean,
  outDir?: string,
  miniapps?: Array<string>,
  platform?: 'android' | 'ios',
  containerName?: string,
  publicationUrl?: string
}) {
  let napDescriptor: ?NativeApplicationDescriptor

  ensureValidContainerVersion(version)

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
    let result =
    _.filter(
      _.flattenDeep(
        _.map(nativeApps, nativeApp =>
          _.map(nativeApp.platforms, p =>
            _.map(p.versions, version => {
              if (!version.isReleased) {
                return `${nativeApp.name}:${p.name}:${version.name}`
              }
            })))), elt => elt !== undefined)

    const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([{
      type: 'list',
      name: 'userSelectedCompleteNapDescriptor',
      message: 'Choose a non released native application version for which to generate container',
      choices: result
    }])

    completeNapDescriptor = userSelectedCompleteNapDescriptor
  }

  if (completeNapDescriptor) {
    napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  }

  let miniAppsPaths: Array<DependencyPath> = _.map(miniapps, DependencyPath.fromString)

  //
  // --jsOnly switch
  // Ony generates the composite miniapp to a provided output folder
  if (jsOnly) {
    if (!miniapps) {
      if (!napDescriptor) {
        return log.error('You need to provide a napDescriptor if not providing miniapps')
      }
      const miniAppsObjs = await cauldron.getContainerMiniApps(napDescriptor)
      miniAppsPaths = _.map(miniAppsObjs, m => DependencyPath.fromString(m.toString()))
    }

    let pathToYarnLock
    if (napDescriptor) {
      pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor)
    }

    await generateMiniAppsComposite(miniAppsPaths, outDir || `${Platform.rootDirectory}/miniAppsComposite`, {pathToYarnLock})
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
        miniAppsPaths,
        platform, {
          containerVersion: version,
          nativeAppName: containerName,
          outDir
        }
      )
    } else if (napDescriptor && version) {
      await runCauldronContainerGen(
        napDescriptor,
        version,
        { publish: false, outDir })
    }
  }
}

function ensureValidContainerVersion (version: string) {
  if ((/^\d+.\d+.\d+$/.test(version) === false) && (version !== 'auto')) {
    throw new Error(`Invalid version (${version}) for container. Please use a valid version in the form x.y.z`)
  }
}
