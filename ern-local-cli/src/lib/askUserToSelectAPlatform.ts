import { NativePlatform } from 'ern-core';
import inquirer from 'inquirer';

export async function askUserToSelectAPlatform(): Promise<NativePlatform> {
  const { userSelectedPlatform } = await inquirer.prompt([
    <inquirer.Question>{
      choices: ['android', 'ios'],
      message: 'Select a platform',
      name: 'userSelectedPlatform',
      type: 'list',
    },
  ]);

  return userSelectedPlatform as NativePlatform;
}
