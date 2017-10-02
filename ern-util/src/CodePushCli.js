// @flow

import {
  exec
} from 'child_process'
import inquirer from 'inquirer'

export default class CodePushCli {
  _binaryPath: ?string

  constructor (binaryPath?: string) {
    this._binaryPath = binaryPath
  }

  get binaryPath () : string {
    return this._binaryPath ? this._binaryPath : `code-push`
  }

  async releaseReact (
    appName: string,
    platform: 'android' | 'ios', {
      targetBinaryVersion,
      mandatory,
      deploymentName,
      rolloutPercentage,
      askForConfirmation
    } : {
      targetBinaryVersion?: string,
      mandatory?: boolean,
      deploymentName: string,
      rolloutPercentage?: string,
      askForConfirmation?: boolean
    }) : Promise<boolean> {
    const codePushCommand =
      `${this.binaryPath} release-react \
${appName} \
${platform} \
${targetBinaryVersion ? `-t ${targetBinaryVersion}` : ''} \
${mandatory ? `-m` : ''} \
${deploymentName ? `-d ${deploymentName}` : ''} \
${rolloutPercentage ? `-r ${rolloutPercentage}` : ''} \
${platform === 'ios' ? `-b MiniApp.jsbundle` : ''}`

    let shouldExecuteCodePushCommand = true

    if (askForConfirmation) {
      log.info(`Will run:\n${codePushCommand}`)
      const {userConfirmedCodePushCommand} = await inquirer.prompt({
        type: 'confirm',
        name: 'userConfirmedCodePushCommand',
        message: 'Do you confirm code push command execution ?',
        default: true
      })
      shouldExecuteCodePushCommand = userConfirmedCodePushCommand
    }

    if (shouldExecuteCodePushCommand) {
      await new Promise((resolve, reject) => {
        log.debug(`[releaseReact] Running ${codePushCommand}`)
        exec(codePushCommand,
            (err, stdout, stderr) => {
              if (err) {
                return reject(err)
              }
              if (stderr) {
                return reject(stderr)
              }
              if (stdout) {
                resolve(stdout)
              }
            })
      })
    }

    return shouldExecuteCodePushCommand
  }
}
