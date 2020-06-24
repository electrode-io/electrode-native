import CauldronApi from '../CauldronApi';
import {
  AppNameDescriptor,
  AppPlatformDescriptor,
  AppVersionDescriptor,
  log,
} from 'ern-core';

const transformerPrefix = 'ern-container-transformer-';
const publisherPrefix = 'ern-container-publisher-';

function patchContainerGenConfig(obj: any) {
  if (obj.config && obj.config.containerGenerator) {
    const containerGenConf = obj.config.containerGenerator;
    if (containerGenConf.transformers || containerGenConf.publishers) {
      containerGenConf.pipeline = [];
      for (const transformer of containerGenConf.transformers || []) {
        if (
          !transformer.name.startsWith('@') &&
          !transformer.name.startsWith(transformerPrefix)
        ) {
          transformer.name = `${transformerPrefix}${transformer.name}`;
        }
        containerGenConf.pipeline.push(transformer);
      }
      for (const publisher of containerGenConf.publishers || []) {
        if (
          !publisher.name.startsWith('@') &&
          !publisher.name.startsWith(transformerPrefix)
        ) {
          if (publisher.name.startsWith === 'github') {
            publisher.name = publisher.name.replace('github', 'git');
          }
          publisher.name = `${publisherPrefix}${publisher.name}`;
        }
        containerGenConf.pipeline.push(publisher);
      }
      delete containerGenConf.transformers;
      delete containerGenConf.publishers;
    }
  }
}

export default async function upgrade(cauldronApi: CauldronApi) {
  try {
    log.info('Upgrading Cauldron schema from v2.0.0 to v3.0.0');
    await cauldronApi.beginTransaction();
    const cauldron = await cauldronApi.getCauldron();
    // Patch container generator configs by moving publishers
    // and transformers to new pipeline object
    patchContainerGenConfig(cauldron);
    for (const nativeApp of cauldron.nativeApps) {
      patchContainerGenConfig(nativeApp);
      for (const platform of nativeApp.platforms) {
        patchContainerGenConfig(platform);
        for (const version of platform.versions) {
          patchContainerGenConfig(version);
        }
      }
    }
    // - Move all inline configuration to dedicated configuration files
    //   in Cauldron file store
    for (const nativeApp of cauldron.nativeApps) {
      for (const platform of nativeApp.platforms) {
        for (const version of platform.versions) {
          if (version.config) {
            const versionDesc = new AppVersionDescriptor(
              nativeApp.name,
              platform.name as 'android' | 'ios',
              version.name,
            );
            if (version.config.containerGenerator) {
              delete version.config.containerGenerator.containerVersion;
            }
            await cauldronApi.setConfig({
              config: version.config,
              descriptor: versionDesc,
            });
            delete version.config;
          }
        }
        if (platform.config) {
          // - Move top level Container version out of config object
          if (
            platform.config.containerGenerator &&
            platform.config.containerGenerator.containerVersion
          ) {
            platform.containerVersion =
              platform.config.containerGenerator.containerVersion;
            delete platform.config.containerGenerator.containerVersion;
          }
          const platformDesc = new AppPlatformDescriptor(
            nativeApp.name,
            platform.name as 'android' | 'ios',
          );
          await cauldronApi.setConfig({
            config: platform.config,
            descriptor: platformDesc,
          });
          delete platform.config;
        }
      }
      if (nativeApp.config) {
        const nativeAppDesc = new AppNameDescriptor(nativeApp.name);
        if (nativeApp.config.containerGenerator) {
          delete nativeApp.config.containerGenerator.containerVersion;
        }
        await cauldronApi.setConfig({
          config: nativeApp.config,
          descriptor: nativeAppDesc,
        });
        delete nativeApp.config;
      }
    }
    if (cauldron.config) {
      await cauldronApi.setConfig({
        config: cauldron.config,
      });
      delete cauldron.config;
    }
    //  Move detachContainerVersionFromRoot to config
    for (const nativeApp of cauldron.nativeApps) {
      for (const platform of nativeApp.platforms) {
        for (const version of platform.versions) {
          if ((version as any).detachContainerVersionFromRoot) {
            await cauldronApi.updateConfig({
              config: {
                detachContainerVersionFromRoot: (version as any)
                  .detachContainerVersionFromRoot,
              },
              descriptor: AppVersionDescriptor.fromString(
                `${nativeApp.name}:${platform.name}:${version.name}`,
              ),
            });
            delete (version as any).detachContainerVersionFromRoot;
          }
        }
      }
    }
    cauldron.schemaVersion = '3.0.0';
    await cauldronApi.commit('Upgrade Cauldron schema from v2.0.0 to v3.0.0');
    await cauldronApi.commitTransaction(
      'Upgrade Cauldron schema from v2.0.0 to v3.0.0',
    );
  } catch (e) {
    log.error(`Something went wrong : ${e}`);
    throw e;
  }
}
