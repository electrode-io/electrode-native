/* import {
  exec
} from 'child_process'
import inquirer from 'inquirer' */
import platform from './platform'

export class CodePushCommands {
  get codePushBinaryPath () {
    return `${platform.currentPlatformVersionPath}/node_modules/.bin/code-push`
  }

  async releaseReact (appName, platform, {
    targetBinaryVersion,
    mandatory,
    deploymentName,
    rolloutPercentage,
    askForConfirmation
  }) {
    const codePushCommand =
      `${this.codePushBinaryPath} release-react \
${appName} \
${platform} \
${targetBinaryVersion ? `-t ${targetBinaryVersion}` : ''} \
${mandatory ? `-m` : ''} \
${deploymentName ? `-d ${deploymentName}` : ''} \
${rolloutPercentage ? `-r ${rolloutPercentage}` : ''} \
${platform === 'ios' ? `-b Miniapp.jsbundle` : ''}`
    console.log(`CodePush command : ${codePushCommand}`)

    /* let shouldExecuteCodePushCommand = true

    if (askForConfirmation) {
      console.log(`Will run:\n${codePushCommand}`)
      const {userConfirmedCodePushCommand} = await inquirer.prompt({
        type: 'confirm',
        name: 'userConfirmedCodePushCommand',
        message: 'Do you confirm code push command execution ?',
        default: true
      })
      shouldExecuteCodePushCommand = userConfirmedCodePushCommand
    }

     if (shouldExecuteCodePushCommand) {
      return new Promise((resolve, reject) => {
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
    } */
  }
}

export default new CodePushCommands()
