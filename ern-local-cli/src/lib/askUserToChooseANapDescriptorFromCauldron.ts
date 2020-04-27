import { getActiveCauldron } from 'ern-cauldron-api';
import { AppVersionDescriptor, NativePlatform } from 'ern-core';
import _ from 'lodash';
import inquirer from 'inquirer';

//
// Inquire user to choose a native application version from the Cauldron, optionally
// filtered by platform/and or release status and returns the selected one as a string
export async function askUserToChooseANapDescriptorFromCauldron({
  platform,
  onlyReleasedVersions,
  onlyNonReleasedVersions,
  message,
}: {
  platform?: NativePlatform;
  onlyReleasedVersions?: boolean;
  onlyNonReleasedVersions?: boolean;
  message?: string;
} = {}): Promise<AppVersionDescriptor> {
  const cauldron = await getActiveCauldron();
  const napDescriptorStrings = await cauldron.getNapDescriptorStrings({
    onlyNonReleasedVersions,
    onlyReleasedVersions,
    platform,
  });

  if (_.isEmpty(napDescriptorStrings)) {
    throw new Error(
      'Could not find any qualifying native application version in the Cauldron',
    );
  }

  const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([
    <inquirer.Question>{
      choices: napDescriptorStrings,
      message: message || 'Choose a native application version',
      name: 'userSelectedCompleteNapDescriptor',
      type: 'list',
    },
  ]);

  return AppVersionDescriptor.fromString(userSelectedCompleteNapDescriptor);
}
