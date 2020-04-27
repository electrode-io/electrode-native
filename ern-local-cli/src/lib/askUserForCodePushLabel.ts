import inquirer from 'inquirer';

export async function askUserForCodePushLabel(): Promise<string> {
  const { userInputedLabel } = await inquirer.prompt([
    <inquirer.Question>{
      message: 'Please input a label name',
      name: 'userInputedLabel',
      type: 'input',
    },
  ]);
  return userInputedLabel;
}
