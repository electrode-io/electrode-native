import { log, AppVersionDescriptor, PackagePath } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { deleteBranch, deleteTag } from 'ern-orchestrator'
import {
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'
import inquirer from 'inquirer'

export const command = 'delete-ref'
export const desc = 'Deletes a branch/tag in multiple GitHub repositories'

export const builder = (argv: Argv) => {
  return argv
    .option('branch', {
      describe: 'Name of the branch to delete',
      type: 'string',
    })
    .option('descriptor', {
      describe:
        'Native application version containing the packages to delete a branch/tag from',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('tag', {
      describe: 'Name of the tag to delete',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  branch,
  descriptor,
  tag,
}: {
  branch?: string
  descriptor?: AppVersionDescriptor
  tag?: string
} = {}) => {
  if (!branch && !tag) {
    const { branchOrTag } = await inquirer.prompt([
      <inquirer.Question>{
        choices: ['branch', 'tag'],
        message: 'Which type of ref to delete ?',
        name: 'branchOrTag',
        type: 'list',
      },
    ])
    const { branchOrTagName } = await inquirer.prompt(<inquirer.Question>{
      message: `Please input the name of the ${branchOrTag} to delete`,
      name: 'branchOrTagName',
      type: 'input',
    })
    if (branchOrTag === 'branch') {
      branch = branchOrTagName
    } else {
      tag = branchOrTagName
    }
  }

  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))

  await logErrorAndExitIfNotSatisfied({
    isEnvVariableDefined: {
      extraErrorMessage:
        'ERN_GITHUB_TOKEN environment variable must be set, to use `ern github` commands',
      name: 'ERN_GITHUB_TOKEN',
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  const cauldron = await getActiveCauldron()

  const packages: PackagePath[] = await cauldron.getContainerMiniApps(
    descriptor
  )

  if (branch) {
    await deleteBranch({ name: branch, packages })
  } else if (tag) {
    await deleteTag({ name: tag, packages })
  }
}

export const handler = tryCatchWrap(commandHandler)
