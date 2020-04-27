import { isPackagePublished } from 'ern-core';
import inquirer from 'inquirer';

export async function performPkgNameConflictCheck(
  name: string,
): Promise<boolean> {
  if (await isPackagePublished(name)) {
    const { continueIfPkgNameExists } = await inquirer.prompt([
      <inquirer.Question>{
        default: false,
        message: `The package with name ${name} is already published in NPM registry. Do you wish to continue?`,
        name: 'continueIfPkgNameExists',
        type: 'confirm',
      },
    ]);
    return continueIfPkgNameExists;
  }
  return true; // If package name doesn't exist continue with command execution
}
