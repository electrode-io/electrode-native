import CauldronApi from '../CauldronApi'
import { log } from 'ern-core'

export default async function upgrade(cauldronApi: CauldronApi) {
  try {
    log.info('Upgrading Cauldron schema from v0.0.0 to v1.0.0')
    const cauldron = await cauldronApi.getCauldron()
    for (const nativeApp of cauldron.nativeApps) {
      for (const platform of nativeApp.platforms) {
        // - Move 'nativeDeps' array and 'miniApps' array into
        // new 'container' object
        // - Create new 'jsApiImpls' array
        let version: any
        for (version of platform.versions) {
          version.container = {
            jsApiImpls: [],
            miniApps: version.miniApps.container || [],
            nativeDeps: version.nativeDeps || [],
          }
          // Remove top level 'nativeDeps' and 'miniApps' arrays
          delete version.nativeDeps
          delete version.miniApps
          // Create new 'jsApiImpls' array for each CodePush entry
          if (version.codePush) {
            for (const deploymentName of Object.keys(version.codePush)) {
              for (const codePushEntry of version.codePush[deploymentName]) {
                codePushEntry.jsApiImpls = []
              }
            }
          }
        }
      }
    }
    cauldron.schemaVersion = '1.0.0'
    await cauldronApi.commit('Upgrade Cauldron schema from v0.0.0 to v1.0.0')
  } catch (e) {
    log.error(`Something went wrong : ${e}`)
    throw e
  }
}
