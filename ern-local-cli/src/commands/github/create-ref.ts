import { AppVersionDescriptor, PackagePath } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { createBranch, createTag } from 'ern-orchestrator'
import {
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib'
import { Argv } from 'yargs'
import inquirer from 'inquirer'

export const command = 'create-ref'
export const desc = 'Creates a new branch/tag in multiple GitHub repositories'

export const builder = (argv: Argv) => {
  return argv
    .option('branch', {
      describe: 'Name of the new branch to create',
      type: 'string',
    })
    .option('descriptor', {
      describe:
        'Native application version containing the packages to create a branch/tag for',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('fromBranch', {
      describe:
        'Create the ref from the current tracked branches of the packages',
      type: 'boolean',
    })
    .option('fromTagOrSha', {
      describe: 'Create the ref from the current tag/sha of the packages',
      type: 'boolean',
    })
    .option('jsApiImplsOnly', {
      describe: 'Create the ref for JS API Implementations only',
      type: 'boolean',
    })
    .option('miniAppsOnly', {
      describe: 'Create the ref for MiniApps only',
      type: 'boolean',
    })
    .option('tag', {
      describe: 'Name of the new tag to create',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  branch,
  descriptor,
  fromBranch,
  fromTagOrSha,
  jsApiImplsOnly,
  miniAppsOnly,
  tag,
}: {
  branch?: string
  descriptor?: AppVersionDescriptor
  fromBranch?: boolean
  fromTagOrSha?: boolean
  jsApiImplsOnly?: boolean
  miniAppsOnly?: boolean
  tag?: string
} = {}) => {
  if (!branch && !tag) {
    const { branchOrTag } = await inquirer.prompt([
      <inquirer.Question>{
        choices: ['branch', 'tag'],
        message: 'Which type of ref to create ?',
        name: 'branchOrTag',
        type: 'list',
      },
    ])
    const { branchOrTagName } = await inquirer.prompt([
      <inquirer.Question>{
        message: `Please input the new ${branchOrTag} name`,
        name: 'branchOrTagName',
        type: 'input',
      },
    ])
    if (branchOrTag === 'branch') {
      branch = branchOrTagName
    } else {
      tag = branchOrTagName
    }
  }

  if (!fromBranch && !fromTagOrSha) {
    const { fromBranchOrFromTagSha } = await inquirer.prompt([
      <inquirer.Question>{
        choices: ['fromBranch', 'fromTagOrSha'],
        message: 'From which source to create the ref ?',
        name: 'fromBranchOrFromTagSha',
        type: 'list',
      },
    ])
    if (fromBranchOrFromTagSha === 'fromBranch') {
      fromBranch = true
    } else {
      fromTagOrSha = true
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

  const packages: PackagePath[] = await cauldron.getContainerJsPackages({
    descriptor,
    jsApiImplsOnly,
    miniAppsOnly,
    type: fromBranch ? 'branches' : 'versions',
  })

  if (branch) {
    await createBranch({ name: branch, packages })
  } else if (tag) {
    await createTag({ name: tag, packages })
  }
}

export const handler = tryCatchWrap(commandHandler)
