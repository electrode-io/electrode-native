import { log, NativePlatform } from 'ern-core'
import fs from 'fs'
import path from 'path'

/**
 * Infer the native platform of a Container given its path.
 * This method could be deprecated at some point.
 * @param containerPath Local file system path to the Container
 */
export function inferContainerPlatform(containerPath: string): NativePlatform {
  if (!fs.existsSync(containerPath)) {
    throw new Error(`${containerPath} does not exist`)
  }
  log.warn(
    `Infering Container platform as no container platform metadata was found for this Container.
The Container was probably generated with an ern version < 0.19.0.
Please Consider regenerating it at some point with a newer version of ern.`
  )
  const buildGradlePath = path.join(containerPath, 'build.gradle')
  return fs.existsSync(buildGradlePath) ? 'android' : 'ios'
}
