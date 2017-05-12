import MiniApp from './miniapp.js';

import {
    platform,
    config as ernConfig,
    required,
    explodeNapSelector as explodeNativeAppSelector,
    cauldron,
    codePush
} from '@walmart/ern-util';

import {
    nativeCompatCheck, 
    getNativeAppCompatibilityReport
} from './compatibility.js';

import { 
    generateContainer, 
    generateMiniAppsComposite,
    MavenGenerator,
    GithubGenerator
} from '@walmart/ern-container-gen';

import _ from 'lodash';
import emoji from 'node-emoji';
import inquirer from 'inquirer';
import child_process from 'child_process';
const log = require('console-log-level')();


const ERN_PATH = `${process.env['HOME']}/.ern`;
const execSync = child_process.execSync;

function createContainerGenerator(platform, config) {
    if (config) {
        switch (config.name) {
            case 'maven': 
                return new MavenGenerator({ mavenRepositoryUrl: config.mavenRepositoryUrl })
            case 'github':
                return new GithubGenerator({ targetRepoUrl: config.targetRepoUrl })
        }
    }
    
    // No generator configuration was provided
    // Create default generator for target native platform
    switch(platform) {
        case 'android':
            return new MavenGenerator()
        case 'ios':
            return new GithubGenerator()
    }
}

export async function runContainerGen(nativeAppName = required(nativeAppName, 'nativeAppName'),
                                      nativeAppPlatform = required(nativeAppPlatform, 'nativeAppPlatform'),
                                      nativeAppVersion = required(nativeAppVersion, 'nativeAppVersion'),
                                      version = required(version, 'version'),
                                      verbose) {
    try {
        const plugins = await cauldron.getNativeDependencies(nativeAppName, nativeAppPlatform, nativeAppVersion);
        const reactNativePlugin = _.find(plugins, p => p.name === 'react-native');
        const miniapps = await cauldron.getReactNativeApps(nativeAppName, nativeAppPlatform, nativeAppVersion);
        const config = await cauldron.getConfig(nativeAppName, nativeAppPlatform, nativeAppVersion) 

        await generateContainer({
            containerVersion: version,
            nativeAppName,
            platformPath: platform.currentPlatformVersionPath,
            generator: createContainerGenerator(config.containerGenerator),
            plugins,
            miniapps,
            verbose
        });
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

        const {nativeApps} = await inquirer.prompt({
            type: 'checkbox',
            name: 'nativeApps',
            message: 'Select one or more compatible native application version(s)',
            choices: compatibleVersionsChoices
        })

        for (const nativeApp of nativeApps) {
            if (nativeApp.isReleased) {
                await publishOta(nativeApp.fullNapSelector, {verbose, force})
            } else {
                await publishInApp(nativeApp.fullNapSelector, {containerVersion, verbose, force})
            }
        }
    }
    // full nap selector was provided (mostly for CI use)
    // do the job !
    else {
        // Todo : Check for compat first !
        // Todo : handle OTA
        if (!containerVersion) {
            containerVersion = await askUserForContainerVersion()
        } 

        await runContainerGen(
            ...explodeNativeAppSelector(fullNapSelector), containerVersion, verbose)
    }
}

async function publishInApp(fullNapSelector, {containerVersion, verbose, force}) {
    try {
        await MiniApp.fromCurrentPath().addToNativeAppInCauldron(
            ...explodeNativeAppSelector(fullNapSelector), force);

        if (!containerVersion) {
            containerVersion = await askUserForContainerVersion()
        } 

        await runContainerGen(
            ...explodeNativeAppSelector(fullNapSelector), containerVersion, verbose)
    } catch (e) {
        log.error(`[publishInApp] failed`);
    }
}

async function askUserForContainerVersion() {
    const {userSelectedContainerVersion} = await inquirer.prompt({
        type: 'input',
        name: 'userSelectedContainerVersion',
        message: 'Version of generated container'
    })
    return userSelectedContainerVersion
}

