import inquirer from 'inquirer';

export async function askUserToInputPackageName({
  defaultPackageName,
}: { defaultPackageName?: string } = {}): Promise<string> {
  const { packageName } = await inquirer.prompt([
    <inquirer.Question>{
      default: defaultPackageName,
      message: 'Input a package name. Press Enter to use the default.',
      name: 'packageName',
      type: 'input',
    },
  ]);
  return packageName;
}
