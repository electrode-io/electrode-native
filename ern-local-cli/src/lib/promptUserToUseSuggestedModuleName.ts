import { ModuleTypes, utils } from 'ern-core';
import inquirer from 'inquirer';

export async function promptUserToUseSuggestedModuleName(
  moduleName: string,
  moduleType: string,
): Promise<string> {
  const suffix = utils.getModuleSuffix(moduleType);
  let suggestion = moduleName.toLowerCase();
  if (!suggestion.endsWith(suffix)) {
    suggestion = suggestion.concat('-').concat(suffix);
  }

  const { acceptSuggestion } = await inquirer.prompt([
    <inquirer.Question>{
      default: true,
      message: `Module name of type ${moduleType} should be all lowercase and end in -${suffix}, Do you want to use ${suggestion}?`,
      name: 'acceptSuggestion',
      type: 'confirm',
    },
  ]);

  return acceptSuggestion ? suggestion : moduleName;
}