async function publishOta(fullNapSelector, {verbose, force} = {}) {
    try {
        const explodedNapSelector = explodeNativeAppSelector(fullNapSelector);
        const plugins = await cauldron.getNativeDependencies(...explodedNapSelector);

        const codePushPlugin = _.find(plugins, p => p.name === 'react-native-code-push');
        if (!codePushPlugin) {
            throw new Error("react-native-code-push plugin is not in native app !");
        }

        await MiniApp.fromCurrentPath().addToNativeAppInCauldron(...explodedNapSelector, force);

        const workingFolder = `${ERN_PATH}/CompositeOta`;
        const miniapps = await cauldron.getReactNativeApps(...explodedNapSelector);

        await generateMiniAppsComposite(miniapps, workingFolder, {plugins});
        process.chdir(workingFolder);

        const applicationName = explodedNapSelector[0]
        const platformName = explodedNapSelector[1]

        const config = await cauldron.getConfig(...explodedNapSelector)
        const hasCodePushDeploymentsConfig = config && config.codePush && config.codePush.deployments
        const codePushDeployments = hasCodePushDeploymentsConfig ? config.codePush.deployments : undefined

        const codePushDeploymentName = await askUserForCodePushDeploymentName(codePushDeployments)
        const codePushAppName = await askUserForCodePushAppName(`${applicationName}-${platformName}`)
        const codePushPlatformName = await askUserForCodePushPlatformName(platformName)
        const codePushTargetVersionName = await askUserForCodePushTargetVersionName()
        const codePushIsMandatoryRelease = await askUserIfCodePushMandatoryRelease(false)
        const codePushRolloutPercentage = await askUserForCodePushRolloutPercentage(100)
        
        await codePush.releaseReact(
          codePushAppName,
          codePushPlatformName, {
            targetBinaryVersion: codePushTargetVersionName,
            mandatory: codePushIsMandatoryRelease,
            deploymentName: codePushDeploymentName,
            rolloutPercentage: codePushRolloutPercentage,
            askForConfirmation: true
          })
    } catch (e) {
        log.error(`[publishOta] failed: ${e}`);
    }
}

async function askUserForCodePushDeploymentName(choices) {
     const {userSelectedDeploymentName} = await inquirer.prompt({
        type: choices ? 'list': 'input',
        name: 'userSelectedDeploymentName',
        message: 'Deployment name',
        choices
    })

    return userSelectedDeploymentName
}

async function askUserForCodePushAppName(defaultAppName) {
    const {userSelectedCodePushAppName} = await inquirer.prompt({
        type: 'input',
        name: 'userSelectedCodePushAppName',
        message: 'Application name',
        default: defaultAppName
    })
    return userSelectedCodePushAppName
}

async function askUserForCodePushPlatformName(defaultPlatformName) {
     const {userSelectedCodePushPlatformName} = await inquirer.prompt({
        type: 'input',
        name: 'userSelectedCodePushPlatformName',
        message: 'Platform name',
        default: defaultPlatformName
    })
    return userSelectedCodePushPlatformName
}

async function askUserForCodePushTargetVersionName(defaultTargetVersionName) {
     const {userSelectedCodePushTargetVersionName} = await inquirer.prompt({
        type: 'input',
        name: 'userSelectedCodePushTargetVersionName',
        message: 'Target binary version name',
        default: defaultTargetVersionName
    })
    return userSelectedCodePushTargetVersionName
}

async function askUserIfCodePushMandatoryRelease(defaultValue) {
     const {userSelectedCodePushMandatoryRelease} = await inquirer.prompt({
        type: 'confirm',
        name: 'userSelectedCodePushMandatoryRelease',
        message: 'Is this a mandatory release ?',
        default: defaultValue
    })
    return userSelectedCodePushMandatoryRelease
}

async function askUserForCodePushRolloutPercentage(defaultRolloutPercentage) {
     const {userSelectedCodePushRolloutPercentage} = await inquirer.prompt({
        type: 'input',
        name: 'userSelectedCodePushRolloutPercentage',
        message: 'Release rollout percentage [1-100]',
        default: defaultRolloutPercentage
    })
    return userSelectedCodePushRolloutPercentage
}