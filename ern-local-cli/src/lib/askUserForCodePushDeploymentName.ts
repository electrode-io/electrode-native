import { AppVersionDescriptor } from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import inquirer from 'inquirer';

export async function askUserForCodePushDeploymentName(
  napDescriptor: AppVersionDescriptor,
  message?: string,
): Promise<string> {
  const cauldron = await getActiveCauldron();
  const conf = await cauldron.getCodePushConfig(napDescriptor);
  const hasCodePushDeploymentsConfig = conf && conf.deployments;
  const choices = hasCodePushDeploymentsConfig
    ? conf && conf.deployments
    : undefined;

  const { userSelectedDeploymentName } = await inquirer.prompt([
    <inquirer.Question>{
      choices,
      message: message || 'Deployment name',
      name: 'userSelectedDeploymentName',
      type: choices ? 'list' : 'input',
    },
  ]);

  return userSelectedDeploymentName;
}
