import { AppVersionDescriptor, log } from 'ern-core'
import { performCodePushPatch } from 'ern-orchestrator'
import {
  askUserForCodePushDeploymentName,
  askUserForCodePushLabel,
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib'
import { Argv } from 'yargs'

export const command = 'patch'
export const desc = 'Patch a CodePush release'

export const builder = (argv: Argv) => {
  return argv
    .option('deploymentName', {
      describe: 'Deployment to release the update to',
      type: 'string',
    })
    .option('description', {
      alias: 'des',
      describe: 'Description of the changes made to the app with this release',
      type: 'string',
    })
    .option('descriptor', {
      describe:
        'Full native application descriptor from which to promote a release',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('disabled', {
      alias: 'x',
      describe:
        'Specifies whether this release should be immediately downloadable',
      type: 'boolean',
    })
    .option('label', {
      alias: 'l',
      describe: 'Label of the release to update',
      type: 'string',
    })
    .option('mandatory', {
      alias: 'm',
      default: false,
      describe: 'Specifies whether this release should be considered mandatory',
      type: 'boolean',
    })
    .option('rollout', {
      alias: 'r',
      describe:
        'Percentage of users this release should be immediately available to',
      type: 'number',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  deploymentName,
  description,
  descriptor,
  disabled,
  label,
  mandatory,
  rollout,
}: {
  deploymentName?: string
  description?: string
  descriptor?: AppVersionDescriptor
  disabled?: boolean
  label?: string
  mandatory?: boolean
  rollout?: number
}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyReleasedVersions: true,
    }))

  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'You cannot CodePush to a non existing native application version.',
    },
  })

  deploymentName =
    deploymentName || (await askUserForCodePushDeploymentName(descriptor))
  label = label || (await askUserForCodePushLabel())

  await performCodePushPatch(descriptor, deploymentName, label, {
    description,
    isDisabled: disabled,
    isMandatory: mandatory,
    rollout,
  })
  log.info(`Successfully patched ${descriptor} ${deploymentName} ${label}`)
}

export const handler = tryCatchWrap(commandHandler)
