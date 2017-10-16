// @flow

import {
  generateMiniAppsComposite
} from 'ern-container-gen'
import {
  cauldron,
  Platform
} from 'ern-core'
import {
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor,
  spin
} from 'ern-util'
import {
  runLocalContainerGen,
  runCauldronContainerGen
} from '../lib/publication'
import utils from '../lib/utils'
import _ from 'lodash'
import inquirer from 'inquirer'

exports.command = 'create-container'
exports.desc = 'Create a container locally'

exports.builder = function (yargs: any) {
  return yargs
    .option('descriptor', {
      type: 'string',
      alias: 'd',
      describe: 'Full native application descriptor'
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
    .option('dependencies', {
      type: 'array',
      alias: 'deps',
      describe: 'A list of one or more extra native dependencies to include in this container'
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
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor,
  version = '1.0.0',
  jsOnly,
  outDir,
  miniapps,
  dependencies = [],
  platform,
  containerName,
  publicationUrl
} : {
  descriptor?: string,
  version: string,
  jsOnly?: boolean,
  outDir?: string,
  miniapps?: Array<string>,
  dependencies: Array<string>,
  platform?: 'android' | 'ios',
  containerName?: string,
  publicationUrl?: string
} = {}) {
  let napDescriptor: ?NativeApplicationDescriptor

  await utils.logErrorAndExitIfNotSatisfied({
    isValidContainerVersion: version ? {containerVersion: version} : undefined,
    noGitOrFilesystemPath: {
      obj: dependencies,
      extraErrorMessage: 'You cannot provide dependencies using git or file schme for this command. Only the form miniapp@version is allowed.'
    }
  })

  if ((dependencies.length > 0) && (jsOnly || descriptor)) {
    return log.error(`You can only provide extra native dependencies when generating a non JS only / non Cauldron based container`)
  }

  //
  // Full native application selector was not provided.
  // Ask the user to select a completeNapDescriptor from a list
  // containing all the native applications versions in the cauldron
  // Not needed if miniapps are directly provided
  if (!descriptor && !miniapps) {
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

    const {userSelectedCompleteNapDescriptor} = await inquirer.prompt([{
      type: 'list',
      name: 'userSelectedCompleteNapDescriptor',
      message: 'Choose a non released native application version for which to generate container',
      choices: result
    }])

    descriptor = userSelectedCompleteNapDescriptor
  }

  if (descriptor) {
    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: {descriptor},
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'You cannot create a container for a non existin native application version.'
      }
    })

    napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
  }

  let miniAppsPaths: Array<DependencyPath> = _.map(miniapps, DependencyPath.fromString)
  //
  // --jsOnly switch
  // Ony generates the composite miniapp to a provided output directory
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

    await generateMiniAppsComposite(
      miniAppsPaths,
      outDir || `${Platform.rootDirectory}/miniAppsComposite`,
      pathToYarnLock ? {pathToYarnLock} : {})
  } else {
    if (!napDescriptor && miniapps) {
      if (!platform) {
        const {userSelectedPlatform} = await inquirer.prompt([{
          type: 'list',
          name: 'userSelectedPlatform',
          message: 'Choose platform to generate container for',
          choices: ['android', 'ios']
        }])

        platform = userSelectedPlatform
      }

      await spin('Generating Container locally', runLocalContainerGen(
        miniAppsPaths,
        platform, {
          version,
          nativeAppName: containerName,
          outDir,
          extraNativeDependencies: _.map(dependencies, d => Dependency.fromString(d))
        }
      ))
    } else if (napDescriptor && version) {
      await runCauldronContainerGen(
        napDescriptor,
        version,
        {publish: false, outDir})
    }
  }
}
