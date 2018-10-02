import { NativeApplicationDescriptor } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import inquirer from 'inquirer'

export async function askUserForCodePushDeploymentName(
  napDescriptor: NativeApplicationDescriptor,
  message?: string
): Promise<string> {
  const cauldron = await getActiveCauldron()
  const conf = await cauldron.getConfig(napDescriptor)
  const hasCodePushDeploymentsConfig =
    conf && conf.codePush && conf.codePush.deployments
  const choices = hasCodePushDeploymentsConfig
    ? conf && conf.codePush.deployments
    : undefined

  const { userSelectedDeploymentName } = await inquirer.prompt(<
    inquirer.Question
  >{
    choices,
    message: message || 'Deployment name',
    name: 'userSelectedDeploymentName',
    type: choices ? 'list' : 'input',
  })

  return userSelectedDeploymentName
}
