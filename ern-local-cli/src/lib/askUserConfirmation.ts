import inquirer from 'inquirer';

export async function askUserConfirmation(
  message: string = 'Do you confirm ?',
): Promise<boolean> {
  const { result } = await inquirer.prompt([
    <inquirer.Question>{
      message,
      name: 'result',
      type: 'confirm',
    },
  ]);
  return result;
}
