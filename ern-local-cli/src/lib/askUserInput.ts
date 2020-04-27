import inquirer from 'inquirer';

export async function askUserInput({
  message,
}: {
  message: string;
}): Promise<string> {
  const { result } = await inquirer.prompt([
    <inquirer.Question>{
      message,
      name: 'result',
      type: 'input',
    },
  ]);
  return result;
}
