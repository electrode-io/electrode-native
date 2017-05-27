// @flow

import {
  getNativeAppCompatibilityReport
} from '../../../lib/compatibility'
import {
  explodeNapSelector
} from '@walmart/ern-util'
import _ from 'lodash'
import inquirer from 'inquirer'
import miniapp from '../../../lib/miniapp'

exports.command = 'miniapp [fullNapSelector]'
exports.desc = 'Publish mini app to given native app'

exports.builder = function (yargs: any) {
  return yargs
  .option('fullNapSelector', {
    alias: 's',
    describe: 'Full native application selector'
  })
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force publish'
  })
}

exports.handler = async function (argv: any) {
  // todo : move logic away from this command source !
  if (!argv.fullNapSelector) {
    const compatibilityReport = await getNativeAppCompatibilityReport()
    const compatibleVersionsChoices = _.map(Object.keys(compatibilityReport), key => {
      const entry = compatibilityReport[key]
      if (entry.isCompatible) {
        const value = `${entry.appName}:${entry.appPlatform}:${entry.appVersion}`
        const name = entry.isReleased ? `${value} [OTA]` : `${value} [IN-APP]`
        return {name, value}
      }
    }).filter(e => e !== undefined)

    if (compatibleVersionsChoices.length === 0) {
      return console.log('No compatible native application versions were found :(')
    }

    const {fullNapSelectors} = await inquirer.prompt({
      type: 'checkbox',
      name: 'fullNapSelectors',
      message: 'Select one or more compatible native application version(s)',
      choices: compatibleVersionsChoices
    })

    for (const fullNapSelector of fullNapSelectors) {
      try {
        await miniapp.fromCurrentPath().addToNativeAppInCauldron(
        ...explodeNapSelector(fullNapSelector), argv.force)
      } catch (e) {
        console.log(`An error happened while trying to add MiniApp to ${fullNapSelector}`)
      }
    }
  } else {
    return miniapp.fromCurrentPath().addToNativeAppInCauldron(
    ...explodeNapSelector(argv.fullNapSelector), argv.force)
  }
}
