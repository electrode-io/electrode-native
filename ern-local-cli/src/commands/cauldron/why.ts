import {
  AppVersionDescriptor,
  log,
  PackagePath,
  YarnLockParser,
} from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import {
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib';
import { Argv } from 'yargs';
import treeify from 'treeify';
import _ from 'lodash';

export const command = 'why <dependency>';
export const desc =
  'Why is a dependency (native or JS) in the Container of a native application verstion';

export const builder = (argv: Argv) => {
  return argv
    .coerce('dependency', PackagePath.fromString)
    .option('descriptor', {
      alias: 'd',
      describe: 'A complete native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  dependency,
  descriptor,
}: {
  dependency: PackagePath;
  descriptor?: AppVersionDescriptor;
}) => {
  if (descriptor) {
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
    });
  } else {
    descriptor = await askUserToChooseANapDescriptorFromCauldron();
  }

  const cauldron = await getActiveCauldron();
  const lock = await cauldron.getYarnLock(descriptor, 'container');
  if (lock) {
    const tree = YarnLockParser.fromContent(
      lock.toString(),
    ).buildDependencyTree(dependency);
    if (_.isEmpty(tree)) {
      log.info(`${dependency} is not part of the Composite of ${descriptor}`);
    } else {
      log.info(treeify.asTree(tree, true, true));
    }
  } else {
    throw new Error(
      `No yarn lock was found in Cauldron for ${descriptor} Container`,
    );
  }
};

export const handler = tryCatchWrap(commandHandler);
