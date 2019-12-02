import CauldronApi from '../CauldronApi'
import { log, PackagePath, utils } from 'ern-core'

export default async function upgrade(cauldronApi: CauldronApi) {
  try {
    log.info('Upgrading Cauldron schema from v1.0.0 to v2.0.0')
    // - Add miniAppsBranches array to container object
    // - Copy any mini app that is delcared as git branch,
    //   from the miniApps array to the miniAppsBranches array
    const cauldron = await cauldronApi.getCauldron()
    for (const nativeApp of cauldron.nativeApps) {
      for (const platform of nativeApp.platforms) {
        for (const version of platform.versions) {
          const container = version.container as any
          container.miniAppsBranches = []
          container.jsApiImplsBranches = []
          for (const miniApp of version.container.miniApps) {
            const p = PackagePath.fromString(miniApp)
            if (p.isGitPath && (await utils.isGitBranch(p))) {
              container.miniAppsBranches.push(miniApp)
            }
          }
          for (const jsApiImpl of container.jsApiImpls) {
            const p = PackagePath.fromString(jsApiImpl)
            if (p.isGitPath && (await utils.isGitBranch(p))) {
              container.jsApiImplsBranches.push(jsApiImpl)
            }
          }
        }
      }
    }
    cauldron.schemaVersion = '2.0.0'
    await cauldronApi.commit('Upgrade Cauldron schema from v1.0.0 to v2.0.0')
  } catch (e) {
    log.error(`Something went wrong : ${e}`)
    throw e
  }
}
