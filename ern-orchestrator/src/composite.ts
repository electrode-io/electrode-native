import { Composite } from 'ern-composite-gen'
import {
  createTmpDir,
  PackagePath,
  NativeApplicationDescriptor,
  log,
  kax,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import _ from 'lodash'
import * as constants from './constants'
import * as lockfile from '@yarnpkg/lockfile'
import fs from 'fs'
import path from 'path'

export async function runLocalCompositeGen(
  miniappPackagesPaths: PackagePath[],
  {
    baseComposite,
    jsApiImpls,
    outDir,
  }: {
    baseComposite?: PackagePath
    jsApiImpls?: PackagePath[]
    outDir?: string
  }
): Promise<Composite> {
  try {
    const composite = await kax.task('Generating Composite').run(
      Composite.generate({
        baseComposite,
        jsApiImplDependencies: jsApiImpls,
        miniApps: miniappPackagesPaths,
        outDir: outDir || createTmpDir(),
      })
    )

    await validateCompositeNativeDependencies(composite)

    return composite
  } catch (e) {
    log.error(`runLocalCompositeGen failed: ${e}`)
    throw e
  }
}

// Run container generator using the Cauldron, given a native application descriptor
export async function runCauldronCompositeGen(
  napDescriptor: NativeApplicationDescriptor,
  {
    baseComposite,
    outDir,
    favorGitBranches,
  }: {
    baseComposite?: PackagePath
    outDir?: string
    favorGitBranches?: boolean
  } = {}
): Promise<Composite> {
  try {
    const cauldron = await getActiveCauldron()
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      napDescriptor
    )
    baseComposite =
      baseComposite || (compositeGenConfig && compositeGenConfig.baseComposite)
    const miniapps = await cauldron.getContainerMiniApps(napDescriptor, {
      favorGitBranches,
    })
    const jsApiImpls = await cauldron.getContainerJsApiImpls(napDescriptor)

    // bypassYarnLock to move into compositeGen config
    const containerGenConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor
    )
    let pathToYarnLock

    if (!containerGenConfig || !containerGenConfig.bypassYarnLock) {
      pathToYarnLock = await cauldron.getPathToYarnLock(
        napDescriptor,
        constants.CONTAINER_YARN_KEY
      )
    } else {
      log.debug(
        'Bypassing yarn.lock usage as bypassYarnLock flag is set in Cauldron config'
      )
    }

    const composite = await kax.task('Generating Composite').run(
      Composite.generate({
        baseComposite,
        jsApiImplDependencies: jsApiImpls,
        miniApps: miniapps,
        outDir: outDir || createTmpDir(),
        pathToYarnLock,
      })
    )

    await validateCompositeNativeDependencies(composite)

    return composite
  } catch (e) {
    log.error(`runCauldronCompositeGen failed: ${e}`)
    throw e
  }
}

export async function validateCompositeNativeDependencies(
  composite: Composite
) {
  // Validate composite native dependencies
  const resolution = await composite.getResolvedNativeDependencies()
  if (resolution.pluginsWithMismatchingVersions.length > 0) {
    throw new Error(`The following plugins are not using compatible versions : 
     ${resolution.pluginsWithMismatchingVersions.toString()}`)
  }
  try {
    await logResolvedDependencies(composite, resolution.resolved)
    if (resolution.pluginsWithMismatchingVersions.length > 0) {
      await logMismatchingDependencies(
        composite,
        resolution.pluginsWithMismatchingVersions
      )
    }
  } catch (e) {
    log.error(e)
  }
}

const getTopLevelEntriesMatching = (json, dep: string) =>
  Object.keys(json.object).filter(k => k.startsWith(`${dep}@`))

function getTopLevelEntriesWithDependency(json, dep: PackagePath) {
  return Object.entries(json.object)
    .filter(([key, value]: [string, any]) =>
      Object.entries(value.dependencies || []).some(
        ([k, v]: [string, string]) => k === dep.basePath && v === dep.version
      )
    )
    .map(([k, v]: [string, any]) => k)
}

export async function logResolvedDependencies(
  composite: Composite,
  pp: PackagePath[]
) {
  const file = fs.readFileSync(path.join(composite.path, 'yarn.lock'), 'utf8')
  const lock = lockfile.parse(file)
  lock.info(`[===== RESOLVED NATIVE DEPENDENCIES =====]`)
  for (const p of pp) {
    const topLevel = getTopLevelEntriesMatching(lock, p.basePath)
    log.info(`[===== ${p.basePath} Resolved version : ${p.version} =====]`)
    for (const t of topLevel) {
      getTopLevelEntriesWithDependency(lock, PackagePath.fromString(t)).forEach(
        x => log.info(`${t} => ${x}`)
      )
    }
  }
}

export async function logMismatchingDependencies(
  composite: Composite,
  deps: string[]
) {
  const file = fs.readFileSync(path.join(composite.path, 'yarn.lock'), 'utf8')
  const lock = lockfile.parse(file)
  lock.error(`[===== MISMATCHING NATIVE DEPENDENCIES =====]`)
  for (const d of deps) {
    const topLevel = getTopLevelEntriesMatching(lock, d)
    log.info(`[===== Mismatching Native Dependency ${d}=====]`)
    for (const t of topLevel) {
      getTopLevelEntriesWithDependency(lock, PackagePath.fromString(t)).forEach(
        x => log.error(`${t} => ${x}`)
      )
    }
  }
}
