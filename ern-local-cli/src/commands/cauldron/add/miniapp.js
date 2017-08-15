// @flow

import {
  cauldron,
  compatibility,
  MiniApp
} from 'ern-core'
import {
  DependencyPath,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  runCauldronContainerGen
} from '../../../lib/publication'
import _ from 'lodash'
import inquirer from 'inquirer'
import semver from 'semver'

exports.command = 'miniapp [completeNapDescriptor] [miniappName]'
exports.desc = 'Publish mini app to given native app'

exports.builder = function (yargs: any) {
  return yargs
  .option('miniappName', {
    alias: 'm',
    describe: 'miniapp that needs to be added to cauldron',
    example: 'miniapp1@1.0.0 || git@x.y.z.com:Electrode-Mobile-Platform/MiniApp1.git || file://Users/workspace/MiniApp1'
  })
  .option('completeNapDescriptor', {
    alias: 'd',
    describe: 'Complete native application descriptor',
    example: 'walmart:android:17.8.0'
  })
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force publish'
  })
  .option('ignoreNpmPublish', {
    alias: 'i',
    type: 'bool',
    describe: 'Ignore npm publication step'
  })
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
  })
}

/// Most/All of the logic here should be moved to the MiniApp class
/// Commands should remain as much logic less as possible
exports.handler = async function ({
  miniappName,
  completeNapDescriptor,
  force = false,
  ignoreNpmPublish = false,
  containerVersion
} : {
  miniappName: string,
  completeNapDescriptor: string,
  force: boolean,
  ignoreNpmPublish: boolean,
  containerVersion?: string
}) {
  if (containerVersion) {
    ensureValidContainerVersion(containerVersion)
  }
  if (!completeNapDescriptor && containerVersion) {
    return log.error(`You can only specify a container version if you provide a specific target native application descriptor`)
  }

  const miniapp = await getMiniApp(miniappName)

  const miniappPackage = `${miniapp.packageJson.name}@${miniapp.packageJson.version}`

  if (!ignoreNpmPublish && !await miniapp.isPublishedToNpm()) {
    const {publishToNpm} = await inquirer.prompt({
      type: 'confirm',
      name: 'publishToNpm',
      message: `${miniappPackage} not published to npm. Do you want to publish it`,
      default: true
    })
    if (publishToNpm) {
      log.info(`Publishing MiniApp to npm`)
      miniapp.publishToNpm()
    } else {
      return log.error(`Sorry you cannot add a MiniApp version that was not published to NPM to the Cauldron.`)
    }
  }

  if (!completeNapDescriptor) {
    const compatibilityReport = await compatibility.getNativeAppCompatibilityReport(miniapp)
    const compatibleVersionsChoices = _.map(compatibilityReport, entry => {
      if (entry.isCompatible) {
        const value = `${entry.appName}:${entry.appPlatform}:${entry.appVersion}`
        const name = entry.isReleased ? `${value} [OTA]` : `${value} [IN-APP]`
        return {name, value}
      }
    }).filter(e => e !== undefined)

    if (compatibleVersionsChoices.length === 0) {
      return console.log('No compatible native application versions were found :(')
    }

    const {completeNapDescriptors} = await inquirer.prompt({
      type: 'checkbox',
      name: 'completeNapDescriptors',
      message: 'Select one or more compatible native application version(s)',
      choices: compatibleVersionsChoices
    })

    for (const completeNapDescriptor of completeNapDescriptors) {
      const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
      await addMiniAppToNativeAppInCauldron(napDescriptor, miniapp, { force })
    }
  } else {
    const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
    await addMiniAppToNativeAppInCauldron(napDescriptor, miniapp, { force, containerVersion })
  }
}

async function addMiniAppToNativeAppInCauldron (
  napDescriptor: NativeApplicationDescriptor,
  miniapp: MiniApp, {
    containerVersion,
    force
  } : {
    containerVersion?: string,
    force?: boolean
  } = {}) {
  try {
    // Begin a Cauldron transaction
    await cauldron.beginTransaction()

    // Add the MiniApp (and all it's dependencies if needed) to Cauldron
    await miniapp.addToNativeAppInCauldron(napDescriptor, force)

    // Set the container version to use for container generation
    let cauldronContainerVersion
    if (containerVersion) {
      cauldronContainerVersion = containerVersion
    } else {
      await cauldron.getContainerVersion(napDescriptor)
      cauldronContainerVersion = semver.inc(cauldronContainerVersion, 'patch')
    }

    // Run container generator
    await runCauldronContainerGen(
      napDescriptor,
      cauldronContainerVersion,
      { publish: true })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(napDescriptor, cauldronContainerVersion)

    // Commit Cauldron transaction
    await cauldron.commitTransaction()

    log.info(`MiniApp ${miniapp.name} was succesfully added to ${napDescriptor.toString()} !`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to add MiniApp ${miniapp.name} to ${napDescriptor.toString()}`)
    cauldron.discardTransaction()
  }
}

async function getMiniApp (miniappName) {
  if (miniappName) {
    return MiniApp.fromPackagePath(DependencyPath.fromString(miniappName))
  } else {
    log.debug('Miniapp name was not provided. Will proceed if the command is executed from MiniApp\'s root folder')
    return MiniApp.fromCurrentPath()
  }
}

function ensureValidContainerVersion (version: string) {
  if ((/^\d+.\d+.\d+$/.test(version) === false) && (version !== 'auto')) {
    throw new Error(`Invalid version (${version}) for container. Please use a valid version in the form x.y.z`)
  }
}
