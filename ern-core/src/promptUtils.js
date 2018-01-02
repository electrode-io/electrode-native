// @flow

import inquirer from 'inquirer'

export async function askUserToChooseAnOption (choices: Array<string>, message?: string): Promise<any> {
  const {userSelectedOption} = await inquirer.prompt([{
    type: 'list',
    name: 'userSelectedOption',
    message: message || 'Choose one',
    choices: choices
  }])
  return userSelectedOption
}
