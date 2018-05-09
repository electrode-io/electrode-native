import { generateMiniAppsComposite } from 'ern-container-gen'
import {
  PackagePath,
  NativeApplicationDescriptor,
  spin,
  utils as coreUtils,
  Platform,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  runLocalContainerGen,
  runCauldronContainerGen,
} from '../lib/publication'
import utils from '../lib/utils'
import * as constants from '../lib/constants'
import _ from 'lodash'
import inquirer from 'inquirer'
import { Argv } from 'yargs'
import fs from 'fs'

export const command = 'create-container'
export const desc = 'Create a container locally'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .option('jsOnly', {
      alias: 'js',
      describe: 'Generates JS only (composite app)',
      type: 'boolean',
    })
    .option('miniapps', {
      alias: 'm',
      describe: 'A list of one or more miniapps',
      type: 'array',
    })
    .option('jsApiImpls', {
      describe: 'A list of one or more JS API implementation',
      type: 'array',
    })
    .option('dependencies', {
      alias: 'deps',
      describe:
        'A list of one or more extra native dependencies to include in this container',
      type: 'array',
    })
    .option('platform', {
      alias: 'p',
      choices: ['android', 'ios', undefined],
      describe: 'The platform for which to generate the container',
      type: 'string',
    })
    .option('outDir', {
      alias: 'out',
      describe: 'Directory to output the generated container to',
      type: 'string',
    })
    .option('ignoreRnpmAssets', {
      describe: 'Ignore rnpm assets from the MiniApps',
      type: 'boolean',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  jsOnly,
  outDir,
  miniapps,
  jsApiImpls = [],
  dependencies = [],
  platform,
  publicationUrl,
  ignoreRnpmAssets,
}: {
  descriptor?: string
  jsOnly?: boolean
  outDir?: string
  miniapps?: string[]
  jsApiImpls: string[]
  dependencies: string[]
  platform?: 'android' | 'ios'
  publicationUrl?: string
  ignoreRnpmAssets?: boolean
}) => {
  let napDescriptor: NativeApplicationDescriptor | void

  try {
    if (outDir && fs.existsSync(outDir)) {
      if (fs.readdirSync(outDir).length > 0) {
        throw new Error(
          `${outDir} directory exists and is not empty.
Output directory should either not exist (it will be created) or should be empty.`
        )
      }
    }

    await utils.logErrorAndExitIfNotSatisfied({
      noGitOrFilesystemPath: {
        extraErrorMessage:
          'You cannot provide dependencies using git or file scheme for this command. Only the form miniapp@version is allowed.',
        obj: dependencies,
      },
    })

    if (dependencies.length > 0 && (jsOnly || descriptor)) {
      throw new Error(
        `You can only provide extra native dependencies, when generating a non-JS-only / non-Cauldron based container`
      )
    }

    const cauldron = await getActiveCauldron()
    if (!cauldron && !miniapps) {
      throw new Error(
        "A Cauldron must be active, if you don't explicitly provide miniapps"
      )
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
      const result = _.filter(
        _.flattenDeep(
          _.map(nativeApps, nativeApp =>
            _.map(nativeApp.platforms, p =>
              _.map(p.versions, version => {
                if (!version.isReleased) {
                  return `${nativeApp.name}:${p.name}:${version.name}`
                }
              })
            )
          )
        ),
        elt => elt !== undefined
      )

      const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([
        <inquirer.Question>{
          choices: result,
          message:
            'Choose a non-released native application version for which to generate container',
          name: 'userSelectedCompleteNapDescriptor',
          type: 'list',
        },
      ])

      descriptor = userSelectedCompleteNapDescriptor
    }

    if (descriptor) {
      await utils.logErrorAndExitIfNotSatisfied({
        isCompleteNapDescriptorString: { descriptor },
        napDescriptorExistInCauldron: {
          descriptor,
          extraErrorMessage:
            'You cannot create a container for a non-existing native application version.',
        },
      })

      napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    }

    let miniAppsPaths: PackagePath[] = _.map(miniapps, PackagePath.fromString)
    let jsApiImplsPaths: PackagePath[] = _.map(
      jsApiImpls,
      PackagePath.fromString
    )

    //
    // --jsOnly switch
    // Ony generates the composite miniapp to a provided output directory
    if (jsOnly) {
      if (!miniapps) {
        if (!napDescriptor) {
          return log.error(
            'You need to provide a native application descriptor, if not providing miniapps'
          )
        }
        miniAppsPaths = await cauldron.getContainerMiniApps(napDescriptor)
        jsApiImplsPaths = await cauldron.getContainerJsApiImpls(napDescriptor)
      }

      let pathToYarnLock
      if (napDescriptor) {
        pathToYarnLock = await cauldron.getPathToYarnLock(
          napDescriptor,
          constants.CONTAINER_YARN_KEY
        )
      }

      await generateMiniAppsComposite(
        miniAppsPaths,
        outDir || `${Platform.rootDirectory}/miniAppsComposite`,
        pathToYarnLock ? { pathToYarnLock } : {},
        jsApiImplsPaths
      )
    } else {
      if (!napDescriptor && miniapps) {
        if (!platform) {
          const { userSelectedPlatform } = await inquirer.prompt([
            <inquirer.Question>{
              choices: ['android', 'ios'],
              message: 'Choose platform to generate container for',
              name: 'userSelectedPlatform',
              type: 'list',
            },
          ])

          platform = userSelectedPlatform
        }

        await spin(
          'Generating Container locally',
          runLocalContainerGen(miniAppsPaths, jsApiImplsPaths, platform, {
            extraNativeDependencies: _.map(dependencies, d =>
              PackagePath.fromString(d)
            ),
            ignoreRnpmAssets,
            outDir,
          })
        )
      } else if (napDescriptor) {
        await runCauldronContainerGen(napDescriptor, { outDir })
      }
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
