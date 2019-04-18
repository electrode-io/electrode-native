import CauldronApi from '../CauldronApi'
import { log, PackagePath, utils, NativeApplicationDescriptor } from 'ern-core'

export default async function upgrade(cauldronApi: CauldronApi) {
  try {
    log.info('Upgrading Cauldron schema from v2.0.0 to v3.0.0')
    await cauldronApi.beginTransaction()
    const cauldron = await cauldronApi.getCauldron()
    // - Move all inline configuration to dedicated configuration files
    //   in Cauldron file store
    for (const nativeApp of cauldron.nativeApps) {
      for (const platform of nativeApp.platforms) {
        for (const version of platform.versions) {
          if (version.config) {
            const versionDesc = new NativeApplicationDescriptor(
              nativeApp.name,
              platform.name as 'android' | 'ios',
              version.name
            )
            if (version.config.containerGenerator) {
              delete version.config.containerGenerator.containerVersion
            }
            await cauldronApi.setConfig({
              config: version.config,
              descriptor: versionDesc,
            })
            delete version.config
          }
        }
        if (platform.config) {
          // - Move top level Container version out of config object
          if (
            platform.config.containerGenerator &&
            platform.config.containerGenerator.containerVersion
          ) {
            platform.containerVersion =
              platform.config.containerGenerator.containerVersion
            delete platform.config.containerGenerator.containerVersion
          }
          const platformDesc = new NativeApplicationDescriptor(
            nativeApp.name,
            platform.name as 'android' | 'ios'
          )
          await cauldronApi.setConfig({
            config: platform.config,
            descriptor: platformDesc,
          })
          delete platform.config
        }
      }
      if (nativeApp.config) {
        const nativeAppDesc = new NativeApplicationDescriptor(nativeApp.name)
        if (nativeApp.config.containerGenerator) {
          delete nativeApp.config.containerGenerator.containerVersion
        }
        await cauldronApi.setConfig({
          config: nativeApp.config,
          descriptor: nativeAppDesc,
        })
        delete nativeApp.config
      }
    }
    if (cauldron.config) {
      await cauldronApi.setConfig({
        config: cauldron.config,
      })
      delete cauldron.config
    }
    cauldron.schemaVersion = '3.0.0'
    await cauldronApi.commit('toto')
    await cauldronApi.commitTransaction(
      'Upgrade Cauldron schema from v2.0.0 to v3.0.0'
    )
  } catch (e) {
    log.error(`Something went wrong : ${e}`)
    throw e
  }
}
