// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import inquirer from 'inquirer'
import _ from 'lodash'

exports.command = 'nativeapp <completeNapDescriptor> [platformVersion]'
exports.desc = 'Add a native application to the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('platformVersion', {
    alias: 'v',
    describe: 'Platform version'
  })
  .option('copyPreviousVersionData', {
    alias: 'c',
    describe: 'Copy previous version data'
  })
}

exports.handler = async function ({
  completeNapDescriptor,
  platformVersion,
  copyPreviousVersionData
} : {
  completeNapDescriptor: string,
  platformVersion?: string,
  copyPreviousVersionData?: boolean
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  if (napDescriptor.isPartial) {
    return log.error('You need to provide a complete native application descriptor to this command !')
  }

  const previousApps = await cauldron.getNativeApp(new NativeApplicationDescriptor(napDescriptor.name, napDescriptor.platform))

  await cauldron.addNativeApp(napDescriptor, platformVersion
    ? platformVersion.toString().replace('v', '')
    : undefined)

  if (previousApps && (copyPreviousVersionData || await askUserCopyPreviousVersionData())) {
    // Copy over previous native application version native dependencies
    for (const nativeDep of _.last(previousApps.versions).nativeDeps) {
      await cauldron.addNativeDependency(napDescriptor, Dependency.fromString(nativeDep))
    }
    // Copy over previous native application version container MiniApps
    for (const containerMiniApp of _.last(previousApps.versions).miniApps.container) {
      await cauldron.addContainerMiniApp(napDescriptor, Dependency.fromString(containerMiniApp))
    }
  }
}

async function askUserCopyPreviousVersionData () {
  const { userCopyPreviousVersionData } = await inquirer.prompt({
    type: 'confirm',
    name: 'userCopyPreviousVersionData',
    message: 'Do you want to copy data from previous version ?'
  })

  return userCopyPreviousVersionData
}
