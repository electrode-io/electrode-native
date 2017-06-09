// @flow

import {
  getNativeAppCompatibilityReport
} from '../../../lib/compatibility'
import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import _ from 'lodash'
import inquirer from 'inquirer'
import Miniapp from '../../../lib/miniapp'

exports.command = 'miniapp [completeNapDescriptor]'
exports.desc = 'Publish mini app to given native app'

exports.builder = function (yargs: any) {
  return yargs
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
}

exports.handler = async function (argv: any) {
  const miniapp = Miniapp.fromCurrentPath()
  const miniappPackage = `${miniapp.packageJson.name}@${miniapp.packageJson.version}`

  if (!await miniapp.isPublishedToNpm()) {
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

  if (!argv.completeNapDescriptor) {
    const compatibilityReport = await getNativeAppCompatibilityReport()
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
        await miniapp.addToNativeAppInCauldron(napDescriptor, argv.force)
      } catch (e) {
        console.log(`An error happened while trying to add MiniApp to ${completeNapDescriptor}`)
      }
    }
  } else {
    const napDescriptor = NativeApplicationDescriptor.fromString(argv.completeNapDescriptor)
    return miniapp.addToNativeAppInCauldron(napDescriptor, argv.force)
  }
}
