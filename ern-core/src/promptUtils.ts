import inquirer from 'inquirer'

export async function askUserToChooseAnOption(
  choices: string[],
  message?: string
): Promise<any> {
  const { userSelectedOption } = await inquirer.prompt([
    <inquirer.Question>{
      choices,
      message: message || 'Choose one',
      name: 'userSelectedOption',
      type: 'list',
    },
  ])
  return userSelectedOption
}
