// @flow

import {
  generateMiniAppsComposite
} from 'ern-container-gen'
import {
  PackagePath,
  NativeApplicationDescriptor,
  spin,
  utils as coreUtils,
  Platform
} from 'ern-core'
import {
  runLocalContainerGen,
  runCauldronContainerGen
} from '../lib/publication'
import utils from '../lib/utils'
import * as constants from '../lib/constants'
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
    .option('jsApiImpls', {
      type: 'array',
      describe: 'A list of one or more JS API implementation'
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
    .option('outDir', {
      type: 'string',
      alias: 'out',
      describe: 'Directory to output the generated container to'
    })
    .option('ignoreRnpmAssets', {
      type: 'bool',
      describe: 'Ignore rnpm assets from the MiniApps'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor,
  jsOnly,
  outDir,
  miniapps,
  jsApiImpls = [],
  dependencies = [],
  platform,
  publicationUrl,
  ignoreRnpmAssets
} : {
  descriptor?: string,
  jsOnly?: boolean,
  outDir?: string,
  miniapps?: Array<string>,
  jsApiImpls: Array<string>,
  dependencies: Array<string>,
  platform?: 'android' | 'ios',
  publicationUrl?: string,
  ignoreRnpmAssets?: boolean
} = {}) {
  let napDescriptor: ?NativeApplicationDescriptor

  try {
    await utils.logErrorAndExitIfNotSatisfied({
      noGitOrFilesystemPath: {
        obj: dependencies,
        extraErrorMessage: 'You cannot provide dependencies using git or file scheme for this command. Only the form miniapp@version is allowed.'
      }
    })

    if ((dependencies.length > 0) && (jsOnly || descriptor)) {
      throw new Error(`You can only provide extra native dependencies, when generating a non-JS-only / non-Cauldron based container`)
    }

    const cauldron = await coreUtils.getCauldronInstance()
    if (!cauldron && !miniapps) {
      throw new Error('A Cauldron must be active, if you don\'t explicitly provide miniapps')
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
        message: 'Choose a non-released native application version for which to generate container',
        choices: result
      }])

      descriptor = userSelectedCompleteNapDescriptor
    }

    if (descriptor) {
      await utils.logErrorAndExitIfNotSatisfied({
        isCompleteNapDescriptorString: {descriptor},
        napDescriptorExistInCauldron: {
          descriptor,
          extraErrorMessage: 'You cannot create a container for a non-existing native application version.'
        }
      })

      napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    }

    let miniAppsPaths: Array<PackagePath> = _.map(miniapps, PackagePath.fromString)
    let jsApiImplsPaths: Array<PackagePath> = _.map(jsApiImpls, PackagePath.fromString)

    //
    // --jsOnly switch
    // Ony generates the composite miniapp to a provided output directory
    if (jsOnly) {
      if (!miniapps) {
        if (!napDescriptor) {
          return log.error('You need to provide a native application descriptor, if not providing miniapps')
        }
        miniAppsPaths = await cauldron.getContainerMiniApps(napDescriptor)
        jsApiImplsPaths = await cauldron.getContainerJsApiImpls(napDescriptor)
      }

      let pathToYarnLock
      if (napDescriptor) {
        pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor, constants.CONTAINER_YARN_KEY)
      }

      await generateMiniAppsComposite(
        miniAppsPaths,
        outDir || `${Platform.rootDirectory}/miniAppsComposite`,
        pathToYarnLock ? {pathToYarnLock} : {},
        jsApiImplsPaths)
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
          jsApiImplsPaths,
          platform, {
            outDir,
            extraNativeDependencies: _.map(dependencies, d => PackagePath.fromString(d)),
            ignoreRnpmAssets
          }
        ))
      } else if (napDescriptor) {
        await runCauldronContainerGen(
          napDescriptor,
          {outDir})
      }
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
