// @flow

import {
  compatibility,
  MiniApp
} from '@walmart/ern-core'
import {
  DependencyPath,
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import _ from 'lodash'
import inquirer from 'inquirer'

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
}

/// Most/All of the logic here should be moved to the MiniApp class
/// Commands should remain as much logic less as possible
exports.handler = async function ({
  miniappName,
  completeNapDescriptor,
  force = false,
  ignoreNpmPublish = false
} : {
  miniappName: string,
  completeNapDescriptor: string,
  force: boolean,
  ignoreNpmPublish: boolean
}) {
  const miniapp = await getMiniApp(miniappName)

  const miniappPackage = `${miniapp.packageJson.name}@${miniapp.packageJson.version}`

  if (!ignoreNpmPublish && !await miniapp.isPublishedToNpm()) {
    const {publishToNpm} = await inquirer.prompt({
      type: 'confirm',
      name: 'doPublishToNpm',
      message: `${miniappPackage} not published to npm. Do you want to publish it`,
      default: true
    })
    if (publishToNpm) {
      log.info(`Publishing MiniApp to npm`)
      miniapp.publishToNpm()
    } else {
      return log.error(`You cannot add an unpublished MiniApp to the Cauldron !!!`)
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
      try {
        const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
        await miniapp.addToNativeAppInCauldron(napDescriptor, force)
      } catch (e) {
        console.log(`An error happened while trying to add MiniApp to ${completeNapDescriptor}`)
      }
    }
  } else {
    const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
    return miniapp.addToNativeAppInCauldron(napDescriptor, force)
  }
}

async function getMiniApp (miniappName) {
  if (miniappName) {
    return MiniApp.fromPackagePath(DependencyPath.fromString(miniappName))
  } else {
    log.debug('Miniapp name is NOT passed, will proceed if the command is executed from MiniApp\'s root folder')
    return MiniApp.fromCurrentPath()
  }
}
