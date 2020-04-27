import inquirer from 'inquirer';

export async function askUserToSelectAnEnvironment(): Promise<string> {
  const { targetEnv } = await inquirer.prompt([
    <inquirer.Question>{
      choices: ['js', 'native'],
      default: 'js',
      message: 'Choose an environment',
      name: 'targetEnv',
      type: 'list',
    },
  ]);
  return targetEnv;
}
