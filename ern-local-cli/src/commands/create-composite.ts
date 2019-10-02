import { generateComposite } from 'ern-composite-gen'
import {
  PackagePath,
  AppVersionDescriptor,
  Platform,
  log,
  NativePlatform,
  kax,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
  askUserToChooseANapDescriptorFromCauldron,
} from '../lib'
import _ from 'lodash'
import { Argv } from 'yargs'
import fs from 'fs'
import path from 'path'
import untildify from 'untildify'

export const command = 'create-composite'
export const desc = 'Create a JS composite project locally'

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', d => PackagePath.fromString(d))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('extraJsDependencies', {
      alias: 'e',
      describe: 'Additional JS dependency(ies)',
      type: 'array',
    })
    .coerce('extraJsDependencies', d => d.map(PackagePath.fromString))
    .option('fromGitBranches', {
      describe: 'Favor MiniApp(s) branches',
      type: 'boolean',
    })
    .option('jsApiImpls', {
      describe: 'One or more JS API implementation(s)',
      type: 'array',
    })
    .coerce('jsApiImpls', d => d.map(PackagePath.fromString))
    .option('miniapps', {
      alias: 'm',
      describe: 'One or more MiniApp(s)',
      type: 'array',
    })
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .option('outDir', {
      alias: 'out',
      describe: 'Output directory',
      type: 'string',
    })
    .coerce('outDir', p => untildify(p))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  baseComposite,
  descriptor,
  extraJsDependencies,
  fromGitBranches,
  jsApiImpls,
  miniapps,
  outDir,
}: {
  baseComposite?: PackagePath
  descriptor?: AppVersionDescriptor
  extraJsDependencies?: PackagePath[]
  fromGitBranches?: boolean
  jsApiImpls?: PackagePath[]
  miniapps?: PackagePath[]
  outDir?: string
  platform?: NativePlatform
} = {}) => {
  if (outDir && fs.existsSync(outDir)) {
    if (fs.readdirSync(outDir).length > 0) {
      throw new Error(
        `${outDir} directory exists and is not empty.
Output directory should either not exist (it will be created) or should be empty.`
      )
    }
  }
  outDir = outDir || path.join(Platform.rootDirectory, 'miniAppsComposite')

  const cauldron = await getActiveCauldron({ throwIfNoActiveCauldron: false })
  if (!cauldron && !miniapps) {
    throw new Error(
      "A Cauldron must be active if you don't explicitly provide miniapps"
    )
  }

  // Full native application selector was not provided.
  // Ask the user to select a completeNapDescriptor from a list
  // containing all the native applications versions in the cauldron
  // Not needed if miniapps are directly provided
  if (!descriptor && !miniapps) {
    descriptor = await askUserToChooseANapDescriptorFromCauldron()
  }

  let pathToYarnLock
  let resolutions
  if (descriptor) {
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot create a composite for a non-existing native application version.',
      },
    })
    miniapps = await cauldron.getContainerMiniApps(descriptor, {
      favorGitBranches: !!fromGitBranches,
    })
    jsApiImpls = await cauldron.getContainerJsApiImpls(descriptor)
    const containerGenConfig = await cauldron.getContainerGeneratorConfig(
      descriptor
    )
    if (!containerGenConfig || !containerGenConfig.bypassYarnLock) {
      pathToYarnLock = await cauldron.getPathToYarnLock(descriptor, 'container')
    } else {
      log.debug(
        'Bypassing yarn.lock usage as bypassYarnLock flag is set in config'
      )
    }
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      descriptor
    )
    baseComposite =
      baseComposite || (compositeGenConfig && compositeGenConfig.baseComposite)
    resolutions = compositeGenConfig && compositeGenConfig.resolutions
  }

  await kax.task('Generating Composite').run(
    generateComposite({
      baseComposite,
      extraJsDependencies,
      jsApiImplDependencies: jsApiImpls,
      miniApps: miniapps!,
      outDir,
      pathToYarnLock,
      resolutions,
    })
  )

  log.info(`Composite successfully generated in ${outDir}`)
}

export const handler = tryCatchWrap(commandHandler)
