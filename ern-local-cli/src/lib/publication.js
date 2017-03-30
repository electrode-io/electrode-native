import {
    platform,
    config as ernConfig,
    required,
    explodeNapSelector as explodeNativeAppSelector,
    cauldron,
    codePush
} from '@walmart/ern-util';
import {nativeCompatCheck, getNativeAppCompatibilityReport} from './compatibility.js';
import MiniApp from './miniapp.js';
import {generateContainer, generateMiniAppsComposite} from '@walmart/ern-container-gen';

import _ from 'lodash';
import emoji from 'node-emoji';
import inquirer from 'inquirer';
import child_process from 'child_process';
const log = require('console-log-level')();


const ERN_PATH = `${process.env['HOME']}/.ern`;
const execSync = child_process.execSync;

export async function runContainerGen(nativeAppName = required(nativeAppName, 'nativeAppName'),
                                      nativeAppPlatform = required(nativeAppPlatform, 'nativeAppPlatform'),
                                      nativeAppVersion = required(nativeAppVersion, 'nativeAppVersion'),
                                      version = required(version, 'version'),
                                      verbose) {
    try {
        const nativeApp =
            await cauldron.getNativeApp(nativeAppName, nativeAppPlatform, nativeAppVersion);
        const plugins =
            await cauldron.getNativeDependencies(nativeAppName, nativeAppPlatform, nativeAppVersion);
        const reactNativePlugin = _.find(plugins, p => p.name === 'react-native');
        const miniapps =
            await cauldron.getReactNativeApps(nativeAppName, nativeAppPlatform, nativeAppVersion);
        let versionBeforeSwitch;

        if (platform.currentVersion !== nativeApp.ernPlatformVersion) {
            versionBeforeSwitch = platform.currentVersion;
            platform.switchToVersion(nativeApp.ernPlatformVersion);
        }

        if (nativeAppPlatform === 'android') {
            let generator = ernConfig.obj.libgen.android.generator;
            generator.containerVersion = version;
            await generateContainer({
                nativeAppName,
                platformPath: platform.currentPlatformVersionPath,
                generator,
                plugins,
                miniapps,
                verbose
            });

        } else {
            throw new Error(`${platformName} not supported yet`);
        }

        if (versionBeforeSwitch) {
            platform.switchToVersion(versionBeforeSwitch);
        }
    } catch (e) {
        log.error(e);
    }
}

export async function publishMiniApp({
    fullNapSelector, 
    verbose, 
    force, 
    containerVersion, 
    npmPublish = false
    } = {}) {
    if (npmPublish) {
      MiniApp.fromCurrentPath().publishToNpm()
    }

    // No full nap selector was provied
    // in that case, prompt the user with compatible native application versions
    // so that he can select one or more to publish miniapp to
    if (!fullNapSelector) {
        const compatibilityReport = await getNativeAppCompatibilityReport();

        const compatibleVersionsChoices = _.map(compatibilityReport, entry => {
            if (entry.compatibility.incompatible.length === 0) {
                const value = {
                    fullNapSelector: `${entry.appName}:${entry.appPlatform}:${entry.appVersion}`,
                    isReleased: entry.isReleased
                };
                const suffix = value.isReleased ?
                    `[OTA] ${emoji.get('rocket')}` : `[IN-APP]`;
                const name = `${value.fullNapSelector} ${suffix}`;
                return {name, value}
            }
        }).filter(e => e !== undefined);

        if (compatibleVersionsChoices.length === 0) {
            return log.error('No compatible native application versions have been found');
        }

        inquirer.prompt({
            type: 'checkbox',
            name: 'nativeApps',
            message: 'Select one or more compatible native application version(s)',
            choices: compatibleVersionsChoices
        }).then(async(answer) => {
            for (const nativeApp of answer.nativeApps) {
                if (nativeApp.isReleased) {
                    await publishOta(nativeApp.fullNapSelector, {verbose, force});
                } else {
                    await publishInApp(nativeApp.fullNapSelector, {containerVersion, verbose, force});
                }
            }
        })
    }
    // full nap selector was provided (mostly for CI use)
    // do the job !
    else {
        // Todo : Check for compat first !
        // Todo : handle OTA
        if (!containerVersion) {
            inquirer.prompt({
                type: 'input',
                name: 'containerVersion',
                message: 'Version of generated container'
            }).then(async(answer) => {
                await runContainerGen(
                    ...explodeNativeAppSelector(fullNapSelector), answer.containerVersion, verbose)
            })
        } else {
            await runContainerGen(
                ...explodeNativeAppSelector(fullNapSelector), containerVersion, verbose)
        }
    }
}

async function publishInApp(fullNapSelector, {containerVersion, verbose, force}) {
    try {
        await MiniApp.fromCurrentPath().addToNativeAppInCauldron(
            ...explodeNativeAppSelector(fullNapSelector), force);

        if (!containerVersion) {
            inquirer.prompt({
                type: 'input',
                name: 'containerVersion',
                message: 'Version of generated container'
            }).then(async(answer) => {
                await runContainerGen(
                    ...explodeNativeAppSelector(fullNapSelector), answer.containerVersion, verbose)
            })
        } else {
            await runContainerGen(
                ...explodeNativeAppSelector(fullNapSelector), containerVersion, verbose)
        }
    } catch (e) {
        log.error(`[publishInApp] failed`);
    }
}

async function publishOta(fullNapSelector, {verbose, force} = {}) {
    try {
        const plugins =
            await cauldron.getNativeDependencies(...explodeNativeAppSelector(fullNapSelector));

        const codePushPlugin = _.find(plugins, p => p.name === 'react-native-code-push');
        if (!codePushPlugin) {
            throw new Error("react-native-code-push plugin is not in native app !");
        }

        await MiniApp.fromCurrentPath().addToNativeAppInCauldron(
            ...explodeNativeAppSelector(fullNapSelector), force);

        const workingFolder = `${ERN_PATH}/CompositeOta`;
        const miniapps =
            await cauldron.getReactNativeApps(...explodeNativeAppSelector(fullNapSelector));

        await generateMiniAppsComposite(miniapps, workingFolder, {plugins});
        process.chdir(workingFolder);

        const nativeApp = [...explodeNativeAppSelector(fullNapSelector)];

        await codePush.releaseReact(
          nativeApp[0] /* appName*/,
          nativeApp[1] /* platform */, {
            targetBinaryVersion: nativeApp[2],
            mandatory: true,
            deploymentName: 'Production'
          }
        );
    } catch (e) {
        log.error(`[publishOta] failed: ${e}`);
    }
}
