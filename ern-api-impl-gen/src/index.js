// @flow
import fs from 'fs'
import chalk from 'chalk'
import shell from 'shelljs'

import {
  Platform
} from '@walmart/ern-util'

export async function generateApiImpl ({

                                         apiName,
                                         outputFolder,
                                         nativeOnly
                                       }: {
  apiName: string,
  outputFolder: string,
  nativeOnly: boolean
} = {}) {
  console.log('Entering generate API IMPL')

  if (!outputFolder) {
    outputFolder = `${shell.pwd()}/${apiName}-impl`
  }

  if (fs.existsSync(outputFolder)) {
    log.warn(chalk.red(`An implementation directory already exists: ${outputFolder}`))
    process.exit(1)
  }

  // Folder from which api-impl-gen is executed.
  const WORKING_FOLDER = `${Platform.rootDirectory}/api-impl-gen`
  const API_FOLDER = `${WORKING_FOLDER}/api`
  const PLUGIN_FOLDER = `${WORKING_FOLDER}/plugins`

  console.log(API_FOLDER)
  console.log(PLUGIN_FOLDER)

  shell.mkdir(outputFolder)
  log.info(chalk.green(`${outputFolder} is generated for api: ${apiName}`))
}
